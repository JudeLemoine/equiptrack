import { apiClient } from './apiClient'
import type { Session, UserRole } from '../types/auth'

export function loginAsRole(role: UserRole): Promise<Session> {
  return apiClient.post<Session, { role: UserRole }>('/api/auth/login', { role })
}
