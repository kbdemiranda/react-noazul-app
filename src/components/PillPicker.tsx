import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { PickerOption } from './PickerField'

interface PillPickerProps {
  label: string
  options: PickerOption[]
  value?: string
  onChange: (value: string) => void
  isActive?: boolean
  searchable?: boolean
}

export function PillPicker({ label, options, value, onChange, isActive = false, searchable = true }: PillPickerProps) {
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

  const filtered = query
    ? options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
    : options

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open)
          setQuery('')
        }}
        className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
          isActive
            ? 'border-brand-300 bg-brand-100 text-brand-700'
            : 'border-ink/[.06] bg-surface/70 text-ink/70 backdrop-blur-sm hover:text-ink'
        }`}
      >
        {label}
        <ChevronDown size={13} className={`flex-none text-current/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="glass-surface absolute top-full left-0 z-30 mt-1.5 w-52 rounded-2xl bg-surface/95 p-1.5 shadow-lg">
          {searchable && (
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar..."
              className="mb-1 h-8 w-full rounded-xl bg-ink/[.05] px-3 text-sm text-ink outline-none"
            />
          )}
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
                  <span className="min-w-0 flex-1 truncate font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
