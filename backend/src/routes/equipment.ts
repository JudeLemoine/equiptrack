import { randomUUID } from "crypto"
import { Prisma } from "@prisma/client"
import { Router } from "express"
import {
  mapApiEquipmentStatusToPrisma,
  mapAuditActionToActivityType,
  mapPrismaEquipmentStatusToApi,
  toIsoDate,
  type ApiEquipmentStatus,
} from "../db/mappers"
import { prisma } from "../lib/db"
import { requireRole } from "../middleware/requireRole"
import { markServiced } from "../services/maintenance.service"

const router = Router()

type ApiEquipment = {
  id: string
  name: string
  category: string
  status: ApiEquipmentStatus
  qrCode: string
  lastServiceDate: string
  maintenanceIntervalDays?: number
  nextServiceDueDate?: string
  notes?: string
}

type ServiceLogEntry = {
  id: string
  equipmentId: string
  date: string
  note: string
  performedByUserId: string
}

const equipmentInclude = {
  equipmentType: {
    include: {
      category: true,
    },
  },
} satisfies Prisma.EquipmentUnitInclude

function slugifyCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32)
}

function toApiEquipment(unit: Prisma.EquipmentUnitGetPayload<{ include: typeof equipmentInclude }>): ApiEquipment {
  return {
    id: unit.id,
    name: unit.equipmentType.name,
    category: unit.equipmentType.category.name,
    status: mapPrismaEquipmentStatusToApi(unit.status),
    qrCode: unit.assetTag,
    lastServiceDate: toIsoDate(unit.lastMaintenanceAt) ?? "",
    maintenanceIntervalDays: unit.equipmentType.defaultMaintenanceDays ?? undefined,
    nextServiceDueDate: toIsoDate(unit.nextMaintenanceDue),
    notes: unit.notesSummary ?? undefined,
  }
}

async function ensureUserExists(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
}

function statusFilterToWhere(status?: ApiEquipmentStatus): Prisma.EquipmentUnitWhereInput {
  if (!status) return {}

  if (status === "available") {
    return { status: { in: ["AVAILABLE"] } }
  }

  if (status === "in_use") {
    return { status: { in: ["RESERVED", "CHECKED_OUT", "OVERDUE"] } }
  }

  return { status: { in: ["DUE_SOON_MAINTENANCE", "IN_MAINTENANCE", "OUT_OF_SERVICE"] } }
}

router.get("/alerts/maintenance", async (_req, res) => {
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const units = await prisma.equipmentUnit.findMany({
    where: {
      isActive: true,
      nextMaintenanceDue: {
        lte: nextWeek,
      },
    },
    include: equipmentInclude,
    orderBy: {
      nextMaintenanceDue: "asc",
    },
  })

  const alerts = units.filter((u) => Boolean(u.nextMaintenanceDue))

  res.json({
    count: alerts.length,
    equipment: alerts.map(toApiEquipment),
  })
})

router.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : ""
  const status = typeof req.query.status === "string" ? (req.query.status as ApiEquipmentStatus) : undefined
  const category = typeof req.query.category === "string" ? req.query.category.trim() : undefined

  const where: Prisma.EquipmentUnitWhereInput = {
    isActive: true,
    ...statusFilterToWhere(status),
    ...(category
      ? {
          equipmentType: {
            category: {
              name: category,
            },
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              assetTag: {
                contains: search,
              },
            },
            {
              equipmentType: {
                name: {
                  contains: search,
                },
              },
            },
          ],
        }
      : {}),
  }

  const units = await prisma.equipmentUnit.findMany({
    where,
    include: equipmentInclude,
    orderBy: { createdAt: "desc" },
  })

  res.json(units.map(toApiEquipment))
})

router.get("/:id", async (req, res) => {
  const item = await prisma.equipmentUnit.findFirst({
    where: { id: req.params.id, isActive: true },
    include: equipmentInclude,
  })

  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  res.json(toApiEquipment(item))
})

