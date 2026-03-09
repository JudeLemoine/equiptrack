import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Menu, Package, Users, ClipboardList, LogOut, Wrench } from 'lucide-react'
import { clearSession, getSession } from '../lib/auth'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { cn } from '../lib/utils'
import iconColor from '../assets/logos/icon_color.png'

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

export default function AppLayout() {
  const navigate = useNavigate()
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const session = getSession()

  const navItems = useMemo<NavItem[]>(() => {
    if (session?.user.role === 'admin') {
      return [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/equipment', label: 'Equipment', icon: Package },
        { to: '/admin/rentals', label: 'Rentals', icon: ClipboardList },
        { to: '/admin/users', label: 'Users', icon: Users },
      ]
    }

    if (session?.user.role === 'maintenance') {
      return [
        { to: '/maintenance/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/maintenance/queue', label: 'Maintenance Queue', icon: Wrench },
      ]
    }

    return [
      { to: '/field/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/field/equipment', label: 'Availability', icon: Package },
      { to: '/field/rentals', label: 'My Requests', icon: ClipboardList },
    ]
  }, [session?.user.role])

  const initials =
    session?.user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'U'

  const roleLabel =
    session?.user.role === 'admin'
      ? 'Admin'
      : session?.user.role === 'maintenance'
        ? 'Maintenance'
        : 'Field User'

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {isSidebarOpen ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-20 bg-slate-950/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white p-5 transition-transform md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Link className="flex items-center gap-2" to="/">
          <img alt="EquipTrack brand icon" className="h-9 w-9 rounded-md object-contain" src={iconColor} />
          <div>
            <p className="font-semibold">
              <span className="text-[rgb(var(--brand-navy-rgb))]">Equip</span>
              <span className="text-[rgb(var(--brand-yellow-rgb))]">Track</span>
            </p>
            <p className="text-xs text-slate-500">{roleLabel} Portal</p>
          </div>
        </Link>

        <nav className="mt-8 flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[rgb(var(--brand-navy-rgb))] text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                )
              }
              key={item.to}
              onClick={() => setSidebarOpen(false)}
              to={item.to}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <Button
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            size="icon"
            variant="secondary"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open sidebar</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-auto flex items-center gap-3 rounded-md px-2 py-1 hover:bg-slate-100">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-none">{session?.user.name ?? 'User'}</p>
                  <p className="mt-1 text-xs text-slate-500">{roleLabel}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <p className="text-sm">{session?.user.email}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
