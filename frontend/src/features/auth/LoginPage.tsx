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
    <main className="relative grid min-h-screen grid-rows-[1fr_auto_1fr] overflow-hidden bg-[#1A4889] px-4 py-10">
      <div className="pointer-events-none z-10 row-start-1 flex items-center justify-center">
        <img
          alt="EquipTrack logo"
          className="h-auto select-none w-50 md:w-70"
          src={fullLogoStroke}
        />
      </div>
      <div className="relative z-20 row-start-2 flex min-h-56 justify-self-center rounded-xl border border-slate-700 bg-slate-900/90 p-5 text-slate-100 shadow-2xl sm:p-6">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 items-center">
          <Button
            className="h-24 flex-col gap-2"
            disabled={loginMutation.isPending}
            onClick={() => loginMutation.mutate('admin')}
            size="lg"
            variant="secondary"
          >
            <Building2 className="h-5 w-5" />
            Login as Admin
          </Button>
          <Button
            className="h-24 w-full flex-col gap-2"
            disabled={loginMutation.isPending}
            onClick={() => loginMutation.mutate('field')}
            size="lg"
            variant="secondary"
          >
            <HardHat className="h-5 w-5" />
            Login as Field User
          </Button>
          <Button
            className="h-24 w-full flex-col gap-2"
            disabled={loginMutation.isPending}
            onClick={() => loginMutation.mutate('maintenance')}
            size="lg"
            variant="secondary"
          >
            <Wrench className="h-5 w-5" />
            Login as Maintenance
          </Button>
        </div>
      </div>
    </main>
  )
}
