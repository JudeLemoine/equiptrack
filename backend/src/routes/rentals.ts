import { Router } from "express"
import {
  equipment,
  getEquipmentById,
  getRentalById,
  getUserById,
  newId,
  rentalTimelines,
  rentals,
  type Rental,
  type RentalDetail,
  type RentalStatus,
} from "../db/store"

const router = Router()

function pushTimeline(rentalId: string, label: string) {
  if (!rentalTimelines[rentalId]) rentalTimelines[rentalId] = []
  rentalTimelines[rentalId].push({ label, at: new Date().toISOString() })
}

router.get("/", (req, res) => {
  const status = typeof req.query.status === "string" ? (req.query.status as RentalStatus) : undefined
  const requestedBy = typeof req.query.requestedBy === "string" ? req.query.requestedBy : undefined

  let list = rentals.slice()

  if (status) list = list.filter((r) => r.status === status)
  if (requestedBy) list = list.filter((r) => r.requestedBy === requestedBy)

  res.json(list)
})

router.get("/:id", (req, res) => {
  const rental = getRentalById(req.params.id)

  if (!rental) {
    res.status(404).json({ message: "Rental not found" })
    return
  }

  const detail: RentalDetail = {
    ...rental,
    timeline: rentalTimelines[rental.id] ?? [],
  }

  res.json(detail)
})

router.post("/", (req, res) => {
  const equipmentId = req.body?.equipmentId as string | undefined
  const requestedBy = req.body?.requestedBy as string | undefined
  const startDate = req.body?.startDate as string | undefined
  const endDate = req.body?.endDate as string | undefined
  const notes = req.body?.notes as string | undefined

  if (!equipmentId || !requestedBy || !startDate) {
    res.status(400).json({ message: "equipmentId, requestedBy, startDate are required" })
    return
  }

  const eq = getEquipmentById(equipmentId)
  const user = getUserById(requestedBy)

  if (!eq) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  if (!user) {
    res.status(404).json({ message: "User not found" })
    return
  }

  if (eq.status === "maintenance") {
    res.status(400).json({ message: "Equipment is under maintenance and cannot be rented" })
    return
  }

  if (eq.status === "in_use") {
    res.status(400).json({ message: "Equipment already in use" })
    return
  }

  if (eq.nextServiceDueDate) {
    const today = new Date()
    const serviceDate = new Date(eq.nextServiceDueDate)

    if (serviceDate <= today) {
      res.status(400).json({
        message: "Equipment service overdue and must be maintained before rental",
      })
      return
    }
  }

  const now = new Date().toISOString()

  const rental: Rental = {
    id: newId(),
    equipmentId: eq.id,
    equipmentName: eq.name,
    requestedBy: user.id,
    requestedByName: user.name,
    status: "pending",
    startDate,
    endDate,
    notes,
    createdAt: now,
    updatedAt: now,
  }

  rentals.unshift(rental)

  rentalTimelines[rental.id] = [
    { label: "Created", at: now },
    { label: "Pending", at: now },
  ]

  res.status(201).json(rental)
})

router.patch("/:id/status", (req, res) => {
  const rental = getRentalById(req.params.id)

  if (!rental) {
    res.status(404).json({ message: "Rental not found" })
    return
  }

  const status = req.body?.status as Extract<RentalStatus, "active" | "returned" | "rejected"> | undefined

  if (!status) {
    res.status(400).json({ message: "status is required" })
    return
  }

  rental.status = status
  rental.updatedAt = new Date().toISOString()

  if (status === "active") {
    const eq = getEquipmentById(rental.equipmentId)
    if (eq) eq.status = "in_use"
    pushTimeline(rental.id, "Active")
  } else if (status === "returned") {
    const eq = getEquipmentById(rental.equipmentId)
    if (eq) eq.status = "available"
    pushTimeline(rental.id, "Returned")
  } else if (status === "rejected") {
    pushTimeline(rental.id, "Rejected")
  }

  res.json(rental)
})

export default router