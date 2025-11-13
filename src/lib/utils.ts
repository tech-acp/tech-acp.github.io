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
