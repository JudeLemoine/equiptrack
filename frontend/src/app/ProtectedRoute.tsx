import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getCurrentRole, isAuthenticated } from '../lib/auth'
import type { UserRole } from '../types/auth'

type ProtectedRouteProps = {
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (allowedRoles?.length) {
    const role = getCurrentRole()
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate replace to="/" />
    }
  }

  return <Outlet />
}
