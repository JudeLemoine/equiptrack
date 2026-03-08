import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select } from '../../../components/ui/select'
import { Textarea } from '../../../components/ui/textarea'
import { getSession } from '../../../lib/auth'
import { formatDate, formatDateTime } from '../../../lib/utils'
import { listActivityByEquipment } from '../../../services/activityService'
import {
  changeEquipmentStatus,
  checkinEquipment,
  checkoutEquipment,
  deleteEquipment,
  getEquipment,
  markEquipmentServiced,
  updateEquipment,
} from '../../../services/equipmentService'
import { addServiceLogEntry, listServiceLogsByEquipment } from '../../../services/serviceLogService'
import type { EquipmentStatus } from '../../../types/equipment'

const equipmentStatusOptions: EquipmentStatus[] = ['available', 'in_use', 'maintenance']

export default function EquipmentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = getSession()
  const [isEditOpen, setEditOpen] = useState(false)
  const [isStatusOpen, setStatusOpen] = useState(false)
  const [isServiceOpen, setServiceOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [statusValue, setStatusValue] = useState<EquipmentStatus>('available')
  const [manualNextDueDate, setManualNextDueDate] = useState('')
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [logNote, setLogNote] = useState('')

  const role = session?.user.role
  const userId = session?.user.id ?? ''

  const equipmentQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['equipment', id],
    queryFn: () => getEquipment(id as string),
  })

  const serviceLogsQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['service-logs', id],
    queryFn: () => listServiceLogsByEquipment(id as string),
  })

  const activityQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['activity', id],
    queryFn: () => listActivityByEquipment(id as string, 10),
  })

  const backPath = useMemo(() => {
    if (role === 'admin') return '/admin/equipment'
    if (role === 'maintenance') return '/maintenance/queue'
    return '/field/equipment'
  }, [role])

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['equipment'] })
    await queryClient.invalidateQueries({ queryKey: ['service-logs', id] })
    await queryClient.invalidateQueries({ queryKey: ['activity', id] })
    await queryClient.invalidateQueries({ queryKey: ['maintenance-summary'] })
    await queryClient.invalidateQueries({ queryKey: ['admin-summary'] })
    await queryClient.invalidateQueries({ queryKey: ['field-summary'] })
  }

  const editMutation = useMutation({
    mutationFn: (values: {
      name: string
      category: string
      qrCode: string
      lastServiceDate: string
      maintenanceIntervalDays?: number
      nextServiceDueDate?: string
      notes?: string
    }) =>
      updateEquipment(id as string, {
        ...values,
        maintenanceIntervalDays: values.maintenanceIntervalDays || undefined,
        nextServiceDueDate: values.nextServiceDueDate || undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: async () => {
      await refreshAll()
      setEditOpen(false)
      toast.success('Equipment updated.')
    },
    onError: () => toast.error('Could not update equipment.'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: EquipmentStatus) =>
      changeEquipmentStatus(id as string, {
        status,
        actorUserId: userId,
      }),
    onSuccess: async () => {
      await refreshAll()
      setStatusOpen(false)
      toast.success('Status updated.')
    },
    onError: () => toast.error('Could not change status.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteEquipment(id as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast.success('Equipment deleted.')
      navigate('/admin/equipment', { replace: true })
    },
    onError: () => toast.error('Could not delete equipment.'),
  })

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutEquipment(id as string, userId),
    onSuccess: async () => {
      await refreshAll()
      toast.success('Equipment checked out.')
    },
    onError: () => toast.error('Could not check out equipment.'),
  })

  const checkinMutation = useMutation({
    mutationFn: () => checkinEquipment(id as string, userId),
    onSuccess: async () => {
      await refreshAll()
      toast.success('Equipment checked in.')
    },
    onError: () => toast.error('Could not check in equipment.'),
  })

  const markServicedMutation = useMutation({
    mutationFn: () =>
      markEquipmentServiced(id as string, {
        performedByUserId: userId,
        nextServiceDueDate: manualNextDueDate || undefined,
      }),
    onSuccess: async () => {
      await refreshAll()
      setServiceOpen(false)
      setManualNextDueDate('')
      toast.success('Service recorded.')
    },
    onError: () => toast.error('Could not mark as serviced.'),
  })

  const addLogMutation = useMutation({
    mutationFn: () =>
      addServiceLogEntry(id as string, {
        date: logDate,
        note: logNote.trim(),
        performedByUserId: userId,
      }),
    onSuccess: async () => {
      await refreshAll()
      setLogNote('')
      toast.success('Service log entry added.')
    },
    onError: () => toast.error('Could not add service log entry.'),
  })

  if (equipmentQuery.isLoading) {
    return <Loader label="Loading equipment profile..." />
  }

  if (equipmentQuery.isError || !equipmentQuery.data) {
    return (
      <ErrorState
        error={equipmentQuery.error ?? new Error('Equipment not found.')}
        onRetry={() => equipmentQuery.refetch()}
        title="Could not load equipment profile"
      />
    )
  }

  const equipment = equipmentQuery.data
  const canCheckout = role === 'field' && equipment.status === 'available'
  const canCheckin = role === 'field' && equipment.status === 'in_use'

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={backPath}>Back</Link>
            </Button>

            {role === 'admin' ? (
              <>
                <Button onClick={() => setEditOpen(true)} variant="secondary">Edit</Button>
                <Button
                  onClick={() => {
                    setStatusValue(equipment.status)
                    setStatusOpen(true)
                  }}
                  variant="outline"
                >
                  Change status
                </Button>
                <Button onClick={() => setDeleteConfirmOpen(true)} variant="destructive">Delete</Button>
              </>
            ) : null}

            {role === 'field' ? (
              <>
                <Button disabled={!canCheckout || checkoutMutation.isPending} onClick={() => checkoutMutation.mutate()}>
                  {checkoutMutation.isPending ? 'Checking out...' : 'Check out'}
                </Button>
                <Button disabled={!canCheckin || checkinMutation.isPending} onClick={() => checkinMutation.mutate()} variant="secondary">
                  {checkinMutation.isPending ? 'Checking in...' : 'Check in'}
                </Button>
              </>
            ) : null}

            {role === 'maintenance' ? (
              <Button onClick={() => setServiceOpen(true)}>Mark serviced</Button>
            ) : null}
          </div>
        }
        subtitle="Asset profile, activity, and service history"
        title={equipment.name}
      />

      <Card>
        <CardHeader>
          <CardTitle>Equipment Profile</CardTitle>
          <CardDescription>Core equipment details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <p><span className="font-medium">Name:</span> {equipment.name}</p>
          <p><span className="font-medium">Category:</span> {equipment.category}</p>
          <p><span className="font-medium">Status:</span> <StatusBadge status={equipment.status} /></p>
          <p><span className="font-medium">QR Code:</span> {equipment.qrCode}</p>
          <p><span className="font-medium">Last Service:</span> {formatDate(equipment.lastServiceDate)}</p>
          <p><span className="font-medium">Next Service Due:</span> {formatDate(equipment.nextServiceDueDate)}</p>
          <p><span className="font-medium">Interval (days):</span> {equipment.maintenanceIntervalDays ?? '-'}</p>
          <p className="md:col-span-2"><span className="font-medium">Notes:</span> {equipment.notes || '-'}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 10 events</CardDescription>
          </CardHeader>
          <CardContent>
            {activityQuery.isLoading ? <Loader label="Loading activity..." /> : null}
            {activityQuery.isError ? (
              <ErrorState error={activityQuery.error} title="Could not load activity" />
            ) : null}
            {activityQuery.data?.length ? (
              <ol className="space-y-3">
                {activityQuery.data.map((event) => (
                  <li className="rounded-md border border-slate-200 p-3" key={event.id}>
                    <p className="text-sm font-medium text-slate-900">{event.summary}</p>
                    <p className="text-xs text-slate-600">{event.type.replace('_', ' ')} by {event.actorUserId}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(event.timestamp)}</p>
                  </li>
                ))}
              </ol>
            ) : !activityQuery.isLoading ? (
              <p className="text-sm text-slate-600">No activity yet.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Log</CardTitle>
            <CardDescription>Lightweight service notes for this equipment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="grid gap-3 rounded-md border border-slate-200 p-3"
              onSubmit={(event) => {
                event.preventDefault()
                if (!logNote.trim()) {
                  toast.error('Service note is required.')
                  return
                }
                addLogMutation.mutate()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="logDate">Date</Label>
                <Input id="logDate" onChange={(event) => setLogDate(event.target.value)} type="date" value={logDate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logNote">Note</Label>
                <Textarea
                  id="logNote"
                  maxLength={240}
                  onChange={(event) => setLogNote(event.target.value)}
                  placeholder="Short service note"
                  value={logNote}
                />
              </div>
              <div className="flex justify-end">
                <Button disabled={addLogMutation.isPending} type="submit">
                  {addLogMutation.isPending ? 'Saving...' : 'Add entry'}
                </Button>
              </div>
            </form>

            {serviceLogsQuery.isLoading ? <Loader label="Loading service logs..." /> : null}
            {serviceLogsQuery.isError ? (
              <ErrorState error={serviceLogsQuery.error} title="Could not load service logs" />
            ) : null}
            {serviceLogsQuery.data?.length ? (
              <div className="space-y-2">
                {serviceLogsQuery.data.map((entry) => (
                  <div className="rounded-md border border-slate-200 p-3" key={entry.id}>
                    <p className="text-sm font-medium text-slate-900">{entry.note}</p>
                    <p className="text-xs text-slate-600">{formatDate(entry.date)} by {entry.performedByUserId}</p>
                  </div>
                ))}
              </div>
            ) : !serviceLogsQuery.isLoading ? (
              <p className="text-sm text-slate-600">No service log entries yet.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog onOpenChange={setEditOpen} open={isEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>Update profile fields and maintenance metadata.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              editMutation.mutate({
                name: String(formData.get('name') || ''),
                category: String(formData.get('category') || ''),
                qrCode: String(formData.get('qrCode') || ''),
                lastServiceDate: String(formData.get('lastServiceDate') || ''),
                nextServiceDueDate: String(formData.get('nextServiceDueDate') || ''),
                maintenanceIntervalDays: Number(formData.get('maintenanceIntervalDays') || 0) || undefined,
                notes: String(formData.get('notes') || ''),
              })
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input defaultValue={equipment.name} id="editName" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategory">Category</Label>
              <Input defaultValue={equipment.category} id="editCategory" name="category" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editQrCode">QR Code</Label>
              <Input defaultValue={equipment.qrCode} id="editQrCode" name="qrCode" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLastServiceDate">Last Service Date</Label>
              <Input defaultValue={equipment.lastServiceDate} id="editLastServiceDate" name="lastServiceDate" required type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNextServiceDueDate">Next Service Due Date</Label>
              <Input defaultValue={equipment.nextServiceDueDate} id="editNextServiceDueDate" name="nextServiceDueDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMaintenanceIntervalDays">Maintenance Interval (days)</Label>
              <Input defaultValue={equipment.maintenanceIntervalDays} id="editMaintenanceIntervalDays" min={1} name="maintenanceIntervalDays" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea defaultValue={equipment.notes} id="editNotes" maxLength={500} name="notes" />
            </div>
            <div className="flex justify-end">
              <Button disabled={editMutation.isPending} type="submit">{editMutation.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setStatusOpen} open={isStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>Update the current availability state.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="statusSelect">Status</Label>
            <Select id="statusSelect" onChange={(event) => setStatusValue(event.target.value as EquipmentStatus)} value={statusValue}>
              {equipmentStatusOptions.map((option) => (
                <option key={option} value={option}>{option.replace('_', ' ')}</option>
              ))}
            </Select>
            <div className="flex justify-end">
              <Button disabled={statusMutation.isPending} onClick={() => statusMutation.mutate(statusValue)}>
                {statusMutation.isPending ? 'Saving...' : 'Save status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setServiceOpen} open={isServiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Serviced</DialogTitle>
            <DialogDescription>
              A service log entry will be added automatically. Add next due date only when no interval is configured.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="manualNextDueDate">Manual Next Due Date (optional)</Label>
              <Input
                id="manualNextDueDate"
                onChange={(event) => setManualNextDueDate(event.target.value)}
                type="date"
                value={manualNextDueDate}
              />
            </div>
            <div className="flex justify-end">
              <Button disabled={markServicedMutation.isPending} onClick={() => markServicedMutation.mutate()}>
                {markServicedMutation.isPending ? 'Saving...' : 'Confirm serviced'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setDeleteConfirmOpen} open={deleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete equipment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()} variant="destructive">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
