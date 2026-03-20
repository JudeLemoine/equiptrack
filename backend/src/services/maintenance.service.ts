import { IssueSeverity, IssueStatus, NoteTargetType, Prisma } from "@prisma/client"
import { mapPrismaEquipmentStatusToApi, toIsoDate } from "../db/mappers"
import { prisma } from "../lib/db"

type QueueItem = {
  id: string
  name: string
  category: string
  status: ReturnType<typeof mapPrismaEquipmentStatusToApi>
  qrCode: string
  lastServiceDate: string
  maintenanceIntervalDays?: number
  nextServiceDueDate?: string
  notes?: string
}

type IssuePayload = {
  equipmentId: string
  reportedByUserId: string
  title: string
  description: string
  severity: IssueSeverity
}

type NotePayload = {
  authorId: string
  body: string
  targetType: NoteTargetType
  equipmentUnitId?: string
  rentalId?: string
  maintenanceRecordId?: string
  issueReportId?: string
}

async function validateNoteTarget(payload: NotePayload): Promise<boolean> {
  if (payload.targetType === "EQUIPMENT_UNIT") {
    if (!payload.equipmentUnitId) return false
    const item = await prisma.equipmentUnit.findUnique({
      where: { id: payload.equipmentUnitId },
      select: { id: true },
    })
    return Boolean(item)
  }

  if (payload.targetType === "RENTAL") {
    if (!payload.rentalId) return false
    const item = await prisma.rental.findUnique({
      where: { id: payload.rentalId },
      select: { id: true },
    })
    return Boolean(item)
  }

  if (payload.targetType === "MAINTENANCE_RECORD") {
    if (!payload.maintenanceRecordId) return false
    const item = await prisma.maintenanceRecord.findUnique({
      where: { id: payload.maintenanceRecordId },
      select: { id: true },
    })
    return Boolean(item)
  }

  if (!payload.issueReportId) return false
  const item = await prisma.issueReport.findUnique({
    where: { id: payload.issueReportId },
    select: { id: true },
  })
  return Boolean(item)
}

export async function getMaintenanceQueue(days: number): Promise<QueueItem[]> {
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + days)

  const list = await prisma.equipmentUnit.findMany({
    where: {
      isActive: true,
      nextMaintenanceDue: {
        lte: cutoff,
      },
    },
    include: {
      equipmentType: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { nextMaintenanceDue: "asc" },
  })

  return list.map((unit) => ({
    id: unit.id,
    name: unit.equipmentType.name,
    category: unit.equipmentType.category.name,
    status: mapPrismaEquipmentStatusToApi(unit.status),
    qrCode: unit.assetTag,
    lastServiceDate: toIsoDate(unit.lastMaintenanceAt) ?? "",
    maintenanceIntervalDays: unit.equipmentType.defaultMaintenanceDays ?? undefined,
    nextServiceDueDate: toIsoDate(unit.nextMaintenanceDue),
    notes: unit.notesSummary ?? undefined,
  }))
}

export async function listIssueReports(input: { equipmentId?: string; status?: IssueStatus; severity?: IssueSeverity }) {
  const issues = await prisma.issueReport.findMany({
    where: {
      ...(input.equipmentId ? { equipmentUnitId: input.equipmentId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.severity ? { severity: input.severity } : {}),
    },
    orderBy: { reportedAt: "desc" },
  })

  return issues.map((issue) => ({
    id: issue.id,
    equipmentId: issue.equipmentUnitId,
    reportedByUserId: issue.reportedById,
    title: issue.title,
    description: issue.description,
    severity: issue.severity,
    status: issue.status,
    reportedAt: issue.reportedAt.toISOString(),
    resolvedAt: issue.resolvedAt?.toISOString(),
  }))
}

export async function createIssueReport(input: IssuePayload) {
  const unit = await prisma.equipmentUnit.findFirst({
    where: { id: input.equipmentId, isActive: true },
    select: { id: true },
  })

  if (!unit) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: input.reportedByUserId },
    select: { id: true },
  })

  if (!user) {
    return undefined
  }

  const issue = await prisma.$transaction(async (tx) => {
    const created = await tx.issueReport.create({
      data: {
        equipmentUnitId: unit.id,
        reportedById: user.id,
        title: input.title,
        description: input.description,
        severity: input.severity,
      },
    })

    await tx.auditLog.create({
      data: {
        action: "ISSUE_REPORTED",
        actorId: user.id,
        equipmentUnitId: unit.id,
        issueReportId: created.id,
        message: input.title,
      },
    })

    return created
  })

  return {
    id: issue.id,
    equipmentId: issue.equipmentUnitId,
    reportedByUserId: issue.reportedById,
    title: issue.title,
    description: issue.description,
    severity: issue.severity,
    status: issue.status,
    reportedAt: issue.reportedAt.toISOString(),
    resolvedAt: issue.resolvedAt?.toISOString(),
  }
}

