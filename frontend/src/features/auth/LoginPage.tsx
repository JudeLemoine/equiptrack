import { useMutation } from '@tanstack/react-query'
import { Building2, HardHat, Wrench } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import fullLogoStroke from '../../assets/logos/full_logo_stroke.png'
import { isAuthenticated, setSession } from '../../lib/auth'
import { loginAsRole } from '../../services/authService'
import type { UserRole } from '../../types/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const authenticated = isAuthenticated()

  const loginMutation = useMutation({
    mutationFn: (role: UserRole) => loginAsRole(role),
    onSuccess: (session) => {
      setSession(session)
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
    <main className="relative grid min-h-screen grid-rows-[1fr_auto_1fr] overflow-hidden bg-white px-4 py-10">
      <div className="pointer-events-none z-10 row-start-1 flex items-center justify-center">
        <img
          alt="EquipTrack logo"
          className="h-auto select-none w-50 md:w-70"
          src={fullLogoStroke}
        />
      </div>
      <div className="relative z-20 row-start-2 flex min-h-56 justify-self-center rounded-xl border border-slate-200 bg-[#1A4889] p-5 text-white shadow-2xl sm:p-8">
        <div className="flex flex-col gap-6 w-full max-w-md items-center">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-slate-300">Select your role to continue</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 items-center">
            <Button
              className="h-28 flex-col gap-3 bg-white/10 hover:bg-white/20 border-white/20 text-white"
              disabled={loginMutation.isPending}
              onClick={() => loginMutation.mutate('admin')}
              size="lg"
              variant="outline"
            >
              <Building2 className="h-6 w-6" />
              <span className="text-xs font-semibold uppercase tracking-wider">Admin</span>
            </Button>
            <Button
              className="h-28 w-full flex-col gap-3 bg-white/10 hover:bg-white/20 border-white/20 text-white"
              disabled={loginMutation.isPending}
              onClick={() => loginMutation.mutate('field')}
              size="lg"
              variant="outline"
            >
              <HardHat className="h-6 w-6" />
              <span className="text-xs font-semibold uppercase tracking-wider">Field User</span>
            </Button>
            <Button
              className="h-28 w-full flex-col gap-3 bg-white/10 hover:bg-white/20 border-white/20 text-white"
              disabled={loginMutation.isPending}
              onClick={() => loginMutation.mutate('maintenance')}
              size="lg"
              variant="outline"
            >
              <Wrench className="h-6 w-6" />
              <span className="text-xs font-semibold uppercase tracking-wider">Maintenance</span>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
