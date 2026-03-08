import { useQuery } from '@tanstack/react-query'
import { Activity, CheckCircle2, Clock3, Package, Wrench } from 'lucide-react'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { getAdminSummary } from '../../../services/dashboardService'

export default function AdminDashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ['admin-summary'],
    queryFn: getAdminSummary,
  })

  if (summaryQuery.isLoading) {
    return <Loader label="Loading admin dashboard..." />
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
      title: 'Total Equipment',
      value: summaryQuery.data.totalEquipment,
      icon: Package,
      description: 'All tracked assets',
    },
    {
      title: 'Available',
      value: summaryQuery.data.byStatus.available,
      icon: CheckCircle2,
      description: 'Ready for rental',
    },
    {
      title: 'In Use',
      value: summaryQuery.data.byStatus.in_use,
      icon: Activity,
      description: 'Currently rented',
    },
    {
      title: 'Maintenance',
      value: summaryQuery.data.byStatus.maintenance,
      icon: Wrench,
      description: 'Needs service',
    },
    {
      title: 'Pending Requests',
      value: summaryQuery.data.pendingRentalRequests,
      icon: Clock3,
      description: 'Awaiting admin action',
    },
    {
      title: 'Active Rentals',
      value: summaryQuery.data.activeRentals,
      icon: Activity,
      description: 'Ongoing equipment use',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Operational health of inventory and rental demand"
        title="Admin Dashboard"
      />

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
