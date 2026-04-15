import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, MoreHorizontal, Check, X, LogOut, RotateCcw, ClipboardList } from 'lucide-react'
import DataTable from '../../../components/DataTable'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import StatusBadge from '../../../components/StatusBadge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '../../../components/ui/alert-dialog'
import { Button } from '../../../components/ui/button'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '../../../components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { formatDate, formatDateTime } from '../../../lib/utils'
import { getRentalById, listRentals, updateRentalStatus } from '../../../services/rentalService'
import type { Rental, RentalStatus } from '../../../types/rental'
import ApproveRentalDialog from '../components/ApproveRentalDialog'

type RentalAction = { id: string; nextStatus: 'active' | 'rejected' | 'returned'; title: string; description: string }

const RENTAL_STATUS_RANK: Record<string, number> = { pending: 0, active: 1, approved: 2, returned: 3, rejected: 4 }

const tabMap: Array<{ label: string; value: RentalStatus | 'all' }> = [
  { label: 'All',      value: 'all'      },
  { label: 'Pending',  value: 'pending'  },
  { label: 'Approved', value: 'approved' },
  { label: 'Active',   value: 'active'   },
  { label: 'Returned', value: 'returned' },
]

const STATUS_DOT: Record<string, string> = {
  pending:  'bg-orange-400',
  approved: 'bg-blue-400',
  active:   'bg-emerald-500',
  returned: 'bg-slate-400',
  rejected: 'bg-red-400',
}

const TIMELINE_COLORS: Record<string, string> = {
  pending:  'bg-orange-400',
  approved: 'bg-blue-400',
  active:   'bg-emerald-500',
  returned: 'bg-slate-400',
  rejected: 'bg-red-400',
}

