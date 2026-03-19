import {
  AuditAction,
  EquipmentStatus,
  Prisma,
  RentalStatus,
  UserRole,
  type User,
} from "@prisma/client"
import { mapPrismaRentalStatusToApi, toIsoDate } from "../db/mappers"
import { prisma } from "../lib/db"
import { assertEquipmentUnitBookable, checkOverlap, validateMaintenanceWindow, OCCUPYING_RENTAL_STATUSES } from "./availability.service"

const RENTAL_TRANSITIONS: Record<RentalStatus, ReadonlySet<RentalStatus>> = {
  PENDING: new Set(["APPROVED", "REJECTED", "CANCELLED"]),
  APPROVED: new Set(["RESERVED", "CHECKED_OUT", "REJECTED", "CANCELLED"]),
  RESERVED: new Set(["CHECKED_OUT", "REJECTED", "CANCELLED"]),
  CHECKED_OUT: new Set(["OVERDUE", "RETURNED"]),
  OVERDUE: new Set(["RETURNED"]),
  RETURNED: new Set(),
  REJECTED: new Set(),
  CANCELLED: new Set(),
}

const MAINTENANCE_BLOCKING_EQUIPMENT_STATUSES: EquipmentStatus[] = [
  "DUE_SOON_MAINTENANCE",
  "IN_MAINTENANCE",
  "OUT_OF_SERVICE",
]

type AllowedAction =
  | "REQUEST"
  | "APPROVED"
  | "REJECTED"
  | "RESERVED"
  | "CHECKED_OUT"
  | "RETURNED"
  | "OVERDUE"
  | "CANCELLED"

type StatusInput =
  | RentalStatus
  | "active"
  | "returned"
  | "rejected"
  | "approved"
  | "reserved"
  | "overdue"
  | "cancelled"

type ApiRental = {
  id: string
  equipmentId: string
  equipmentName: string
  requestedBy: string
  requestedByName: string
  status: ReturnType<typeof mapPrismaRentalStatusToApi>
  startDate: string
  endDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

type RentalWithRelations = Prisma.RentalGetPayload<{
  include: {
    equipmentUnit: {
      include: {
        equipmentType: true
      }
    }
    equipmentType: true
    requester: true
  }
}>

const rentalInclude = {
  equipmentUnit: {
    include: {
      equipmentType: true,
    },
  },
  equipmentType: true,
  requester: true,
} satisfies Prisma.RentalInclude

export type CreateRentalInput = {
  equipmentId: string
  requestedByUserId: string
  startDate: string
  endDate?: string
  notes?: string
}

export type TransitionRentalInput = {
  rentalId: string
  requestedStatus: StatusInput
  actorUserId: string
  assignedEquipmentId?: string
  rejectionReason?: string
}

type ServiceErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "INVALID_TRANSITION"
  | "FORBIDDEN"
  | "CONFLICT"

export class RentalLifecycleError extends Error {
  code: ServiceErrorCode
  statusCode: number

  constructor(code: ServiceErrorCode, message: string, statusCode: number) {
    super(message)
    this.code = code
    this.statusCode = statusCode
  }
}

function toApiRental(rental: RentalWithRelations): ApiRental {
  return {
    id: rental.id,
    equipmentId: rental.equipmentUnitId ?? "",
    equipmentName: rental.equipmentUnit?.equipmentType.name ?? rental.equipmentType.name,
    requestedBy: rental.requesterId,
    requestedByName: rental.requester.name,
    status: mapPrismaRentalStatusToApi(rental.status),
    startDate: toIsoDate(rental.requestedStart) ?? "",
    endDate: toIsoDate(rental.requestedEnd),
    notes: rental.reason,
    createdAt: rental.createdAt.toISOString(),
    updatedAt: rental.updatedAt.toISOString(),
  }
}

function parseRequestedStatus(input: StatusInput): RentalStatus {
  switch (input) {
    case "active":
      return "CHECKED_OUT"
    case "returned":
      return "RETURNED"
    case "rejected":
      return "REJECTED"
    case "approved":
      return "APPROVED"
    case "reserved":
      return "RESERVED"
    case "overdue":
      return "OVERDUE"
    case "cancelled":
      return "CANCELLED"
    default:
      return input
  }
}

function toAction(status: RentalStatus): AllowedAction {
  switch (status) {
    case "APPROVED":
      return "APPROVED"
    case "REJECTED":
      return "REJECTED"
    case "RESERVED":
      return "RESERVED"
    case "CHECKED_OUT":
      return "CHECKED_OUT"
    case "RETURNED":
      return "RETURNED"
    case "OVERDUE":
      return "OVERDUE"
    case "CANCELLED":
      return "CANCELLED"
    case "PENDING":
      return "REQUEST"
  }
}

function canTransition(from: RentalStatus, to: RentalStatus): boolean {
  return RENTAL_TRANSITIONS[from].has(to)
}

function ensureRoleForAction(actor: User, action: AllowedAction, rental?: { requesterId: string }) {
  if (action === "REQUEST") {
    if (actor.role !== UserRole.FIELD_WORKER && actor.role !== UserRole.ADMIN) {
      throw new RentalLifecycleError("FORBIDDEN", "Only field workers and admins can create requests", 403)
    }
    return
  }

  if (action === "RETURNED") {
    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.MAINTENANCE) {
      throw new RentalLifecycleError("FORBIDDEN", "Only admin or maintenance can mark rentals returned", 403)
    }
    return
  }

  if (action === "CANCELLED") {
    if (actor.role === UserRole.ADMIN) return
    if (actor.role === UserRole.FIELD_WORKER && rental?.requesterId === actor.id) return

    throw new RentalLifecycleError("FORBIDDEN", "Only admin or requester can cancel this rental", 403)
  }

  if (actor.role !== UserRole.ADMIN) {
    throw new RentalLifecycleError("FORBIDDEN", "Only admin can perform this rental transition", 403)
  }
}

