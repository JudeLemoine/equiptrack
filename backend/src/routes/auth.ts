import { Router } from "express"
import db from "../lib/db"
import { generateId } from "../lib/db"
import { mapApiRoleToPrisma, type ApiRole } from "../db/mappers"
import * as authService from "../services/authService"

const router = Router()

router.post("/login", async (req, res) => {
  const role = req.body?.role as ApiRole | undefined
  if (!role) {
    return res.status(400).json({ message: "role is required" })
  }

  try {
    let authUser = await authService.findUserByRole(role)

    if (!authUser) {
      console.log(`User for role ${role} not found. Checking if database is empty...`)
      const row = db.prepare("SELECT COUNT(*) as count FROM User").get() as { count: number }

      if (row.count === 0) {
        console.log("Database is empty. Creating default test user...")
        const id = generateId()
        db.prepare(
          "INSERT INTO User (id, name, email, role) VALUES (?, ?, ?, ?)"
        ).run(id, "Default Admin", "admin@equiptrack.dev", mapApiRoleToPrisma("admin"))

        if (role === "admin") {
          authUser = await authService.findUserByRole("admin")
        }
      }
    }

    if (!authUser) {
      return res.status(401).json({ message: "invalid role" })
    }

    const isPasswordValid = await authService.verifyPassword(authUser, req.body?.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "invalid credentials" })
    }

    const token = process.env.JWT_SECRET
      ? `jwt-token-${authUser.id}`
      : `dev-token-${authUser.id}`

    res.json({
      token: token,
      user: authUser
    })
  } catch (error) {
    console.error("Login Error:", error)
    res.status(500).json({ error: "Internal server error during login" })
  }
})

export default router
