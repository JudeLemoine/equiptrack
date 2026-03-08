import type { UserRole } from './auth'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
}