async function resolveRequestedEquipment(
  tx: Prisma.TransactionClient,
  rental: { id: string; equipmentUnitId: string | null; requestedStart: Date; requestedEnd: Date; locationId: string | null },
  targetStatus: RentalStatus,
  assignedEquipmentId?: string,
) {
  const equipmentId = assignedEquipmentId ?? rental.equipmentUnitId
  if (!equipmentId) {
    throw new RentalLifecycleError("INVALID_INPUT", "assignedEquipmentId is required for approval", 400)
  }

  const unit = await tx.equipmentUnit.findFirst({
    where: { id: equipmentId, isActive: true },
    select: {
      id: true,
      status: true,
      nextMaintenanceDue: true,
      equipmentTypeId: true,
      locationId: true,
    },
  })

  if (!unit) {
    throw new RentalLifecycleError("NOT_FOUND", "Equipment not found", 404)
  }

  const bookable = await assertEquipmentUnitBookable({
    equipmentUnitId: unit.id,
    startDate: rental.requestedStart,
    endDate: rental.requestedEnd,
    locationId: rental.locationId ?? undefined,
    excludeRentalId: rental.id,
  })
  if (!bookable.ok) {
    throw new RentalLifecycleError("CONFLICT", bookable.message, bookable.statusCode)
  }

  const overlap = await checkOverlap(unit.id, rental.requestedStart, rental.requestedEnd, rental.id);
  if (overlap) {
    throw new RentalLifecycleError("CONFLICT", "Equipment is already reserved or checked out during the requested window.", 409);
  }

  const durationMs = rental.requestedEnd.getTime() - rental.requestedStart.getTime();
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  
  const validMaintenance = await validateMaintenanceWindow(unit.id, durationDays, rental.requestedStart);
  if (!validMaintenance) {
    throw new RentalLifecycleError("CONFLICT", "Equipment maintenance is due during the requested rental duration.", 409);
  }

  if (targetStatus === "CHECKED_OUT") {
    if (unit.status === "IN_MAINTENANCE" || unit.status === "OUT_OF_SERVICE" || unit.status === "DUE_SOON_MAINTENANCE") {
      throw new RentalLifecycleError("CONFLICT", "Equipment is not available for checkout", 409)
    }
    return { ...unit, nextStatus: EquipmentStatus.CHECKED_OUT }
  }

  if (targetStatus === "OVERDUE") {
    return { ...unit, nextStatus: EquipmentStatus.OVERDUE }
  }

  if (targetStatus === "APPROVED" || targetStatus === "RESERVED") {
    return { ...unit, nextStatus: EquipmentStatus.RESERVED }
  }

  return { ...unit, nextStatus: unit.status }
}

