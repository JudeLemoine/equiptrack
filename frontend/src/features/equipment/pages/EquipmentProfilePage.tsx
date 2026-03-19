import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
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
import { Select } from '../../../components/ui/select'
import { Textarea } from '../../../components/ui/textarea'
import { getSession } from '../../../lib/auth'
import { formatDate, formatDateTime } from '../../../lib/utils'
import { listActivityByEquipment } from '../../../services/activityService'
import {
  changeEquipmentStatus,
  checkoutEquipment,
  getEquipment,
} from '../../../services/equipmentService'
import { listServiceLogsByEquipment } from '../../../services/serviceLogService'
import type { ActivityEvent } from '../../../types/activity'
import type { ServiceLogEntry } from '../../../types/serviceLog'

export default function EquipmentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = getSession()
  
  // Dialog States
  const [isReportIssueOpen, setReportIssueOpen] = useState(false)

  // Form States
  const [issueSeverity, setIssueSeverity] = useState('low')
  const [issueDescription, setIssueDescription] = useState('')

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

  const backPath = useMemo(() => {
    if (role === 'admin') return '/admin/equipment'
    if (role === 'maintenance') return '/maintenance/queue'
    return '/field/equipment'
  }, [role])

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['equipment', id] })
    await queryClient.invalidateQueries({ queryKey: ['service-logs', id] })
    await queryClient.invalidateQueries({ queryKey: ['activity', id] })
  }

  // Mutations
  const reportIssueMutation = useMutation({
    mutationFn: async () => {
      // Logic: If critical, backend will flip status to OUT_OF_SERVICE
      // This matches your Node 08 requirement
      console.log("Reporting issue:", { issueSeverity, issueDescription })
      return changeEquipmentStatus(id as string, {
        status: issueSeverity === 'critical' ? 'maintenance' : equipment?.status ?? 'available',
        actorUserId: userId,
        note: `Issue Reported (${issueSeverity}): ${issueDescription}`
      })
    },
    onSuccess: async () => {
      await refreshAll()
      setReportIssueOpen(false)
      setIssueDescription('')
      toast.success('Issue reported successfully.')
    }
  })

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutEquipment(id as string, userId),
    onSuccess: refreshAll
  })

  if (isLoading) return <Loader label="Loading Asset Profile..." />
  if (isError || !equipment) return <ErrorState error={error as Error} title="Asset Not Found" />

  return (
    <div className="space-y-6 pb-10">
      {/* Header with Navy/Gold buttons */}
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(backPath)}>Back</Button>
            
            {role === 'field' && (
              <>
                <Button 
                  style={{ backgroundColor: navy, color: 'white' }}
                  onClick={() => checkoutMutation.mutate()}
                  disabled={equipment.status !== 'available'}
                >
                  Check Out
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
              <Button style={{ backgroundColor: navy }}>
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

      {/* Activity & Service History */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity?.map((log: ActivityEvent) => (
                <div key={log.id} className="border-l-2 border-slate-200 pl-4 py-1">
                  <p className="text-sm font-medium">{log.summary}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(log.timestamp)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Service Logs</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceLogs?.map((entry: ServiceLogEntry) => (
                <div key={entry.id} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm">{entry.note}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(entry.date)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REPORT ISSUE DIALOG (Node 08 Feature) */}
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
              <Select value={issueSeverity} onChange={(e) => setIssueSeverity(e.target.value)}>
                <option value="low">Low (Operational)</option>
                <option value="medium">Medium (Monitor)</option>
                <option value="critical">Critical (Immediate Repair)</option>
              </Select>
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
              disabled={reportIssueMutation.isPending}
            >
              Submit Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}