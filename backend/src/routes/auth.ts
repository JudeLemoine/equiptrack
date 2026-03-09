import { Router } from "express"
import { users } from "../db/store"

const router = Router()

router.post("/login", (req, res) => {
  const role = req.body?.role as "admin" | "field" | "maintenance" | undefined
  if (!role) {
    res.status(400).json({ message: "role is required" })
    return
  }

  const user = users.find((u) => u.role === role)
  if (!user) {
    res.status(401).json({ message: "invalid role" })
    return
  }

  res.json({
    token: `dev-token-${user.id}`,
    user,
  })
})

export default router