router.post("/", requireRole("admin"), async (req, res) => {
  const body = req.body as Partial<ApiEquipment>

  if (!body.name || !body.category || !body.qrCode || !body.status) {
    res.status(400).json({ message: "name, category, qrCode, and status are required" })
    return
  }

  const categoryName = body.category.trim()
  const categoryCode = slugifyCode(categoryName)
  const typeName = body.name.trim()
  const typeCode = slugifyCode(typeName)
  const qrCode = body.qrCode
  const nextStatus = body.status

  const createdEquipmentId = await prisma.$transaction(async (tx) => {
    const category = await tx.equipmentCategory.upsert({
      where: { code: categoryCode },
      update: {
        name: categoryName,
      },
      create: {
        name: categoryName,
        code: categoryCode,
      },
    })

    const equipmentType = await tx.equipmentType.upsert({
      where: { code: typeCode },
      update: {
        name: typeName,
        categoryId: category.id,
        defaultMaintenanceDays: body.maintenanceIntervalDays,
      },
      create: {
        name: typeName,
        code: typeCode,
        categoryId: category.id,
        defaultMaintenanceDays: body.maintenanceIntervalDays,
      },
    })

    const defaultLocation = await tx.location.findFirst({ orderBy: { createdAt: "asc" } })
    if (!defaultLocation) {
      throw new Error("No location exists. Seed database first.")
    }

    const created = await tx.equipmentUnit.create({
      data: {
        assetTag: qrCode,
        serialNumber: `SN-${randomUUID().slice(0, 8).toUpperCase()}`,
        equipmentTypeId: equipmentType.id,
        locationId: defaultLocation.id,
        status: mapApiEquipmentStatusToPrisma(nextStatus),
        lastMaintenanceAt: body.lastServiceDate ? new Date(body.lastServiceDate) : null,
        nextMaintenanceDue: body.nextServiceDueDate ? new Date(body.nextServiceDueDate) : null,
        notesSummary: body.notes,
      },
    })

    return created.id
  })

  const equipment = await prisma.equipmentUnit.findUnique({
    where: { id: createdEquipmentId },
    include: equipmentInclude,
  })

  if (!equipment) {
    res.status(500).json({ message: "Failed to create equipment" })
    return
  }

  res.status(201).json(toApiEquipment(equipment))
})

router.put("/:id", requireRole("admin"), async (req, res) => {
  const existing = await prisma.equipmentUnit.findFirst({
    where: { id: req.params.id, isActive: true },
    include: equipmentInclude,
  })

  if (!existing) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  const body = req.body as Partial<ApiEquipment>

  let equipmentTypeId = existing.equipmentTypeId
  if (body.name || body.category || body.maintenanceIntervalDays !== undefined) {
    const categoryName = (body.category ?? existing.equipmentType.category.name).trim()
    const categoryCode = slugifyCode(categoryName)
    const typeName = (body.name ?? existing.equipmentType.name).trim()
    const typeCode = slugifyCode(typeName)

    const category = await prisma.equipmentCategory.upsert({
      where: { code: categoryCode },
      update: { name: categoryName },
      create: { name: categoryName, code: categoryCode },
    })

    const type = await prisma.equipmentType.upsert({
      where: { code: typeCode },
      update: {
        name: typeName,
        categoryId: category.id,
        defaultMaintenanceDays: body.maintenanceIntervalDays ?? existing.equipmentType.defaultMaintenanceDays,
      },
      create: {
        name: typeName,
        code: typeCode,
        categoryId: category.id,
        defaultMaintenanceDays: body.maintenanceIntervalDays,
      },
    })

    equipmentTypeId = type.id
  }

  const item = await prisma.equipmentUnit.update({
    where: { id: existing.id },
    data: {
      equipmentTypeId,
      status: body.status ? mapApiEquipmentStatusToPrisma(body.status) : undefined,
      assetTag: body.qrCode,
      lastMaintenanceAt: body.lastServiceDate ? new Date(body.lastServiceDate) : existing.lastMaintenanceAt,
      nextMaintenanceDue:
        body.nextServiceDueDate !== undefined
          ? body.nextServiceDueDate
            ? new Date(body.nextServiceDueDate)
            : null
          : existing.nextMaintenanceDue,
      notesSummary: body.notes ?? existing.notesSummary,
    },
    include: equipmentInclude,
  })

  res.json(toApiEquipment(item))
})

router.delete("/:id", requireRole("admin"), async (req, res) => {
  const item = await prisma.equipmentUnit.findUnique({ where: { id: req.params.id } })
  if (!item || !item.isActive) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  await prisma.equipmentUnit.update({
    where: { id: item.id },
    data: { isActive: false },
  })

  res.status(204).end()
})

router.patch("/:id/status", requireRole("admin", "maintenance"), async (req, res) => {
  const item = await prisma.equipmentUnit.findFirst({
    where: { id: req.params.id, isActive: true },
  })

  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  const status = req.body?.status as ApiEquipmentStatus | undefined
  const actorUserId = req.body?.actorUserId as string | undefined

  if (!status || !actorUserId) {
    res.status(400).json({ message: "status and actorUserId are required" })
    return
  }

  const actor = await ensureUserExists(actorUserId)
  if (!actor) {
    res.status(400).json({ message: "actorUserId is required" })
    return
  }

  const updated = await prisma.$transaction(async (tx) => {
    const unit = await tx.equipmentUnit.update({
      where: { id: item.id },
      data: { status: mapApiEquipmentStatusToPrisma(status) },
      include: equipmentInclude,
    })

    await tx.auditLog.create({
      data: {
        action: "STATUS_CHANGED",
        actorId: actor.id,
        equipmentUnitId: item.id,
        message: `Status changed to ${status}`,
      },
    })

    return unit
  })

  res.json(toApiEquipment(updated))
})

