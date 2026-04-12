import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Link, useNavigate } from 'react-router-dom'
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
import { TextField } from '@mui/material'
import { Label } from '../../../components/ui/label'
import { listMaintenanceQueue, markEquipmentServiced } from '../../../services/equipmentService'
import type { Equipment } from '../../../types/equipment'
import { formatDate } from '../../../lib/utils'
import { getSession } from '../../../lib/auth'

export default function MaintenanceEquipmentPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const session = getSession()
  const userId = session?.user.id ?? ''
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null)
  const [manualNextDueDate, setManualNextDueDate] = useState('')

  const equipmentQuery = useQuery({
    queryKey: ['maintenance-queue'],
    queryFn: () => listMaintenanceQueue(14),
    placeholderData: keepPreviousData,
  })

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
    [],
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

      <DataTable
        columns={columns}
        data={equipmentQuery.data ?? []}
        emptyDescription="No equipment is due for maintenance in the selected window."
        emptyTitle="Maintenance queue is empty"
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
