import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  isLoading?: boolean
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-linear-to-br from-brand-500 to-brand-400 text-white shadow-brand hover:brightness-105 disabled:from-brand-300 disabled:to-brand-300 disabled:shadow-none',
  secondary: 'bg-black/[.06] text-ink hover:bg-black/[.1] disabled:text-ink/40',
  danger: 'bg-expense-vivid text-white hover:brightness-95 disabled:bg-expense-vivid/40',
  ghost: 'bg-transparent text-brand-500 hover:bg-brand-100 disabled:text-brand-300',
}

export function Button({ variant = 'primary', isLoading, className = '', disabled, children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 font-heading text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? 'Aguarde...' : children}
    </button>
  )
}
