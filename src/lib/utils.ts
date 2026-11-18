import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isBrevetPast(dateString: string): boolean {
  const brevetDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return brevetDate < today
}

// Date -> YYYY-MM-DD en heure locale (toISOString serait en UTC)
export const toIso = (date: Date | null) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : null
