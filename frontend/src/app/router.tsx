import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './AppLayout'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '../features/auth/LoginPage'
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage'
import AdminEquipmentPage from '../features/admin/pages/AdminEquipmentPage'
import AdminEquipmentDetailPage from '../features/admin/pages/AdminEquipmentDetailPage'
import AdminRentalsPage from '../features/admin/pages/AdminRentalsPage'
import AdminUsersPage from '../features/admin/pages/AdminUsersPage'
import FieldDashboardPage from '../features/field/pages/FieldDashboardPage'
import FieldEquipmentPage from '../features/field/pages/FieldEquipmentPage'
import FieldEquipmentDetailPage from '../features/field/pages/FieldEquipmentDetailPage'
import FieldRentalsPage from '../features/field/pages/FieldRentalsPage'
import MaintenanceDashboardPage from '../features/maintenance/pages/MaintenanceDashboardPage'
import MaintenanceEquipmentPage from '../features/maintenance/pages/MaintenanceEquipmentPage'
import MaintenanceEquipmentDetailPage from '../features/maintenance/pages/MaintenanceEquipmentDetailPage'
import UserProfilePage from '../features/user/pages/UserProfilePage'
import NotFoundPage from './NotFoundPage'
import { getCurrentRole } from '../lib/auth'

function RootRedirect() {
  const role = getCurrentRole()

  if (role === 'admin') {
    return <Navigate replace to="/admin/dashboard" />
  }

  if (role === 'field') {
    return <Navigate replace to="/field/dashboard" />
  }

  if (role === 'maintenance') {
    return <Navigate replace to="/maintenance/dashboard" />
  }

  return <Navigate replace to="/login" />
}

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<RootRedirect />} index />
          <Route element={<UserProfilePage />} path="/profile/:id?" />

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminDashboardPage />} path="/admin/dashboard" />
            <Route element={<AdminEquipmentPage />} path="/admin/equipment" />
            <Route element={<AdminEquipmentDetailPage />} path="/admin/equipment/:id" />
            <Route element={<AdminRentalsPage />} path="/admin/rentals" />
            <Route element={<AdminUsersPage />} path="/admin/users" />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['field']} />}>
            <Route element={<FieldDashboardPage />} path="/field/dashboard" />
            <Route element={<FieldEquipmentPage />} path="/field/equipment" />
            <Route element={<FieldEquipmentDetailPage />} path="/field/equipment/:id" />
            <Route element={<FieldRentalsPage />} path="/field/rentals" />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['maintenance']} />}>
            <Route element={<MaintenanceDashboardPage />} path="/maintenance/dashboard" />
            <Route element={<MaintenanceEquipmentPage />} path="/maintenance/queue" />
            <Route element={<MaintenanceEquipmentDetailPage />} path="/maintenance/equipment/:id" />
          </Route>
        </Route>
      </Route>

      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  )
}
