import { Router } from "express"
import { equipment, rentals, type EquipmentStatus } from "../db/store"

const router = Router()

router.get("/admin-summary", (req, res) => {
  const byStatus: Record<EquipmentStatus, number> = {
    available: 0,
    in_use: 0,
    maintenance: 0,
  }

  for (const e of equipment) byStatus[e.status]++

  const pendingRentalRequests = rentals.filter((r) => r.status === "pending").length
  const activeRentals = rentals.filter((r) => r.status === "active").length

  res.json({
    totalEquipment: equipment.length,
    byStatus,
    pendingRentalRequests,
    activeRentals,
  })
})

router.get("/field-summary", (req, res) => {
  const userId = typeof req.query.userId === "string" ? req.query.userId : ""
  const myPendingRequests = rentals.filter((r) => r.requestedBy === userId && r.status === "pending").length
  const myActiveRentals = rentals.filter((r) => r.requestedBy === userId && r.status === "active").length
  const recommendedEquipmentIds = equipment.filter((e) => e.status === "available").slice(0, 3).map((e) => e.id)

  res.json({
    myPendingRequests,
    myActiveRentals,
    recommendedEquipmentIds,
  })
})

router.get("/maintenance-summary", (req, res) => {
  const maintenanceEquipment = equipment.filter((e) => e.status === "maintenance").length
  const availableEquipment = equipment.filter((e) => e.status === "available").length
  const inUseEquipment = equipment.filter((e) => e.status === "in_use").length

  res.json({
    maintenanceEquipment,
    availableEquipment,
    inUseEquipment,
  })
})

export default router
