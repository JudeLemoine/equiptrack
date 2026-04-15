import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, MoreHorizontal, Check, X, LogOut, RotateCcw } from 'lucide-react'
import DataTable from '../../../components/DataTable'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import StatusBadge from '../../../components/StatusBadge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog'
import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { formatDate, formatDateTime } from '../../../lib/utils'
import { getRentalById, listRentals, updateRentalStatus } from '../../../services/rentalService'
import type { Rental, RentalStatus } from '../../../types/rental'

type RentalAction = {
  id: string
  nextStatus: 'active' | 'rejected' | 'returned'
  title: string
  description: string
}

const RENTAL_STATUS_RANK: Record<string, number> = { pending: 0, active: 1, approved: 2, returned: 3, rejected: 4 }

const tabMap: Array<{ label: string; value: RentalStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Active', value: 'active' },
  { label: 'Returned', value: 'returned' },
]

import ApproveRentalDialog from '../components/ApproveRentalDialog'

export default function AdminRentalsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as { statusFilter?: RentalStatus | 'all' } | null
  const [status, setStatus] = useState<RentalStatus | 'all'>(
    locationState?.statusFilter ?? 'all'
  )
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
      },
      {
        accessorKey: 'requestedByName',
        header: 'Requested by',
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
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const rental = row.original
          const hasStatusActions = ['pending', 'approved', 'active'].includes(rental.status)

          return (
            <div className="flex items-center gap-2">
              <Button onClick={() => setSelectedRentalId(rental.id)} size="sm" variant="secondary">
                View
              </Button>
              
              {hasStatusActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {rental.status === 'pending' && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            setApproveDialog({
                              id: rental.id,
                              typeId: rental.equipmentTypeId,
                              start: rental.startDate,
                              end: rental.endDate,
                            })
                          }
                          className="cursor-pointer"
                        >
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span>Approve</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setAction({
                              id: rental.id,
                              nextStatus: 'rejected',
                              title: 'Reject rental request?',
                              description: 'The request will move to rejected state.',
                            })
                          }
                          className="cursor-pointer"
                        >
                          <X className="mr-2 h-4 w-4 text-red-600" />
                          <span>Reject</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {rental.status === 'approved' && (
                      <DropdownMenuItem
                        onClick={() =>
                          setAction({
                            id: rental.id,
                            nextStatus: 'active',
                            title: 'Check out rental?',
                            description: 'This marks the equipment as checked out by the user.',
                          })
                        }
                        className="cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4 text-blue-600" />
                        <span>Check out</span>
                      </DropdownMenuItem>
                    )}
                    {rental.status === 'active' && (
                      <DropdownMenuItem
                        onClick={() =>
                          setAction({
                            id: rental.id,
                            nextStatus: 'returned',
                            title: 'Mark rental as returned?',
                            description: 'This sets linked equipment back to available.',
                          })
                        }
                        className="cursor-pointer"
                      >
                        <RotateCcw className="mr-2 h-4 w-4 text-green-600" />
                        <span>Mark returned</span>
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

  const sortedRentals = useMemo(() => {
    return [...(rentalsQuery.data ?? [])].sort((a, b) =>
      (RENTAL_STATUS_RANK[a.status] ?? 99) - (RENTAL_STATUS_RANK[b.status] ?? 99)
    )
  }, [rentalsQuery.data])

  if (rentalsQuery.isLoading) {
    return <Loader label="Loading rentals..." />
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
      <Button className="mb-4" onClick={() => navigate(-1)} size="sm" variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <PageHeader
        subtitle="Review requests and manage status transitions"
        title="Rentals"
      />

      <Tabs onValueChange={(value) => setStatus(value as RentalStatus | 'all')} value={status}>
        <TabsList>
          {tabMap.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={sortedRentals}
        emptyDescription="No rentals in this status right now."
        emptyTitle="No rentals found"
      />

      <Dialog onOpenChange={(open) => !open && setSelectedRentalId(null)} open={Boolean(selectedRentalId)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rental Detail</DialogTitle>
            <DialogDescription>Timeline and metadata</DialogDescription>
          </DialogHeader>
          {rentalDetailQuery.isLoading ? <Loader label="Loading rental detail..." /> : null}
          {rentalDetailQuery.isError ? (
            <ErrorState error={rentalDetailQuery.error} title="Could not load rental detail" />
          ) : null}
          {rentalDetailQuery.data ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <p><span className="font-medium">Equipment:</span> {rentalDetailQuery.data.equipmentName}</p>
                <p><span className="font-medium">Requested by:</span> {rentalDetailQuery.data.requestedByName}</p>
                <p><span className="font-medium">Start:</span> {formatDate(rentalDetailQuery.data.startDate)}</p>
                <p><span className="font-medium">End:</span> {formatDate(rentalDetailQuery.data.endDate)}</p>
                <p className="sm:col-span-2"><span className="font-medium">Status:</span> <StatusBadge status={rentalDetailQuery.data.status} /></p>
              </div>

              <div>
                <p className="font-medium text-slate-900">Timeline</p>
                <ol className="mt-2 space-y-2 border-l border-slate-200 pl-4">
                  {rentalDetailQuery.data.timeline.map((event) => (
                    <li className="relative" key={`${event.label}-${event.at}`}>
                      <span className="absolute -left-[22px] top-1.5 h-2 w-2 rounded-full bg-slate-400" />
                      <p className="font-medium">{event.label}</p>
                      <p className="text-slate-600">{formatDateTime(event.at)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setAction(null)} open={Boolean(action)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{action?.title}</AlertDialogTitle>
            <AlertDialogDescription>{action?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                disabled={actionMutation.isPending}
                onClick={() => action && actionMutation.mutate({ id: action.id, nextStatus: action.nextStatus })}
              >
                {actionMutation.isPending ? 'Saving...' : 'Confirm'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {approveDialog ? (
        <ApproveRentalDialog
          endDate={approveDialog.end}
          equipmentTypeId={approveDialog.typeId}
          onClose={() => setApproveDialog(null)}
          open={true}
          rentalId={approveDialog.id}
          startDate={approveDialog.start}
        />
      ) : null}
    </div>
  )
}
