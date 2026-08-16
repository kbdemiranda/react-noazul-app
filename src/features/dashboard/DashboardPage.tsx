import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Inbox, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountsApi } from '../../api/accounts'
import { creditCardsApi } from '../../api/creditCards'
import { transactionsApi, type TransactionPayload } from '../../api/transactions'
import { Button } from '../../components/Button'
import { Card, CardKicker } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { BankLogo } from '../../lib/bankLogos'
import { CategoryIconBadge } from '../../lib/categoryIcons'
import { getCreditCardInvoiceDates } from '../../lib/creditCardInvoice'
import { flowTone } from '../../lib/flow'
import { formatCurrency, formatDate, formatFullDatePtBR, formatMonthYearPtBR, formatShortDatePtBR } from '../../lib/format'
import { accountTypeLabels } from '../../lib/labels'
import { useAuth } from '../../context/AuthContext'
import { TransactionFormModal } from '../transactions/TransactionFormModal'

const DONUT_COLORS = ['var(--color-brand-500)', 'var(--color-expense-vivid)', 'var(--color-alert-vivid)', '#bf5af2']

export function DashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [hideSaldo, setHideSaldo] = useState(false)
  const [hideFaturas, setHideFaturas] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  const creditCardsQuery = useQuery({ queryKey: ['credit-cards'], queryFn: creditCardsApi.list })
  const transactionsQuery = useQuery({ queryKey: ['transactions'], queryFn: () => transactionsApi.list() })

  const createMutation = useMutation({
    mutationFn: (payload: TransactionPayload) => transactionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data])
  const creditCards = useMemo(() => creditCardsQuery.data ?? [], [creditCardsQuery.data])
  const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data])

  // Balances are per-currency (AccountBalance) — summing across different currencies
  // as if they were the same unit would be wrong, so totals are grouped by currency
  // instead of collapsed into one naively-summed number.
  const balanceTotalsByCurrency = useMemo(() => {
    const totals = new Map<string, number>()
    for (const account of accounts) {
      for (const balance of account.balances) {
        totals.set(balance.currency, (totals.get(balance.currency) ?? 0) + balance.balance)
      }
    }
    return [...totals.entries()].map(([currency, total]) => ({ currency, total }))
  }, [accounts])

  // The card itself already carries the correctly up-to-date amounts (backend-
  // or mock-computed, factoring in any invoice payments) — no need to
  // re-derive them from the raw transaction list here.
  const cardInvoices = useMemo(
    () =>
      creditCards.map((card) => ({
        card,
        total: card.creditLimit - card.availableLimit,
        availableLimit: card.availableLimit,
        dueDate: getCreditCardInvoiceDates(card).dueDate,
      })),
    [creditCards],
  )
  const totalInvoice = useMemo(() => cardInvoices.reduce((sum, entry) => sum + entry.total, 0), [cardInvoices])

  const monthTransactions = useMemo(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return transactions.filter((t) => t.date.startsWith(currentMonth))
  }, [transactions])

  const categoryBreakdown = useMemo(() => {
    const expenses = monthTransactions.filter((t) => t.type === 'EXPENSE')
    const total = expenses.reduce((sum, t) => sum + t.amount, 0)
    if (total <= 0) return { slices: [], total: 0 }

    const byCategory = new Map<string, number>()
    for (const t of expenses) {
      // EXPENSE transactions always have a category (only EXCHANGE doesn't).
      const categoryName = t.categoryName ?? 'Outros'
      byCategory.set(categoryName, (byCategory.get(categoryName) ?? 0) + t.amount)
    }
    const sorted = [...byCategory.entries()].sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 4)
    const restSum = sorted.slice(4).reduce((sum, [, amount]) => sum + amount, 0)
    const entries = restSum > 0 ? [...top, ['Outros', restSum] as const] : top

    let cumulative = 0
    const slices = entries.map(([name, amount], index) => {
      const pct = (amount / total) * 100
      const from = cumulative
      cumulative += pct
      return { name, pct, from, to: cumulative, color: DONUT_COLORS[index] ?? '#8e8e93' }
    })
    return { slices, total }
  }, [monthTransactions])

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 5),
    [transactions],
  )

  const isLoading = accountsQuery.isLoading || creditCardsQuery.isLoading || transactionsQuery.isLoading
  const isError = accountsQuery.isError || creditCardsQuery.isError || transactionsQuery.isError
  const canCreate = accounts.length > 0 || creditCards.length > 0
  const today = useMemo(() => new Date(), [])
  const firstName = user?.name.split(' ')[0] ?? ''

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink sm:text-2xl">Olá, {firstName}</h1>
          <p className="mt-0.5 text-[13px] text-ink/60">{formatFullDatePtBR(today)}</p>
        </div>
        <Button className="hidden sm:inline-flex" disabled={!canCreate} onClick={() => setIsCreating(true)}>
          <Plus size={15} />
          Nova transação
        </Button>
      </div>

      {isCreating && (
        <TransactionFormModal
          accounts={accounts}
          creditCards={creditCards}
          onClose={() => setIsCreating(false)}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      )}

      {isError && <ErrorBanner error={accountsQuery.error ?? creditCardsQuery.error ?? transactionsQuery.error} />}

      {isLoading && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="h-56 animate-pulse rounded-2xl bg-ink/[.06]" />
            <div className="h-40 animate-pulse rounded-2xl bg-ink/[.06]" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-56 animate-pulse rounded-2xl bg-ink/[.06]" />
            <div className="h-40 animate-pulse rounded-2xl bg-ink/[.06]" />
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-4">
            <Card>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-3.5 w-1 rounded-full bg-income-vivid" />
                <CardKicker>Saldo geral</CardKicker>
              </div>
              <div className="mb-4 flex items-center gap-2.5">
                {hideSaldo ? (
                  <p className="font-heading text-2xl tabular-nums text-ink">••••••</p>
                ) : balanceTotalsByCurrency.length <= 1 ? (
                  <p className="font-heading text-2xl tabular-nums text-ink">
                    {formatCurrency(balanceTotalsByCurrency[0]?.total ?? 0, balanceTotalsByCurrency[0]?.currency)}
                  </p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {balanceTotalsByCurrency.map(({ currency, total }) => (
                      <p key={currency} className="font-heading text-xl tabular-nums text-ink">
                        {formatCurrency(total, currency)}
                      </p>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Mostrar/ocultar saldo"
                  onClick={() => setHideSaldo((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-ink/45 hover:bg-ink/[.05]"
                >
                  {hideSaldo ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="mb-4 h-px bg-ink/[.06]" />
              <h2 className="mb-3 font-heading text-[17px] font-semibold text-ink">Minhas contas</h2>
              {accounts.length === 0 ? (
                <p className="py-2 text-[13px] text-ink/55">Nenhuma conta cadastrada ainda.</p>
              ) : (
                <ul className="flex flex-col">
                  {accounts.map((account) => (
                    <li key={account.uuid}>
                      {/* The transactions filter is per-balance (multi-currency accounts have one AccountBalance
                          per currency) — this links to the account's first currency; a multi-currency account can
                          switch currency from the Transações page's own filter afterward. */}
                      <Link
                        to={`/transacoes?accountBalanceUuid=${account.balances[0].uuid}`}
                        className="flex items-center gap-3 border-b border-ink/[.06] py-2.5 last:border-b-0 hover:opacity-80"
                      >
                        <BankLogo name={account.bankName} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[14.5px] font-semibold text-ink">{account.name}</p>
                          <p className="mt-0.5 text-xs text-ink/60">{accountTypeLabels[account.type]}</p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          {account.balances.map((balance) => (
                            <p
                              key={balance.uuid}
                              className="font-heading text-[14.5px] tabular-nums text-brand-500"
                            >
                              {formatCurrency(balance.balance, balance.currency)}
                            </p>
                          ))}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/configuracoes/contas">
                <Button variant="secondary" className="mt-3.5 w-full">
                  Gerenciar contas
                </Button>
              </Link>
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-heading font-semibold text-ink">Últimos lançamentos</h2>
                <Link to="/transacoes" className="text-sm font-medium text-brand-500 hover:text-brand-700">
                  Ver todas
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Inbox size={28} className="text-ink/35" />
                  <p className="text-sm text-ink/60">Nenhum lançamento ainda.</p>
                </div>
              ) : (
                <ul className="flex flex-col">
                  {recentTransactions.map((transaction) => {
                    const tone = flowTone(transaction.type)
                    return (
                      <li key={transaction.uuid}>
                        <Link
                          to={`/transacoes/${transaction.uuid}`}
                          className="flex items-center gap-3 border-b border-ink/[.06] py-2.5 last:border-b-0 hover:opacity-80"
                        >
                          <CategoryIconBadge name={transaction.categoryName ?? 'Câmbio'} type={transaction.type} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-ink">{transaction.description}</p>
                            <p className="text-xs text-ink/60">
                              {transaction.categoryName ?? 'Câmbio'} · {formatDate(transaction.date)}
                            </p>
                          </div>
                          <p className={`font-heading text-sm tabular-nums ${tone.text}`}>
                            {tone.sign}
                            {formatCurrency(transaction.amount)}
                          </p>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-3.5 w-1 rounded-full bg-income-vivid" />
                <CardKicker>Faturas de {formatMonthYearPtBR(today)}</CardKicker>
              </div>
              <div className="mb-4 flex items-center gap-2.5">
                <p className="font-heading text-2xl tabular-nums text-expense">
                  {hideFaturas ? '••••••' : formatCurrency(totalInvoice)}
                </p>
                <button
                  type="button"
                  aria-label="Mostrar/ocultar faturas"
                  onClick={() => setHideFaturas((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-ink/45 hover:bg-ink/[.05]"
                >
                  {hideFaturas ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="mb-4 h-px bg-ink/[.06]" />
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-heading text-[17px] font-semibold text-ink">Meus cartões</h2>
                <Link to="/configuracoes/cartoes" className="text-sm font-medium text-brand-500 hover:text-brand-700">
                  Ver todos
                </Link>
              </div>
              {creditCards.length === 0 ? (
                <p className="py-2 text-[13px] text-ink/55">Nenhum cartão cadastrado ainda.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {cardInvoices.map(({ card, total, availableLimit, dueDate }) => (
                    <div key={card.uuid} className="rounded-2xl bg-ink/[.04] p-3.5">
                      <div className="mb-3 flex items-center gap-2.5">
                        <BankLogo name={card.issuer} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14.5px] font-semibold text-ink">{card.name}</p>
                          <p className="mt-0.5 text-xs text-ink/60">Cartão manual</p>
                        </div>
                        <Link to={`/cartoes/${card.uuid}/fatura`}>
                          <Button variant="secondary" className="px-3.5 py-1.5 text-xs">
                            Ver fatura
                          </Button>
                        </Link>
                      </div>
                      <div className="flex gap-2.5 rounded-xl bg-raised/70 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="mb-0.5 text-[11px] text-ink/60">Limite disponível</p>
                          <p className="text-sm font-semibold tabular-nums text-ink">{formatCurrency(availableLimit)}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="mb-0.5 text-[11px] text-ink/60">
                            Fatura atual <span className="text-[10px] font-normal">vence {formatShortDatePtBR(dueDate)}</span>
                          </p>
                          <p className="text-sm font-semibold tabular-nums text-expense">{formatCurrency(total)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/configuracoes/cartoes">
                <Button variant="secondary" className="mt-3.5 w-full">
                  Gerenciar cartões
                </Button>
              </Link>
            </Card>

            <Card>
              <h2 className="mb-4 font-heading text-[17px] font-semibold text-ink">Maiores gastos do mês atual</h2>
              <div className="flex items-center gap-5">
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  {categoryBreakdown.slices.length === 0 ? (
                    <p className="text-[13px] text-ink/55">Nenhuma despesa no período.</p>
                  ) : (
                    categoryBreakdown.slices.map((slice) => (
                      <div key={slice.name} className="flex items-center gap-2.5">
                        <span className="h-2 w-2 flex-none rounded-full" style={{ background: slice.color }} />
                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{slice.name}</span>
                        <span className="text-[13.5px] font-semibold tabular-nums text-ink">
                          {slice.pct.toFixed(0)}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex flex-none flex-col items-center gap-3">
                  <div
                    className="relative h-24 w-24 rounded-full"
                    style={{
                      background:
                        categoryBreakdown.slices.length > 0
                          ? `conic-gradient(${categoryBreakdown.slices.map((s) => `${s.color} ${s.from}% ${s.to}%`).join(', ')})`
                          : 'var(--color-surface)',
                    }}
                  >
                    <div className="absolute inset-[15px] rounded-full bg-page" />
                  </div>
                  <Link to="/categorias">
                    <Button variant="secondary" className="px-4 py-2 text-xs whitespace-nowrap">
                      Ver relatório
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
