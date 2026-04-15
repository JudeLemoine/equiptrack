import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Trash2, QrCode, Download, UserCircle2, UserX, Search } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { listUsers } from '../../../services/userService'
import { assignEquipment } from '../../../services/equipmentService'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import StatusBadge from '../../../components/StatusBadge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
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
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { getSession } from '../../../lib/auth'
import { formatDate, formatDateTime } from '../../../lib/utils'
import { listActivityByEquipment } from '../../../services/activityService'
import {
  checkoutEquipment,
  getEquipment,
  updateEquipment,
  markEquipmentServiced,
  reportIssue,
  addEquipmentNote,
  clearServiceLogs,
  clearActivity,
  clearTechNotes,
} from '../../../services/equipmentService'
import { listMaintenanceNotes, addMaintenanceNote, deleteMaintenanceNote } from '../../../services/maintenanceService'
import type { MaintenanceNote } from '../../../services/maintenanceService'
import { listServiceLogsByEquipment } from '../../../services/serviceLogService'
import type { ActivityEvent } from '../../../types/activity'
import type { ServiceLogEntry } from '../../../types/serviceLog'

export default function EquipmentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const queryClient = useQueryClient()
  const session = getSession()

  // Extract dates from navigation state (passed from search page)
  const searchDates = location.state as { startDate?: string; endDate?: string } | null
  const { startDate, endDate } = searchDates || {}
  
  // Dialog States
  const [isReportIssueOpen, setReportIssueOpen] = useState(false)
  const [isMarkServicedOpen, setMarkServicedOpen] = useState(false)
  const [isEditAssetOpen, setEditAssetOpen] = useState(false)
  const [manualNextDueDate, setManualNextDueDate] = useState('')

  // Confirmation dialog states (admin clear actions)
  const [confirmClearServiceLogs, setConfirmClearServiceLogs] = useState(false)
  const [confirmClearHistory, setConfirmClearHistory] = useState(false)
  const [confirmClearTechNotes, setConfirmClearTechNotes] = useState(false)

  // Form States
  const [issueSeverity, setIssueSeverity] = useState('low')
  const [issueDescription, setIssueDescription] = useState('')
  const [fieldNote, setFieldNote] = useState('')
  const [techNote, setTechNote] = useState('')

  // Edit Asset form states
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editQrCode, setEditQrCode] = useState('')
  const [editInterval, setEditInterval] = useState('')
  const [editNextDue, setEditNextDue] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const role = session?.user.role
  const userId = session?.user.id ?? ''

  // Assign worker dialog
  const [isAssignOpen, setAssignOpen] = useState(false)
  const [assignSearch, setAssignSearch] = useState('')

  const fieldUsersQuery = useQuery({
    queryKey: ['users-field-for-assign'],
    queryFn: () => listUsers(),
    enabled: isAssignOpen,
    select: (users) => users.filter((u) => u.role === 'field'),
  })

  const assignMutation = useMutation({
    mutationFn: ({ targetUserId }: { targetUserId: string | null }) =>
      assignEquipment(id as string, targetUserId, userId),
    onSuccess: async () => {
      setAssignOpen(false)
      setAssignSearch('')
      await refreshAll()
      toast.success('Assignment updated.')
    },
    onError: () => toast.error('Could not update assignment.'),
  })

  // QR code download ref
  const qrWrapperRef = useRef<HTMLDivElement>(null)

  const handleDownloadQR = () => {
    const canvas = qrWrapperRef.current?.querySelector('canvas')
    if (!canvas || !equipment) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${equipment.name.replace(/[^a-z0-9]/gi, '_')}_QR.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Data Queries
  const { data: equipment, isLoading, isError, error } = useQuery({
    enabled: Boolean(id),
    queryKey: ['equipment', id],
    queryFn: () => getEquipment(id as string),
  })

  const { data: serviceLogs } = useQuery({
    enabled: Boolean(id),
    queryKey: ['service-logs', id],
    queryFn: () => listServiceLogsByEquipment(id as string),
  })

  const { data: activity } = useQuery({
    enabled: Boolean(id),
    queryKey: ['activity', id],
    queryFn: () => listActivityByEquipment(id as string, 10),
  })

  const { data: techNotes } = useQuery({
    enabled: Boolean(id),
    queryKey: ['tech-notes', id],
    queryFn: () => listMaintenanceNotes(id as string),
  })

  // Theme Colors
  const navy = "#1A4889"
  const gold = "#EBBA38"

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['equipment', id] })
    await queryClient.invalidateQueries({ queryKey: ['service-logs', id] })
    await queryClient.invalidateQueries({ queryKey: ['activity', id] })
    await queryClient.invalidateQueries({ queryKey: ['tech-notes', id] })
  }

  // Mutations
  const reportIssueMutation = useMutation({
    mutationFn: async () => {
      return reportIssue(id as string, {
        severity: issueSeverity,
        title: `Issue Report: ${equipment?.name}`,
        description: issueDescription,
        reportedById: userId
      })
    },
    onSuccess: async () => {
      setReportIssueOpen(false)
      setIssueSeverity('low')
      setIssueDescription('')
      await refreshAll()
      toast.success('Issue reported successfully.')
    }
  })

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      return addEquipmentNote(id as string, {
        note: fieldNote,
        authorId: userId
      })
    },
    onSuccess: async () => {
      setFieldNote('')
      await refreshAll()
      toast.success('Note added to equipment history.')
    }
  })

  const addTechNoteMutation = useMutation({
    mutationFn: async () => {
      return addMaintenanceNote({
        body: techNote,
        authorId: userId,
        equipmentId: id as string,
      })
    },
    onSuccess: async () => {
      setTechNote('')
      await refreshAll()
      toast.success('Technician note added.')
    }
  })

  const markServicedMutation = useMutation({
    mutationFn: () => markEquipmentServiced(id as string, {
      performedByUserId: userId,
      nextServiceDueDate: manualNextDueDate || undefined,
    }),
    onSuccess: async () => {
      setMarkServicedOpen(false)
      setManualNextDueDate('')
      await refreshAll()
      toast.success('Equipment marked as serviced.')
    },
    onError: () => toast.error('Could not mark serviced. Add a manual due date if needed.'),
  })

  const checkoutMutation = useMutation({
    mutationFn: () => {
      if (!startDate || !endDate) {
        toast.error('Please select rental dates on the Search page before checking out.')
        throw new Error('Start date and end date are required for checkout.')
      }
      return checkoutEquipment(id as string, {
        requestedBy: userId,
        startDate,
        endDate,
      })
    },
    onSuccess: () => {
      refreshAll()
      toast.success('Checkout request submitted for approval.')
    },
    onError: (err: any) => {
      if (err.message !== 'Start date and end date are required for checkout.') {
        toast.error(err.message || 'Failed to submit checkout request.')
      }
    }
  })

  const editAssetMutation = useMutation({
    mutationFn: async () => {
      return updateEquipment(id as string, {
        name: editName || undefined,
        category: editCategory || undefined,
        qrCode: editQrCode || undefined,
        maintenanceIntervalDays: editInterval ? Number(editInterval) : undefined,
        nextServiceDueDate: editNextDue || undefined,
        notes: editNotes,
      })
    },
    onSuccess: async () => {
      setEditAssetOpen(false)
      await refreshAll()
      toast.success('Asset updated successfully.')
    },
  })

  const openEditDialog = () => {
    if (equipment) {
      setEditName(equipment.name)
      setEditCategory(equipment.category)
      setEditQrCode(equipment.qrCode)
      setEditInterval(equipment.maintenanceIntervalDays?.toString() ?? '')
      setEditNextDue(equipment.nextServiceDueDate ?? '')
      setEditNotes(equipment.notes ?? '')
    }
    setEditAssetOpen(true)
  }

  const clearServiceLogsMutation = useMutation({
    mutationFn: () => clearServiceLogs(id as string),
    onSuccess: async () => { await refreshAll(); toast.success('Service logs cleared.') },
  })

  const clearActivityMutation = useMutation({
    mutationFn: () => clearActivity(id as string),
    onSuccess: async () => { await refreshAll(); toast.success('Recent history cleared.') },
  })

  const clearTechNotesMutation = useMutation({
    mutationFn: () => clearTechNotes(id as string),
    onSuccess: async () => { await refreshAll(); toast.success('Technician notes cleared.') },
  })

  const deleteTechNoteMutation = useMutation({
    mutationFn: (noteId: string) => deleteMaintenanceNote(noteId, userId),
    onSuccess: async () => { await refreshAll(); toast.success('Note removed.') },
  })

  const canCheckout = equipment?.status === 'available' && startDate && endDate

  if (isLoading) return <Loader label="Loading Asset Profile..." />
  if (isError || !equipment) return <ErrorState error={error as Error} title="Asset Not Found" />

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            {role === 'field' && (
              <>
                <Button 
                  style={{ backgroundColor: navy, color: 'white' }}
                  onClick={() => checkoutMutation.mutate()}
                  disabled={!canCheckout || checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? 'Processing...' : 'Check Out'}
                </Button>
                <Button 
                  variant="outline" 
                  style={{ borderColor: gold, color: navy }}
                  onClick={() => setReportIssueOpen(true)}
                >
                  Report Issue
                </Button>
              </>
            )}

            {role === 'maintenance' && (
              <Button style={{ backgroundColor: navy }} onClick={() => setMarkServicedOpen(true)}>
                Mark Serviced
              </Button>
            )}
            
            {role === 'admin' && (
              <Button variant="secondary" onClick={openEditDialog}>Edit Asset</Button>
            )}
          </div>
        }
        subtitle={`Asset Tag: ${equipment.qrCode}`}
        title={equipment.name}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Specifications & Status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Current Status</p>
              <StatusBadge status={equipment.status} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Category</p>
              <p className="text-sm font-medium text-slate-900">{equipment.category}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Next Service Due</p>
              <p className={`text-sm font-medium ${equipment.nextServiceDueDate && new Date(equipment.nextServiceDueDate) < new Date() ? 'text-red-600' : 'text-slate-900'}`}>
                {formatDate(equipment.nextServiceDueDate)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Last Service</p>
              <p className="text-sm text-slate-700">{formatDate(equipment.lastServiceDate)}</p>
            </div>

            {/* Assigned Worker row — visible to all roles, editable by admin */}
            <div className="sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Assigned Worker</p>
              <div className="flex items-center gap-3">
                {equipment.assignedToName ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 shrink-0">
                      <UserCircle2 className="h-4 w-4 text-emerald-700" />
                    </div>
                    <span className="font-medium text-slate-900">{equipment.assignedToName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">No worker assigned</span>
                )}
                {role === 'admin' && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => setAssignOpen(true)}
                    >
                      <UserCircle2 className="h-3.5 w-3.5" />
                      {equipment.assignedToName ? 'Reassign' : 'Assign Worker'}
                    </Button>
                    {equipment.assignedToName && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                        disabled={assignMutation.isPending}
                        onClick={() => assignMutation.mutate({ targetUserId: null })}
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Unassign
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            {role === 'field' && !canCheckout && equipment.status === 'available' && (
              <div className="sm:col-span-2">
                <p className="text-xs text-amber-600 font-medium">
                  * Please select rental dates on the Search page before checking out.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Technician Notes</CardTitle>
            {role === 'admin' && techNotes && techNotes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                onClick={() => setConfirmClearTechNotes(true)}
              >
                Clear All
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {equipment.notes && (
              <p className="text-sm text-slate-600 italic">{equipment.notes}</p>
            )}
            {techNotes && techNotes.length > 0 ? (
              <div className="space-y-3">
                {techNotes.map((note: MaintenanceNote) => (
                  <div key={note.id} className="border-l-2 border-indigo-200 pl-3 py-1 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700">{note.body}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(note.createdAt)}</p>
                    </div>
                    {(role === 'maintenance' || role === 'admin') && (
                      <button
                        type="button"
                        className="shrink-0 p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove note"
                        onClick={() => deleteTechNoteMutation.mutate(note.id)}
                        disabled={deleteTechNoteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : !equipment.notes ? (
              <p className="text-sm text-slate-500 italic">No technician notes on file.</p>
            ) : null}
            {role === 'maintenance' && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Textarea
                  placeholder="Add a technician note..."
                  value={techNote}
                  onChange={(e) => setTechNote(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <Button
                  size="sm"
                  style={{ backgroundColor: navy }}
                  onClick={() => addTechNoteMutation.mutate()}
                  disabled={!techNote.trim() || addTechNoteMutation.isPending}
                >
                  {addTechNoteMutation.isPending ? 'Saving...' : 'Add Note'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-4 w-4 text-slate-500" />
            Equipment QR Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* QR image + download */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div
                ref={qrWrapperRef}
                className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm"
              >
                <QRCodeCanvas
                  value={equipment.id}
                  size={148}
                  level="H"
                  marginSize={1}
                  bgColor="#ffffff"
                  fgColor="#1A4889"
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                Asset Tag:{' '}
                <span className="font-mono font-semibold text-slate-700">{equipment.qrCode}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleDownloadQR}
              >
                <Download className="h-3.5 w-3.5" />
                Download PNG
              </Button>
            </div>

            {/* Description */}
            <div className="flex-1 min-w-0 space-y-3 pt-1">
              <p className="text-sm font-medium text-slate-800">How to use this QR code</p>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">1</span>
                  Download and print this QR code, then attach it to the physical equipment.
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">2</span>
                  Use the <strong>Scan QR</strong> option in the app navigation to scan it with your camera.
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">3</span>
                  EquipTrack will instantly navigate to this equipment's profile.
                </li>
              </ul>
              <p className="text-xs text-slate-400 pt-1">
                Encodes equipment ID:{' '}
                <span className="font-mono">{equipment.id}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Worker Add Note (New Feature) */}
      {role === 'field' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Log Field Note</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Textarea 
                placeholder="Add a field observation, site note, or specific usage detail..." 
                value={fieldNote}
                onChange={(e) => setFieldNote(e.target.value)}
                className="min-h-[80px]"
              />
              <Button 
                style={{ backgroundColor: navy }} 
                className="self-end"
                onClick={() => addNoteMutation.mutate()}
                disabled={!fieldNote.trim() || addNoteMutation.isPending}
              >
                Add Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity & Service History */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent History</CardTitle>
            {role === 'admin' && activity && activity.filter((l: ActivityEvent) => !l.summary.startsWith('Technician Note:')).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                onClick={() => setConfirmClearHistory(true)}
              >
                Clear All
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const historyItems = activity?.filter(
                  (log: ActivityEvent) => !log.summary.startsWith('Technician Note:')
                ) ?? []
                return historyItems.length > 0 ? (
                  historyItems.map((log: ActivityEvent) => (
                    <div key={log.id} className="border-l-2 border-slate-200 pl-4 py-1">
                      <p className="text-sm font-medium">{log.summary}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(log.timestamp)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 py-2">No recent history on file</p>
                )
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Service Logs</CardTitle>
            {role === 'admin' && serviceLogs && serviceLogs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                onClick={() => setConfirmClearServiceLogs(true)}
              >
                Clear All
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceLogs && serviceLogs.length > 0 ? (
                serviceLogs.map((entry: ServiceLogEntry) => (
                  <div key={entry.id} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm">{entry.note}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(entry.date)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 py-2">No service logs on file</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REPORT ISSUE DIALOG */}
      <Dialog open={isReportIssueOpen} onOpenChange={setReportIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Equipment Issue</DialogTitle>
            <DialogDescription>
              Critical issues will automatically mark this unit as Out of Service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={issueSeverity} 
                onChange={(e) => setIssueSeverity(e.target.value)}
              >
                <option value="low">Low (Operational)</option>
                <option value="medium">Medium (Monitor)</option>
                <option value="critical">Critical (Immediate Repair)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe the leak, noise, or damage..." 
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              style={{ backgroundColor: navy }}
              onClick={() => reportIssueMutation.mutate()}
              disabled={reportIssueMutation.isPending || !issueDescription.trim()}
            >
              {reportIssueMutation.isPending ? 'Sending...' : 'Submit Report'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MARK SERVICED DIALOG */}
      <Dialog open={isMarkServicedOpen} onOpenChange={setMarkServicedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Serviced</DialogTitle>
            <DialogDescription>
              This will add a routine service log and update last/next service dates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Info card */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Equipment</p>
                <p className="text-sm font-semibold text-slate-800">{equipment?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Configured interval</p>
                <p className="text-sm text-slate-600">
                  {equipment?.maintenanceIntervalDays ? `${equipment.maintenanceIntervalDays} days` : '—'}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manualNextDueDate" className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Manual next due date <span className="normal-case tracking-normal text-slate-400">(required if no interval)</span>
              </Label>
              <input
                id="manualNextDueDate"
                type="date"
                value={manualNextDueDate}
                onChange={(e) => setManualNextDueDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setMarkServicedOpen(false)}>Cancel</Button>
              <Button
                style={{ backgroundColor: navy }}
                disabled={markServicedMutation.isPending}
                onClick={() => markServicedMutation.mutate()}
              >
                {markServicedMutation.isPending ? 'Saving…' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT ASSET DIALOG */}
      <Dialog open={isEditAssetOpen} onOpenChange={setEditAssetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update equipment details. Leave a field unchanged to keep its current value.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="editName">Name</Label>
                <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editCategory">Category</Label>
                <Input id="editCategory" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editQrCode">Asset Tag / QR Code</Label>
                <Input id="editQrCode" value={editQrCode} onChange={(e) => setEditQrCode(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editInterval">Maintenance Interval (days)</Label>
                <Input id="editInterval" type="number" value={editInterval} onChange={(e) => setEditInterval(e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="editNextDue">Next Service Due Date</Label>
                <input
                  id="editNextDue"
                  type="date"
                  value={editNextDue}
                  onChange={(e) => setEditNextDue(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea id="editNotes" className="min-h-[60px] text-sm" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditAssetOpen(false)}>Cancel</Button>
              <Button
                style={{ backgroundColor: navy }}
                disabled={editAssetMutation.isPending}
                onClick={() => editAssetMutation.mutate()}
              >
                {editAssetMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADMIN CLEAR CONFIRMATIONS */}
      <AlertDialog open={confirmClearServiceLogs} onOpenChange={setConfirmClearServiceLogs}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Service Logs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all service log entries for this equipment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                disabled={clearServiceLogsMutation.isPending}
                onClick={() => clearServiceLogsMutation.mutate()}
              >
                {clearServiceLogsMutation.isPending ? 'Clearing...' : 'Clear Service Logs'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClearHistory} onOpenChange={setConfirmClearHistory}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Recent History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all activity history entries for this equipment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                disabled={clearActivityMutation.isPending}
                onClick={() => clearActivityMutation.mutate()}
              >
                {clearActivityMutation.isPending ? 'Clearing...' : 'Clear History'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClearTechNotes} onOpenChange={setConfirmClearTechNotes}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Technician Notes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all technician notes for this equipment. Field notes will not be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                disabled={clearTechNotesMutation.isPending}
                onClick={() => clearTechNotesMutation.mutate()}
              >
                {clearTechNotesMutation.isPending ? 'Clearing...' : 'Clear Notes'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ASSIGN WORKER DIALOG */}
      <Dialog open={isAssignOpen} onOpenChange={(open) => { setAssignOpen(open); if (!open) setAssignSearch('') }}>
        <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-slate-500" />
              Assign Worker
            </DialogTitle>
            <DialogDescription>
              Select a field worker to assign to <strong>{equipment.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="Search field workers…"
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Worker list */}
          <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
            {fieldUsersQuery.isLoading && (
              <p className="text-xs text-slate-400 text-center py-8">Loading workers…</p>
            )}
            {!fieldUsersQuery.isLoading && (fieldUsersQuery.data ?? []).filter((u) =>
              u.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
              (u.position ?? '').toLowerCase().includes(assignSearch.toLowerCase())
            ).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">No field workers found.</p>
            )}
            {(fieldUsersQuery.data ?? [])
              .filter((u) =>
                u.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
                (u.position ?? '').toLowerCase().includes(assignSearch.toLowerCase())
              )
              .map((u) => {
                const isCurrentlyAssigned = equipment.assignedToUserId === u.id
                return (
                  <button
                    key={u.id}
                    disabled={assignMutation.isPending}
                    onClick={() => assignMutation.mutate({ targetUserId: u.id })}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left border-b border-slate-50 last:border-0 transition-colors ${
                      isCurrentlyAssigned
                        ? 'bg-emerald-50 hover:bg-emerald-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-emerald-100 shrink-0">
                      <UserCircle2 className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                      {u.position && (
                        <p className="text-xs text-slate-500 truncate">{u.position}</p>
                      )}
                    </div>
                    {isCurrentlyAssigned && (
                      <span className="shrink-0 text-[10px] font-semibold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                        Current
                      </span>
                    )}
                  </button>
                )
              })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}