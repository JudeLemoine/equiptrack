import { apiClient } from './apiClient'
import type {
  CreateEquipmentDTO,
  Equipment,
  EquipmentStatus,
  UpdateEquipmentDTO,
} from '../types/equipment'

export type ListEquipmentParams = {
  search?: string
  status?: EquipmentStatus | 'all'
  category?: string | 'all'
}

export type MarkServicedDTO = {
  performedByUserId: string
  nextServiceDueDate?: string
}

export type ChangeEquipmentStatusDTO = {
  status: EquipmentStatus
  actorUserId: string
}

export function listEquipment(params?: ListEquipmentParams): Promise<Equipment[]> {
  const searchParams = new URLSearchParams()

  if (params?.search) searchParams.set('search', params.search)
  if (params?.status && params.status !== 'all') searchParams.set('status', params.status)
  if (params?.category && params.category !== 'all') searchParams.set('category', params.category)

  const queryString = searchParams.toString()
  return apiClient.get<Equipment[]>(`/api/equipment${queryString ? `?${queryString}` : ''}`)
}

export function getEquipment(id: string): Promise<Equipment> {
  return apiClient.get<Equipment>(`/api/equipment/${id}`)
}

export function createEquipment(dto: CreateEquipmentDTO): Promise<Equipment> {
  return apiClient.post<Equipment, CreateEquipmentDTO>('/api/equipment', dto)
}

export function updateEquipment(id: string, dto: UpdateEquipmentDTO): Promise<Equipment> {
  return apiClient.put<Equipment, UpdateEquipmentDTO>(`/api/equipment/${id}`, dto)
}

export function deleteEquipment(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/equipment/${id}`)
}

export function changeEquipmentStatus(id: string, dto: ChangeEquipmentStatusDTO): Promise<Equipment> {
  return apiClient.patch<Equipment, ChangeEquipmentStatusDTO>(`/api/equipment/${id}/status`, dto)
}

export function checkoutEquipment(id: string, actorUserId: string): Promise<Equipment> {
  return apiClient.post<Equipment, { actorUserId: string }>(`/api/equipment/${id}/checkout`, {
    actorUserId,
  })
}

export function checkinEquipment(id: string, actorUserId: string): Promise<Equipment> {
  return apiClient.post<Equipment, { actorUserId: string }>(`/api/equipment/${id}/checkin`, {
    actorUserId,
  })
}

export function markEquipmentServiced(id: string, dto: MarkServicedDTO): Promise<Equipment> {
  return apiClient.post<Equipment, MarkServicedDTO>(`/api/equipment/${id}/mark-serviced`, dto)
}

export function listMaintenanceQueue(days = 14): Promise<Equipment[]> {
  return apiClient.get<Equipment[]>(`/api/maintenance/queue?days=${days}`)
}
