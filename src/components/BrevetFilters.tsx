import { BrevetFilters as BrevetFiltersType } from '../types/brevet'
import { DateRangePicker } from './CustomDatePicker'
import { toIso } from '../lib/utils'
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

type Range = { start: string; end: string }

// 30 jours à partir d'aujourd'hui inclus
function getNext30Days(): Range {
  const today = new Date()
  return { start: toIso(today)!, end: toIso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 29))! }
}

// Samedi + dimanche à venir ; le dimanche, seulement aujourd'hui (la veille est passée)
function getWeekend(): Range {
  const today = new Date()
  const day = today.getDay() // 0 = dimanche
  if (day === 0) {
    const iso = toIso(today)!
    return { start: iso, end: iso }
  }
  const saturday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - day))
  const sunday = new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate() + 1)
  return { start: toIso(saturday)!, end: toIso(sunday)! }
}

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
}

function Switch({ checked, onChange, label, hint }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 min-h-[36px] text-left rounded-md px-1 -mx-1
                 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5077]/40"
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200
                    ${checked ? 'bg-[#2E5077]' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200
                      ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </span>
    </button>
  )
}

export function BrevetFilters({ filters, onFiltersChange, distanceCounts = {}, isOpen = true, onToggle }: BrevetFiltersProps) {
  const isMobile = useIsMobile()

  const update = (changes: Partial<BrevetFiltersType>) => onFiltersChange({ ...filters, ...changes })

  // Raccourcis de dates : chacun sélectionne sa période, un second clic la retire
  const isRange = (range: Range) => filters.dateStart === range.start && (filters.dateEnd ?? filters.dateStart) === range.end
  const toggleRange = (range: Range) =>
    update(isRange(range) ? { dateStart: null, dateEnd: null } : { dateStart: range.start, dateEnd: range.end })
  const presets = [
    { label: 'Ce week-end', range: getWeekend() },
    { label: '30 prochains jours', range: getNext30Days() }
  ]

  const toggleDistance = (distance: number) => {
    update({
      distances: filters.distances.includes(distance)
        ? filters.distances.filter(d => d !== distance)
        : [...filters.distances, distance]
    })
  }

  // Filtres masqués : seul le bouton d'ouverture (dans App) reste visible
  if (!isOpen) {
    return null
  }

  return (
    <div
      className={`
        ui-fade-down absolute z-10 bg-white/75 backdrop-blur-md backdrop-saturate-150 rounded-xl shadow-lg border border-white/60
        ${isMobile ? 'top-2 left-2 right-2' : 'top-4 left-4 w-[460px]'}
      `}
    >
      <div className="p-3 md:p-4 flex flex-col gap-3 relative">
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute top-1 right-1 p-2.5 rounded-lg text-slate-500 hover:bg-slate-900/5 hover:text-slate-900 transition-colors cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5077]/40"
            aria-label="Masquer les filtres"
            title="Masquer les filtres"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}

        {/* Distances */}
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Distance</legend>
          <div className="flex flex-wrap gap-1.5 pr-10">
            {AVAILABLE_DISTANCES.map(distance => {
              const isActive = filters.distances.includes(distance)
              const count = distanceCounts[distance] || 0
              return (
                <button
                  key={distance}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => toggleDistance(distance)}
                  className={`
                    min-h-[36px] px-2.5 py-1 rounded-lg text-sm font-semibold border
                    flex items-center gap-1.5 whitespace-nowrap transition-[color,background-color,border-color,transform] duration-150 cursor-pointer active:scale-[0.96]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5077]/40
                    ${isActive
                      ? 'bg-[#2E5077] border-[#2E5077] text-white'
                      : 'bg-white/70 border-slate-200/80 text-slate-600 hover:border-[#2E5077]/50'}
                  `}
                >
                  {distance} km
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-bold tabular-nums
                      ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* Dates : un clic = un jour, deux clics = une période */}
        <fieldset className="flex flex-col">
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Dates</legend>
          <DateRangePicker
            start={filters.dateStart}
            end={filters.dateEnd}
            onChange={(dateStart, dateEnd) => update({ dateStart, dateEnd })}
            placeholder="Tous les brevets à venir"
            footer={close => (
              <>
                <div className="flex gap-2">
                  {presets.map(({ label, range }) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={isRange(range)}
                      onClick={() => { toggleRange(range); close() }}
                      className={`
                        flex-1 min-h-[36px] px-2 rounded-lg text-sm font-semibold border whitespace-nowrap
                        transition-[color,background-color,border-color,transform] duration-150 cursor-pointer active:scale-[0.96]
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5077]/40
                        ${isRange(range)
                          ? 'bg-[#2E5077] border-[#2E5077] text-white'
                          : 'bg-white border-slate-200 text-[#2E5077] hover:border-[#2E5077]/50'}
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          />
          <p className="text-xs text-slate-500 mt-1">Un jour, deux dates pour une période, ou un raccourci</p>
        </fieldset>

        <div className="border-t border-slate-100 pt-2">
          <Switch
            checked={filters.eligibleR10000}
            onChange={eligibleR10000 => update({ eligibleR10000 })}
            label="Éligibles R10000"
          />
        </div>
      </div>
    </div>
  )
}
