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

export function getUser(id: string): Promise<User> {
  return apiClient.get<User>(`/api/users/${id}`)
}

export type UpdateUserPayload = {
  phoneNumber?: string | null
  position?: string | null
  avatarUrl?: string | null
  isAvatarIcon?: boolean
}

export function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  return apiClient.put<User, UpdateUserPayload>(`/api/users/${id}`, payload)
}

export function deleteUser(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/users/${id}`)
}
