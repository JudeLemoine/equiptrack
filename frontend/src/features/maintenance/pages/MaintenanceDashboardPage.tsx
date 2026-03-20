import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Wrench, CheckCircle2, Activity, AlertCircle } from 'lucide-react'
import { Card as MuiCard, CardActionArea, Typography, Box } from '@mui/material'
import { toast } from 'sonner'
import DataTable from '../../../components/DataTable'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { getSession } from '../../../lib/auth'
import { getMaintenanceSummary } from '../../../services/dashboardService'
import { listIssueReports, resolveIssue, moveToMaintenance } from '../../../services/maintenanceService'

export default function MaintenanceDashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = getSession()
  const userId = session?.user.id ?? ''

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

  if (summaryQuery.isLoading || issuesQuery.isLoading) {
    return <Loader label="Loading maintenance dashboard..." />
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <ErrorState
        error={summaryQuery.error}
        onRetry={() => {
          void summaryQuery.refetch()
          void issuesQuery.refetch()
        }}
        title="Could not load dashboard"
      />
    )
  }

  const cards = [
    {
      title: 'In Maintenance',
      value: summaryQuery.data.maintenanceEquipment,
      icon: Wrench,
      description: 'Equipment currently in service queue',
    },
    {
      title: 'Available',
      value: summaryQuery.data.availableEquipment,
      icon: CheckCircle2,
      description: 'Ready to be rented',
    },
    {
      title: 'In Use',
      value: summaryQuery.data.inUseEquipment,
      icon: Activity,
      description: 'Currently assigned to active rentals',
    },
  ]

  const issueColumns = [
    {
      accessorKey: 'title',
      header: 'Issue Title',
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }: any) => {
        const severity = row.original.severity
        const colors: Record<string, string> = {
          LOW: 'text-blue-700 bg-blue-50 border-blue-200',
          MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
          HIGH: 'text-orange-700 bg-orange-50 border-orange-200',
          CRITICAL: 'text-red-700 bg-red-50 border-red-200',
        }
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colors[severity] || 'text-slate-700 bg-slate-50 border-slate-200'}`}>
            {severity}
          </span>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/equipment/${row.original.equipmentId}`)}
            size="sm"
            variant="outline"
          >
            View
          </Button>
          <Button
            onClick={() => maintenanceMutation.mutate(row.original.id)}
            size="sm"
            className="bg-navy-700 hover:bg-navy-800"
            disabled={maintenanceMutation.isPending}
          >
            Move to Maintenance
          </Button>
          <Button
            onClick={() => resolveMutation.mutate(row.original.id)}
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={resolveMutation.isPending}
          >
            Dismiss
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Service workload and inventory health"
        title="Maintenance Dashboard"
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 2, mb: 1 }}>
        <MuiCard elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <CardActionArea component={Link} to="/maintenance/queue" sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f1f5f9', color: '#0f172a' }}>
              <Wrench size={28} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600" color="#0f172a">Maintenance Queue</Typography>
              <Typography variant="body2" color="text.secondary">Review and resolve service requests</Typography>
            </Box>
          </CardActionArea>
        </MuiCard>
      </Box>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
              <CardDescription className="mt-1">{card.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h2 className="text-xl font-bold text-slate-900">Reported Issues Queue</h2>
        </div>
        <DataTable
          columns={issueColumns}
          data={issuesQuery.data ?? []}
          emptyDescription="No active issue reports found."
          emptyTitle="Queue Clear"
        />
      </div>
    </div>
  )
}
