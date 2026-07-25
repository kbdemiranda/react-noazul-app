import { type ReactNode } from 'react'

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-expense">{error}</span>}
    </div>
  )
}

export const inputClass =
  'h-11 rounded-2xl border-none bg-surface px-3.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500'
