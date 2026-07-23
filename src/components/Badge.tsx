import { type ReactNode } from 'react'

type BadgeVariant = 'neutral' | 'outline' | 'income' | 'expense'

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-black/[.05] text-ink/70',
  outline: 'border border-brand-500 text-brand-500',
  income: 'bg-income-vivid/12 text-income',
  expense: 'bg-expense-vivid/12 text-expense',
}

export function Badge({
  variant = 'neutral',
  children,
  className = '',
}: {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
