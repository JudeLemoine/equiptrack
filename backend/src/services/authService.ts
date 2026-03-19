import { prisma } from "../lib/db"
import { mapPrismaRoleToApi, type ApiRole, mapApiRoleToPrisma } from "../db/mappers"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: ApiRole
}

export async function findUserByRole(role: ApiRole): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findFirst({
      where: { role: mapApiRoleToPrisma(role) },
      orderBy: { createdAt: "asc" },
    })

    if (!user) {
      return null
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: mapPrismaRoleToApi(user.role),
    }
  } catch (error) {
    console.error("Error in findUserByRole:", error)
    throw new Error("Database query failed")
  }
}

/**
 * Placeholder for password verification. 
 * Since the current schema does not have a password field, 
 * this always returns true for existing users.
 */
export async function verifyPassword(_user: AuthUser, _password?: string): Promise<boolean> {
  // In a real system, we would check bcrypt.compare(password, user.passwordHash)
  return true
}