// New endpoint: Report Issue
router.post("/:id/report-issue", requireRole("field", "maintenance", "admin"), async (req, res) => {
  const item = await prisma.equipmentUnit.findFirst({
    where: { id: req.params.id, isActive: true },
    include: equipmentInclude,
  })

  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  const { severity, description, actorUserId, title } = req.body as {
    severity: string;
    description: string;
    actorUserId: string;
    title?: string;
  }

  if (!severity || !description || !actorUserId) {
    res.status(400).json({ message: "severity, description, and actorUserId are required" })
    return
  }

  const actor = await ensureUserExists(actorUserId)
  if (!actor) {
    res.status(400).json({ message: "Invalid actorUserId" })
    return
  }

  // Create IssueReport
  const issue = await prisma.issueReport.create({
    data: {
      equipmentUnitId: item.id,
      reportedById: actor.id,
      title: title || `Issue reported: ${severity.toUpperCase()}`,
      description,
      severity: severity.toUpperCase() as any, // normalize to match Prisma enum
    },
  })

  // If high severity, set equipment status to OUT_OF_SERVICE
  let updatedUnit = item
  if (severity.toUpperCase() === "HIGH" || severity.toUpperCase() === "CRITICAL") {
    updatedUnit = await prisma.equipmentUnit.update({
      where: { id: item.id },
      data: { status: "OUT_OF_SERVICE" },
      include: equipmentInclude,
    })
    await prisma.auditLog.create({
      data: {
        action: "STATUS_CHANGED",
        actorId: actor.id,
        equipmentUnitId: item.id,
        message: "Status changed to OUT_OF_SERVICE due to high severity issue",
      },
    })
  }

  // Log the issue creation in audit log
  await prisma.auditLog.create({
    data: {
      action: "ISSUE_REPORTED",
      actorId: actor.id,
      equipmentUnitId: item.id,
      issueReportId: issue.id,
      message: `Issue reported with severity ${severity}`,
    },
  })

  res.status(201).json({ issue, equipment: toApiEquipment(updatedUnit) })
})


router.post("/:id/checkout", async (req, res) => {
  const item = await prisma.equipmentUnit.findFirst({
    where: { id: req.params.id, isActive: true },
    include: equipmentInclude,
  })

  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  if (mapPrismaEquipmentStatusToApi(item.status) === "maintenance") {
    res.status(400).json({ message: "Equipment is under maintenance and cannot be checked out" })
    return
  }

  if (item.nextMaintenanceDue && item.nextMaintenanceDue <= new Date()) {
    res.status(400).json({ message: "Equipment service overdue. Maintenance required." })
    return
  }

  const actorUserId = req.body?.actorUserId as string | undefined
  if (!actorUserId) {
    res.status(400).json({ message: "actorUserId is required" })
    return
  }

  const actor = await ensureUserExists(actorUserId)
  if (!actor) {
    res.status(400).json({ message: "actorUserId is required" })
    return
  }

  const updated = await prisma.$transaction(async (tx) => {
    const unit = await tx.equipmentUnit.update({
      where: { id: item.id },
      data: { status: "CHECKED_OUT" },
      include: equipmentInclude,
    })

    await tx.auditLog.create({
      data: {
        action: "CHECKED_OUT",
        actorId: actor.id,
        equipmentUnitId: item.id,
        message: "Checked out",
      },
    })

    return unit
  })

  res.json(toApiEquipment(updated))
})

router.post("/:id/checkin", async (req, res) => {
  const item = await prisma.equipmentUnit.findFirst({
    where: { id: req.params.id, isActive: true },
    include: equipmentInclude,
  })

  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  const actorUserId = req.body?.actorUserId as string | undefined
  if (!actorUserId) {
    res.status(400).json({ message: "actorUserId is required" })
    return
  }

  const actor = await ensureUserExists(actorUserId)
  if (!actor) {
    res.status(400).json({ message: "actorUserId is required" })
    return
  }

  const updated = await prisma.$transaction(async (tx) => {
    const unit = await tx.equipmentUnit.update({
      where: { id: item.id },
      data: { status: "AVAILABLE" },
      include: equipmentInclude,
    })

    await tx.auditLog.create({
      data: {
        action: "RETURNED",
        actorId: actor.id,
        equipmentUnitId: item.id,
        message: "Checked in",
      },
    })

    return unit
  })

  res.json(toApiEquipment(updated))
})

