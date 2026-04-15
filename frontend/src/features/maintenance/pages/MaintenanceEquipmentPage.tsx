import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import DataTable from '../../../components/DataTable'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import StatusBadge from '../../../components/StatusBadge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { TextField } from '@mui/material'
import { Label } from '../../../components/ui/label'
import { Select } from '../../../components/ui/select'
import { listMaintenanceQueue, markEquipmentServiced } from '../../../services/equipmentService'
import type { Equipment, EquipmentStatus, IssueSeverity } from '../../../types/equipment'
import { formatDate } from '../../../lib/utils'
import { getSession } from '../../../lib/auth'

type Priority = 'overdue' | 'critical' | 'upcoming' | 'scheduled'

function derivePriority(nextServiceDueDate?: string): Priority {
  if (!nextServiceDueDate) return 'scheduled'
  const now = new Date()
  const due = new Date(nextServiceDueDate)
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 3) return 'critical'
  if (diffDays <= 7) return 'upcoming'
  return 'scheduled'
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  overdue: { label: 'Overdue', className: 'text-red-700 bg-red-50 border-red-200' },
  critical: { label: 'Critical', className: 'text-orange-700 bg-orange-50 border-orange-200' },
  upcoming: { label: 'Upcoming', className: 'text-amber-700 bg-amber-50 border-amber-200' },
  scheduled: { label: 'Scheduled', className: 'text-blue-700 bg-blue-50 border-blue-200' },
}

const priorityOptions: Array<{ label: string; value: Priority | 'all' }> = [
  { label: 'All priorities', value: 'all' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Critical (≤3 days)', value: 'critical' },
  { label: 'Upcoming (≤7 days)', value: 'upcoming' },
  { label: 'Scheduled', value: 'scheduled' },
]

const severityConfig: Record<IssueSeverity, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'text-blue-700 bg-blue-50 border-blue-200' },
  MEDIUM: { label: 'Medium', className: 'text-amber-700 bg-amber-50 border-amber-200' },
  HIGH: { label: 'High', className: 'text-orange-700 bg-orange-50 border-orange-200' },
  CRITICAL: { label: 'Critical', className: 'text-red-700 bg-red-50 border-red-200' },
}

const statusOptions: Array<{ label: string; value: EquipmentStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'In Maintenance', value: 'maintenance' },
  { label: 'Available', value: 'available' },
  { label: 'In Use', value: 'in_use' },
]

