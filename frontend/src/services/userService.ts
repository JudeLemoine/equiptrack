import { apiClient } from './apiClient'
import type { UserRole } from '../types/auth'
import type { User } from '../types/user'

export type ListUsersParams = {
  role?: UserRole | 'all'
}

export function listUsers(params?: ListUsersParams): Promise<User[]> {
  const searchParams = new URLSearchParams()

  if (params?.role && params.role !== 'all') {
    searchParams.set('role', params.role)
  }

  const queryString = searchParams.toString()
  return apiClient.get<User[]>(`/api/users${queryString ? `?${queryString}` : ''}`)
}
