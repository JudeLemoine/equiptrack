import {
  AuditAction,
  EquipmentStatus as PrismaEquipmentStatus,
  RentalStatus as PrismaRentalStatus,
  UserRole as PrismaUserRole,
} from "@prisma/client"

export type ApiRole = "admin" | "field" | "maintenance"
export type ApiEquipmentStatus = "available" | "in_use" | "maintenance"
export type ApiRentalStatus = "pending" | "approved" | "active" | "returned" | "rejected"

export function mapApiRoleToPrisma(role: ApiRole): PrismaUserRole {
  switch (role) {
    case "admin":
      return PrismaUserRole.ADMIN
    case "field":
      return PrismaUserRole.FIELD_WORKER
    case "maintenance":
      return PrismaUserRole.MAINTENANCE
  }
}

export function mapPrismaRoleToApi(role: PrismaUserRole): ApiRole {
  switch (role) {
    case PrismaUserRole.ADMIN:
      return "admin"
    case PrismaUserRole.FIELD_WORKER:
      return "field"
    case PrismaUserRole.MAINTENANCE:
      return "maintenance"
  }
}

export function mapPrismaEquipmentStatusToApi(status: PrismaEquipmentStatus): ApiEquipmentStatus {
  switch (status) {
    case PrismaEquipmentStatus.AVAILABLE:
      return "available"
    case PrismaEquipmentStatus.RESERVED:
    case PrismaEquipmentStatus.CHECKED_OUT:
    case PrismaEquipmentStatus.OVERDUE:
      return "in_use"
    case PrismaEquipmentStatus.DUE_SOON_MAINTENANCE:
    case PrismaEquipmentStatus.IN_MAINTENANCE:
    case PrismaEquipmentStatus.OUT_OF_SERVICE:
    case PrismaEquipmentStatus.MAINTENANCE:
      return "maintenance"
  }
}

export function mapApiEquipmentStatusToPrisma(status: ApiEquipmentStatus): PrismaEquipmentStatus {
  switch (status) {
    case "available":
      return PrismaEquipmentStatus.AVAILABLE
    case "in_use":
      return PrismaEquipmentStatus.CHECKED_OUT
    case "maintenance":
      return PrismaEquipmentStatus.IN_MAINTENANCE
  }
}

export function mapPrismaRentalStatusToApi(status: PrismaRentalStatus): ApiRentalStatus {
  switch (status) {
    case PrismaRentalStatus.PENDING:
      return "pending"
    case PrismaRentalStatus.APPROVED:
    case PrismaRentalStatus.RESERVED:
      return "approved"
    case PrismaRentalStatus.CHECKED_OUT:
    case PrismaRentalStatus.OVERDUE:
      return "active"
    case PrismaRentalStatus.RETURNED:
      return "returned"
    case PrismaRentalStatus.REJECTED:
    case PrismaRentalStatus.CANCELLED:
      return "rejected"
  }
}

export function mapApiRentalStatusToPrisma(status: ApiRentalStatus): PrismaRentalStatus {
  switch (status) {
    case "pending":
      return PrismaRentalStatus.PENDING
    case "approved":
      return PrismaRentalStatus.APPROVED
    case "active":
      return PrismaRentalStatus.CHECKED_OUT
    case "returned":
      return PrismaRentalStatus.RETURNED
    case "rejected":
      return PrismaRentalStatus.REJECTED
  }
}

export function toIsoDate(value?: Date | null): string | undefined {
  if (!value) return undefined
  return value.toISOString().slice(0, 10)
}

export function toIsoDateTime(value?: Date | null): string | undefined {
  if (!value) return undefined
  return value.toISOString()
}

export function mapAuditActionToActivityType(action: AuditAction): "checkout" | "checkin" | "service" | "issue" | "status_change" {
  switch (action) {
    case AuditAction.CHECKED_OUT:
      return "checkout"
    case AuditAction.RETURNED:
      return "checkin"
    case AuditAction.MAINTENANCE_COMPLETED:
    case AuditAction.MAINTENANCE_OPENED:
      return "service"
    case AuditAction.ISSUE_REPORTED:
      return "issue"
    default:
      return "status_change"
  }
}
