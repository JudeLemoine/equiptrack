import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
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
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { getSession } from '../../../lib/auth'
import { formatDate, formatDateTime } from '../../../lib/utils'
import { listActivityByEquipment } from '../../../services/activityService'
import { Input } from '../../../components/ui/input'
import {
  checkoutEquipment,
  getEquipment,
  markEquipmentServiced,
  reportIssue,
  addEquipmentNote,
} from '../../../services/equipmentService'
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
  const [manualNextDueDate, setManualNextDueDate] = useState('')

  // Form States
  const [issueSeverity, setIssueSeverity] = useState('low')
  const [issueDescription, setIssueDescription] = useState('')
  const [fieldNote, setFieldNote] = useState('')

  const role = session?.user.role
  const userId = session?.user.id ?? ''

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

  // Theme Colors
  const navy = "#1A4889"
  const gold = "#EBBA38"

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['equipment', id] })
    await queryClient.invalidateQueries({ queryKey: ['service-logs', id] })
    await queryClient.invalidateQueries({ queryKey: ['activity', id] })
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
              <Button variant="secondary">Edit Asset</Button>
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
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-slate-500">Current Status</Label>
              <div className="mt-1"><StatusBadge status={equipment.status} /></div>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Category</Label>
              <p className="font-medium text-slate-900">{equipment.category}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Next Service Due</Label>
              <p className={`font-medium ${equipment.nextServiceDueDate && new Date(equipment.nextServiceDueDate) < new Date() ? 'text-red-600' : ''}`}>
                {formatDate(equipment.nextServiceDueDate)}
              </p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Last Service</Label>
              <p className="text-slate-700">{formatDate(equipment.lastServiceDate)}</p>
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

        {/* Quick Actions Card */}
        <Card>
          <CardHeader><CardTitle>Technician Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 italic">
              {equipment.notes || "No permanent notes on file."}
            </p>
          </CardContent>
        </Card>
      </div>

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
          <CardHeader><CardTitle>Recent History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity && activity.length > 0 ? (
                activity.map((log: ActivityEvent) => (
                  <div key={log.id} className="border-l-2 border-slate-200 pl-4 py-1">
                    <p className="text-sm font-medium">{log.summary}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(log.timestamp)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 py-2">No recent history on file</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Service Logs</CardTitle></CardHeader>
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
          <div className="space-y-3">
            <p className="text-sm"><span className="font-medium">Equipment:</span> {equipment?.name}</p>
            <p className="text-sm"><span className="font-medium">Configured interval:</span> {equipment?.maintenanceIntervalDays ?? '-'} days</p>
            <div className="space-y-2">
              <Label htmlFor="manualNextDueDate">Manual next due date (required if no interval)</Label>
              <Input
                id="manualNextDueDate"
                onChange={(e) => setManualNextDueDate(e.target.value)}
                type="date"
                value={manualNextDueDate}
              />
            </div>
            <div className="flex justify-end">
              <Button
                style={{ backgroundColor: navy }}
                disabled={markServicedMutation.isPending}
                onClick={() => markServicedMutation.mutate()}
              >
                {markServicedMutation.isPending ? 'Saving...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}