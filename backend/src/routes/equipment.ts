import { Router } from "express"
import {
  activityEvents,
  equipment,
  getEquipmentById,
  getUserById,
  newId,
  serviceLogs,
  type ActivityEvent,
  type Equipment,
  type EquipmentStatus,
} from "../db/store"

const router = Router()

function addActivity(equipmentId: string, type: ActivityEvent["type"], actorUserId: string, summary: string) {
  activityEvents.unshift({
    id: newId(),
    equipmentId,
    type,
    timestamp: new Date().toISOString(),
    actorUserId,
    summary,
  })
}

router.get("/", (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : ""
  const status = typeof req.query.status === "string" ? (req.query.status as EquipmentStatus) : undefined
  const category = typeof req.query.category === "string" ? req.query.category : undefined

  let list = equipment.slice()

  if (search) {
    list = list.filter((e) => e.name.toLowerCase().includes(search) || e.qrCode.toLowerCase().includes(search))
  }
  if (status) {
    list = list.filter((e) => e.status === status)
  }
  if (category) {
    list = list.filter((e) => e.category === category)
  }

  res.json(list)
})

router.get("/:id", (req, res) => {
  const item = getEquipmentById(req.params.id)
  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }
  res.json(item)
})

router.post("/", (req, res) => {
  const body = req.body as Omit<Equipment, "id">
  const item: Equipment = {
    id: newId(),
    name: body.name,
    category: body.category,
    status: body.status,
    qrCode: body.qrCode,
    lastServiceDate: body.lastServiceDate,
    maintenanceIntervalDays: body.maintenanceIntervalDays,
    nextServiceDueDate: body.nextServiceDueDate,
    notes: body.notes,
  }
  equipment.unshift(item)
  res.status(201).json(item)
})

router.put("/:id", (req, res) => {
  const item = getEquipmentById(req.params.id)
  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }
  const body = req.body as Partial<Equipment>
  item.name = body.name ?? item.name
  item.category = body.category ?? item.category
  item.status = (body.status as EquipmentStatus) ?? item.status
  item.qrCode = body.qrCode ?? item.qrCode
  item.lastServiceDate = body.lastServiceDate ?? item.lastServiceDate
  item.maintenanceIntervalDays = body.maintenanceIntervalDays ?? item.maintenanceIntervalDays
  item.nextServiceDueDate = body.nextServiceDueDate ?? item.nextServiceDueDate
  item.notes = body.notes ?? item.notes
  res.json(item)
})

router.delete("/:id", (req, res) => {
  const idx = equipment.findIndex((e) => e.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }
  equipment.splice(idx, 1)
  res.status(204).end()
})

router.patch("/:id/status", (req, res) => {
  const item = getEquipmentById(req.params.id)
  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  const status = req.body?.status as EquipmentStatus | undefined
  const actorUserId = req.body?.actorUserId as string | undefined

  if (!status || !actorUserId) {
    res.status(400).json({ message: "status and actorUserId are required" })
    return
  }

  item.status = status
  addActivity(item.id, "status_change", actorUserId, `Status changed to ${status}`)
  res.json(item)
})

router.post("/:id/checkout", (req, res) => {
  const item = getEquipmentById(req.params.id)
  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }
  const actorUserId = req.body?.actorUserId as string | undefined
  if (!actorUserId || !getUserById(actorUserId)) {
    res.status(400).json({ message: "actorUserId is required" })
    return
  }
  item.status = "in_use"
  addActivity(item.id, "checkout", actorUserId, "Checked out")
  res.json(item)
})

router.post("/:id/checkin", (req, res) => {
  const item = getEquipmentById(req.params.id)
  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }
  const actorUserId = req.body?.actorUserId as string | undefined
  if (!actorUserId || !getUserById(actorUserId)) {
    res.status(400).json({ message: "actorUserId is required" })
    return
  }
  item.status = "available"
  addActivity(item.id, "checkin", actorUserId, "Checked in")
  res.json(item)
})

router.post("/:id/mark-serviced", (req, res) => {
  const item = getEquipmentById(req.params.id)
  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  const performedByUserId = req.body?.performedByUserId as string | undefined
  const nextServiceDueDate = req.body?.nextServiceDueDate as string | undefined

  if (!performedByUserId) {
    res.status(400).json({ message: "performedByUserId is required" })
    return
  }

  const today = new Date().toISOString().slice(0, 10)
  item.lastServiceDate = today
  if (nextServiceDueDate) item.nextServiceDueDate = nextServiceDueDate
  item.status = "available"

  serviceLogs.unshift({
    id: newId(),
    equipmentId: item.id,
    date: today,
    note: "Marked serviced",
    performedByUserId,
  })

  addActivity(item.id, "service", performedByUserId, "Service completed")
  res.json(item)
})

router.get("/:id/service-logs", (req, res) => {
  const item = getEquipmentById(req.params.id)
  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }
  res.json(serviceLogs.filter((l) => l.equipmentId === item.id))
})

router.post("/:id/service-logs", (req, res) => {
  const item = getEquipmentById(req.params.id)
  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }
  const date = req.body?.date as string | undefined
  const note = req.body?.note as string | undefined
  const performedByUserId = req.body?.performedByUserId as string | undefined

  if (!date || !note || !performedByUserId) {
    res.status(400).json({ message: "date, note, performedByUserId are required" })
    return
  }

  const entry = {
    id: newId(),
    equipmentId: item.id,
    date,
    note,
    performedByUserId,
  }
  serviceLogs.unshift(entry)
  res.status(201).json(entry)
})

router.get("/:id/activity", (req, res) => {
  const item = getEquipmentById(req.params.id)
  if (!item) {
    res.status(404).json({ message: "Equipment not found" })
    return
  }

  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 10
  const list = activityEvents.filter((a) => a.equipmentId === item.id).slice(0, Number.isFinite(limit) ? limit : 10)
  res.json(list)
})

export default router
