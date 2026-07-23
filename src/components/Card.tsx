import { type ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass-surface rounded-2xl p-5 shadow-sm ${className}`}>{children}</div>
  )
}

export function CardKicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-[10px] font-semibold tracking-[0.1em] text-brand-700 uppercase ${className}`}>
      {children}
    </span>
  )
}
