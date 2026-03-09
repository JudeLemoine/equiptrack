import { randomUUID } from "crypto"

export type UserRole = "admin" | "field" | "maintenance"

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
}

export type EquipmentStatus = "available" | "in_use" | "maintenance"

export type Equipment = {
  id: string
  name: string
  category: string
  status: EquipmentStatus
  qrCode: string
  lastServiceDate: string
  maintenanceIntervalDays?: number
  nextServiceDueDate?: string
  notes?: string
}

export type RentalStatus = "pending" | "active" | "returned" | "rejected"

export type Rental = {
  id: string
  equipmentId: string
  equipmentName: string
  requestedBy: string
  requestedByName: string
  status: RentalStatus
  startDate: string
  endDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type RentalStatusEvent = {
  label: string
  at: string
}

export type RentalDetail = Rental & {
  timeline: RentalStatusEvent[]
}

export type ServiceLogEntry = {
  id: string
  equipmentId: string
  date: string
  note: string
  performedByUserId: string
}

export type ActivityType = "checkout" | "checkin" | "service" | "issue" | "status_change"

export type ActivityEvent = {
  id: string
  equipmentId: string
  type: ActivityType
  timestamp: string
  actorUserId: string
  summary: string
}

const nowIso = () => new Date().toISOString()

export const users: User[] = [
  { id: "u_admin", name: "Admin User", email: "admin@equiptrack.local", role: "admin" },
  { id: "u_field1", name: "Jordan Vega", email: "jordan@equiptrack.local", role: "field" },
  { id: "u_field2", name: "Samir Patel", email: "samir@equiptrack.local", role: "field" },
  { id: "u_maint", name: "Maintenance User", email: "maintenance@equiptrack.local", role: "maintenance" },
]

export const equipment: Equipment[] = [
  {
    id: "e1",
    name: "Mini Excavator E35",
    category: "Earthmoving",
    status: "available",
    qrCode: "EQ-0001",
    lastServiceDate: "2026-01-10",
    nextServiceDueDate: "2026-03-09",
  },
  {
    id: "e2",
    name: "Wheel Loader 244L",
    category: "Earthmoving",
    status: "in_use",
    qrCode: "EQ-0002",
    lastServiceDate: "2026-01-12",
    nextServiceDueDate: "2026-02-09",
  },
  {
    id: "e3",
    name: "Scissor Lift 26ft",
    category: "Access",
    status: "maintenance",
    qrCode: "EQ-0003",
    lastServiceDate: "2026-01-02",
    nextServiceDueDate: "2026-02-01",
  },
  {
    id: "e4",
    name: "Crawler Dozer D2",
    category: "Earthmoving",
    status: "available",
    qrCode: "EQ-0004",
    lastServiceDate: "2026-01-18",
    nextServiceDueDate: "2026-03-18",
  },
  {
    id: "e5",
    name: "Backhoe Loader 420",
    category: "Earthmoving",
    status: "available",
    qrCode: "EQ-0005",
    lastServiceDate: "2026-01-25",
    nextServiceDueDate: "2026-02-25",
  },
  {
    id: "e6",
    name: "Skid Steer S66",
    category: "Earthmoving",
    status: "in_use",
    qrCode: "EQ-0006",
    lastServiceDate: "2026-01-01",
    nextServiceDueDate: "2026-02-01",
  },
  {
    id: "e7",
    name: "Dump Truck DT-12",
    category: "Transportation",
    status: "in_use",
    qrCode: "EQ-0007",
    lastServiceDate: "2026-01-27",
    nextServiceDueDate: "2026-01-27",
  },
]

export const rentals: Rental[] = [
  {
    id: "r1",
    equipmentId: "e2",
    equipmentName: "Wheel Loader 244L",
    requestedBy: "u_field1",
    requestedByName: "Jordan Vega",
    status: "active",
    startDate: "2026-01-27",
    endDate: "2026-02-09",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "r2",
    equipmentId: "e6",
    equipmentName: "Skid Steer S66",
    requestedBy: "u_field2",
    requestedByName: "Samir Patel",
    status: "active",
    startDate: "2026-01-29",
    endDate: "2026-02-07",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "r3",
    equipmentId: "e7",
    equipmentName: "Dump Truck DT-12",
    requestedBy: "u_field1",
    requestedByName: "Jordan Vega",
    status: "active",
    startDate: "2026-01-26",
    endDate: "2026-02-04",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "r4",
    equipmentId: "e5",
    equipmentName: "Backhoe Loader 420",
    requestedBy: "u_field2",
    requestedByName: "Samir Patel",
    status: "pending",
    startDate: "2026-02-07",
    endDate: "2026-02-13",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
]

export const rentalTimelines: Record<string, RentalStatusEvent[]> = {
  r1: [{ label: "Created", at: nowIso() }, { label: "Active", at: nowIso() }],
  r2: [{ label: "Created", at: nowIso() }, { label: "Active", at: nowIso() }],
  r3: [{ label: "Created", at: nowIso() }, { label: "Active", at: nowIso() }],
  r4: [{ label: "Created", at: nowIso() }, { label: "Pending", at: nowIso() }],
}

export const serviceLogs: ServiceLogEntry[] = []
export const activityEvents: ActivityEvent[] = []

export function newId() {
  return randomUUID()
}

export function getUserById(id: string) {
  return users.find((u) => u.id === id)
}

export function getEquipmentById(id: string) {
  return equipment.find((e) => e.id === id)
}

export function getRentalById(id: string) {
  return rentals.find((r) => r.id === id)
}