router.post("/:id/mark-serviced", requireRole("maintenance", "admin"), async (req, res) => {
  const performedByUserId = req.body?.performedByUserId as string | undefined
  const nextServiceDueDate = req.body?.nextServiceDueDate as string | undefined

  if (!performedByUserId) {
    res.status(400).json({ message: "performedByUserId is required" })
    return
  }

  const result = await markServiced(req.params.id, performedByUserId, nextServiceDueDate)

  if (result === null) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  if (result === undefined) {
    res.status(400).json({ message: "performedByUserId is invalid" })
    return
  }

  res.json(toApiEquipment(result))
})

router.get("/:id/service-logs", async (req, res) => {
  const item = await prisma.equipmentUnit.findFirst({
    where: { id: req.params.id, isActive: true },
    select: { id: true },
  })

  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  const logs = await prisma.maintenanceRecord.findMany({
    where: { equipmentUnitId: item.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      equipmentUnitId: true,
      completedAt: true,
      createdAt: true,
      description: true,
      technicianId: true,
    },
  })

  const data: ServiceLogEntry[] = logs.map((entry) => ({
    id: entry.id,
    equipmentId: entry.equipmentUnitId,
    date: toIsoDate(entry.completedAt ?? entry.createdAt) ?? "",
    note: entry.description ?? "Maintenance entry",
    performedByUserId: entry.technicianId ?? "",
  }))

  res.json(data)
})

router.post("/:id/service-logs", requireRole("maintenance", "admin"), async (req, res) => {
  const item = await prisma.equipmentUnit.findFirst({
    where: { id: req.params.id, isActive: true },
    select: { id: true },
  })

  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  const date = req.body?.date as string | undefined
  const note = req.body?.note as string | undefined
  const performedByUserId = req.body?.performedByUserId as string | undefined

  if (!date || !note || !performedByUserId) {
    res.status(400).json({ message: "date, note, performedByUserId are required" })
    return
  }

  const performer = await ensureUserExists(performedByUserId)
  if (!performer) {
    res.status(400).json({ message: "performedByUserId is required" })
    return
  }

  const completedAt = new Date(date)

  const entry = await prisma.$transaction(async (tx) => {
    const record = await tx.maintenanceRecord.create({
      data: {
        equipmentUnitId: item.id,
        technicianId: performer.id,
        status: "COMPLETED",
        trigger: "ROUTINE",
        title: "Service log",
        description: note,
        completedAt,
      },
      select: {
        id: true,
        equipmentUnitId: true,
        completedAt: true,
        description: true,
        technicianId: true,
      },
    })

    await tx.auditLog.create({
      data: {
        action: "MAINTENANCE_COMPLETED",
        actorId: performer.id,
        equipmentUnitId: item.id,
        message: note,
      },
    })

    return record
  })

  res.status(201).json({
    id: entry.id,
    equipmentId: entry.equipmentUnitId,
    date: toIsoDate(entry.completedAt) ?? date,
    note: entry.description ?? note,
    performedByUserId: entry.technicianId ?? performedByUserId,
  })
})

router.post("/:id/notes", async (req, res) => {
  const item = await prisma.equipmentUnit.findFirst({
    where: { id: req.params.id, isActive: true },
  })

  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  const { note, authorId } = req.body as { note: string; authorId: string }

  if (!note || !authorId) {
    res.status(400).json({ message: "note and authorId are required" })
    return
  }

  const author = await ensureUserExists(authorId)
  if (!author) {
    res.status(400).json({ message: "Invalid authorId" })
    return
  }

  await prisma.$transaction(async (tx) => {
    const createdNote = await tx.note.create({
      data: {
        body: note,
        authorId: author.id,
        targetType: "EQUIPMENT_UNIT",
        equipmentUnitId: item.id,
      },
    })

    await tx.auditLog.create({
      data: {
        action: "NOTE_ADDED",
        actorId: author.id,
        equipmentUnitId: item.id,
        noteId: createdNote.id,
        message: `Field Note: ${note.length > 50 ? note.slice(0, 47) + "..." : note}`,
      },
    })
  })

  res.status(201).json({ message: "Note added successfully" })
})

router.get("/:id/activity", async (req, res) => {
  const item = await prisma.equipmentUnit.findFirst({
    where: { id: req.params.id, isActive: true },
    select: { id: true },
  })

  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 10

  const logs = await prisma.auditLog.findMany({
    where: { equipmentUnitId: item.id },
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(limit) ? limit : 10,
    select: {
      id: true,
      equipmentUnitId: true,
      action: true,
      createdAt: true,
      actorId: true,
      message: true,
    },
  })

  res.json(
    logs.map((a) => ({
      id: a.id,
      equipmentId: a.equipmentUnitId ?? item.id,
      type: mapAuditActionToActivityType(a.action),
      timestamp: a.createdAt.toISOString(),
      actorUserId: a.actorId ?? "",
      summary: a.message,
    })),
  )
})

export default router
