import { Router } from "express"
import { equipment } from "../db/store"

const router = Router()

router.get("/queue", (req, res) => {
  const days = typeof req.query.days === "string" ? Number(req.query.days) : 14
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + (Number.isFinite(days) ? days : 14))

  const list = equipment.filter((e) => {
    if (!e.nextServiceDueDate) return false
    const due = new Date(e.nextServiceDueDate)
    return due <= cutoff
  })

  res.json(list)
})

export default router
