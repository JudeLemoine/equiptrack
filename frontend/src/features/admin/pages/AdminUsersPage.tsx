import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import DataTable from '../../../components/DataTable'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Select } from '../../../components/ui/select'
import { listUsers, deleteUser } from '../../../services/userService'
import { getSession } from '../../../lib/auth'
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

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = getSession()
  const currentUserRole = session?.user?.role

  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | 'all'>('all')

  const usersQuery = useQuery({
    queryKey: ['users', { role }],
    queryFn: () => listUsers({ role }),
    placeholderData: keepPreviousData,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => {
      toast.error('Failed to delete user: ' + (error as Error).message)
    }
  })

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <p className="font-medium">{row.original.name}</p>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => roleLabelMap[row.original.role],
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const user = row.original
          
          if (currentUserRole === 'admin' && user.role === 'admin') {
            return null
          }

          return (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this user?')) {
                  deleteMutation.mutate(user.id)
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )
        }
      }
    ],
    [currentUserRole, deleteMutation],
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

    return (
      user.name.toLowerCase().includes(query)
      || user.email.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <Button className="mb-4" onClick={() => navigate('/admin/dashboard')} size="sm" variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <PageHeader
        subtitle="User directory for role visibility"
        title="Users"
      />

      <div className="max-w-xs space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <Label htmlFor="userRoleFilter">Role filter</Label>
        <Select
          id="userRoleFilter"
          onChange={(event) => setRole(event.target.value as UserRole | 'all')}
          value={role}
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
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
    </div>
  )
}
