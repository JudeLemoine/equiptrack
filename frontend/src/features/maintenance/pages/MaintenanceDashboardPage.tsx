import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Wrench,
  CheckCircle2,
  Activity,
  AlertCircle,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import DataTable from '../../../components/DataTable'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import { Button } from '../../../components/ui/button'
import { getSession } from '../../../lib/auth'
import { getMaintenanceSummary } from '../../../services/dashboardService'
import { listIssueReports, resolveIssue, moveToMaintenance } from '../../../services/maintenanceService'
import type { IssueSeverity } from '../../../services/maintenanceService'
import { formatDateTime } from '../../../lib/utils'

const SEVERITY_RANK: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const SEVERITY_STYLES: Record<string, { label: string; pill: string; dot: string; bar: string }> = {
  LOW:      { label: 'Low',      pill: 'text-blue-700 bg-blue-50 border-blue-200',       dot: 'bg-blue-400',   bar: 'bg-blue-400'   },
  MEDIUM:   { label: 'Medium',   pill: 'text-amber-700 bg-amber-50 border-amber-200',    dot: 'bg-amber-400',  bar: 'bg-amber-400'  },
  HIGH:     { label: 'High',     pill: 'text-orange-700 bg-orange-50 border-orange-200', dot: 'bg-orange-400', bar: 'bg-orange-400' },
  CRITICAL: { label: 'Critical', pill: 'text-red-700 bg-red-50 border-red-200',          dot: 'bg-red-500',    bar: 'bg-red-500'    },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function MaintenanceDashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = getSession()
  const userId = session?.user.id ?? ''
  const firstName = (session?.user.name ?? 'there').split(' ')[0]
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | 'all'>('all')

  const summaryQuery = useQuery({
    queryKey: ['maintenance-summary'],
    queryFn: getMaintenanceSummary,
  })

  const issuesQuery = useQuery({
    queryKey: ['open-issues'],
    queryFn: () => listIssueReports({ status: 'OPEN' }),
  })

  const resolveMutation = useMutation({
    mutationFn: (issueId: string) => resolveIssue(issueId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['open-issues'] })
      void queryClient.invalidateQueries({ queryKey: ['maintenance-summary'] })
      toast.success('Issue dismissed successfully')
    },
  })

  const maintenanceMutation = useMutation({
    mutationFn: (issueId: string) => moveToMaintenance(issueId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['open-issues'] })
      void queryClient.invalidateQueries({ queryKey: ['maintenance-summary'] })
      toast.success('Equipment moved to maintenance')
    },
  })

  const filteredSortedIssues = useMemo(() => {
    const items = issuesQuery.data ?? []
    const filtered =
      severityFilter === 'all' ? items : items.filter((i) => i.severity === severityFilter)
    return [...filtered].sort((a, b) => {
      const diff = (SEVERITY_RANK[a.severity] ?? 99) - (SEVERITY_RANK[b.severity] ?? 99)
      return diff !== 0 ? diff : new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    })
  }, [issuesQuery.data, severityFilter])

  // Severity breakdown counts
  const severityCounts = useMemo(() => {
    const all = issuesQuery.data ?? []
    return {
      CRITICAL: all.filter((i) => i.severity === 'CRITICAL').length,
      HIGH:     all.filter((i) => i.severity === 'HIGH').length,
      MEDIUM:   all.filter((i) => i.severity === 'MEDIUM').length,
      LOW:      all.filter((i) => i.severity === 'LOW').length,
    }
  }, [issuesQuery.data])

  const totalIssues = (issuesQuery.data ?? []).length || 1

  if (summaryQuery.isLoading || issuesQuery.isLoading) return <Loader label="Loading maintenance dashboard..." />
  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <ErrorState
        error={summaryQuery.error}
        onRetry={() => { void summaryQuery.refetch(); void issuesQuery.refetch() }}
        title="Could not load dashboard"
      />
    )
  }

  const metrics = [
    { title: 'In Maintenance', value: summaryQuery.data.maintenanceEquipment, icon: Wrench,       desc: 'Currently in the service queue', border: 'border-l-amber-500',   color: 'text-amber-600',  to: '/maintenance/queue',     state: { statusFilter: 'maintenance' } },
    { title: 'Available',      value: summaryQuery.data.availableEquipment,   icon: CheckCircle2, desc: 'Ready to be rented',             border: 'border-l-emerald-500', color: 'text-emerald-600',to: '/maintenance/equipment', state: { statusFilter: 'available'   } },
    { title: 'In Use',         value: summaryQuery.data.inUseEquipment,       icon: Activity,     desc: 'Assigned to active rentals',     border: 'border-l-blue-500',    color: 'text-blue-600',   to: '/maintenance/equipment', state: { statusFilter: 'in_use'      } },
  ]

  const severityOptions: Array<{ label: string; value: IssueSeverity | 'all' }> = [
    { label: 'All',      value: 'all'      },
    { label: 'Low',      value: 'LOW'      },
    { label: 'Medium',   value: 'MEDIUM'   },
    { label: 'High',     value: 'HIGH'     },
    { label: 'Critical', value: 'CRITICAL' },
  ]

  const issueColumns = [
    { accessorKey: 'title', header: 'Issue Title' },
    {
      accessorKey: 'reportedAt',
      header: 'Date / Time',
      cell: ({ row }: any) => (
        <span className="whitespace-nowrap text-sm text-slate-500">{formatDateTime(row.original.reportedAt)}</span>
      ),
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }: any) => {
        const cfg = SEVERITY_STYLES[row.original.severity as string]
        if (!cfg) return <span className="text-xs text-slate-400">—</span>
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/maintenance/equipment/${row.original.equipmentId}`)} size="sm" variant="outline">View</Button>
          <Button onClick={() => maintenanceMutation.mutate(row.original.id)} size="sm" disabled={maintenanceMutation.isPending} style={{ backgroundColor: 'rgb(var(--brand-navy-rgb))', color: '#fff' }} className="hover:opacity-90">
            Move to Maintenance
          </Button>
          <Button onClick={() => resolveMutation.mutate(row.original.id)} size="sm" variant="ghost" disabled={resolveMutation.isPending} className="text-red-600 hover:bg-red-50 hover:text-red-700">
            Dismiss
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-7">

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <div
        className="anim-fade-up relative overflow-hidden rounded-2xl px-7 py-10"
        style={{ background: 'linear-gradient(135deg, #b45309 0%, #7c3a0a 100%)', animationDelay: '0s' }}
      >
        <div className="hero-blob pointer-events-none absolute -right-14 -top-14 h-64 w-64 rounded-full bg-white/10" />
        <div className="hero-blob-2 pointer-events-none absolute right-20 -bottom-12 h-40 w-40 rounded-full bg-white/5" />
        <div className="hero-blob pointer-events-none absolute -left-10 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5" style={{ animationDelay: '2.5s' }} />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-amber-200">{getGreeting()}</p>
            <h1 className="text-2xl font-bold text-white">{firstName}!</h1>
            <p className="mt-1.5 text-sm text-amber-100/80">Here's your service workload and inventory health.</p>
          </div>
          <span
            className="hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.88)' }}
          >
            <Wrench className="h-3 w-3" />
            Maintenance
          </span>
        </div>
      </div>

      {/* ── Quick Access ─────────────────────────────────────── */}
      <div className="anim-fade-up" style={{ animationDelay: '0.08s' }}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Quick Access</p>
        <button
          onClick={() => navigate('/maintenance/queue')}
          className="group w-full flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-left hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <Wrench className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">Maintenance Queue</p>
            <p className="text-xs text-slate-500">Review and resolve upcoming service requests</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
        </button>
      </div>

      {/* ── Fleet Status ─────────────────────────────────────── */}
      <div className="anim-fade-up" style={{ animationDelay: '0.16s' }}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Fleet Status</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map((m, i) => (
            <button
              key={m.title}
              onClick={() => navigate(m.to, { state: m.state })}
              className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl anim-fade-up"
              style={{ animationDelay: `${0.18 + i * 0.06}s` }}
            >
              <div className={`metric-card h-full rounded-xl border border-slate-200 border-l-4 ${m.border} bg-white px-5 py-5 group-hover:border-slate-300 group-hover:shadow-md`}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{m.title}</p>
                  <m.icon className={`h-4 w-4 ${m.color} opacity-50`} />
                </div>
                <p className={`anim-count-pop text-3xl font-bold ${m.color}`} style={{ animationDelay: `${0.28 + i * 0.06}s` }}>{m.value}</p>
                <p className="mt-1 text-xs text-slate-400">{m.desc}</p>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-300 transition-colors group-hover:text-slate-500">View details →</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Reported Issues Queue ─────────────────────────────── */}
      <div className="anim-fade-up" style={{ animationDelay: '0.28s' }}>

        {/* Section header + severity pills */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Reported Issues Queue</p>
              <p className="text-xs text-slate-400">
                {filteredSortedIssues.length} open issue{filteredSortedIssues.length !== 1 ? 's' : ''}
                {severityFilter !== 'all' ? ` · filtered by ${SEVERITY_STYLES[severityFilter]?.label ?? severityFilter}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {severityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSeverityFilter(opt.value)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  severityFilter === opt.value
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                {opt.value !== 'all' && SEVERITY_STYLES[opt.value] && (
                  <span className={`h-1.5 w-1.5 rounded-full ${severityFilter === opt.value ? 'bg-white' : SEVERITY_STYLES[opt.value].dot}`} />
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Severity breakdown mini-chart */}
        {(issuesQuery.data ?? []).length > 0 && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Issue Breakdown</p>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
                <div
                  key={sev}
                  className={`${SEVERITY_STYLES[sev].bar} transition-all duration-700`}
                  style={{ width: `${(severityCounts[sev] / totalIssues) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <span className={`h-2 w-2 rounded-full ${SEVERITY_STYLES[sev].dot}`} />
                  <span className="text-xs text-slate-500">{SEVERITY_STYLES[sev].label}</span>
                  <span className="text-xs font-bold text-slate-700">{severityCounts[sev]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {issuesQuery.isError ? (
          <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Could not load issue reports.
          </div>
        ) : (
          <DataTable
            columns={issueColumns}
            data={filteredSortedIssues}
            emptyDescription="No active issue reports match the current filter."
            emptyTitle="Queue Clear"
          />
        )}
      </div>

    </div>
  )
}
