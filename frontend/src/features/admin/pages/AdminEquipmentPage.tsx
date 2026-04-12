import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MoreHorizontal, Plus, ArrowLeft } from 'lucide-react'
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
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
import { Label } from '../../../components/ui/label'
import { Select } from '../../../components/ui/select'
import EquipmentForm from '../../equipment/components/EquipmentForm'
import {
  createEquipment,
  deleteEquipment,
  listEquipment,
  updateEquipment,
} from '../../../services/equipmentService'
import type { CreateEquipmentDTO, Equipment, EquipmentStatus } from '../../../types/equipment'
import { formatDate } from '../../../lib/utils'

const filterOptions: Array<{ label: string; value: EquipmentStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'In use', value: 'in_use' },
  { label: 'Maintenance', value: 'maintenance' },
]

export default function AdminEquipmentPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all')
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<Equipment | null>(null)
  const [deleteItem, setDeleteItem] = useState<Equipment | null>(null)

  const equipmentQuery = useQuery({
    queryKey: ['equipment', { search, statusFilter }],
    queryFn: () => listEquipment({ search, status: statusFilter }),
    placeholderData: keepPreviousData,
  })

  const createMutation = useMutation({
    mutationFn: (values: CreateEquipmentDTO) => createEquipment(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['equipment'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-summary'] })
      setCreateOpen(false)
      toast.success('Equipment added.')
    },
    onError: () => toast.error('Could not create equipment.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: CreateEquipmentDTO }) =>
      updateEquipment(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['equipment'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-summary'] })
      setEditItem(null)
      toast.success('Equipment updated.')
    },
    onError: () => toast.error('Could not update equipment.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['equipment'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-summary'] })
      setDeleteItem(null)
      toast.success('Equipment deleted.')
    },
    onError: () => toast.error('Could not delete equipment.'),
  })

  const columns = useMemo<ColumnDef<Equipment>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
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
        header: 'Next service due',
        cell: ({ row }) => formatDate(row.original.nextServiceDueDate),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="secondary">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/admin/equipment/${row.original.id}`}>View profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditItem(row.original)}>Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => setDeleteItem(row.original)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  )

  if (equipmentQuery.isLoading) {
    return <Loader label="Loading equipment..." />
  }

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
      <Button className="mb-4" onClick={() => navigate(-1)} size="sm" variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <PageHeader
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add equipment
          </Button>
        }
        subtitle="Manage inventory, profile metadata, and service scheduling"
        title="Equipment"
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search by name and narrow by status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="statusFilter">Status</Label>
            <Select
              id="statusFilter"
              onChange={(event) => setStatusFilter(event.target.value as EquipmentStatus | 'all')}
              value={statusFilter}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={equipmentQuery.data ?? []}
        emptyDescription="Try broadening your filters or add equipment."
        emptyTitle="No equipment found"
        onSearchValueChange={setSearch}
        searchPlaceholder="Search equipment by name"
        searchValue={search}
      />

      <Dialog onOpenChange={setCreateOpen} open={isCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add equipment</DialogTitle>
            <DialogDescription>Create a new equipment record.</DialogDescription>
          </DialogHeader>
          <EquipmentForm
            isSubmitting={createMutation.isPending}
            onCancel={() => setCreateOpen(false)}
            onSubmit={(values) => createMutation.mutate(values)}
            submitLabel="Create equipment"
          />
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => !open && setEditItem(null)} open={Boolean(editItem)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit equipment</DialogTitle>
            <DialogDescription>Update equipment details and status.</DialogDescription>
          </DialogHeader>
          {editItem ? (
            <EquipmentForm
              initialValues={editItem}
              isSubmitting={updateMutation.isPending}
              onCancel={() => setEditItem(null)}
              onSubmit={(values) => updateMutation.mutate({ id: editItem.id, values })}
              submitLabel="Save changes"
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setDeleteItem(null)} open={Boolean(deleteItem)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete equipment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Equipment with active/pending rentals cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                disabled={deleteMutation.isPending}
                onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
                variant="default"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
