import { forwardRef } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { fr } from 'date-fns/locale/fr'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import './CustomDatePicker.css'

registerLocale('fr', fr)

interface CustomDatePickerProps {
  value: string | null
  onChange: (date: string | null) => void
  placeholder?: string
}

interface CustomInputProps {
  value?: string
  onClick?: () => void
}

const CustomInput = forwardRef<HTMLButtonElement, CustomInputProps>(
  ({ value, onClick }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="group relative px-4 py-2.5 border border-slate-200 rounded-xl text-sm
                 transition-all duration-300 ease-out
                 hover:border-acp-blue hover:shadow-lg hover:shadow-acp-blue/10 hover:-translate-y-0.5
                 focus:outline-none focus:border-acp-blue focus:ring-2 focus:ring-acp-blue/30
                 active:scale-[0.98] active:shadow-sm
                 bg-gradient-to-b from-white to-slate-50/50
                 flex items-center gap-2.5 min-w-[140px]
                 shadow-sm font-medium overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-acp-blue/0 via-acp-blue/5 to-acp-blue/0
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <Calendar className="w-4 h-4 text-acp-blue relative z-10
                           transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
      <span className={`relative z-10 transition-colors duration-200 ${
        value ? 'text-slate-800 font-semibold' : 'text-slate-400'
      }`}>
        {value || 'Sélectionner'}
      </span>
    </button>
  )
)

CustomInput.displayName = 'CustomInput'

export function CustomDatePicker({ value, onChange, placeholder }: CustomDatePickerProps) {
  const dateValue = value ? new Date(value) : null

  const handleChange = (date: Date | null) => {
    if (date) {
      // Convert to YYYY-MM-DD format
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}`)
    } else {
      onChange(null)
    }
  }

  return (
    <DatePicker
      selected={dateValue}
      onChange={handleChange}
      dateFormat="dd/MM/yyyy"
      locale="fr"
      customInput={<CustomInput />}
      placeholderText={placeholder}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      calendarStartDay={1}
    />
  )
}