export default function MaintenanceEquipmentPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const session = getSession()
  const userId = session?.user.id ?? ''
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null)
  const [manualNextDueDate, setManualNextDueDate] = useState('')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | 'all' | 'none'>('all')

  // Pre-set status filter from dashboard card navigation
  const locationState = location.state as { statusFilter?: EquipmentStatus | 'all' } | null
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>(
    locationState?.statusFilter ?? 'all'
  )

  const equipmentQuery = useQuery({
    queryKey: ['maintenance-queue'],
    queryFn: () => listMaintenanceQueue(14),
    placeholderData: keepPreviousData,
  })

  const filteredData = useMemo(() => {
    let items = equipmentQuery.data ?? []

    if (search) {
      const term = search.toLowerCase()
      items = items.filter((item) =>
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.qrCode?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      items = items.filter((item) => item.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      items = items.filter((item) => derivePriority(item.nextServiceDueDate) === priorityFilter)
    }

    if (severityFilter === 'none') {
      items = items.filter((item) => !item.severity)
    } else if (severityFilter !== 'all') {
      items = items.filter((item) => item.severity === severityFilter)
    }

    return items
  }, [equipmentQuery.data, search, statusFilter, priorityFilter, severityFilter])

  const completeServiceMutation = useMutation({
    mutationFn: (payload: { id: string; nextServiceDueDate?: string }) =>
      markEquipmentServiced(payload.id, {
        performedByUserId: userId,
        nextServiceDueDate: payload.nextServiceDueDate,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['equipment'] })
      await queryClient.invalidateQueries({ queryKey: ['maintenance-queue'] })
      await queryClient.invalidateQueries({ queryKey: ['maintenance-summary'] })
      await queryClient.invalidateQueries({ queryKey: ['service-logs'] })
      await queryClient.invalidateQueries({ queryKey: ['activity'] })
      setSelectedItem(null)
      setManualNextDueDate('')
      toast.success('Equipment marked serviced.')
    },
    onError: () => toast.error('Could not mark serviced. Add a manual due date if needed.'),
  })

  const columns = useMemo<ColumnDef<Equipment>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Equipment',
        cell: ({ row }) => <p className="font-medium">{row.original.name}</p>,
      },
      {
        accessorKey: 'category',
        header: 'Category',
      },
      {
        id: 'priority',
        header: 'Priority',
        cell: ({ row }) => {
          const p = derivePriority(row.original.nextServiceDueDate)
          const cfg = priorityConfig[p]
          return (
            <span className={`inline-block w-20 text-center py-0.5 rounded text-xs font-semibold border ${cfg.className}`}>
              {cfg.label}
            </span>
          )
        },
      },
      {
        id: 'severity',
        header: () => {
          const cycle: Array<IssueSeverity | 'all' | 'none'> = ['all', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'none']
          const currentIdx = cycle.indexOf(severityFilter)
          const nextVal = cycle[(currentIdx + 1) % cycle.length]
          const label = severityFilter === 'all'
            ? 'Severity'
            : severityFilter === 'none'
              ? 'Severity: None'
              : `Severity: ${severityConfig[severityFilter].label}`
          return (
            <button
              type="button"
              onClick={() => setSeverityFilter(nextVal)}
              className={`flex items-center gap-1 text-left font-medium transition-colors ${severityFilter !== 'all' ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {label}
              {severityFilter !== 'all' && (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
              )}
            </button>
          )
        },
        enableSorting: false,
        cell: ({ row }) => {
          const sev = row.original.severity
          if (!sev) return <span className="text-xs text-slate-400">—</span>
          const cfg = severityConfig[sev]
          return (
            <span className={`inline-block w-20 text-center py-0.5 rounded text-xs font-semibold border ${cfg.className}`}>
              {cfg.label}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'nextServiceDueDate',
        header: 'Due date',
        cell: ({ row }) => formatDate(row.original.nextServiceDueDate),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link to={`/maintenance/equipment/${row.original.id}`}>View</Link>
            </Button>
            <Button onClick={() => setSelectedItem(row.original)} size="sm">
              Mark serviced
            </Button>
          </div>
        ),
      },
    ],
    [severityFilter],
  )

  if (equipmentQuery.isLoading) {
    return <Loader label="Loading maintenance queue..." />
  }

  if (equipmentQuery.isError) {
    return (
      <ErrorState
        error={equipmentQuery.error}
        onRetry={() => equipmentQuery.refetch()}
        title="Could not load maintenance queue"
      />
    )
  }

  return (
    <div className="space-y-6">
      <Button className="mb-4" onClick={() => navigate(-1)} size="sm" variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <PageHeader
        subtitle="Items due in the next 14 days or already overdue"
        title="Maintenance Queue"
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search and filter the maintenance queue.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[160px] space-y-2">
              <Label htmlFor="statusFilter">Status</Label>
              <Select
                id="statusFilter"
                onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | 'all')}
                value={statusFilter}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div className="min-w-[160px] space-y-2">
              <Label htmlFor="priorityFilter">Priority</Label>
              <Select
                id="priorityFilter"
                onChange={(event) => setPriorityFilter(event.target.value as Priority | 'all')}
                value={priorityFilter}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={filteredData}
        emptyDescription="No equipment matches the current filters."
        emptyTitle="Maintenance queue is empty"
        onSearchValueChange={setSearch}
        searchPlaceholder="Search by name, category, or asset tag"
        searchValue={search}
        pageSize={25}
      />

      <Dialog onOpenChange={(open) => !open && setSelectedItem(null)} open={Boolean(selectedItem)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Serviced</DialogTitle>
            <DialogDescription>
              This will add a routine service log and update last/next service dates.
            </DialogDescription>
          </DialogHeader>
          {selectedItem ? (
            <div className="space-y-3">
              <p className="text-sm"><span className="font-medium">Equipment:</span> {selectedItem.name}</p>
              <p className="text-sm"><span className="font-medium">Configured interval:</span> {selectedItem.maintenanceIntervalDays ?? '-'} days</p>
              <div className="space-y-2">
                <Label htmlFor="manualNextDueDate">Manual next due date (required if no interval)</Label>
                <TextField
                  id="manualNextDueDate"
                  type="date"
                  fullWidth
                  size="small"
                  value={manualNextDueDate}
                  onChange={(event) => setManualNextDueDate(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px', backgroundColor: 'white' } }}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={completeServiceMutation.isPending}
                  onClick={() =>
                    completeServiceMutation.mutate({
                      id: selectedItem.id,
                      nextServiceDueDate: manualNextDueDate || undefined,
                    })
                  }
                >
                  {completeServiceMutation.isPending ? 'Saving...' : 'Confirm'}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
