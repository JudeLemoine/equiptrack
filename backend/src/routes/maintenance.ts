import { Router } from "express"
import { mapPrismaEquipmentStatusToApi, toIsoDate } from "../db/mappers"
import { prisma } from "../db/prisma"

const router = Router()

router.get("/queue", async (req, res) => {
  const days = typeof req.query.days === "string" ? Number(req.query.days) : 14
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + (Number.isFinite(days) ? days : 14))

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

  res.json(
    list.map((unit) => ({
      id: unit.id,
      name: unit.equipmentType.name,
      category: unit.equipmentType.category.name,
      status: mapPrismaEquipmentStatusToApi(unit.status),
      qrCode: unit.assetTag,
      lastServiceDate: toIsoDate(unit.lastMaintenanceAt) ?? "",
      maintenanceIntervalDays: unit.equipmentType.defaultMaintenanceDays ?? undefined,
      nextServiceDueDate: toIsoDate(unit.nextMaintenanceDue),
      notes: unit.notesSummary ?? undefined,
    })),
  )
})

export default router
