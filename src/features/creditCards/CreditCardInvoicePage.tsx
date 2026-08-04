import { useQuery } from '@tanstack/react-query'
import { addDays, format, parseISO, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, Receipt } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { creditCardsApi } from '../../api/creditCards'
import { transactionsApi } from '../../api/transactions'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { BankLogo } from '../../lib/bankLogos'
import { CategoryIconBadge, categoryColor } from '../../lib/categoryIcons'
import { formatCurrency, formatDate } from '../../lib/format'
import { PayCreditCardInvoiceModal } from './PayCreditCardInvoiceModal'

export function CreditCardInvoicePage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const [isPaying, setIsPaying] = useState(false)

  const cardQuery = useQuery({
    queryKey: ['credit-cards', uuid],
    queryFn: () => creditCardsApi.find(uuid!),
    enabled: Boolean(uuid),
  })
  const card = cardQuery.data

  // The invoice window is "right after the previous closing date, up to and
  // including this one" — closingDate itself comes from the backend (or the
  // mock store), only periodStart is derived here.
  const { dateFrom, dateTo } = useMemo(() => {
    if (!card) return { dateFrom: undefined, dateTo: undefined }
    const periodStart = subMonths(parseISO(card.closingDate), 1)
    return { dateFrom: format(addDays(periodStart, 1), 'yyyy-MM-dd'), dateTo: card.closingDate }
  }, [card])

  const referenceMonthLabel = useMemo(() => {
    if (!card) return ''
    const label = format(parseISO(card.closingDate), 'MMMM yyyy', { locale: ptBR })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [card])

  const transactionsQuery = useQuery({
    queryKey: ['transactions', 'invoice', uuid, dateFrom, dateTo],
    queryFn: () => transactionsApi.list({ creditCardUuid: uuid!, type: 'EXPENSE', dateFrom, dateTo }),
    enabled: Boolean(uuid && card),
  })
  const transactions = transactionsQuery.data ?? []

  if (cardQuery.isError) {
    return <ErrorBanner error={cardQuery.error} />
  }

  if (cardQuery.isLoading || !card) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-24 animate-pulse rounded-2xl bg-ink/[.06]" />
        <div className="h-64 animate-pulse rounded-2xl bg-ink/[.06]" />
      </div>
    )
  }

  // The true amount currently owed, not just this cycle's gross charges — a
  // payment made within the still-open current cycle already reduced
  // `availableLimit`, so `currentInvoiceTotal + previousBalance` would miss it.
  const totalDue = card.creditLimit - card.availableLimit

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/configuracoes/cartoes"
        className="flex w-fit items-center gap-1 text-[13px] font-medium text-ink/55 hover:text-ink"
      >
        <ChevronLeft size={14} />
        Cartões
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
          <SummaryRow label="Saldo anterior" value={formatCurrency(card.previousBalance)} valueClassName="text-expense" />
          <SummaryRow label="Referência" value={referenceMonthLabel} />
          <SummaryRow label="Fechamento" value={formatDate(card.closingDate)} />
        </Card>
        <Card className="flex flex-col justify-center gap-1">
          <p className="text-[12px] font-semibold text-ink/55">Vencimento</p>
          <p className="font-data text-xl font-bold tabular-nums text-ink">{formatDate(card.dueDate)}</p>
        </Card>
        <Card className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold text-ink/55">Valor da fatura</p>
          <p className="font-data text-xl font-bold tabular-nums text-expense">
            {formatCurrency(totalDue)}
          </p>
          <Button variant="success" className="w-full" disabled={totalDue <= 0} onClick={() => setIsPaying(true)}>
            Pagar
          </Button>
        </Card>
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
          <p className="text-sm text-ink/60">Nenhuma compra nesta fatura ainda.</p>
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
                    <td className="px-4 py-2.5 text-right font-heading tabular-nums text-expense">
                      − {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-2 lg:hidden">
        {transactions.map((transaction) => (
          <Link key={transaction.uuid} to={`/transacoes/${transaction.uuid}`}>
            <Card className="flex items-center gap-3 transition-shadow hover:shadow-md">
              <CategoryIconBadge name={transaction.categoryName ?? 'Outros'} type={transaction.type} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{transaction.description}</p>
                <p className="text-xs text-ink/60">
                  {transaction.categoryName ?? 'Outros'} · {formatDate(transaction.date)}
                </p>
              </div>
              <p className="font-heading text-sm tabular-nums text-expense">− {formatCurrency(transaction.amount)}</p>
            </Card>
          </Link>
        ))}
      </div>

      {isPaying && <PayCreditCardInvoiceModal card={card} onClose={() => setIsPaying(false)} />}
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
