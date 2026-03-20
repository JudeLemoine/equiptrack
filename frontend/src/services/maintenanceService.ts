import { apiClient } from './apiClient'

export type IssueStatus = 'OPEN' | 'REVIEWED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type IssueReport = {
  id: string
  equipmentId: string
  reportedByUserId: string
  title: string
  description: string
  severity: IssueSeverity
  status: IssueStatus
  reportedAt: string
  resolvedAt?: string
}

export function listIssueReports(params: { status?: IssueStatus; severity?: IssueSeverity } = {}): Promise<IssueReport[]> {
  const searchParams = new URLSearchParams()
  if (params.status) searchParams.set('status', params.status)
  if (params.severity) searchParams.set('severity', params.severity)
  
  const queryString = searchParams.toString()
  return apiClient.get<IssueReport[]>(`/api/maintenance/issues${queryString ? `?${queryString}` : ''}`)
}

export function resolveIssue(id: string, actorUserId: string): Promise<IssueReport> {
  return apiClient.post<IssueReport, { actorUserId: string }>(`/api/maintenance/issues/${id}/resolve`, {
    actorUserId,
  })
}

export function moveToMaintenance(id: string, actorUserId: string): Promise<unknown> {
  return apiClient.post<unknown, { actorUserId: string }>(`/api/maintenance/issues/${id}/move-to-maintenance`, {
    actorUserId,
  })
}
