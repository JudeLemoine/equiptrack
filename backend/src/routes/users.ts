import { Router } from "express"
import { Prisma, UserRole } from "@prisma/client"
import { mapApiRoleToPrisma, mapPrismaRoleToApi, type ApiRole } from "../db/mappers"
import { prisma } from "../lib/db"

type RequestWithUser = import("express").Request & {
  user?: {
    id: string
    role: ReturnType<typeof mapPrismaRoleToApi>
  }
}

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
      phoneNumber: u.phoneNumber,
      position: u.position,
      avatarUrl: u.avatarUrl,
      isAvatarIcon: u.isAvatarIcon,
    })),
  )
})

router.get("/:id", async (req, res) => {
  const { id } = req.params
  const targetUser = await prisma.user.findUnique({ where: { id } })
  if (!targetUser) {
    return res.status(404).json({ error: "User not found." })
  }

  res.json({
    id: targetUser.id,
    name: targetUser.name,
    email: targetUser.email,
    role: mapPrismaRoleToApi(targetUser.role as UserRole),
    phoneNumber: targetUser.phoneNumber,
    position: targetUser.position,
    avatarUrl: targetUser.avatarUrl,
    isAvatarIcon: targetUser.isAvatarIcon,
  })
})

router.put("/:id", async (req, res) => {
  const { id } = req.params
  const { phoneNumber, position, avatarUrl, isAvatarIcon } = req.body

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(position !== undefined && { position }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(isAvatarIcon !== undefined && { isAvatarIcon }),
      },
    })
    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: mapPrismaRoleToApi(updated.role as UserRole),
      phoneNumber: updated.phoneNumber,
      position: updated.position,
      avatarUrl: updated.avatarUrl,
      isAvatarIcon: updated.isAvatarIcon,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to update user." })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  const userReq = req as RequestWithUser

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) {
      return res.status(404).json({ error: "User not found." })
    }

    if (userReq.user?.role === "admin" && targetUser.role === UserRole.ADMIN) {
      return res.status(403).json({ error: "Admins cannot delete other Admins." })
    }

    await prisma.user.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user." })
  }
})

export default router
