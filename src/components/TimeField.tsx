import { Clock, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

interface TimeFieldProps {
  label: string
  hint?: string
  value?: string
  onChange: (value: string | undefined) => void
  error?: string
}

export function TimeField({ label, hint, value, onChange, error }: TimeFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState(value ?? '')
  const containerRef = useRef<HTMLDivElement>(null)
  const [hour, minute] = value ? value.split(':') : [undefined, undefined]

  useEffect(() => {
    setText(value ?? '')
  }, [value])

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function handleTextChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4)
    setText(digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits)
    if (digits.length === 4) {
      const h = Math.min(23, Number(digits.slice(0, 2)))
      const m = Math.min(59, Number(digits.slice(2, 4)))
      onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    } else {
      onChange(undefined)
    }
  }

  return (
    <div ref={containerRef} className="relative flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink">
        {label}
        {hint && <span className="ml-1 text-[12.5px] font-normal text-ink/55">{hint}</span>}
      </span>
      <div className="flex h-11 w-full items-center gap-2 rounded-2xl bg-surface px-3.5 focus-within:ring-2 focus-within:ring-brand-500">
        <Clock size={14} className="flex-none text-ink/45" />
        <input
          value={text}
          onChange={(event) => handleTextChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          inputMode="numeric"
          placeholder="--:--"
          className="min-w-0 flex-1 bg-transparent font-data text-sm text-ink outline-none placeholder:text-ink/45"
        />
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="flex-none text-ink/45"
          aria-label="Abrir seletor de hora"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {isOpen && (
        <div className="glass-surface absolute top-full z-10 mt-1.5 w-full min-w-[150px] rounded-2xl bg-surface/95 p-2 shadow-lg">
          <div className="flex gap-1.5">
            <div className="flex max-h-40 flex-1 flex-col gap-0.5 overflow-y-auto">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onChange(`${h}:${minute ?? '00'}`)}
                  className={`rounded-lg py-1 text-center font-data text-sm ${
                    h === hour ? 'bg-brand-100 font-semibold text-brand-700' : 'text-ink hover:bg-ink/[.05]'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="flex max-h-40 flex-1 flex-col gap-0.5 overflow-y-auto">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange(`${hour ?? '00'}:${m}`)}
                  className={`rounded-lg py-1 text-center font-data text-sm ${
                    m === minute ? 'bg-brand-100 font-semibold text-brand-700' : 'text-ink hover:bg-ink/[.05]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-divider pt-1.5">
            <button
              type="button"
              onClick={() => {
                onChange(undefined)
                setIsOpen(false)
              }}
              className="px-1 text-xs font-semibold text-ink/50 hover:text-ink"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date()
                onChange(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
                setIsOpen(false)
              }}
              className="px-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Agora
            </button>
          </div>
        </div>
      )}
      {error && <span className="text-xs text-expense">{error}</span>}
    </div>
  )
}
