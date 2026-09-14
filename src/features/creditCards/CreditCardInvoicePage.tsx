import { useQuery } from '@tanstack/react-query'
import { addDays, format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, ChevronLeft, ChevronRight, Layers, Receipt, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { categoriesApi } from '../../api/categories'
import { creditCardsApi } from '../../api/creditCards'
import { transactionsApi } from '../../api/transactions'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { type PickerOption } from '../../components/PickerField'
import { PillPicker } from '../../components/PillPicker'
import { BankLogo } from '../../lib/bankLogos'
import { CategoryIconBadge, categoryColor } from '../../lib/categoryIcons'
import { clampDay, getCreditCardInvoiceDates } from '../../lib/creditCardInvoice'
import { flowTone } from '../../lib/flow'
import { formatCurrency, formatDate } from '../../lib/format'
import { PayCreditCardInvoiceModal } from './PayCreditCardInvoiceModal'

type TypeFilter = 'ALL' | 'EXPENSE' | 'INCOME'

const typeOptions: PickerOption[] = [
  { value: 'ALL', label: 'Todas', leading: null },
  { value: 'EXPENSE', label: 'Compras', leading: null },
  { value: 'INCOME', label: 'Estornos', leading: null },
]

const ALL_CATEGORIES = ''

export function CreditCardInvoicePage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const [isPaying, setIsPaying] = useState(false)

  const [type, setType] = useState<TypeFilter>('ALL')
  const [descriptionInput, setDescriptionInput] = useState('')
  const [description, setDescription] = useState('')
  const [categoryUuid, setCategoryUuid] = useState(ALL_CATEGORIES)
  // 0 = the invoice's current, still-open cycle; 1 = one cycle back, etc.
  const [cycleOffset, setCycleOffset] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => setDescription(descriptionInput.trim()), 300)
    return () => clearTimeout(timeout)
  }, [descriptionInput])

  // Reset filters if the user navigates from one card's invoice straight to
  // another's (route param changes without unmounting this page).
  useEffect(() => {
    setType('ALL')
    setDescriptionInput('')
    setDescription('')
    setCategoryUuid(ALL_CATEGORIES)
    setCycleOffset(0)
  }, [uuid])

  const cardQuery = useQuery({
    queryKey: ['credit-cards', uuid],
    queryFn: () => creditCardsApi.find(uuid!),
    enabled: Boolean(uuid),
  })
  const card = cardQuery.data

  const invoicesQuery = useQuery({
    queryKey: ['credit-cards', uuid, 'invoices'],
    queryFn: () => creditCardsApi.listInvoices(uuid!),
    enabled: Boolean(uuid),
  })

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })

  // The filter bar's period pill browses past, closed cycles. Each cycle's
  // own "Valor da fatura" (below) is that cycle's own charges plus whatever
  // was still unpaid before it — so paying a past, overdue invoice settles
  // exactly that fatura (and anything before it), leaving later, still-open
  // cycles untouched. Paying the current cycle settles everything, since its
  // own total already includes every unpaid cycle before it.
  const period = useMemo(() => {
    if (!card) return null
    const { closingDate: currentClosingDate } = getCreditCardInvoiceDates(card)
    const closingDate =
      cycleOffset === 0 ? currentClosingDate : clampDay(subMonths(currentClosingDate, cycleOffset), card.closingDay)
    const previousClosingDate = clampDay(subMonths(closingDate, 1), card.closingDay)
    const dueDate = clampDay(closingDate, card.dueDay)
    const label = format(closingDate, 'MMMM yyyy', { locale: ptBR })
    return {
      closingDate,
      dueDate,
      dateFrom: format(addDays(previousClosingDate, 1), 'yyyy-MM-dd'),
      dateTo: format(closingDate, 'yyyy-MM-dd'),
      label: label.charAt(0).toUpperCase() + label.slice(1),
    }
  }, [card, cycleOffset])

  const transactionsQuery = useQuery({
    queryKey: ['transactions', 'invoice', uuid, type, categoryUuid, description, period],
    queryFn: () =>
      transactionsApi.list({
        creditCardUuids: [uuid!],
        type: type === 'ALL' ? undefined : type,
        categoryUuid: categoryUuid || undefined,
        description: description || undefined,
        dateFrom: period!.dateFrom,
        dateTo: period!.dateTo,
      }),
    enabled: Boolean(uuid && card && period),
  })
  const transactions = transactionsQuery.data ?? []

  // A historical period must read its own persisted ledger row. The card
  // response describes only the current cycle and cannot tell whether August,
  // for example, has already been paid.
  const invoice = useMemo(
    () => invoicesQuery.data?.find((candidate) => candidate.closingDate === period?.dateTo),
    [invoicesQuery.data, period?.dateTo],
  )
  const previousBalance = invoice?.previousBalance
  const cycleTotalDue = invoice?.outstandingAmount
  const invoiceTotal = invoice ? invoice.totalAmount + invoice.previousBalance : undefined
  const isPartiallyPaid = invoice?.status === 'PARTIALLY_PAID'

  const categoryOptions = useMemo<PickerOption[]>(
    () => [
      { value: ALL_CATEGORIES, label: 'Todas as categorias', leading: <Layers size={16} className="text-ink/45" /> },
      ...(categoriesQuery.data ?? []).map((category) => ({
        value: category.uuid,
        label: category.name,
        leading: <CategoryIconBadge name={category.name} type={category.type} size="sm" />,
      })),
    ],
    [categoriesQuery.data],
  )

  const categoryLabel = categoryOptions.find((option) => option.value === categoryUuid)?.label
  const typeLabel = typeOptions.find((option) => option.value === type)?.label

  const hasActiveFilters = type !== 'ALL' || categoryUuid !== ALL_CATEGORIES || description !== '' || cycleOffset !== 0

  if (cardQuery.isError) {
    return <ErrorBanner error={cardQuery.error} />
  }

  if (invoicesQuery.isError) {
    return <ErrorBanner error={invoicesQuery.error} />
  }

  if (cardQuery.isLoading || !card) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-24 animate-pulse rounded-2xl bg-ink/[.06]" />
        <div className="h-64 animate-pulse rounded-2xl bg-ink/[.06]" />
      </div>
    )
  }

  const { closingDate, dueDate } = period!

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/dashboard"
        className="flex w-fit items-center gap-1 text-[13px] font-medium text-ink/55 hover:text-ink"
      >
        <ChevronLeft size={14} />
        Visão geral
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <BankLogo name={card.issuer} size={40} />
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-xl font-semibold text-ink">Fatura {card.name}</h1>
          <p className="text-[13px] text-ink/60">
            {card.issuer} · Fecha dia {card.closingDay}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="flex flex-col gap-2">
          {previousBalance !== undefined ? (
            <SummaryRow label="Saldo anterior" value={formatCurrency(previousBalance)} valueClassName="text-expense" />
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold text-ink/55">Saldo anterior</span>
              <div className="h-3.5 w-16 animate-pulse rounded bg-ink/[.08]" />
            </div>
          )}
          <SummaryRow label="Referência" value={period!.label} />
          <SummaryRow label="Fechamento" value={format(closingDate, 'dd/MM/yyyy')} />
        </Card>
        <Card className="flex flex-col justify-center gap-1">
          <p className="text-[12px] font-semibold text-ink/55">Vencimento</p>
          <p className="font-data text-xl font-bold tabular-nums text-ink">{format(dueDate, 'dd/MM/yyyy')}</p>
        </Card>
        <Card className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold text-ink/55">Valor da fatura</p>
          {cycleTotalDue !== undefined && invoiceTotal !== undefined ? (
            <>
              {isPartiallyPaid ? (
                <>
                  <SummaryRow label="Total" value={formatCurrency(invoiceTotal)} />
                  <SummaryRow label="Pago" value={formatCurrency(invoice.paidAmount)} valueClassName="text-income" />
                  <SummaryRow label="Falta pagar" value={formatCurrency(cycleTotalDue)} valueClassName="text-expense" />
                </>
              ) : (
                <p className="font-data text-xl font-bold tabular-nums text-expense">{formatCurrency(cycleTotalDue)}</p>
              )}
            </>
          ) : (
            <div className="h-7 w-28 animate-pulse rounded bg-ink/[.08]" />
          )}
          <Button
            variant="success"
            className="w-full"
            disabled={!cycleTotalDue || cycleTotalDue <= 0}
            onClick={() => setIsPaying(true)}
          >
            {invoice?.status === 'PAID' || cycleTotalDue === 0
              ? 'Fatura paga'
              : isPartiallyPaid
                ? 'Pagar restante'
                : 'Pagar'}
          </Button>
        </Card>
      </div>

      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <div
            className={`flex h-9 w-36 items-center gap-1.5 rounded-full border px-3 backdrop-blur-sm transition-colors ${
              description ? 'border-brand-300 bg-brand-100' : 'border-ink/[.06] bg-surface/70'
            }`}
          >
            <Search size={13} className="flex-none text-ink/55" />
            <input
              value={descriptionInput}
              onChange={(event) => setDescriptionInput(event.target.value)}
              placeholder="Descrição"
              className="w-full min-w-0 bg-transparent text-[13px] text-ink placeholder:text-ink/55 outline-none"
            />
          </div>

          <PillPicker
            label={categoryLabel ?? 'Categoria'}
            options={categoryOptions}
            value={categoryUuid}
            onChange={setCategoryUuid}
            isActive={categoryUuid !== ALL_CATEGORIES}
          />

          <PillPicker
            label={typeLabel ?? 'Tipo'}
            options={typeOptions}
            value={type}
            onChange={(value) => setType(value as TypeFilter)}
            isActive={type !== 'ALL'}
            searchable={false}
          />
        </div>

        <div className="flex h-9 flex-none items-center gap-0.5 rounded-full border border-ink/[.06] bg-surface/70 px-1.5 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setCycleOffset((offset) => offset + 1)}
            className="grid h-6 w-6 flex-none place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/[.06] hover:text-ink"
            aria-label="Fatura anterior"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => setCycleOffset(0)}
            className="flex items-center gap-1 rounded-full px-1.5 text-[13px] font-semibold whitespace-nowrap text-ink transition-colors hover:bg-ink/[.06]"
            aria-label="Voltar para a fatura atual"
          >
            {period?.label}
            <ChevronDown size={12} className="flex-none text-ink/55" />
          </button>
          <button
            type="button"
            onClick={() => setCycleOffset((offset) => Math.max(0, offset - 1))}
            disabled={cycleOffset === 0}
            className="grid h-6 w-6 flex-none place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/[.06] hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Próxima fatura"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {transactionsQuery.isError && <ErrorBanner error={transactionsQuery.error} />}

      {transactionsQuery.isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-2xl bg-ink/[.06]" />
          ))}
        </div>
      )}

      {!transactionsQuery.isLoading && transactions.length === 0 && (
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <Receipt size={28} className="text-ink/35" />
          <p className="text-sm text-ink/60">
            {hasActiveFilters ? 'Nenhuma compra encontrada para esses filtros.' : 'Nenhuma compra nesta fatura ainda.'}
          </p>
        </Card>
      )}

      {transactions.length > 0 && (
        <div className="glass-surface hidden overflow-hidden rounded-2xl shadow-sm lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/[.08] text-left text-[11px] tracking-wide text-ink/60 uppercase">
                <th className="px-4 py-2.5 font-medium">Data</th>
                <th className="px-4 py-2.5 font-medium">Descrição</th>
                <th className="px-4 py-2.5 font-medium">Categoria</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const { text: categoryText, bg: categoryBg } = categoryColor(
                  transaction.categoryName ?? 'Outros',
                  transaction.type,
                )
                const tone = flowTone(transaction.type)
                return (
                  <tr
                    key={transaction.uuid}
                    className="cursor-pointer border-b border-ink/[.06] last:border-b-0 hover:bg-ink/[.03]"
                    onClick={() => navigate(`/transacoes/${transaction.uuid}`)}
                  >
                    <td className="px-4 py-2.5">{formatDate(transaction.date)}</td>
                    <td className="px-4 py-2.5">{transaction.description}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${categoryBg} ${categoryText}`}
                      >
                        {transaction.categoryName ?? 'Outros'}
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 text-right font-heading tabular-nums ${tone.text}`}>
                      {tone.sign} {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-2 lg:hidden">
        {transactions.map((transaction) => {
          const tone = flowTone(transaction.type)
          return (
            <Link key={transaction.uuid} to={`/transacoes/${transaction.uuid}`}>
              <Card className="flex items-center gap-3 transition-shadow hover:shadow-md">
                <CategoryIconBadge name={transaction.categoryName ?? 'Outros'} type={transaction.type} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{transaction.description}</p>
                  <p className="text-xs text-ink/60">
                    {transaction.categoryName ?? 'Outros'} · {formatDate(transaction.date)}
                  </p>
                </div>
                <p className={`font-heading text-sm tabular-nums ${tone.text}`}>
                  {tone.sign} {formatCurrency(transaction.amount)}
                </p>
              </Card>
            </Link>
          )
        })}
      </div>

      {isPaying && cycleTotalDue !== undefined && (
        <PayCreditCardInvoiceModal
          card={card}
          invoiceUuid={invoice!.uuid}
          defaultAmount={cycleTotalDue}
          onClose={() => setIsPaying(false)}
        />
      )}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  valueClassName = 'text-ink',
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[12px] font-semibold text-ink/55">{label}</span>
      <span className={`font-data text-sm font-bold tabular-nums ${valueClassName}`}>{value}</span>
    </div>
  )
}
