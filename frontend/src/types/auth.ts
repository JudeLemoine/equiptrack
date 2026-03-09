export type UserRole = 'admin' | 'field' | 'maintenance'

export type AuthUser = {
  id: string
  name: string
  role: UserRole
  email: string
}

export type Session = {
  token: string
  user: AuthUser
}
