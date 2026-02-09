import { Router } from "express"
import { users } from "../db/store"

const router = Router()

router.get("/", (req, res) => {
  const role = typeof req.query.role === "string" ? req.query.role : undefined
  if (!role || role === "all") {
    res.json(users)
    return
  }
  res.json(users.filter((u) => u.role === role))
})

export default router
