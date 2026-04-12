import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import DataTable from '../../../components/DataTable'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import StatusBadge from '../../../components/StatusBadge'
import { Button } from '../../../components/ui/button'
import { listEquipment } from '../../../services/equipmentService'
import type { Equipment, EquipmentStatus } from '../../../types/equipment'
import { formatDate } from '../../../lib/utils'

const statusOptions: Array<{ label: string; value: EquipmentStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'In Use', value: 'in_use' },
  { label: 'Maintenance', value: 'maintenance' },
]

export default function MaintenanceAllEquipmentPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EquipmentStatus | 'all'>('all')

  const equipmentQuery = useQuery({
    queryKey: ['equipment', 'maintenance-browse', { search, status }],
    queryFn: () => listEquipment({ search, status }),
    placeholderData: keepPreviousData,
  })

  const categories = useMemo(() => {
    const set = new Set((equipmentQuery.data ?? []).map((i) => i.category))
    return Array.from(set).sort()
  }, [equipmentQuery.data])

  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    if (category === 'all') return equipmentQuery.data ?? []
    return (equipmentQuery.data ?? []).filter((i) => i.category === category)
  }, [equipmentQuery.data, category])

  const columns = useMemo<ColumnDef<Equipment>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Equipment',
        cell: ({ row }) => <p className="font-medium text-slate-900">{row.original.name}</p>,
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => <span className="text-slate-600 text-sm">{row.original.category}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'lastServiceDate',
        header: 'Last Serviced',
        cell: ({ row }) => (
          <span className="text-sm text-slate-500">
            {row.original.lastServiceDate ? formatDate(row.original.lastServiceDate) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'nextServiceDueDate',
        header: 'Next Due',
        cell: ({ row }) => {
          const due = row.original.nextServiceDueDate
          if (!due) return <span className="text-slate-400 text-sm">—</span>
          const isOverdue = new Date(due) < new Date()
          return (
            <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
              {formatDate(due)}
              {isOverdue && <span className="ml-1 text-xs">(overdue)</span>}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Button asChild size="sm" variant="secondary">
            <Link to={`/maintenance/equipment/${row.original.id}`}>View</Link>
          </Button>
        ),
      },
    ],
    [],
  )

  if (equipmentQuery.isLoading) return <Loader label="Loading equipment..." />
  if (equipmentQuery.isError) {
    return (
      <ErrorState
        error={equipmentQuery.error}
        onRetry={() => equipmentQuery.refetch()}
        title="Could not load equipment"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Equipment"
        subtitle="Browse and inspect the full fleet"
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
        {categories.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategory('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${category === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-400'}`}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${category === c ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-400'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No equipment found"
        emptyDescription="Try adjusting your filters."
        searchValue={search}
        onSearchValueChange={setSearch}
        searchPlaceholder="Search by name or asset tag…"
      />
    </div>
  )
}