export async function updateIssueReportStatus(input: {
  issueId: string
  status: IssueStatus
  actorUserId: string
}) {
  const [issue, actor] = await Promise.all([
    prisma.issueReport.findUnique({ where: { id: input.issueId } }),
    prisma.user.findUnique({ where: { id: input.actorUserId }, select: { id: true } }),
  ])

  if (!issue) {
    return null
  }

  if (!actor) {
    return undefined
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.issueReport.update({
      where: { id: issue.id },
      data: {
        status: input.status,
        resolvedAt: input.status === "RESOLVED" || input.status === "CLOSED" ? new Date() : null,
      },
    })

    await tx.auditLog.create({
      data: {
        action: "STATUS_CHANGED",
        actorId: actor.id,
        equipmentUnitId: issue.equipmentUnitId,
        issueReportId: issue.id,
        message: `Issue status changed to ${input.status}`,
      },
    })

    return next
  })

  return {
    id: updated.id,
    equipmentId: updated.equipmentUnitId,
    reportedByUserId: updated.reportedById,
    title: updated.title,
    description: updated.description,
    severity: updated.severity,
    status: updated.status,
    reportedAt: updated.reportedAt.toISOString(),
    resolvedAt: updated.resolvedAt?.toISOString(),
  }
}

export async function listNotes(input: {
  equipmentId?: string
  rentalId?: string
  maintenanceRecordId?: string
  issueReportId?: string
}) {
  const where: Prisma.NoteWhereInput = {}
  if (input.equipmentId) where.equipmentUnitId = input.equipmentId
  if (input.rentalId) where.rentalId = input.rentalId
  if (input.maintenanceRecordId) where.maintenanceRecordId = input.maintenanceRecordId
  if (input.issueReportId) where.issueReportId = input.issueReportId

  const notes = await prisma.note.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return notes.map((note) => ({
    id: note.id,
    authorId: note.authorId,
    body: note.body,
    targetType: note.targetType,
    equipmentId: note.equipmentUnitId ?? undefined,
    rentalId: note.rentalId ?? undefined,
    maintenanceRecordId: note.maintenanceRecordId ?? undefined,
    issueReportId: note.issueReportId ?? undefined,
    createdAt: note.createdAt.toISOString(),
  }))
}

function getAuditReferenceKey(targetType: NoteTargetType): "equipmentUnitId" | "rentalId" | "maintenanceRecordId" | "issueReportId" {
  switch (targetType) {
    case "EQUIPMENT_UNIT":
      return "equipmentUnitId"
    case "RENTAL":
      return "rentalId"
    case "MAINTENANCE_RECORD":
      return "maintenanceRecordId"
    case "ISSUE_REPORT":
      return "issueReportId"
  }
}

export async function createNote(input: NotePayload) {
  const author = await prisma.user.findUnique({
    where: { id: input.authorId },
    select: { id: true },
  })

  if (!author) {
    return undefined
  }

  const hasValidTarget = await validateNoteTarget(input)
  if (!hasValidTarget) {
    return null
  }

  const created = await prisma.$transaction(async (tx) => {
    const note = await tx.note.create({
      data: input,
    })

    const referenceKey = getAuditReferenceKey(note.targetType)
    await tx.auditLog.create({
      data: {
        action: "NOTE_ADDED",
        actorId: author.id,
        message: note.body,
        [referenceKey]:
          referenceKey === "equipmentUnitId"
            ? note.equipmentUnitId
            : referenceKey === "rentalId"
              ? note.rentalId
              : referenceKey === "maintenanceRecordId"
                ? note.maintenanceRecordId
                : note.issueReportId,
      },
    })

    return note
  })

  return {
    id: created.id,
    authorId: created.authorId,
    body: created.body,
    targetType: created.targetType,
    equipmentId: created.equipmentUnitId ?? undefined,
    rentalId: created.rentalId ?? undefined,
    maintenanceRecordId: created.maintenanceRecordId ?? undefined,
    issueReportId: created.issueReportId ?? undefined,
    createdAt: created.createdAt.toISOString(),
  }
}

export async function deleteNote(noteId: string, actorUserId: string) {
  const [note, actor] = await Promise.all([
    prisma.note.findUnique({ where: { id: noteId } }),
    prisma.user.findUnique({ where: { id: actorUserId } }),
  ])

  if (!note) return null
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "MAINTENANCE")) return undefined

  await prisma.$transaction(async (tx) => {
    await tx.note.delete({ where: { id: noteId } })
    await tx.auditLog.create({
      data: {
        action: "DELETED",
        actorId: actor.id,
        equipmentUnitId: note.equipmentUnitId,
        rentalId: note.rentalId,
        maintenanceRecordId: note.maintenanceRecordId,
        issueReportId: note.issueReportId,
        message: `Note deleted by ${actor.name}`,
      },
    })
  })

  return true
}

