import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Wrench, CheckCircle2, Activity } from 'lucide-react'
import { Card as MuiCard, CardActionArea, Typography, Box } from '@mui/material'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { getMaintenanceSummary } from '../../../services/dashboardService'

export default function MaintenanceDashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ['maintenance-summary'],
    queryFn: getMaintenanceSummary,
  })

  if (summaryQuery.isLoading) {
    return <Loader label="Loading maintenance dashboard..." />
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <ErrorState
        error={summaryQuery.error}
        onRetry={() => summaryQuery.refetch()}
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
    </div>
  )
}
