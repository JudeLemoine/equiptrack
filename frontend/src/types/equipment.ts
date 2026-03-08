export type EquipmentStatus = 'available' | 'in_use' | 'maintenance'

export type Equipment = {
  id: string
  name: string
  category: string
  status: EquipmentStatus
  qrCode: string
  lastServiceDate: string
  maintenanceIntervalDays?: number
  nextServiceDueDate?: string
  notes?: string
}

export type CreateEquipmentDTO = {
  name: string
  category: string
  status: EquipmentStatus
  qrCode: string
  lastServiceDate: string
  maintenanceIntervalDays?: number
  nextServiceDueDate?: string
  notes?: string
}

export type UpdateEquipmentDTO = Partial<CreateEquipmentDTO>
