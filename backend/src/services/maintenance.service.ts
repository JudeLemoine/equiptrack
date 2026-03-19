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
