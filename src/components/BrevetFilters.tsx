import { BrevetFilters as BrevetFiltersType, getDistanceColor } from '../types/brevet'
import { CustomDatePicker } from './CustomDatePicker'
import { useIsMobile } from '../hooks/useMediaQuery'
import { X } from 'lucide-react'

interface BrevetFiltersProps {
  filters: BrevetFiltersType
  onFiltersChange: (filters: BrevetFiltersType) => void
  distanceCounts?: Record<number, number>
  isOpen?: boolean
  onToggle?: () => void
}

const AVAILABLE_DISTANCES = [200, 300, 400, 600, 1000]

export function BrevetFilters({ filters, onFiltersChange, distanceCounts = {}, isOpen = true, onToggle }: BrevetFiltersProps) {
  const isMobile = useIsMobile()

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

  // Sur mobile, ne rien afficher si les filtres sont fermés
  if (isMobile && !isOpen) {
    return null
  }

  return (
      <div
        className={`
          absolute bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200
          transition-all duration-300
          ${isMobile ? 'top-2 left-2 right-2 z-10' : 'top-4 left-4 z-10'}
          ${isMobile && isOpen ? 'translate-y-0 opacity-100' : ''}
          max-w-[calc(100vw-1rem)] md:max-w-none
        `}
      >
        <div className="px-2 py-2 md:px-4 flex flex-col gap-2 md:gap-3 relative">
          {/* Bouton de fermeture (mobile uniquement) */}
          {isMobile && onToggle && (
            <button
              onClick={onToggle}
              className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded transition-colors z-10"
              aria-label="Fermer les filtres"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          )}

          {/* Distance Buttons with Badges */}
          <div className="flex items-center justify-center gap-1 md:gap-2 flex-wrap">
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
                    px-2 md:px-3 py-1 md:py-1.5 rounded text-xs md:text-sm font-semibold
                    flex items-center gap-1.5 md:gap-2 whitespace-nowrap
                    transition-all duration-200
                    hover:opacity-90 flex-shrink-0
                  `}
                >
                  <span className="font-semibold">{distance}km</span>
                  <span
                    className="px-1 md:px-1.5 py-0.5 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: '#8B3A3A' }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Date Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label className="text-xs md:text-sm text-slate-600 font-medium whitespace-nowrap">Du</label>
                <CustomDatePicker
                  value={filters.dateStart}
                  onChange={handleDateStartChange}
                  placeholder="Date début"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs md:text-sm text-slate-600 font-medium whitespace-nowrap">Au</label>
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
              }}
              className="px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 hover:opacity-90 whitespace-nowrap"
            >
              Éligible R10000
            </button>
          </div>
        </div>
      </div>
  )
}

