import { AlertCircle } from 'lucide-react'
import { ApiError } from '../api/client'

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Algo deu errado. Tente novamente.'
}

export function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-expense-vivid/40 bg-expense-vivid/12 px-3.5 py-2.5 text-sm text-expense">
      <AlertCircle size={16} className="mt-0.5 flex-none" />
      <span>{errorMessage(error)}</span>
    </div>
  )
}
