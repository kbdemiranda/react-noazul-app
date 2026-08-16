import { type ReactNode, useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  maxWidthClassName?: string
}

export function Modal({ title, onClose, children, maxWidthClassName = 'max-w-md' }: ModalProps) {
  const [hasChanges, setHasChanges] = useState(false)
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (isConfirmingDiscard) {
        setIsConfirmingDiscard(false)
      } else if (hasChanges) {
        setIsConfirmingDiscard(true)
      } else {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hasChanges, isConfirmingDiscard, onClose])

  function requestClose() {
    if (hasChanges) {
      setIsConfirmingDiscard(true)
      return
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/28 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`glass-surface w-full ${maxWidthClassName} rounded-2xl bg-surface/85 p-6 shadow-lg`}
        onMouseDown={(event) => event.stopPropagation()}
        onInputCapture={() => setHasChanges(true)}
        onChangeCapture={() => setHasChanges(true)}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="font-heading text-xl font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-ink/50 hover:bg-ink/[.06] hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>

      {isConfirmingDiscard && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/36 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsConfirmingDiscard(false)
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="discard-changes-title"
            className="glass-surface w-full max-w-sm rounded-2xl bg-surface/95 p-5 shadow-lg"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="discard-changes-title" className="font-heading text-lg font-semibold text-ink">
              Descartar alterações?
            </h3>
            <p className="mt-2 text-sm text-ink/65">As informações preenchidas serão perdidas.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingDiscard(false)}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-ink/70 hover:bg-ink/[.06] hover:text-ink"
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-expense px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
