import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DataTable from '../../../components/DataTable'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import { Button } from '../../../components/ui/button'
import { getSession } from '../../../lib/auth'
import { formatDateTime } from '../../../lib/utils'
import {
  listIssueReports,
  resolveIssue,
  moveToMaintenance,
  type IssueReport,
  type IssueStatus,
  type IssueSeverity,
} from '../../../services/maintenanceService'

const SEVERITY_RANK: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
const ISSUE_STATUS_RANK: Record<string, number> = { OPEN: 0, IN_PROGRESS: 1, REVIEWED: 2, RESOLVED: 3, CLOSED: 4 }

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'text-blue-700 bg-blue-50 border-blue-200',
  MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
  HIGH: 'text-orange-700 bg-orange-50 border-orange-200',
  CRITICAL: 'text-red-700 bg-red-50 border-red-200',
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'text-red-700 bg-red-50 border-red-200',
  REVIEWED: 'text-amber-700 bg-amber-50 border-amber-200',
  IN_PROGRESS: 'text-blue-700 bg-blue-50 border-blue-200',
  RESOLVED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  CLOSED: 'text-slate-600 bg-slate-50 border-slate-200',
}

const statusOptions: Array<{ label: string; value: IssueStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Reviewed', value: 'REVIEWED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
]

const severityOptions: Array<{ label: string; value: IssueSeverity | 'all' }> = [
  { label: 'All severities', value: 'all' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
]

export default function MaintenanceIssuesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = getSession()
  const userId = session?.user.id ?? ''

  const [status, setStatus] = useState<IssueStatus | 'all'>('all')
  const [severity, setSeverity] = useState<IssueSeverity | 'all'>('all')

  const issuesQuery = useQuery({
    queryKey: ['issues', { status, severity }],
    queryFn: () =>
      listIssueReports({
        status: status === 'all' ? undefined : status,
        severity: severity === 'all' ? undefined : severity,
      }),
    placeholderData: keepPreviousData,
  })

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolveIssue(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      toast.success('Issue resolved.')
    },
  })

  const maintenanceMutation = useMutation({
    mutationFn: (id: string) => moveToMaintenance(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-queue'] })
      toast.success('Equipment moved to maintenance queue.')
    },
  })

  const columns = useMemo<ColumnDef<IssueReport>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Issue',
        cell: ({ row }) => (
          <p className="font-medium text-slate-900">{row.original.title}</p>
        ),
      },
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ row }) => (
          <span
            className={`inline-block w-20 text-center py-0.5 rounded text-xs font-semibold border ${SEVERITY_COLORS[row.original.severity] ?? 'text-slate-700 bg-slate-50 border-slate-200'}`}
          >
            {row.original.severity}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${STATUS_COLORS[row.original.status] ?? 'text-slate-700 bg-slate-50 border-slate-200'}`}
          >
            {row.original.status.replace('_', ' ')}
          </span>
        ),
      },
      {
        accessorKey: 'reportedAt',
        header: 'Reported',
        cell: ({ row }) => (
          <span className="text-sm text-slate-500 whitespace-nowrap">
            {formatDateTime(row.original.reportedAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const isOpen = row.original.status === 'OPEN' || row.original.status === 'REVIEWED' || row.original.status === 'IN_PROGRESS'
          return (
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/maintenance/equipment/${row.original.equipmentId}`)}
              >
                View Equipment
              </Button>
              {isOpen && (
                <>
                  <Button
                    size="sm"
                    onClick={() => maintenanceMutation.mutate(row.original.id)}
                    disabled={maintenanceMutation.isPending}
                    style={{ backgroundColor: 'rgb(var(--brand-navy-rgb))', color: '#fff' }}
                    className="hover:opacity-90"
                  >
                    Move to Queue
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => resolveMutation.mutate(row.original.id)}
                    disabled={resolveMutation.isPending}
                  >
                    Dismiss
                  </Button>
                </>
              )}
            </div>
          )
        },
      },
    ],
    [navigate, maintenanceMutation, resolveMutation],
  )

  const sortedIssues = useMemo(() => {
    return [...(issuesQuery.data ?? [])].sort((a, b) => {
      const statusDiff = (ISSUE_STATUS_RANK[a.status] ?? 99) - (ISSUE_STATUS_RANK[b.status] ?? 99)
      if (statusDiff !== 0) return statusDiff
      const severityDiff = (SEVERITY_RANK[a.severity] ?? 99) - (SEVERITY_RANK[b.severity] ?? 99)
      if (severityDiff !== 0) return severityDiff
      return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    })
  }, [issuesQuery.data])

  if (issuesQuery.isLoading) return <Loader label="Loading issue reports..." />
  if (issuesQuery.isError) {
    return (
      <ErrorState
        error={issuesQuery.error}
        onRetry={() => issuesQuery.refetch()}
        title="Could not load issue reports"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issue Reports"
        subtitle="All equipment issues reported by field workers"
      />

      <div className="flex flex-wrap gap-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</span>
          <div className="flex flex-wrap gap-1.5">
            {statusOptions.map((o) => (
              <button
                key={o.value}
                onClick={() => setStatus(o.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${status === o.value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-400'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</span>
          <div className="flex flex-wrap gap-1.5">
            {severityOptions.map((o) => (
              <button
                key={o.value}
                onClick={() => setSeverity(o.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${severity === o.value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-400'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sortedIssues}
        emptyTitle="No issue reports"
        emptyDescription="No reports match the current filters."
      />
    </div>
  )
}
