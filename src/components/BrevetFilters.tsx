import { BrevetFilters as BrevetFiltersType, getDistanceColor } from '../types/brevet'
import { CustomDatePicker } from './CustomDatePicker'

interface BrevetFiltersProps {
  filters: BrevetFiltersType
  onFiltersChange: (filters: BrevetFiltersType) => void
  distanceCounts?: Record<number, number>
}

const AVAILABLE_DISTANCES = [200, 300, 400, 600, 1000]

export function BrevetFilters({ filters, onFiltersChange, distanceCounts = {} }: BrevetFiltersProps) {
  const toggleDistance = (distance: number) => {
    const newDistances = filters.distances.includes(distance)
      ? filters.distances.filter(d => d !== distance)
      : [...filters.distances, distance]
    
    onFiltersChange({
      ...filters,
      distances: newDistances
    })
  }

  const handleDateStartChange = (date: string | null) => {
    onFiltersChange({
      ...filters,
      dateStart: date
    })
  }

  const handleDateEndChange = (date: string | null) => {
    onFiltersChange({
      ...filters,
      dateEnd: date
    })
  }

  return (
    <div className="absolute top-4 left-4 bg-white/50 backdrop-blur-sm rounded-lg shadow-md border border-slate-200 z-10">
      <div className="px-4 py-2 flex flex-col gap-3">
        {/* Distance Buttons with Badges */}
        <div className="flex items-center gap-2">
          {AVAILABLE_DISTANCES.map(distance => {
            const isActive = filters.distances.includes(distance)
            const count = distanceCounts[distance] || 0
            return (
              <button
                key={distance}
                onClick={() => toggleDistance(distance)}
                style={{
                  backgroundColor: isActive ? '#2E5077' : 'white',
                  color: isActive ? 'white' : '#2E5077',
                  border: 'none',
                  outline: 'none'
                }}
                className={`
                  px-3 py-1.5 rounded text-sm font-semibold
                  flex items-center gap-2
                  transition-all duration-200
                  hover:opacity-90
                `}
              >
                <span className="font-semibold">{distance}km</span>
                <span
                  className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
                  style={{ backgroundColor: '#8B3A3A' }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Date Filters */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-sm text-slate-600 font-medium">Du</label>
              <CustomDatePicker
                value={filters.dateStart}
                onChange={handleDateStartChange}
                placeholder="Date début"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-sm text-slate-600 font-medium">Au</label>
              <CustomDatePicker
                value={filters.dateEnd}
                onChange={handleDateEndChange}
                placeholder="Date fin"
              />
            </div>
          </div>
          <button
            onClick={() => onFiltersChange({ ...filters, eligibleR10000: !filters.eligibleR10000 })}
            style={{
              backgroundColor: filters.eligibleR10000 ? '#2E5077' : 'white',
              color: filters.eligibleR10000 ? 'white' : '#2E5077',
              border: filters.eligibleR10000 ? 'none' : '2px solid #2E5077'
            }}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-90"
          >
            Éligible R10000
          </button>
        </div>
      </div>
    </div>
  )
}

