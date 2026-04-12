import { useMutation } from '@tanstack/react-query'
import { Building2, HardHat, Wrench, ShieldCheck, MapPin, ClipboardList, Users, BarChart3, Settings, Truck, AlertTriangle, Wrench as WrenchIcon } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import fullLogoStroke from '../../assets/logos/full_logo_stroke.png'
import { isAuthenticated, setSession } from '../../lib/auth'
import { loginAsRole } from '../../services/authService'
import { useImpersonation } from '../../app/ImpersonationContext'
import type { UserRole } from '../../types/auth'

const roles = [
  {
    key: 'admin' as UserRole,
    label: 'Administrator',
    icon: Building2,
    accent: 'rgb(var(--brand-navy-rgb))',
    accentLight: 'rgba(3,62,140,0.08)',
    accentBorder: 'rgba(3,62,140,0.2)',
    tagline: 'Full platform oversight and control',
    description:
      'Administrators have unrestricted access to every area of EquipTrack. They manage the equipment catalogue, approve or reject rental requests, oversee all active and historical rentals, and maintain user accounts across the organisation.',
    access: [
      { icon: BarChart3, label: 'Admin dashboard & KPI summary' },
      { icon: Settings, label: 'Equipment catalogue management' },
      { icon: ClipboardList, label: 'Rental approvals & full history' },
      { icon: Users, label: 'User account administration' },
      { icon: ShieldCheck, label: 'Impersonate any user (view-only)' },
    ],
  },
  {
    key: 'field' as UserRole,
    label: 'Field User',
    icon: HardHat,
    accent: '#15803d',
    accentLight: 'rgba(21,128,61,0.08)',
    accentBorder: 'rgba(21,128,61,0.2)',
    tagline: 'Browse, request and track equipment on-site',
    description:
      'Field users are the people on the ground using the equipment day-to-day. They can browse all available equipment, submit rental requests with a job site and reason, and track the status of their own active and past rentals.',
    access: [
      { icon: BarChart3, label: 'Personal dashboard & active rentals' },
      { icon: Truck, label: 'Browse available equipment' },
      { icon: ClipboardList, label: 'Submit & track rental requests' },
      { icon: MapPin, label: 'Job site & usage details' },
      { icon: AlertTriangle, label: 'Report equipment issues' },
    ],
  },
  {
    key: 'maintenance' as UserRole,
    label: 'Maintenance',
    icon: Wrench,
    accent: '#b45309',
    accentLight: 'rgba(180,83,9,0.08)',
    accentBorder: 'rgba(180,83,9,0.2)',
    tagline: 'Keep the fleet operational and serviced',
    description:
      'Maintenance technicians manage the health of every piece of equipment in the fleet. They work through a prioritised service queue, log completed work, respond to issue reports filed by field users, and update equipment status after servicing.',
    access: [
      { icon: BarChart3, label: 'Maintenance dashboard & queue' },
      { icon: WrenchIcon, label: 'Service logs & maintenance records' },
      { icon: AlertTriangle, label: 'Issue report management' },
      { icon: ClipboardList, label: 'Equipment status updates' },
      { icon: ShieldCheck, label: 'Mark equipment as serviced' },
    ],
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const authenticated = isAuthenticated()
  const { notifySessionChanged } = useImpersonation()

  const loginMutation = useMutation({
    mutationFn: (role: UserRole) => loginAsRole(role),
    onSuccess: (session) => {
      setSession(session)
      notifySessionChanged()
      const target =
        session.user.role === 'admin'
          ? '/admin/dashboard'
          : session.user.role === 'maintenance'
            ? '/maintenance/dashboard'
            : '/field/dashboard'
      navigate(target, { replace: true })
      toast.success(`Welcome back, ${session.user.name}`)
    },
    onError: () => {
      toast.error('Unable to sign in right now. Please try again.')
    },
  })

  if (authenticated) {
    return <Navigate replace to="/" />
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      <div
        className="w-full flex items-center px-8 py-4 shrink-0"
        style={{
          background: 'rgb(var(--brand-navy-rgb))',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <img
          alt="EquipTrack logo"
          className="h-8 w-auto select-none"
          src={fullLogoStroke}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-4">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Select Your Role</h1>
          <p className="mt-1.5 text-slate-500 text-sm">
            Choose a role below to access your workspace.
          </p>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-5">
          {roles.map((role) => {
            const Icon = role.icon
            const isPending = loginMutation.isPending

            return (
              <div
                key={role.key}
                className="flex flex-col rounded-2xl overflow-hidden"
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  className="px-6 pt-7 pb-5"
                  style={{ borderBottom: `1px solid ${role.accentBorder}`, background: role.accentLight }}
                >
                  <div
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4"
                    style={{ background: role.accent }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h2
                    className="text-xl font-bold tracking-tight mb-1"
                    style={{ color: role.accent }}
                  >
                    {role.label}
                  </h2>
                  <p className="text-slate-500 text-xs font-medium">{role.tagline}</p>
                </div>

                <div className="px-6 py-5 flex flex-col gap-4 flex-1">
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {role.description}
                  </p>

                  <div className="flex flex-col gap-2">
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                      style={{ color: role.accent }}
                    >
                      Access includes
                    </p>
                    {role.access.map(({ icon: AccessIcon, label }) => (
                      <div key={label} className="flex items-center gap-2.5">
                        <div
                          className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md"
                          style={{ background: role.accentLight }}
                        >
                          <AccessIcon className="h-3.5 w-3.5" style={{ color: role.accent }} />
                        </div>
                        <span className="text-sm text-slate-700">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button
                    disabled={isPending}
                    onClick={() => loginMutation.mutate(role.key)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                    style={{ background: role.accent }}
                  >
                    {isPending ? 'Signing in…' : `Continue as ${role.label}`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
