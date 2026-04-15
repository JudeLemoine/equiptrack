import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { TextField } from '@mui/material'
import EquipmentGroupGrid from '../../equipment/components/EquipmentGroupGrid'
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

  const equipmentQuery = useQuery({
    queryKey: ['equipment', 'field', { search, status, category, location, startDate, endDate }],
    queryFn: () => listEquipment({ search, status, category, location, startDate, endDate }),
    placeholderData: keepPreviousData,
  })

  const categories = useMemo(() => {
    const set = new Set((equipmentQuery.data ?? []).map((i) => i.category))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [equipmentQuery.data])

  return (
    <div className="space-y-6">
      <Button className="mb-4" onClick={() => navigate(-1)} size="sm" variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <PageHeader
        subtitle="Search inventory and tap a tile to see available units"
        title="Equipment Search"
      />

      {/* Filters */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="space-y-2">
          <Label htmlFor="equipmentSearch">Search</Label>
          <Input
            id="equipmentSearch"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment…"
            value={search}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="locationFilter">Location</Label>
          <Input
            id="locationFilter"
            onChange={(e) => setLocation(e.target.value)}
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
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px', backgroundColor: 'white' } }}
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
            onChange={(e) => setEndDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { height: '40px', borderRadius: '8px', backgroundColor: 'white' } }}
          />
        </div>

        <div className="space-y-2 md:col-span-3 lg:col-span-2">
          <Label>Status</Label>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'available', 'in_use', 'maintenance'] as const).map((val) => {
              const label =
                val === 'all' ? 'All statuses'
                : val === 'in_use' ? 'In Use'
                : val.charAt(0).toUpperCase() + val.slice(1)
              return (
                <button
                  key={val}
                  onClick={() => setStatus(val)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    status === val
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="space-y-2 md:col-span-3 lg:col-span-6">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategory('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  category === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    category === c
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Equipment grid */}
      {equipmentQuery.isLoading ? (
        <Loader label="Searching equipment…" />
      ) : equipmentQuery.isError ? (
        <ErrorState
          error={equipmentQuery.error}
          onRetry={() => equipmentQuery.refetch()}
          title="Could not load equipment"
        />
      ) : (
        <EquipmentGroupGrid
          equipment={equipmentQuery.data ?? []}
          getDetailPath={(item) => `/field/equipment/${item.id}`}
          getDetailState={() => ({ startDate, endDate })}
        />
      )}
    </div>
  )
}
