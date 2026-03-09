import { Prisma, RentalStatus } from "@prisma/client"
import { Router } from "express"
import {
  mapApiRentalStatusToPrisma,
  mapPrismaRentalStatusToApi,
  toIsoDate,
  toIsoDateTime,
  type ApiRentalStatus,
} from "../db/mappers"
import { prisma } from "../db/prisma"

const router = Router()

type ApiRental = {
  id: string
  equipmentId: string
  equipmentName: string
  requestedBy: string
  requestedByName: string
  status: ApiRentalStatus
  startDate: string
  endDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

type ApiRentalDetail = ApiRental & {
  timeline: Array<{ label: string; at: string }>
}

const rentalInclude = {
  equipmentUnit: {
    include: {
      equipmentType: true,
    },
  },
  requester: true,
} satisfies Prisma.RentalInclude

function toApiRental(rental: Prisma.RentalGetPayload<{ include: typeof rentalInclude }>): ApiRental {
  return {
    id: rental.id,
    equipmentId: rental.equipmentUnitId ?? "",
    equipmentName: rental.equipmentUnit?.equipmentType.name ?? "Equipment",
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

function statusFilterToWhere(status?: ApiRentalStatus): Prisma.RentalWhereInput {
  if (!status) return {}

  if (status === "pending") {
    return { status: { in: [RentalStatus.PENDING, RentalStatus.APPROVED, RentalStatus.RESERVED] } }
  }

  if (status === "active") {
    return { status: { in: [RentalStatus.CHECKED_OUT, RentalStatus.OVERDUE] } }
  }

  if (status === "returned") {
    return { status: RentalStatus.RETURNED }
  }

  return { status: { in: [RentalStatus.REJECTED, RentalStatus.CANCELLED] } }
}

router.get("/", async (req, res) => {
  const status = typeof req.query.status === "string" ? (req.query.status as ApiRentalStatus) : undefined
  const requestedBy = typeof req.query.requestedBy === "string" ? req.query.requestedBy : undefined

  const list = await prisma.rental.findMany({
    where: {
      ...statusFilterToWhere(status),
      ...(requestedBy ? { requesterId: requestedBy } : {}),
    },
    include: rentalInclude,
    orderBy: { createdAt: "desc" },
  })

  res.json(list.map(toApiRental))
})

router.get("/:id", async (req, res) => {
  const rental = await prisma.rental.findUnique({
    where: { id: req.params.id },
    include: rentalInclude,
  })

  if (!rental) {
    res.status(404).json({ message: "Rental not found" })
    return
  }

  const timeline = await prisma.auditLog.findMany({
    where: { rentalId: rental.id },
    orderBy: { createdAt: "asc" },
    select: {
      message: true,
      createdAt: true,
    },
  })

  const detail: ApiRentalDetail = {
    ...toApiRental(rental),
    timeline: timeline.map((item) => ({
      label: item.message,
      at: item.createdAt.toISOString(),
    })),
  }

  res.json(detail)
})

router.post("/", async (req, res) => {
  const equipmentId = req.body?.equipmentId as string | undefined
  const requestedBy = req.body?.requestedBy as string | undefined
  const startDate = req.body?.startDate as string | undefined
  const endDate = req.body?.endDate as string | undefined
  const notes = req.body?.notes as string | undefined

  if (!equipmentId || !requestedBy || !startDate) {
    res.status(400).json({ message: "equipmentId, requestedBy, startDate are required" })
    return
  }

  const equipment = await prisma.equipmentUnit.findFirst({
    where: { id: equipmentId, isActive: true },
    include: {
      equipmentType: true,
    },
  })

  if (!equipment) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  const user = await prisma.user.findUnique({
    where: { id: requestedBy },
  })

  if (!user) {
    res.status(404).json({ message: "User not found" })
    return
  }

  if (equipment.status === "IN_MAINTENANCE" || equipment.status === "OUT_OF_SERVICE") {
    res.status(400).json({ message: "Equipment is under maintenance and cannot be rented" })
    return
  }

  if (equipment.status === "CHECKED_OUT" || equipment.status === "RESERVED" || equipment.status === "OVERDUE") {
    res.status(400).json({ message: "Equipment already in use" })
    return
  }

  if (equipment.nextMaintenanceDue && equipment.nextMaintenanceDue <= new Date()) {
    res.status(400).json({ message: "Equipment service overdue and must be maintained before rental" })
    return
  }

  const requestedStart = new Date(startDate)
  const requestedEnd = new Date(endDate ?? startDate)

  const rental = await prisma.$transaction(async (tx) => {
    const created = await tx.rental.create({
      data: {
        equipmentUnitId: equipment.id,
        equipmentTypeId: equipment.equipmentTypeId,
        requesterId: user.id,
        locationId: equipment.locationId,
        status: "PENDING",
        reason: notes ?? "Rental requested",
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
        message: "Pending",
      },
    })

    return created
  })

  res.status(201).json(toApiRental(rental))
})

router.patch("/:id/status", async (req, res) => {
  const rental = await prisma.rental.findUnique({ where: { id: req.params.id } })

  if (!rental) {
    res.status(404).json({ message: "Rental not found" })
    return
  }

  const status = req.body?.status as Extract<ApiRentalStatus, "active" | "returned" | "rejected"> | undefined

  if (!status) {
    res.status(400).json({ message: "status is required" })
    return
  }

  const mappedStatus = mapApiRentalStatusToPrisma(status)

  const updated = await prisma.$transaction(async (tx) => {
    const nextData: Prisma.RentalUpdateInput = {
      status: mappedStatus,
    }

    if (status === "active") {
      nextData.checkedOutAt = new Date()
    } else if (status === "returned") {
      nextData.returnedAt = new Date()
    } else {
      nextData.rejectedReason = "Rejected"
    }

    const nextRental = await tx.rental.update({
      where: { id: rental.id },
      data: nextData,
      include: rentalInclude,
    })

    if (rental.equipmentUnitId) {
      if (status === "active") {
        await tx.equipmentUnit.update({
          where: { id: rental.equipmentUnitId },
          data: { status: "CHECKED_OUT" },
        })
      }

      if (status === "returned") {
        await tx.equipmentUnit.update({
          where: { id: rental.equipmentUnitId },
          data: { status: "AVAILABLE" },
        })
      }
    }

    await tx.auditLog.create({
      data: {
        action: status === "active" ? "CHECKED_OUT" : status === "returned" ? "RETURNED" : "REQUEST_REJECTED",
        rentalId: rental.id,
        equipmentUnitId: rental.equipmentUnitId,
        message: status === "active" ? "Active" : status === "returned" ? "Returned" : "Rejected",
      },
    })

    return nextRental
  })

  res.json({
    ...toApiRental(updated),
    updatedAt: toIsoDateTime(updated.updatedAt) ?? new Date().toISOString(),
  })
})

export default router
