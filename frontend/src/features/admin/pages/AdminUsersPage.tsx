import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X, Eye, EyeOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import DataTable from '../../../components/DataTable'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import { Button } from '../../../components/ui/button'
import { listUsers, createUser, deleteUser, type CreateUserPayload } from '../../../services/userService'
import type { UserRole } from '../../../types/auth'
import type { User } from '../../../types/user'

const roleOptions: Array<{ label: string; value: UserRole | 'all' }> = [
  { label: 'All roles', value: 'all' },
  { label: 'Admin', value: 'admin' },
  { label: 'Field User', value: 'field' },
  { label: 'Maintenance', value: 'maintenance' },
]

const roleLabelMap: Record<UserRole, string> = {
  admin: 'Admin',
  field: 'Field User',
  maintenance: 'Maintenance',
}

const roleColorMap: Record<UserRole, string> = {
  admin: 'bg-blue-100 text-blue-800',
  field: 'bg-emerald-100 text-emerald-800',
  maintenance: 'bg-amber-100 text-amber-800',
}

type CreateUserForm = {
  name: string
  email: string
  role: UserRole
  password: string
  department: string
  position: string
  phoneNumber: string
}

const EMPTY_FORM: CreateUserForm = {
  name: '',
  email: '',
  role: 'field',
  password: '',
  department: '',
  position: '',
  phoneNumber: '',
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreateUserForm>(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)

  const mutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(`${newUser.name} has been added.`)
      onClose()
    },
    onError: () => {
      // error toast already shown by apiClient
    },
  })

  function handleChange(field: keyof CreateUserForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error('Name, email, and password are required.')
      return
    }
    mutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      password: form.password,
      department: form.department.trim() || undefined,
      position: form.position.trim() || undefined,
      phoneNumber: form.phoneNumber.trim() || undefined,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#fff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: 'rgb(var(--brand-navy-rgb))' }}
        >
          <div className="flex items-center gap-2 text-white">
            <Plus className="h-4 w-4" />
            <span className="font-semibold text-sm">Create New User</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
              >
                <option value="field">Field User</option>
                <option value="maintenance">Maintenance</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="jane@equiptrack.local"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Department */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Department
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="Operations"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Position */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Position
              </label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="Site Supervisor"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Phone Number
            </label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              placeholder="555-0100"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={mutation.isPending}
              style={{ background: 'rgb(var(--brand-navy-rgb))' }}
            >
              {mutation.isPending ? 'Creating…' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | 'all'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const usersQuery = useQuery({
    queryKey: ['users', { role }],
    queryFn: () => listUsers({ role }),
    placeholderData: keepPreviousData,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User removed.')
    },
  })

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <button
            className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline text-left"
            onClick={() => navigate(`/profile/${row.original.id}`)}
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-slate-600 text-sm font-mono">{row.original.email}</span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${roleColorMap[row.original.role]}`}
          >
            {roleLabelMap[row.original.role]}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/profile/${row.original.id}`)}
            >
              View Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                if (confirm(`Remove ${row.original.name}? This cannot be undone.`)) {
                  deleteMutation.mutate(row.original.id)
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate, deleteMutation],
  )

  if (usersQuery.isLoading) {
    return <Loader label="Loading users..." />
  }

  if (usersQuery.isError) {
    return (
      <ErrorState
        error={usersQuery.error}
        onRetry={() => usersQuery.refetch()}
        title="Could not load users"
      />
    )
  }

  const filteredUsers = (usersQuery.data ?? []).filter((user) => {
    const query = search.toLowerCase().trim()
    if (!query) return true
    return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
  })

  return (
    <div className="space-y-6">
      <Button className="mb-4" onClick={() => navigate(-1)} size="sm" variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <div className="flex items-center justify-between">
        <PageHeader subtitle="Manage user accounts and access" title="Users" />
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2"
          style={{ background: 'rgb(var(--brand-navy-rgb))' }}
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="flex flex-wrap gap-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</span>
          <div className="flex flex-wrap gap-1.5">
            {roleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setRole(option.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${role === option.value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-400'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        emptyDescription="No users match your current filters."
        emptyTitle="No users found"
        onSearchValueChange={setSearch}
        searchPlaceholder="Search users by name or email"
        searchValue={search}
      />

      {showCreateDialog && (
        <CreateUserDialog onClose={() => setShowCreateDialog(false)} />
      )}
    </div>
  )
}
