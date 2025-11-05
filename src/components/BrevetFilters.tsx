import { useState } from 'react'
import { BrevetFilters as BrevetFiltersType } from '../types/brevet'

interface BrevetFiltersProps {
  filters: BrevetFiltersType
  onFiltersChange: (filters: BrevetFiltersType) => void
}

const AVAILABLE_DISTANCES = [200, 300, 400, 600, 1000]

export function BrevetFilters({ filters, onFiltersChange }: BrevetFiltersProps) {
  const [isOpen, setIsOpen] = useState(true)

  const toggleDistance = (distance: number) => {
    const newDistances = filters.distances.includes(distance)
      ? filters.distances.filter(d => d !== distance)
      : [...filters.distances, distance]
    
    onFiltersChange({
      ...filters,
      distances: newDistances
    })
  }

  const toggleAll = () => {
    const newDistances = filters.distances.length === AVAILABLE_DISTANCES.length
      ? []
      : AVAILABLE_DISTANCES
    
    onFiltersChange({
      ...filters,
      distances: newDistances
    })
  }

  const handleDateStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      dateStart: e.target.value || null
    })
  }

  const handleDateEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      dateEnd: e.target.value || null
    })
  }

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg z-10 w-80">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer border-b"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="font-semibold text-lg">Filtres</h2>
        <span className="text-xl">{isOpen ? '−' : '+'}</span>
      </div>
      
      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Distance Filters */}
          <div>
            <h3 className="font-medium mb-2">Distance (km)</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.distances.length === AVAILABLE_DISTANCES.length}
                  onChange={toggleAll}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">Toutes les distances</span>
              </label>
              
              {AVAILABLE_DISTANCES.map(distance => (
                <label key={distance} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.distances.includes(distance)}
                    onChange={() => toggleDistance(distance)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{distance} km</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Filters */}
          <div>
            <h3 className="font-medium mb-2">Période</h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Date de début</label>
                <input
                  type="date"
                  value={filters.dateStart || ''}
                  onChange={handleDateStartChange}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Date de fin</label>
                <input
                  type="date"
                  value={filters.dateEnd || ''}
                  onChange={handleDateEndChange}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

