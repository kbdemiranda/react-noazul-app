import { useMemo, useState } from 'react'
import type { BankImportLine } from '../../api/bankImports'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { PickerField, type PickerOption } from '../../components/PickerField'
import { CategoryIconBadge } from '../../lib/categoryIcons'
import { formatCurrency, formatDate } from '../../lib/format'
import type { Category } from '../../types/domain'

export interface ReviewLine extends BankImportLine {
  included: boolean
}

interface BankImportReviewTableProps {
  lines: ReviewLine[]
  categories: Category[]
  currency: string
  onChange: (lines: ReviewLine[]) => void
}

export function BankImportReviewTable({ lines, categories, currency, onChange }: BankImportReviewTableProps) {
  const [bulkCategoryUuid, setBulkCategoryUuid] = useState('')

  const allIncluded = lines.length > 0 && lines.every((line) => line.included)
  const someIncluded = lines.some((line) => line.included)

  const categoryOptionsByType = useMemo(() => {
    const byType = new Map<'INCOME' | 'EXPENSE', PickerOption[]>()
    for (const type of ['INCOME', 'EXPENSE'] as const) {
      byType.set(
        type,
        categories
          .filter((category) => category.type === type)
          .map((category) => ({
            value: category.uuid,
            label: category.name,
            leading: <CategoryIconBadge name={category.name} type={category.type} size="sm" />,
          })),
      )
    }
    return byType
  }, [categories])

  function updateLine(index: number, patch: Partial<ReviewLine>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  function toggleAll(included: boolean) {
    onChange(lines.map((line) => ({ ...line, included })))
  }

  function applyBulkCategory() {
    if (!bulkCategoryUuid) return
    // A category is always INCOME- or EXPENSE-typed, and Transaction.type must match
    // category.type — only stamp rows whose own type agrees, so bulk-applying a category
    // while both income and expense rows are selected can't produce a mismatched pair that
    // the backend would reject (and roll back the whole commit for).
    const bulkCategory = categories.find((category) => category.uuid === bulkCategoryUuid)
    if (!bulkCategory) return
    onChange(
      lines.map((line) => (line.included && line.type === bulkCategory.type ? { ...line, categoryUuid: bulkCategoryUuid } : line)),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-surface p-3">
        <label className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <input
            type="checkbox"
            checked={allIncluded}
            onChange={(event) => toggleAll(event.target.checked)}
            className="h-4 w-4 rounded"
          />
          Selecionar todos
        </label>
        <div className="min-w-[200px] flex-1">
          <PickerField
            label=""
            placeholder="Categoria em massa..."
            options={[...(categoryOptionsByType.get('INCOME') ?? []), ...(categoryOptionsByType.get('EXPENSE') ?? [])]}
            value={bulkCategoryUuid || undefined}
            onChange={setBulkCategoryUuid}
          />
        </div>
        <Button type="button" variant="secondary" disabled={!someIncluded || !bulkCategoryUuid} onClick={applyBulkCategory}>
          Aplicar aos selecionados
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {lines.map((line, index) => {
          const options = categoryOptionsByType.get(line.type) ?? []
          return (
            <div
              key={`${line.externalRef}-${index}`}
              className={`flex flex-col gap-2.5 rounded-2xl border p-3 sm:flex-row sm:items-center ${
                line.likelyDuplicate ? 'border-alert-vivid/40 bg-alert-vivid/8' : 'border-divider bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={line.included}
                onChange={(event) => updateLine(index, { included: event.target.checked })}
                className="h-4 w-4 flex-none rounded"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13.5px] font-medium text-ink">{line.description}</p>
                  {line.likelyDuplicate && <Badge variant="outline">Possível duplicata</Badge>}
                </div>
                <p className="text-[11.5px] text-ink/55">{formatDate(line.date)}</p>
              </div>
              <p
                className={`w-28 flex-none font-data text-sm font-semibold tabular-nums ${
                  line.type === 'EXPENSE' ? 'text-expense' : 'text-income'
                }`}
              >
                {line.type === 'EXPENSE' ? '-' : '+'}
                {formatCurrency(line.amount, currency)}
              </p>
              <div className="w-full sm:w-56">
                <PickerField
                  label=""
                  placeholder="Categoria..."
                  options={options}
                  value={line.categoryUuid || undefined}
                  onChange={(value) => updateLine(index, { categoryUuid: value })}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
