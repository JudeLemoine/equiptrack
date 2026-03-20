import { Link, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, User, Wrench, HardHat, Truck, ClipboardList, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { clearSession, getSession, setSession } from '../lib/auth'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import iconColor from '../assets/logos/icon_color.png'
import { getUser } from '../services/userService'

const ICON_MAP: Record<string, React.ReactNode> = {
  hardhat: <HardHat className="h-4 w-4" />,
  wrench: <Wrench className="h-4 w-4" />,
  truck: <Truck className="h-4 w-4" />,
  clipboard: <ClipboardList className="h-4 w-4" />,
  gear: <Settings className="h-4 w-4" />,
}

export default function AppLayout() {
  const navigate = useNavigate()
  const session = getSession()

  // Fetch user data to keep avatar current
  const userQuery = useQuery({
    queryKey: ['current-user-avatar', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null
      const user = await getUser(session.user.id)
      // Update session cache with latest avatar
      if (user && session) {
        const updated = {
          ...session,
          user: { ...session.user, avatarUrl: user.avatarUrl ?? undefined, isAvatarIcon: user.isAvatarIcon },
        }
        setSession(updated)
      }
      return user
    },
    enabled: !!session?.user?.id,
    staleTime: 30_000,
  })

  const avatarIcon = userQuery.data?.avatarUrl || session?.user?.avatarUrl
  const isAvatarIcon = userQuery.data?.isAvatarIcon ?? session?.user?.isAvatarIcon

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
      <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
          <Link className="flex items-center gap-2" to="/">
          <img alt="EquipTrack brand icon" className="h-9 w-9 rounded-md object-contain" src={iconColor} />
          <div>
            <p className="font-semibold">
              <span className="text-[rgb(var(--brand-navy-rgb))]">Equip</span>
              <span className="text-[rgb(var(--brand-yellow-rgb))]">Track</span>
            </p>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-slate-100 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-semibold">
                  {isAvatarIcon && avatarIcon && ICON_MAP[avatarIcon]
                    ? ICON_MAP[avatarIcon]
                    : initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none">{session?.user.name ?? 'User'}</p>
                <p className="mt-1 text-xs text-slate-500">{roleLabel}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{session?.user.name}</p>
              <p className="text-xs text-slate-500">{session?.user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
