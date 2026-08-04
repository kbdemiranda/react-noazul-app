import { Check, ChevronDown } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

export interface PickerOption {
  value: string
  label: string
  sublabel?: string
  leading: ReactNode
}

interface PickerFieldProps {
  label: string
  placeholder: string
  options: PickerOption[]
  value?: string
  onChange: (value: string) => void
  error?: string
}

export function PickerField({ label, placeholder, options, value, onChange, error }: PickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const selected = options.find((option) => option.value === value)
  const filtered = query
    ? options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
    : options

  return (
    <div ref={containerRef} className="relative flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open)
          setQuery('')
        }}
        className={`flex h-11 w-full items-center gap-2 rounded-2xl bg-surface px-3.5 text-left text-sm outline-none focus:ring-2 focus:ring-brand-500 ${selected ? 'text-ink' : 'text-ink/45'}`}
      >
        {selected?.leading}
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown size={14} className="flex-none text-ink/45" />
      </button>

      {isOpen && (
        <div className="glass-surface absolute top-full z-10 mt-1.5 w-full min-w-[220px] rounded-2xl bg-surface/95 p-1.5 shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar..."
            className="mb-1 h-8 w-full rounded-xl bg-ink/[.05] px-3 text-sm text-ink outline-none"
          />
          <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto">
            {filtered.length === 0 && <p className="px-2 py-2 text-xs text-ink/50">Nenhum resultado.</p>}
            {filtered.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm ${isSelected ? 'bg-brand-100 text-brand-700' : 'text-ink hover:bg-ink/[.05]'}`}
                >
                  {option.leading}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{option.label}</span>
                    {option.sublabel && <span className="block truncate text-[11px] text-ink/55">{option.sublabel}</span>}
                  </span>
                  {isSelected && <Check size={14} className="flex-none text-brand-600" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {error && <span className="text-xs text-expense">{error}</span>}
    </div>
  )
}
