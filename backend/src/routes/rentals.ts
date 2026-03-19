import { Prisma, RentalStatus } from "@prisma/client"
import { Router } from "express"
import { mapPrismaRentalStatusToApi, toIsoDate, type ApiRentalStatus } from "../db/mappers"
import { prisma } from "../lib/db"
import {
  createRentalRequest,
  RentalLifecycleError,
  transitionRentalStatus,
} from "../services/rental-lifecycle.service"

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

  try {
    const rental = await createRentalRequest({
      equipmentId: equipmentId ?? "",
      requestedByUserId: requestedBy ?? "",
      startDate: startDate ?? "",
      endDate,
      notes,
    })
    res.status(201).json(rental)
  } catch (error) {
    if (error instanceof RentalLifecycleError) {
      res.status(error.statusCode).json({ message: error.message })
      return
    }
    throw error
  }
})

router.patch("/:id/status", async (req, res) => {
  const requestedStatus = req.body?.status as string | undefined
  const actorUserId = (req.body?.actorUserId as string | undefined) ?? ((req as any).user?.id as string | undefined)
  const assignedEquipmentId = req.body?.assignedEquipmentId as string | undefined
  const rejectionReason = req.body?.rejectionReason as string | undefined

  if (!requestedStatus || !actorUserId) {
    res.status(400).json({ message: "status and actorUserId are required" })
    return
  }

  try {
    const rental = await transitionRentalStatus({
      rentalId: req.params.id,
      requestedStatus: requestedStatus as Parameters<typeof transitionRentalStatus>[0]["requestedStatus"],
      actorUserId,
      assignedEquipmentId,
      rejectionReason,
    })
    res.json(rental)
  } catch (error) {
    if (error instanceof RentalLifecycleError) {
      res.status(error.statusCode).json({ message: error.message })
      return
    }
    throw error
  }
})

export default router
