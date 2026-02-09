import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import DataTable from '../../../components/DataTable'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import StatusBadge from '../../../components/StatusBadge'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { getSession } from '../../../lib/auth'
import { formatDate } from '../../../lib/utils'
import { listRentals } from '../../../services/rentalService'
import type { Rental, RentalStatus } from '../../../types/rental'

const tabs: Array<{ label: string; value: RentalStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Returned', value: 'returned' },
]

export default function FieldRentalsPage() {
  const [status, setStatus] = useState<RentalStatus | 'all'>('all')
  const session = getSession()
  const userId = session?.user.id ?? ''

  const rentalsQuery = useQuery({
    enabled: Boolean(userId),
    queryKey: ['rentals', 'field', userId, status],
    queryFn: () => listRentals({ requestedBy: userId, status }),
  })

  const columns = useMemo<ColumnDef<Rental>[]>(
    () => [
      {
        accessorKey: 'equipmentName',
        header: 'Equipment',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'startDate',
        header: 'Start',
        cell: ({ row }) => formatDate(row.original.startDate),
      },
      {
        accessorKey: 'endDate',
        header: 'End',
        cell: ({ row }) => formatDate(row.original.endDate),
      },
      {
        id: 'message',
        header: 'Message',
        enableSorting: false,
        cell: ({ row }) => {
          const statusValue = row.original.status
          if (statusValue === 'pending') {
            return <p className="text-sm text-amber-700">Waiting for admin approval.</p>
          }
          if (statusValue === 'active') {
            return <p className="text-sm text-slate-600">Return process is handled by admin.</p>
          }
          if (statusValue === 'rejected') {
            return <p className="text-sm text-red-700">Request was rejected.</p>
          }
          return <p className="text-sm text-emerald-700">Rental completed.</p>
        },
      },
    ],
    [],
  )

  if (rentalsQuery.isLoading) {
    return <Loader label="Loading your rentals..." />
  }

  if (rentalsQuery.isError) {
    return (
      <ErrorState
        error={rentalsQuery.error}
        onRetry={() => rentalsQuery.refetch()}
        title="Could not load rentals"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Track request status and active assignments"
        title="My Requests"
      />

      <Tabs onValueChange={(value) => setStatus(value as RentalStatus | 'all')} value={status}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={rentalsQuery.data ?? []}
        emptyDescription="You do not have rentals in this state."
        emptyTitle="No rentals found"
      />
    </div>
  )
}
