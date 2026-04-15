import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, ArrowLeft, Search, Pencil, Trash2 } from 'lucide-react'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
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
import { Input } from '../../../components/ui/input'
import EquipmentForm from '../../equipment/components/EquipmentForm'
import EquipmentGroupGrid from '../../equipment/components/EquipmentGroupGrid'
import {
  createEquipment,
  deleteEquipment,
  listEquipment,
  updateEquipment,
} from '../../../services/equipmentService'
import type { CreateEquipmentDTO, Equipment, EquipmentStatus } from '../../../types/equipment'

const STATUS_FILTERS: Array<{ label: string; value: EquipmentStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'In Use', value: 'in_use' },
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

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
        {/* Search */}
        <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Search</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              className="pl-8"
              placeholder="Search equipment by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Status pills */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</span>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grouped tile grid */}
      <EquipmentGroupGrid
        equipment={equipmentQuery.data ?? []}
        getDetailPath={(item) => `/admin/equipment/${item.id}`}
        renderItemActions={(item) => (
          <>
            <button
              className="flex items-center justify-center h-7 w-7 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Edit"
              onClick={(e) => { e.preventDefault(); setEditItem(item) }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              className="flex items-center justify-center h-7 w-7 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete"
              onClick={(e) => { e.preventDefault(); setDeleteItem(item) }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      />

      {/* Create dialog */}
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

      {/* Edit dialog */}
      <Dialog onOpenChange={(open) => !open && setEditItem(null)} open={Boolean(editItem)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit equipment</DialogTitle>
            <DialogDescription>Update equipment details and status.</DialogDescription>
          </DialogHeader>
          {editItem && (
            <EquipmentForm
              initialValues={editItem}
              isSubmitting={updateMutation.isPending}
              onCancel={() => setEditItem(null)}
              onSubmit={(values) => updateMutation.mutate({ id: editItem.id, values })}
              submitLabel="Save changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
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