export default function AdminRentalsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as { statusFilter?: RentalStatus | 'all' } | null
  const [status, setStatus] = useState<RentalStatus | 'all'>(locationState?.statusFilter ?? 'all')
  const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null)
  const [action, setAction] = useState<RentalAction | null>(null)
  const [approveDialog, setApproveDialog] = useState<{ id: string; typeId: string; start: string; end?: string } | null>(null)

  const rentalsQuery = useQuery({
    queryKey: ['rentals', { status }],
    queryFn: () => listRentals({ status }),
    placeholderData: keepPreviousData,
  })

  const rentalDetailQuery = useQuery({
    enabled: Boolean(selectedRentalId),
    queryKey: ['rental-detail', selectedRentalId],
    queryFn: () => getRentalById(selectedRentalId as string),
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'active' | 'rejected' | 'returned' }) =>
      updateRentalStatus(id, { status: nextStatus }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['rentals'] })
      await queryClient.invalidateQueries({ queryKey: ['equipment'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-summary'] })
      await queryClient.invalidateQueries({ queryKey: ['rental-detail', variables.id] })
      setAction(null)
      toast.success('Rental updated.')
    },
    onError: () => toast.error('Could not update rental status.'),
  })

  const columns = useMemo<ColumnDef<Rental>[]>(
    () => [
      {
        accessorKey: 'equipmentName',
        header: 'Equipment',
        cell: ({ row }) => <p className="font-semibold text-slate-800">{row.original.equipmentName}</p>,
      },
      {
        accessorKey: 'requestedByName',
        header: 'Requested by',
        cell: ({ row }) => <p className="text-sm text-slate-600">{row.original.requestedByName}</p>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[row.original.status] ?? 'bg-slate-400'}`} />
            <StatusBadge status={row.original.status} />
          </span>
        ),
      },
      {
        accessorKey: 'startDate',
        header: 'Start',
        cell: ({ row }) => <span className="text-sm text-slate-600">{formatDate(row.original.startDate)}</span>,
      },
      {
        accessorKey: 'endDate',
        header: 'End',
        cell: ({ row }) => <span className="text-sm text-slate-600">{formatDate(row.original.endDate)}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const rental = row.original
          const hasActions = ['pending', 'approved', 'active'].includes(rental.status)
          return (
            <div className="flex items-center gap-2">
              <Button onClick={() => setSelectedRentalId(rental.id)} size="sm" variant="outline">View</Button>
              {hasActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {rental.status === 'pending' && (
                      <>
                        <DropdownMenuItem onClick={() => setApproveDialog({ id: rental.id, typeId: rental.equipmentTypeId, start: rental.startDate, end: rental.endDate })} className="cursor-pointer">
                          <Check className="mr-2 h-4 w-4 text-emerald-600" /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAction({ id: rental.id, nextStatus: 'rejected', title: 'Reject rental request?', description: 'The request will move to rejected state.' })} className="cursor-pointer">
                          <X className="mr-2 h-4 w-4 text-red-600" /> Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {rental.status === 'approved' && (
                      <DropdownMenuItem onClick={() => setAction({ id: rental.id, nextStatus: 'active', title: 'Check out rental?', description: 'This marks the equipment as checked out.' })} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4 text-blue-600" /> Check out
                      </DropdownMenuItem>
                    )}
                    {rental.status === 'active' && (
                      <DropdownMenuItem onClick={() => setAction({ id: rental.id, nextStatus: 'returned', title: 'Mark rental as returned?', description: 'This sets linked equipment back to available.' })} className="cursor-pointer">
                        <RotateCcw className="mr-2 h-4 w-4 text-emerald-600" /> Mark returned
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        },
      },
    ],
    [],
  )

  const sortedRentals = useMemo(
    () => [...(rentalsQuery.data ?? [])].sort((a, b) =>
      (RENTAL_STATUS_RANK[a.status] ?? 99) - (RENTAL_STATUS_RANK[b.status] ?? 99)
    ),
    [rentalsQuery.data],
  )

  if (rentalsQuery.isLoading) return <Loader label="Loading rentals..." />
  if (rentalsQuery.isError) {
    return <ErrorState error={rentalsQuery.error} onRetry={() => rentalsQuery.refetch()} title="Could not load rentals" />
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <PageHeader title="Rentals" subtitle="Review requests and manage status transitions" />

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1.5">
        {tabMap.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              status === tab.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            {tab.value !== 'all' && (
              <span className={`h-1.5 w-1.5 rounded-full transition-colors ${status === tab.value ? 'bg-white/70' : (STATUS_DOT[tab.value] ?? 'bg-slate-300')}`} />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={sortedRentals}
        emptyDescription="No rentals in this status right now."
        emptyTitle="No rentals found"
      />

      {/* Rental detail dialog */}
      <Dialog onOpenChange={(open) => !open && setSelectedRentalId(null)} open={Boolean(selectedRentalId)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-slate-500" />
              Rental Detail
            </DialogTitle>
            <DialogDescription>Timeline and metadata</DialogDescription>
          </DialogHeader>
          {rentalDetailQuery.isLoading && <Loader label="Loading..." />}
          {rentalDetailQuery.isError && <ErrorState error={rentalDetailQuery.error} title="Could not load rental detail" />}
          {rentalDetailQuery.data && (
            <div className="space-y-5 text-sm">
              {/* Info grid */}
              <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Equipment</p>
                  <p className="font-semibold text-slate-800">{rentalDetailQuery.data.equipmentName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Requested by</p>
                  <p className="font-semibold text-slate-800">{rentalDetailQuery.data.requestedByName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Start date</p>
                  <p className="text-slate-700">{formatDate(rentalDetailQuery.data.startDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">End date</p>
                  <p className="text-slate-700">{formatDate(rentalDetailQuery.data.endDate)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                  <StatusBadge status={rentalDetailQuery.data.status} />
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Timeline</p>
                <ol className="relative space-y-0">
                  {rentalDetailQuery.data.timeline.map((event, i) => {
                    const isLast = i === rentalDetailQuery.data.timeline.length - 1
                    const dotColor = TIMELINE_COLORS[event.label?.toLowerCase() ?? ''] ?? 'bg-slate-400'
                    return (
                      <li key={`${event.label}-${event.at}`} className="relative flex gap-4 pb-4">
                        {/* vertical line */}
                        {!isLast && <div className="absolute left-[9px] top-5 bottom-0 w-px bg-slate-200" />}
                        {/* dot */}
                        <div className={`relative z-10 mt-1.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${dotColor}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 leading-tight">{event.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(event.at)}</p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setAction(null)} open={Boolean(action)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{action?.title}</AlertDialogTitle>
            <AlertDialogDescription>{action?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild><Button variant="secondary">Cancel</Button></AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button disabled={actionMutation.isPending} onClick={() => action && actionMutation.mutate({ id: action.id, nextStatus: action.nextStatus })}>
                {actionMutation.isPending ? 'Saving…' : 'Confirm'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {approveDialog && (
        <ApproveRentalDialog
          endDate={approveDialog.end}
          equipmentTypeId={approveDialog.typeId}
          onClose={() => setApproveDialog(null)}
          open={true}
          rentalId={approveDialog.id}
          startDate={approveDialog.start}
        />
      )}
    </div>
  )
}
