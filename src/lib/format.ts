import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCurrency(value: string | number): string {
  const numeric = typeof value === 'string' ? Number(value) : value
  return currencyFormatter.format(Number.isFinite(numeric) ? numeric : 0)
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export function formatTime(isoTime: string): string {
  return isoTime.slice(0, 5)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatFullDatePtBR(date: Date): string {
  const formatted = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatMonthYearPtBR(date: Date): string {
  const formatted = format(date, 'MMMM', { locale: ptBR })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatShortDatePtBR(date: Date): string {
  return format(date, 'dd/MM')
}
