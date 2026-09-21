import { LoaderCircle, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  financialInstitutionsApi,
  type FinancialInstitution,
} from '../api/financialInstitutions'
import { inputClass } from './Field'

interface FinancialInstitutionAutocompleteProps {
  id: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  onSelect: (institution: FinancialInstitution) => void
}

/** Searches the catalogue by name and resolves a selected institution by its COMPE code. */
export function FinancialInstitutionAutocomplete({
  id,
  value,
  placeholder,
  onChange,
  onSelect,
}: FinancialInstitutionAutocompleteProps) {
  const [results, setResults] = useState<FinancialInstitution[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    const term = value.trim()
    if (term.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    const currentRequest = ++requestId.current
    const timer = window.setTimeout(async () => {
      setIsSearching(true)
      try {
        const institutions = await financialInstitutionsApi.search(term)
        if (currentRequest === requestId.current) setResults(institutions.slice(0, 8))
      } catch {
        if (currentRequest === requestId.current) setResults([])
      } finally {
        if (currentRequest === requestId.current) setIsSearching(false)
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [value])

  async function select(institution: FinancialInstitution) {
    setIsResolving(true)
    try {
      // Codes are not globally unique, so keep the record originally selected
      // whenever it is returned by the code lookup.
      const details = institution.code === null
        ? await financialInstitutionsApi.find(institution.id)
        : (await financialInstitutionsApi.findByCode(institution.code)).find((item) => item.id === institution.id) ?? institution
      onChange(details.name)
      onSelect(details)
      setResults([])
      setIsOpen(false)
    } catch {
      // The list response is still sufficient for choosing an institution if
      // the detail request momentarily fails.
      onChange(institution.name)
      onSelect(institution)
      setResults([])
      setIsOpen(false)
    } finally {
      setIsResolving(false)
    }
  }

  const showResults = isOpen && (isSearching || results.length > 0)

  return (
    <div className="relative min-w-0 flex-1">
      <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/45" />
      <input
        id={id}
        className={`${inputClass} w-full pl-10`}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showResults}
        aria-controls={`${id}-options`}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
        onChange={(event) => {
          onChange(event.target.value)
          setIsOpen(true)
        }}
      />
      {(isSearching || isResolving) && (
        <LoaderCircle aria-label="Buscando instituição" size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-ink/45" />
      )}
      {showResults && (
        <ul id={`${id}-options`} role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-ink/10 bg-raised p-1 shadow-lg">
          {isSearching && results.length === 0 && <li className="px-3 py-2 text-sm text-ink/60">Buscando instituições...</li>}
          {results.map((institution) => (
            <li key={institution.id} role="option" aria-selected={false}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-brand-100"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void select(institution)}
              >
                <InstitutionLogo institution={institution} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{institution.name}</span>
                  {institution.fullName && institution.fullName !== institution.name && (
                    <span className="block truncate text-xs text-ink/55">{institution.fullName}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function InstitutionLogo({ institution }: { institution: Pick<FinancialInstitution, 'name' | 'logoUrl'> }) {
  const [failed, setFailed] = useState(false)
  const initial = institution.name.trim().charAt(0).toUpperCase() || '?'

  if (institution.logoUrl && !failed) {
    return <img src={institution.logoUrl} alt="" className="h-8 w-8 flex-none rounded-full bg-white object-cover" onError={() => setFailed(true)} />
  }

  return <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">{initial}</span>
}
