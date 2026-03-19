import { Router } from "express"
import { EquipmentStatus, RentalStatus } from "@prisma/client"
import { prisma } from "../lib/db"

const router = Router()

router.get("/admin-summary", async (req, res) => {
  const byStatus: Record<"available" | "in_use" | "maintenance", number> = {
    available: 0,
    in_use: 0,
    maintenance: 0,
  }

  const units = await prisma.equipmentUnit.findMany({
    select: { status: true },
  })

  for (const unit of units) {
    if (unit.status === EquipmentStatus.AVAILABLE) {
      byStatus.available++
      continue
    }

    if (
      unit.status === EquipmentStatus.CHECKED_OUT ||
      unit.status === EquipmentStatus.RESERVED ||
      unit.status === EquipmentStatus.OVERDUE
    ) {
      byStatus.in_use++
      continue
    }

    byStatus.maintenance++
  }

  const pendingRentalRequests = await prisma.rental.count({
    where: {
      status: { in: [RentalStatus.PENDING, RentalStatus.APPROVED, RentalStatus.RESERVED] },
    },
  })
  const activeRentals = await prisma.rental.count({
    where: {
      status: { in: [RentalStatus.CHECKED_OUT, RentalStatus.OVERDUE] },
    },
  })

  res.json({
    totalEquipment: units.length,
    byStatus,
    pendingRentalRequests,
    activeRentals,
  })
})

router.get("/field-summary", async (req, res) => {
  const userId = typeof req.query.userId === "string" ? req.query.userId : ""
  const myPendingRequests = await prisma.rental.count({
    where: {
      requesterId: userId,
      status: { in: [RentalStatus.PENDING, RentalStatus.APPROVED, RentalStatus.RESERVED] },
    },
  })
  const myActiveRentals = await prisma.rental.count({
    where: {
      requesterId: userId,
      status: { in: [RentalStatus.CHECKED_OUT, RentalStatus.OVERDUE] },
    },
  })
  const recommendedEquipmentIds = (
    await prisma.equipmentUnit.findMany({
      where: { status: EquipmentStatus.AVAILABLE, isActive: true },
      select: { id: true },
      take: 3,
      orderBy: { createdAt: "desc" },
    })
  ).map((e) => e.id)

  res.json({
    myPendingRequests,
    myActiveRentals,
    recommendedEquipmentIds,
  })
})

router.get("/maintenance-summary", async (req, res) => {
  const units = await prisma.equipmentUnit.findMany({
    select: { status: true },
  })

  let maintenanceEquipment = 0
  let availableEquipment = 0
  let inUseEquipment = 0

  for (const unit of units) {
    if (unit.status === EquipmentStatus.AVAILABLE) {
      availableEquipment++
      continue
    }

    if (
      unit.status === EquipmentStatus.CHECKED_OUT ||
      unit.status === EquipmentStatus.RESERVED ||
      unit.status === EquipmentStatus.OVERDUE
    ) {
      inUseEquipment++
      continue
    }

    maintenanceEquipment++
  }

  res.json({
    maintenanceEquipment,
    availableEquipment,
    inUseEquipment,
  })
})

export default router
