import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  CheckCircle2,
  Clock3,
  Package,
  Wrench,
  Users,
  ClipboardList,
  ChevronRight,
} from 'lucide-react'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import { getAdminSummary } from '../../../services/dashboardService'
import { getSession } from '../../../lib/auth'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const session = getSession()
  const firstName = (session?.user.name ?? 'there').split(' ')[0]

  const summaryQuery = useQuery({
    queryKey: ['admin-summary'],
    queryFn: getAdminSummary,
  })

  if (summaryQuery.isLoading) return <Loader label="Loading admin dashboard..." />
  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <ErrorState
        error={summaryQuery.error}
        onRetry={() => summaryQuery.refetch()}
        title="Could not load dashboard"
      />
    )
  }

  const d = summaryQuery.data
  const total = d.totalEquipment || 1 // avoid div/0

  const quickLinks = [
    { title: 'Equipment',  desc: 'Manage inventory & assets',   to: '/admin/equipment', icon: Package,      accent: 'text-blue-600',   iconBg: 'bg-blue-50'   },
    { title: 'Rentals',    desc: 'Review & approve requests',   to: '/admin/rentals',   icon: ClipboardList, accent: 'text-violet-600', iconBg: 'bg-violet-50' },
    { title: 'Users',      desc: 'Manage team access',          to: '/admin/users',     icon: Users,         accent: 'text-emerald-600',iconBg: 'bg-emerald-50'},
  ]

  const metrics = [
    { title: 'Total Equipment',   value: d.totalEquipment,             icon: Package,      desc: 'All tracked assets',       border: 'border-l-slate-400',   color: 'text-slate-800',  to: '/admin/equipment', state: {} },
    { title: 'Available',         value: d.byStatus.available,         icon: CheckCircle2, desc: 'Ready for rental',         border: 'border-l-emerald-500', color: 'text-emerald-600',to: '/admin/equipment', state: { statusFilter: 'available'   } },
    { title: 'In Use',            value: d.byStatus.in_use,            icon: Activity,     desc: 'Currently rented out',     border: 'border-l-blue-500',    color: 'text-blue-600',   to: '/admin/equipment', state: { statusFilter: 'in_use'      } },
    { title: 'Maintenance',       value: d.byStatus.maintenance,       icon: Wrench,       desc: 'Needs servicing',          border: 'border-l-amber-500',   color: 'text-amber-600',  to: '/admin/equipment', state: { statusFilter: 'maintenance' } },
    { title: 'Pending Requests',  value: d.pendingRentalRequests,      icon: Clock3,       desc: 'Awaiting admin action',    border: 'border-l-orange-500',  color: 'text-orange-600', to: '/admin/rentals',   state: { statusFilter: 'pending'     } },
    { title: 'Active Rentals',    value: d.activeRentals,              icon: Activity,     desc: 'Ongoing equipment use',    border: 'border-l-sky-400',     color: 'text-sky-600',    to: '/admin/rentals',   state: { statusFilter: 'active'      } },
  ]

  const healthBars = [
    { label: 'Available',    value: d.byStatus.available,   bg: 'bg-emerald-500', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    { label: 'In Use',       value: d.byStatus.in_use,      bg: 'bg-blue-400',    text: 'text-blue-700',    dot: 'bg-blue-400'    },
    { label: 'Maintenance',  value: d.byStatus.maintenance, bg: 'bg-amber-400',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  ]

  return (
    <div className="space-y-7">

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <div
        className="anim-fade-up relative overflow-hidden rounded-2xl px-7 py-10"
        style={{ background: 'linear-gradient(135deg, rgb(3,62,140) 0%, rgb(1,38,95) 100%)', animationDelay: '0s' }}
      >
        <div className="hero-blob pointer-events-none absolute -right-14 -top-14 h-64 w-64 rounded-full bg-white/10" />
        <div className="hero-blob-2 pointer-events-none absolute right-20 -bottom-12 h-40 w-40 rounded-full bg-white/5" />
        <div className="hero-blob pointer-events-none absolute -left-10 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-300">
              {getGreeting()}
            </p>
            <h1 className="text-2xl font-bold text-white">{firstName}!</h1>
            <p className="mt-1.5 text-sm text-blue-200/80">
              Here's your fleet and rental overview for today.
            </p>
          </div>
          <span
            className="hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.88)' }}
          >
            <Users className="h-3 w-3" />
            Administrator
          </span>
        </div>
      </div>

      {/* ── Quick Access ─────────────────────────────────────── */}
      <div className="anim-fade-up" style={{ animationDelay: '0.08s' }}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Quick Access</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-300 hover:shadow-md"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${link.iconBg}`}>
                <link.icon className={`h-5 w-5 ${link.accent}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{link.title}</p>
                <p className="text-xs text-slate-500">{link.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Fleet Health Bar ──────────────────────────────────── */}
      <div className="anim-fade-up rounded-xl border border-slate-200 bg-white px-5 py-4" style={{ animationDelay: '0.16s' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Fleet Health</p>
          <p className="text-xs text-slate-400">{d.totalEquipment} total units</p>
        </div>
        {/* Progress bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
          {healthBars.map((bar, i) => (
            <div
              key={bar.label}
              className={`${bar.bg} transition-all duration-700`}
              style={{
                width: `${(bar.value / total) * 100}%`,
                animationDelay: `${0.3 + i * 0.1}s`,
                borderRadius: i === 0 ? '9999px 0 0 9999px' : i === healthBars.length - 1 ? '0 9999px 9999px 0' : '0',
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-5">
          {healthBars.map((bar) => (
            <div key={bar.label} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${bar.dot}`} />
              <span className="text-xs text-slate-500">{bar.label}</span>
              <span className={`text-xs font-bold ${bar.text}`}>{bar.value}</span>
              <span className="text-[10px] text-slate-400">({Math.round((bar.value / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fleet Metrics ─────────────────────────────────────── */}
      <div className="anim-fade-up" style={{ animationDelay: '0.22s' }}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Fleet Overview</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((m, i) => (
            <button
              key={m.title}
              onClick={() => navigate(m.to, { state: m.state })}
              className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-xl anim-fade-up"
              style={{ animationDelay: `${0.24 + i * 0.05}s` }}
            >
              <div className={`metric-card h-full rounded-xl border border-slate-200 border-l-4 ${m.border} bg-white px-5 py-5 group-hover:border-slate-300 group-hover:shadow-md`}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{m.title}</p>
                  <m.icon className={`h-4 w-4 ${m.color} opacity-50`} />
                </div>
                <p className={`anim-count-pop text-3xl font-bold ${m.color}`} style={{ animationDelay: `${0.3 + i * 0.06}s` }}>{m.value}</p>
                <p className="mt-1 text-xs text-slate-400">{m.desc}</p>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-300 transition-colors group-hover:text-slate-500">
                  View details →
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
