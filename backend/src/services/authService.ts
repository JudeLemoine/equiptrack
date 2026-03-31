import db from "../lib/db"
import { mapPrismaRoleToApi, type ApiRole, mapApiRoleToPrisma } from "../db/mappers"
import type { UserRole } from "../db/enums"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: ApiRole
}

export async function findUserByRole(role: ApiRole): Promise<AuthUser | null> {
  try {
    const user = db
      .prepare("SELECT id, name, email, role FROM User WHERE role = ? ORDER BY createdAt ASC LIMIT 1")
      .get(mapApiRoleToPrisma(role)) as { id: string; name: string; email: string; role: UserRole } | undefined

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
  return true
}
