import { Router } from "express"
import { Prisma, UserRole } from "@prisma/client"
import { mapApiRoleToPrisma, mapPrismaRoleToApi, type ApiRole } from "../db/mappers"
import { prisma } from "../db/prisma"

const router = Router()

router.get("/", async (req, res) => {
  const role = typeof req.query.role === "string" ? req.query.role : undefined

  const where: Prisma.UserWhereInput = {}
  if (role && role !== "all") {
    where.role = mapApiRoleToPrisma(role as ApiRole)
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { name: "asc" },
  })

  res.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: mapPrismaRoleToApi(u.role as UserRole),
    })),
  )
})

export default router