async function releaseEquipmentIfNeeded(
  tx: Prisma.TransactionClient,
  rentalId: string,
  equipmentUnitId: string | null,
) {
  if (!equipmentUnitId) return

  const equipment = await tx.equipmentUnit.findUnique({
    where: { id: equipmentUnitId },
    select: { id: true, status: true },
  })

  if (!equipment) return

  if (MAINTENANCE_BLOCKING_EQUIPMENT_STATUSES.includes(equipment.status)) {
    return
  }

  const stillHeld = await tx.rental.count({
    where: {
      id: { not: rentalId },
      equipmentUnitId,
      status: { in: OCCUPYING_RENTAL_STATUSES },
    },
  })

  if (stillHeld > 0) {
    return
  }

  await tx.equipmentUnit.update({
    where: { id: equipmentUnitId },
    data: { status: EquipmentStatus.AVAILABLE },
  })
}

function getAuditEntry(status: RentalStatus, rejectionReason?: string): { action: AuditAction; message: string } {
  if (status === "APPROVED") return { action: "REQUEST_APPROVED", message: "Rental approved" }
  if (status === "REJECTED") return { action: "REQUEST_REJECTED", message: rejectionReason ?? "Rental rejected" }
  if (status === "CHECKED_OUT") return { action: "CHECKED_OUT", message: "Checked out" }
  if (status === "RETURNED") return { action: "RETURNED", message: "Returned" }
  if (status === "CANCELLED") return { action: "STATUS_CHANGED", message: "Rental cancelled" }
  if (status === "OVERDUE") return { action: "STATUS_CHANGED", message: "Rental overdue" }
  if (status === "RESERVED") return { action: "STATUS_CHANGED", message: "Rental reserved" }
  return { action: "STATUS_CHANGED", message: `Status changed to ${status}` }
}

export async function createRentalRequest(input: CreateRentalInput): Promise<ApiRental> {
  if (!input.equipmentId || !input.requestedByUserId || !input.startDate) {
    throw new RentalLifecycleError("INVALID_INPUT", "equipmentId, requestedBy, startDate are required", 400)
  }

  const requestedStart = new Date(input.startDate)
  const requestedEnd = new Date(input.endDate ?? input.startDate)
  if (Number.isNaN(requestedStart.getTime()) || Number.isNaN(requestedEnd.getTime()) || requestedEnd < requestedStart) {
    throw new RentalLifecycleError("INVALID_INPUT", "startDate/endDate are invalid", 400)
  }

  const [user, equipment] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.requestedByUserId } }),
    prisma.equipmentUnit.findFirst({
      where: { id: input.equipmentId, isActive: true },
      select: {
        id: true,
        equipmentTypeId: true,
        locationId: true,
      },
    }),
  ])

  if (!user) throw new RentalLifecycleError("NOT_FOUND", "User not found", 404)
  if (!equipment) throw new RentalLifecycleError("NOT_FOUND", "Equipment not found", 404)

  ensureRoleForAction(user, "REQUEST")

  const bookable = await assertEquipmentUnitBookable({
    equipmentUnitId: equipment.id,
    startDate: requestedStart,
    endDate: requestedEnd,
    locationId: equipment.locationId,
  })
  if (!bookable.ok) {
    throw new RentalLifecycleError("CONFLICT", bookable.message, bookable.statusCode)
  }

  const rental = await prisma.$transaction(async (tx) => {
    const created = await tx.rental.create({
      data: {
        equipmentUnitId: equipment.id,
        equipmentTypeId: equipment.equipmentTypeId,
        requesterId: user.id,
        locationId: equipment.locationId,
        status: "PENDING",
        reason: input.notes ?? "Rental requested",
        requestedStart,
        requestedEnd,
      },
      include: rentalInclude,
    })

    await tx.auditLog.create({
      data: {
        action: "REQUEST_SUBMITTED",
        actorId: user.id,
        rentalId: created.id,
        equipmentUnitId: equipment.id,
        message: "Rental request submitted",
      },
    })

    return created
  })

  return toApiRental(rental)
}

