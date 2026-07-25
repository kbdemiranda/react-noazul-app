import { type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

export function WarningBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-alert-vivid/40 bg-alert-vivid/12 px-3.5 py-2.5 text-sm text-alert">
      <AlertTriangle size={16} className="mt-0.5 flex-none" />
      <span>{children}</span>
    </div>
  )
}