export async function markServiced(unitId: string, performedByUserId: string, nextServiceDue?: string) {
  const unit = await prisma.equipmentUnit.findUnique({
    where: { id: unitId },
    include: { equipmentType: true },
  })

  if (!unit) return null

  const performer = await prisma.user.findUnique({ where: { id: performedByUserId } })
  if (!performer) return undefined

  const now = new Date()
  let nextDue: Date | null = null

  if (nextServiceDue) {
    nextDue = new Date(nextServiceDue)
  } else if (unit.equipmentType.defaultMaintenanceDays) {
    nextDue = new Date(now)
    nextDue.setDate(now.getDate() + unit.equipmentType.defaultMaintenanceDays)
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.equipmentUnit.update({
      where: { id: unit.id },
      data: {
        lastMaintenanceAt: now,
        nextMaintenanceDue: nextDue,
        status: "AVAILABLE",
      },
      include: {
        equipmentType: {
          include: { category: true },
        },
      },
    })

    await tx.maintenanceRecord.create({
      data: {
        equipmentUnitId: unit.id,
        technicianId: performer.id,
        status: "COMPLETED",
        trigger: "ROUTINE",
        title: "Service completed",
        description: "Marked serviced via automated workflow",
        completedAt: now,
        nextDueAt: nextDue,
      },
    })

    await tx.auditLog.create({
      data: {
        action: "MAINTENANCE_COMPLETED",
        actorId: performer.id,
        equipmentUnitId: unit.id,
        message: "Service completed and status restored to AVAILABLE",
      },
    })

    return next
  })

  return updated
}

export async function resolveIssueReport(input: {
  issueId: string
  actorUserId: string
}) {
  const [issue, actor] = await Promise.all([
    prisma.issueReport.findUnique({ where: { id: input.issueId } }),
    prisma.user.findUnique({ where: { id: input.actorUserId } }),
  ])

  if (!issue) return null
  if (!actor) return undefined

  return prisma.$transaction(async (tx) => {
    // 1. Update Issue Status
    const updatedIssue = await tx.issueReport.update({
      where: { id: issue.id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    })

    // 2. Restore Equipment Status if it was Out of Service
    const unit = await tx.equipmentUnit.findUnique({
      where: { id: issue.equipmentUnitId },
    })

    if (unit && unit.status === "OUT_OF_SERVICE") {
      await tx.equipmentUnit.update({
        where: { id: unit.id },
        data: { status: "AVAILABLE" },
      })

      await tx.auditLog.create({
        data: {
          action: "STATUS_CHANGED",
          actorId: actor.id,
          equipmentUnitId: unit.id,
          message: "Status restored to AVAILABLE after issue resolution",
        },
      })
    }

    await tx.auditLog.create({
      data: {
        action: "UPDATED",
        actorId: actor.id,
        equipmentUnitId: issue.equipmentUnitId,
        issueReportId: issue.id,
        message: "Issue resolved and dismissed",
      },
    })

    return updatedIssue
  })
}

export async function moveToMaintenance(input: {
  issueId: string
  actorUserId: string
}) {
  const [issue, actor] = await Promise.all([
    prisma.issueReport.findUnique({ where: { id: input.issueId } }),
    prisma.user.findUnique({ where: { id: input.actorUserId } }),
  ])

  if (!issue) return null
  if (!actor) return undefined

  return prisma.$transaction(async (tx) => {
    // 1. Update Issue Status
    await tx.issueReport.update({
      where: { id: issue.id },
      data: { status: "IN_PROGRESS" },
    })

    // 2. Set Equipment to IN_MAINTENANCE
    await tx.equipmentUnit.update({
      where: { id: issue.equipmentUnitId },
      data: { status: "IN_MAINTENANCE" },
    })

    // 3. Create Maintenance Record
    const record = await tx.maintenanceRecord.create({
      data: {
        equipmentUnitId: issue.equipmentUnitId,
        issueReportId: issue.id,
        technicianId: actor.id,
        status: "IN_PROGRESS",
        trigger: "ISSUE_REPORTED",
        title: `Maintenance: ${issue.title}`,
        description: issue.description,
        startedAt: new Date(),
      },
    })

    await tx.auditLog.create({
      data: {
        action: "MAINTENANCE_OPENED",
        actorId: actor.id,
        equipmentUnitId: issue.equipmentUnitId,
        maintenanceRecordId: record.id,
        message: `Maintenance started from issue: ${issue.title}`,
      },
    })

    return record
  })
}
