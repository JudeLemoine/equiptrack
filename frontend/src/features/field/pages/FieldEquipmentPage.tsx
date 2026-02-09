import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import EmptyState from '../../../components/EmptyState'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import StatusBadge from '../../../components/StatusBadge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select } from '../../../components/ui/select'
import { formatDate } from '../../../lib/utils'
import { listEquipment } from '../../../services/equipmentService'
import type { EquipmentStatus } from '../../../types/equipment'

export default function FieldEquipmentPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EquipmentStatus | 'all'>('available')
  const [category, setCategory] = useState<string>('all')

  const equipmentQuery = useQuery({
    queryKey: ['equipment', 'field', { search, status, category }],
    queryFn: () => listEquipment({ search, status, category }),
  })

  const categories = useMemo(() => {
    const set = new Set((equipmentQuery.data ?? []).map((item) => item.category))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [equipmentQuery.data])

  if (equipmentQuery.isLoading) {
    return <Loader label="Loading available equipment..." />
  }

  if (equipmentQuery.isError) {
    return (
      <ErrorState
        error={equipmentQuery.error}
        onRetry={() => equipmentQuery.refetch()}
        title="Could not load equipment"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Filter and browse inventory ready for rental"
        title="Availability"
      />

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="equipmentSearch">Search</Label>
          <Input
            id="equipmentSearch"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by equipment name"
            value={search}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipmentStatus">Status</Label>
          <Select
            id="equipmentStatus"
            onChange={(event) => setStatus(event.target.value as EquipmentStatus | 'all')}
            value={status}
          >
            <option value="available">Available</option>
            <option value="all">All statuses</option>
            <option value="in_use">In use</option>
            <option value="maintenance">Maintenance</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipmentCategory">Category</Label>
          <Select
            id="equipmentCategory"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            <option value="all">All categories</option>
            {categories.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </div>
      </div>

      {equipmentQuery.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {equipmentQuery.data.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">{item.name}</CardTitle>
                <CardDescription>
                  {item.category} • Last serviced {formatDate(item.lastServiceDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatusBadge status={item.status} />
              </CardContent>
              <CardFooter>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/field/equipment/${item.id}`}>View</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          description="Try a different search, status, or category filter."
          icon={<PackageSearch className="h-5 w-5 text-slate-500" />}
          title="No equipment matches your filters"
        />
      )}
    </div>
  )
}
