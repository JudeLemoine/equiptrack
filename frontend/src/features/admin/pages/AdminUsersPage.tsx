import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import DataTable from '../../../components/DataTable'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import { Label } from '../../../components/ui/label'
import { Select } from '../../../components/ui/select'
import { listUsers } from '../../../services/userService'
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
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | 'all'>('all')

  const usersQuery = useQuery({
    queryKey: ['users', { role }],
    queryFn: () => listUsers({ role }),
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
    ],
    [],
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
