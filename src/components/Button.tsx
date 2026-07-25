import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  isLoading?: boolean
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand-500 font-bold text-white hover:brightness-95 disabled:bg-brand-300',
  secondary:
    'border border-divider bg-white font-semibold text-ink hover:bg-black/[.03] disabled:text-ink/40',
  danger: 'bg-expense font-bold text-white hover:brightness-95 disabled:bg-expense/40',
  ghost: 'bg-transparent font-semibold text-brand-500 hover:bg-brand-100 disabled:text-brand-300',
}

export function Button({ variant = 'primary', isLoading, className = '', disabled, children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4.5 py-2.5 font-body text-sm transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? 'Aguarde...' : children}
    </button>
  )
}
