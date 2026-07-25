import { addMonths, isAfter, setDate } from 'date-fns'
import type { CreditCard, Transaction } from '../types/domain'

/**
 * The open (not-yet-closed) invoice covers the window right after the last
 * closing date up to the next one. There's no backend concept of "invoice" —
 * this is a best-effort client-side estimate from the card's closing day and
 * its own expense transactions, same as the dashboard's other derived stats.
 */
export function currentInvoiceWindow(closingDay: number, referenceDate: Date): { periodStart: Date; periodEnd: Date } {
  const thisMonthClosing = setDate(referenceDate, closingDay)
  const periodEnd = isAfter(referenceDate, thisMonthClosing) ? addMonths(thisMonthClosing, 1) : thisMonthClosing
  const periodStart = addMonths(periodEnd, -1)
  return { periodStart, periodEnd }
}

export function currentInvoiceDueDate(closingDay: number, dueDay: number, referenceDate: Date): Date {
  const { periodEnd } = currentInvoiceWindow(closingDay, referenceDate)
  return setDate(periodEnd, dueDay)
}

export function computeCardInvoice(
  card: CreditCard,
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): { total: number; availableLimit: number; dueDate: Date } {
  const { periodStart, periodEnd } = currentInvoiceWindow(card.closingDay, referenceDate)
  const total = transactions
    .filter((t) => t.fromCreditCardUuid === card.uuid && t.type === 'EXPENSE')
    .filter((t) => {
      const date = new Date(`${t.date}T00:00:00`)
      return isAfter(date, periodStart) && !isAfter(date, periodEnd)
    })
    .reduce((sum, t) => sum + t.amount, 0)
  const dueDate = currentInvoiceDueDate(card.closingDay, card.dueDay, referenceDate)
  return { total, availableLimit: card.creditLimit - total, dueDate }
}
