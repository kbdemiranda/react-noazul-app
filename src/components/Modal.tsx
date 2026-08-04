import { type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  maxWidthClassName?: string
}

export function Modal({ title, onClose, children, maxWidthClassName = 'max-w-md' }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/28 px-4 backdrop-blur-sm">
      <div className={`glass-surface w-full ${maxWidthClassName} rounded-2xl bg-surface/85 p-6 shadow-lg`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-ink/50 hover:bg-ink/[.06] hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
