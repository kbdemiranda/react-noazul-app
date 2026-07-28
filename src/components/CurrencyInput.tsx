import { type ChangeEvent } from 'react'
import type { Currency } from '../types/domain'

/**
 * BRL uses the Brazilian convention (comma decimal, period thousands); every
 * other currency here uses the opposite (period decimal, comma thousands) —
 * not full per-currency locale formatting, just the two conventions the
 * product cares about distinguishing.
 */
function separatorsFor(currency: Currency): { decimal: string; thousands: string } {
  return currency === 'BRL' ? { decimal: ',', thousands: '.' } : { decimal: '.', thousands: ',' }
}

function formatCents(cents: number, currency: Currency): string {
  const { decimal, thousands } = separatorsFor(currency)
  const negative = cents < 0
  const digits = String(Math.abs(cents)).padStart(3, '0')
  const intPart = digits.slice(0, -2)
  const decPart = digits.slice(-2)
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands)
  return `${negative ? '-' : ''}${grouped}${decimal}${decPart}`
}

interface CurrencyInputProps {
  id?: string
  currency: Currency
  value: number
  onChange: (value: number) => void
  className?: string
}

/**
 * A money input that masks digits in as cents from the right (typing "1234"
 * shows "12,34") instead of a plain type="number" field — no spinner, and the
 * decimal/thousands separators match the selected currency
 * ({@link separatorsFor}).
 */
export function CurrencyInput({ id, currency, value, onChange, className = '' }: CurrencyInputProps) {
  const cents = Math.round(value * 100)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const digitsOnly = event.target.value.replace(/\D/g, '')
    const nextCents = digitsOnly === '' ? 0 : parseInt(digitsOnly, 10)
    onChange(nextCents / 100)
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={formatCents(cents, currency)}
      onChange={handleChange}
      className={className}
    />
  )
}
