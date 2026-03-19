import { Router } from "express"
import { prisma } from "../lib/db"
import { mapApiRoleToPrisma, mapPrismaRoleToApi, type ApiRole } from "../db/mappers"

const router = Router()

router.post("/login", async (req, res) => {
  const role = req.body?.role as ApiRole | undefined
  if (!role) {
    res.status(400).json({ message: "role is required" })
    return
  }

  const user = await prisma.user.findFirst({
    where: { role: mapApiRoleToPrisma(role) },
    orderBy: { createdAt: "asc" },
  })

  if (!user) {
    res.status(401).json({ message: "invalid role" })
    return
  }

  res.json({
    token: `dev-token-${user.id}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: mapPrismaRoleToApi(user.role),
    },
  })
})

export default router
