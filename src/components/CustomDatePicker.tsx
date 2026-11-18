import { forwardRef, ReactNode, useRef } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { fr } from 'date-fns/locale/fr'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import './CustomDatePicker.css'
import { toIso } from '../lib/utils'

registerLocale('fr', fr)

interface DateRangePickerProps {
  start: string | null
  end: string | null
  // Un seul jour : end = null. Rien de sélectionné : start = end = null
  onChange: (start: string | null, end: string | null) => void
  placeholder?: string
  // Contenu affiché sous le calendrier (raccourcis) ; reçoit de quoi refermer le calendrier
  footer?: (close: () => void) => ReactNode
}

interface CustomInputProps {
  label: string
  isEmpty: boolean
  onClick?: () => void
}

// YYYY-MM-DD -> Date en heure locale (new Date('YYYY-MM-DD') serait en UTC)
const toDate = (iso: string | null) => {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const formatDay = (date: Date) =>
  date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

// Libellé court : « 21–22 nov. 2026 », « 21 nov. → 3 déc. 2026 », sinon dates complètes
const formatRange = (start: Date, end: Date) => {
  if (start.getFullYear() !== end.getFullYear()) return `${formatDay(start)} → ${formatDay(end)}`
  if (start.getMonth() !== end.getMonth()) {
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → ${formatDay(end)}`
  }
  return `${start.getDate()}–${formatDay(end)}`
}

const CustomInput = forwardRef<HTMLButtonElement, CustomInputProps>(
  ({ label, isEmpty, onClick }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="w-full min-h-[40px] pl-3 pr-9 py-2 border border-slate-200/80 rounded-xl text-sm bg-white/70
                 flex items-center gap-2 shadow-sm cursor-pointer transition-colors duration-150
                 hover:border-[#2E5077]/50
                 focus-visible:outline-none focus-visible:border-[#2E5077] focus-visible:ring-2 focus-visible:ring-[#2E5077]/30"
    >
      <Calendar className="w-4 h-4 text-[#2E5077] flex-shrink-0" aria-hidden="true" />
      <span className={`truncate ${isEmpty ? 'text-slate-500' : 'text-slate-800 font-semibold'}`}>{label}</span>
    </button>
  )
)

CustomInput.displayName = 'CustomInput'

export function DateRangePicker({ start, end, onChange, placeholder = 'Toutes les dates', footer }: DateRangePickerProps) {
  const pickerRef = useRef<DatePicker>(null)
  const startDate = toDate(start)
  const endDate = toDate(end)

  const label = !startDate
    ? placeholder
    : !endDate || endDate.getTime() === startDate.getTime()
      ? formatDay(startDate)
      : formatRange(startDate, endDate)

  return (
    <DatePicker
      ref={pickerRef}
      selectsRange
      startDate={startDate}
      endDate={endDate}
      onChange={([s, e]) => onChange(toIso(s), toIso(e))}
      locale="fr"
      customInput={<CustomInput label={label} isEmpty={!startDate} />}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      calendarStartDay={1}
      isClearable
      clearButtonTitle="Effacer les dates"
      ariaLabelClose="Effacer les dates"
      wrapperClassName="w-full"
    >
      {footer && (
        <div className="border-t border-slate-100 p-3 flex flex-col gap-2 bg-white">
          {footer(() => pickerRef.current?.setOpen(false))}
        </div>
      )}
    </DatePicker>
  )
}
