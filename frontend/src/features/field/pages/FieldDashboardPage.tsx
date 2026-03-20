import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ClipboardList, Hammer, Package } from 'lucide-react'
import { Card as MuiCard, CardActionArea, Typography, Box } from '@mui/material'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { getSession } from '../../../lib/auth'
import { getFieldSummary } from '../../../services/dashboardService'

export default function FieldDashboardPage() {
  const session = getSession()
  const userId = session?.user.id ?? ''

  const summaryQuery = useQuery({
    enabled: Boolean(userId),
    queryKey: ['field-summary', userId],
    queryFn: () => getFieldSummary(userId),
  })

  if (summaryQuery.isLoading) {
    return <Loader label="Loading field dashboard..." />
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <ErrorState
        error={summaryQuery.error}
        onRetry={() => {
          void summaryQuery.refetch()
        }}
        title="Could not load dashboard"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Monitor your requests and quickly access available equipment"
        title="Field Dashboard"
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 1 }}>
        <MuiCard elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <CardActionArea component={Link} to="/field/equipment" sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f1f5f9', color: '#0f172a' }}>
              <Package size={28} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600" color="#0f172a">Equipment Availability</Typography>
              <Typography variant="body2" color="text.secondary">Browse and request ready equipment</Typography>
            </Box>
          </CardActionArea>
        </MuiCard>

        <MuiCard elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <CardActionArea component={Link} to="/field/rentals" sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f1f5f9', color: '#0f172a' }}>
              <ClipboardList size={28} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600" color="#0f172a">My Requests</Typography>
              <Typography variant="body2" color="text.secondary">Track your active and pending rentals</Typography>
            </Box>
          </CardActionArea>
        </MuiCard>
      </Box>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">My Pending Requests</CardTitle>
            <CardDescription>Requests waiting for admin approval</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{summaryQuery.data.myPendingRequests}</p>
            <ClipboardList className="h-5 w-5 text-slate-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">My Active Rentals</CardTitle>
            <CardDescription>Equipment currently assigned to your jobs</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{summaryQuery.data.myActiveRentals}</p>
            <Hammer className="h-5 w-5 text-slate-500" />
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
