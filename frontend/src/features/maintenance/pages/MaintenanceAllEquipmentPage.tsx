import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import ErrorState from '../../../components/ErrorState'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
import { Input } from '../../../components/ui/input'
import EquipmentGroupGrid from '../../equipment/components/EquipmentGroupGrid'
import { listEquipment } from '../../../services/equipmentService'
import type { EquipmentStatus } from '../../../types/equipment'

const STATUS_OPTIONS: Array<{ label: string; value: EquipmentStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'In Use', value: 'in_use' },
  { label: 'Maintenance', value: 'maintenance' },
]

export default function MaintenanceAllEquipmentPage() {
  const location = useLocation()
  const locationState = location.state as { statusFilter?: EquipmentStatus | 'all' } | null

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EquipmentStatus | 'all'>(
    locationState?.statusFilter ?? 'all'
  )
  const [category, setCategory] = useState('all')

  const equipmentQuery = useQuery({
    queryKey: ['equipment', 'maintenance-browse', { search, status }],
    queryFn: () => listEquipment({ search, status }),
    placeholderData: keepPreviousData,
  })

  const categories = useMemo(() => {
    const set = new Set((equipmentQuery.data ?? []).map((i) => i.category))
    return Array.from(set).sort()
  }, [equipmentQuery.data])

  // Category filter is client-side (same as before)
  const filtered = useMemo(() => {
    if (category === 'all') return equipmentQuery.data ?? []
    return (equipmentQuery.data ?? []).filter((i) => i.category === category)
  }, [equipmentQuery.data, category])

  if (equipmentQuery.isLoading) return <Loader label="Loading equipment…" />
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
      <PageHeader title="All Equipment" subtitle="Browse and inspect the full fleet" />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
        {/* Search */}
        <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Search</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              className="pl-8"
              placeholder="Search by name or asset tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</span>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setStatus(o.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  status === o.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div className="flex flex-col gap-1.5 w-full">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</span>
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

      {/* Grouped tile grid */}
      <EquipmentGroupGrid
        equipment={filtered}
        getDetailPath={(item) => `/maintenance/equipment/${item.id}`}
      />
    </div>
  )
}
