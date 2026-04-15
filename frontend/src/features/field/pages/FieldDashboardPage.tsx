import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, Hammer, Package, ChevronRight, CheckCircle2 } from 'lucide-react'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import { getSession } from '../../../lib/auth'
import { getFieldSummary } from '../../../services/dashboardService'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Browse Equipment',
    desc: 'Explore the full catalog and find the right gear for your job.',
    icon: Package,
    accent: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    to: '/field/equipment',
  },
  {
    step: '02',
    title: 'Submit a Request',
    desc: 'Choose your dates and send a rental request for admin review.',
    icon: ClipboardList,
    accent: 'text-blue-600',
    iconBg: 'bg-blue-50',
    to: '/field/rentals',
  },
  {
    step: '03',
    title: 'Pick Up & Return',
    desc: 'Once approved, check out the equipment and return it when done.',
    icon: CheckCircle2,
    accent: 'text-violet-600',
    iconBg: 'bg-violet-50',
    to: '/field/rentals',
  },
]

export default function FieldDashboardPage() {
  const navigate = useNavigate()
  const session = getSession()
  const userId = session?.user.id ?? ''
  const firstName = (session?.user.name ?? 'there').split(' ')[0]

  const summaryQuery = useQuery({
    enabled: Boolean(userId),
    queryKey: ['field-summary', userId],
    queryFn: () => getFieldSummary(userId),
  })

  if (summaryQuery.isLoading) return <Loader label="Loading field dashboard..." />
  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <ErrorState
        error={summaryQuery.error}
        onRetry={() => { void summaryQuery.refetch() }}
        title="Could not load dashboard"
      />
    )
  }

  const quickLinks = [
    { title: 'Equipment Availability', desc: 'Browse and request ready equipment',  to: '/field/equipment', icon: Package,      accent: 'text-emerald-600', iconBg: 'bg-emerald-50' },
    { title: 'My Requests',            desc: 'Track active and pending rentals',    to: '/field/rentals',   icon: ClipboardList, accent: 'text-blue-600',   iconBg: 'bg-blue-50'   },
  ]

  const metrics = [
    { title: 'My Pending Requests', value: summaryQuery.data.myPendingRequests, icon: ClipboardList, desc: 'Requests waiting for admin approval',        border: 'border-l-orange-500', color: 'text-orange-600', to: '/field/rentals', state: { statusFilter: 'pending' } },
    { title: 'My Active Rentals',   value: summaryQuery.data.myActiveRentals,   icon: Hammer,        desc: 'Equipment currently assigned to your jobs',  border: 'border-l-blue-500',   color: 'text-blue-600',   to: '/field/rentals', state: { statusFilter: 'active'  } },
  ]

  return (
    <div className="space-y-7">

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <div
        className="anim-fade-up relative overflow-hidden rounded-2xl px-7 py-10"
        style={{ background: 'linear-gradient(135deg, #15803d 0%, #0f5c2c 100%)', animationDelay: '0s' }}
      >
        <div className="hero-blob pointer-events-none absolute -right-14 -top-14 h-64 w-64 rounded-full bg-white/10" />
        <div className="hero-blob-2 pointer-events-none absolute right-20 -bottom-12 h-40 w-40 rounded-full bg-white/5" />
        <div className="hero-blob pointer-events-none absolute -left-10 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">
              {getGreeting()}
            </p>
            <h1 className="text-2xl font-bold text-white">{firstName}!</h1>
            <p className="mt-1.5 text-sm text-emerald-100/80">
              Monitor your requests and access available equipment.
            </p>
          </div>
          <span
            className="hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.88)' }}
          >
            <Package className="h-3 w-3" />
            Field User
          </span>
        </div>
      </div>

      {/* ── Quick Access ─────────────────────────────────────── */}
      <div className="anim-fade-up" style={{ animationDelay: '0.08s' }}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Quick Access</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      {/* ── My Activity ───────────────────────────────────────── */}
      <div className="anim-fade-up" style={{ animationDelay: '0.16s' }}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">My Activity</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {metrics.map((m, i) => (
            <button
              key={m.title}
              onClick={() => navigate(m.to, { state: m.state })}
              className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl anim-fade-up"
              style={{ animationDelay: `${0.18 + i * 0.07}s` }}
            >
              <div className={`metric-card h-full rounded-xl border border-slate-200 border-l-4 ${m.border} bg-white px-5 py-5 group-hover:border-slate-300 group-hover:shadow-md`}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{m.title}</p>
                  <m.icon className={`h-4 w-4 ${m.color} opacity-50`} />
                </div>
                <p className={`anim-count-pop text-3xl font-bold ${m.color}`} style={{ animationDelay: `${0.28 + i * 0.07}s` }}>{m.value}</p>
                <p className="mt-1 text-xs text-slate-400">{m.desc}</p>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-300 transition-colors group-hover:text-slate-500">
                  View details →
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── How It Works ─────────────────────────────────────── */}
      <div className="anim-fade-up" style={{ animationDelay: '0.28s' }}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">How It Works</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {HOW_IT_WORKS.map((s, i) => (
            <Link
              key={s.step}
              to={s.to}
              className="group relative flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-5 hover:border-slate-300 hover:shadow-md anim-fade-up"
              style={{ animationDelay: `${0.3 + i * 0.07}s` }}
            >
              {/* Step connector line */}
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-full items-center sm:flex" style={{ width: '12px' }}>
                  <div className="h-px w-full bg-slate-200" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}>
                  <s.icon className={`h-4 w-4 ${s.accent}`} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">{s.step}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.desc}</p>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-300 transition-colors group-hover:text-slate-500">
                Get started →
              </p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
