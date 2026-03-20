import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { PackageSearch, ArrowLeft } from 'lucide-react'
import EmptyState from '../../../components/EmptyState'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import StatusBadge from '../../../components/StatusBadge'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select } from '../../../components/ui/select'
import { TextField } from '@mui/material'
import { formatDate } from '../../../lib/utils'
import { listEquipment } from '../../../services/equipmentService'
import type { EquipmentStatus } from '../../../types/equipment'

export default function FieldEquipmentPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EquipmentStatus | 'all'>('all')
  const [category, setCategory] = useState<string>('all')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const isFilterApplied = search.length > 0 || status !== 'all' || category !== 'all' || location.length > 0 || startDate.length > 0 || endDate.length > 0

  const equipmentQuery = useQuery({
    queryKey: ['equipment', 'field', { search, status, category, location, startDate, endDate }],
    queryFn: () => listEquipment({ search, status, category, location, startDate, endDate }),
    placeholderData: keepPreviousData,
    enabled: isFilterApplied,
  })

  const categories = useMemo(() => {
    const data = equipmentQuery.data ?? []
    const set = new Set(data.map((item) => item.category))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [equipmentQuery.data])

  return (
    <div className="space-y-6">
      <Button 
        className="mb-4" 
        onClick={() => navigate(-1)} 
        size="sm" 
        variant="outline"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <PageHeader
        subtitle="Search and filter inventory ready for rental"
        title="Equipment Search"
      />

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="space-y-2">
          <Label htmlFor="equipmentSearch">Search</Label>
          <Input
            id="equipmentSearch"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search equipment..."
            value={search}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationFilter">Location</Label>
          <Input
            id="locationFilter"
            onChange={(event) => setLocation(event.target.value)}
            placeholder="e.g. Site A"
            value={location}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <TextField
            id="startDate"
            type="date"
            fullWidth
            size="small"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'white'
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <TextField
            id="endDate"
            type="date"
            fullWidth
            size="small"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'white'
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipmentStatus">Status</Label>
          <Select
            id="equipmentStatus"
            onChange={(event) => setStatus(event.target.value as EquipmentStatus | 'all')}
            value={status}
          >
            <option value="all">All statuses</option>
            <option value="available">Available</option>
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

      {!isFilterApplied ? (
        <EmptyState
          description="Enter a search term or apply a filter to browse equipment."
          icon={<PackageSearch className="h-10 w-10 text-slate-300" />}
          title="Start Your Search"
        />
      ) : equipmentQuery.isLoading ? (
        <Loader label="Searching equipment..." />
      ) : equipmentQuery.isError ? (
        <ErrorState
          error={equipmentQuery.error}
          onRetry={() => equipmentQuery.refetch()}
          title="Could not load equipment"
        />
      ) : equipmentQuery.data?.length ? (
        <div className="flex flex-col gap-3">
          {equipmentQuery.data.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                      <p className="text-sm text-slate-500">
                        {item.category} • Last serviced {formatDate(item.lastServiceDate)}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                <div className="flex items-center border-t border-slate-100 bg-slate-50/50 p-4 sm:border-l sm:border-t-0 sm:px-6">
                  <Button asChild size="sm" variant="secondary" className="w-full sm:w-auto">
                    <Link 
                      to={`/field/equipment/${item.id}`}
                      state={{ startDate, endDate }}
                    >
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
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
