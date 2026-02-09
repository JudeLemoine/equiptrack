import { useMutation } from '@tanstack/react-query'
import { Building2, HardHat, Wrench } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { isAuthenticated, setSession } from '../../lib/auth'
import { loginAsRole } from '../../services/authService'
import type { UserRole } from '../../types/auth'

export default function LoginPage() {
  const navigate = useNavigate()

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

  if (isAuthenticated()) {
    return <Navigate replace to="/" />
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_50%),radial-gradient(circle_at_80%_80%,_rgba(148,163,184,0.2),_transparent_45%)]" />
      <Card className="relative z-10 w-full max-w-xl border-slate-700 bg-slate-900/90 text-slate-100 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl text-white">EquipTrack</CardTitle>
          <CardDescription className="text-slate-300">
            Choose a role to enter the portal. This login is mock-auth backed by MSW.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Button
            className="h-24 flex-col gap-2"
            disabled={loginMutation.isPending}
            onClick={() => loginMutation.mutate('admin')}
            size="lg"
          >
            <Building2 className="h-5 w-5" />
            Login as Admin
          </Button>
          <Button
            className="h-24 flex-col gap-2"
            disabled={loginMutation.isPending}
            onClick={() => loginMutation.mutate('field')}
            size="lg"
            variant="secondary"
          >
            <HardHat className="h-5 w-5" />
            Login as Field User
          </Button>
          <Button
            className="h-24 flex-col gap-2"
            disabled={loginMutation.isPending}
            onClick={() => loginMutation.mutate('maintenance')}
            size="lg"
            variant="outline"
          >
            <Wrench className="h-5 w-5" />
            Login as Maintenance
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
