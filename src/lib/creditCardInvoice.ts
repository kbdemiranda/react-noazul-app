import { addMonths, getDaysInMonth, isAfter, isValid, parseISO, setDate } from 'date-fns'

interface CreditCardInvoiceDatesInput {
  closingDay: number
  dueDay: number
  closingDate?: string
  dueDate?: string
}

function clampDay(month: Date, day: number): Date {
  const safeDay = Number.isFinite(day) ? Math.max(1, Math.trunc(day)) : 1
  return setDate(month, Math.min(safeDay, getDaysInMonth(month)))
}

function parseDate(value?: string): Date | null {
  if (!value) return null
  const date = parseISO(value)
  return isValid(date) ? date : null
}

/**
 * Older API responses do not contain the computed invoice dates. Derive the
 * same dates on the client until the backend response is updated.
 */
export function getCreditCardInvoiceDates(card: CreditCardInvoiceDatesInput, reference = new Date()) {
  const closingDate = parseDate(card.closingDate) ?? (() => {
    const thisMonth = clampDay(reference, card.closingDay)
    return isAfter(reference, thisMonth) ? clampDay(addMonths(reference, 1), card.closingDay) : thisMonth
  })()

  return {
    closingDate,
    dueDate: parseDate(card.dueDate) ?? clampDay(closingDate, card.dueDay),
  }
}
