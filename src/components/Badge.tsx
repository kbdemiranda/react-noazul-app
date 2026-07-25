import { type ReactNode } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

type BadgeVariant = 'neutral' | 'outline' | 'income' | 'expense'

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-black/[.05] text-ink/70',
  outline: 'border border-brand-500 text-brand-500',
  income: 'bg-income-vivid/12 text-income',
  expense: 'bg-expense-vivid/12 text-expense',
}

const variantIcon: Partial<Record<BadgeVariant, typeof ArrowUpRight>> = {
  income: ArrowUpRight,
  expense: ArrowDownRight,
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
  const Icon = variantIcon[variant]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${variantClasses[variant]} ${className}`}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  )
}
