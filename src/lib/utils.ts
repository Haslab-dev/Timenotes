import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(totalMinutes: any): string {
  const mins = Number(totalMinutes)
  if (isNaN(mins) || mins <= 0) return '0m'

  const totalHours = Math.floor(mins / 60)
  const remainingMinutes = mins % 60

  if (totalHours === 0) return `${remainingMinutes}m`

  if (totalHours < 24) {
    return `${totalHours}h` + (remainingMinutes > 0 ? ` ${remainingMinutes}m` : '')
  }

  const months = Math.floor(totalHours / (24 * 30))
  const daysAfterMonths = Math.floor((totalHours % (24 * 30)) / 24)
  const hoursAfterDays = totalHours % 24

  let result = ''
  if (months > 0) result += `${months}mo `
  if (daysAfterMonths > 0) result += `${daysAfterMonths}d `
  if (hoursAfterDays > 0 || result === '') result += `${hoursAfterDays}h`

  return result.trim()
}
