import { Router } from "express"
import { prisma } from "../lib/db"
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

    // Check for Data / Auto-Seed if database is empty or user is missing
    if (!authUser) {
      console.log(`User for role ${role} not found. Checking if database is empty...`)
      const userCount = await prisma.user.count()
      
      if (userCount === 0) {
        console.log("Database is empty. Creating default test user...")
        const newUser = await prisma.user.create({
          data: {
            name: "Default Admin",
            email: "admin@equiptrack.dev",
            role: mapApiRoleToPrisma("admin"),
          }
        })
        
        // If the requested role was admin, we can proceed with this user
        if (role === "admin") {
          authUser = await authService.findUserByRole("admin")
        }
      }
    }

    if (!authUser) {
      return res.status(401).json({ message: "invalid role" })
    }

    // Verify Password (dummy)
    const isPasswordValid = await authService.verifyPassword(authUser, req.body?.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "invalid credentials" })
    }

    // Use JWT_SECRET if needed, currently dummy token used as per frontend
    const token = process.env.JWT_SECRET 
      ? `jwt-token-${authUser.id}` // Placeholder for real JWT signing
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