export async function transitionRentalStatus(input: TransitionRentalInput): Promise<ApiRental> {
  const targetStatus = parseRequestedStatus(input.requestedStatus)
  const actor = await prisma.user.findUnique({ where: { id: input.actorUserId } })
  if (!actor) throw new RentalLifecycleError("NOT_FOUND", "actorUserId is invalid", 404)

  const rental = await prisma.rental.findUnique({ where: { id: input.rentalId } })
  if (!rental) throw new RentalLifecycleError("NOT_FOUND", "Rental not found", 404)

  if (!canTransition(rental.status, targetStatus)) {
    throw new RentalLifecycleError("INVALID_TRANSITION", `Cannot transition from ${rental.status} to ${targetStatus}`, 409)
  }

  ensureRoleForAction(actor, toAction(targetStatus), rental)

  const updated = await prisma.$transaction(async (tx) => {
    let equipmentUnitId = rental.equipmentUnitId
    let equipmentTypeId = rental.equipmentTypeId
    let locationId = rental.locationId

    if (targetStatus === "APPROVED" || targetStatus === "RESERVED" || targetStatus === "CHECKED_OUT" || targetStatus === "OVERDUE") {
      const unit = await resolveRequestedEquipment(
        tx,
        {
          id: rental.id,
          equipmentUnitId: rental.equipmentUnitId,
          requestedStart: rental.requestedStart,
          requestedEnd: rental.requestedEnd,
          locationId: rental.locationId,
        },
        targetStatus,
        input.assignedEquipmentId,
      )
      equipmentUnitId = unit.id
      equipmentTypeId = unit.equipmentTypeId
      locationId = unit.locationId

      if (unit.status !== unit.nextStatus) {
        await tx.equipmentUnit.update({
          where: { id: unit.id },
          data: { status: unit.nextStatus },
        })
      }
    }

    const updateData: Prisma.RentalUncheckedUpdateInput = {
      status: targetStatus,
      equipmentUnitId: equipmentUnitId ?? undefined,
      equipmentTypeId,
      locationId: locationId ?? undefined,
      approverId: targetStatus === "APPROVED" || targetStatus === "RESERVED" ? actor.id : rental.approverId,
      approvedStart: targetStatus === "APPROVED" || targetStatus === "RESERVED" ? rental.requestedStart : rental.approvedStart,
      approvedEnd: targetStatus === "APPROVED" || targetStatus === "RESERVED" ? rental.requestedEnd : rental.approvedEnd,
      checkedOutById: targetStatus === "CHECKED_OUT" ? actor.id : rental.checkedOutById,
      checkedOutAt: targetStatus === "CHECKED_OUT" ? new Date() : rental.checkedOutAt,
      returnedById: targetStatus === "RETURNED" ? actor.id : rental.returnedById,
      returnedAt: targetStatus === "RETURNED" ? new Date() : rental.returnedAt,
      rejectedReason: targetStatus === "REJECTED" ? input.rejectionReason ?? "Rejected" : null,
    }

    const nextRental = await tx.rental.update({
      where: { id: rental.id },
      data: updateData,
      include: rentalInclude,
    })

    if (targetStatus === "RETURNED" || targetStatus === "REJECTED" || targetStatus === "CANCELLED") {
      await releaseEquipmentIfNeeded(tx, rental.id, nextRental.equipmentUnitId)
    }

    const audit = getAuditEntry(targetStatus, input.rejectionReason)
    await tx.auditLog.create({
      data: {
        action: audit.action,
        actorId: actor.id,
        rentalId: rental.id,
        equipmentUnitId: nextRental.equipmentUnitId,
        message: audit.message,
      },
    })

    return nextRental
  })

  return toApiRental(updated)
}
