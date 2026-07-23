import { useQuery } from '@tanstack/react-query'
import { Inbox, Plus, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { accountsApi } from '../../api/accounts'
import { creditCardsApi } from '../../api/creditCards'
import { transactionsApi } from '../../api/transactions'
import { Button } from '../../components/Button'
import { Card, CardKicker } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { CategoryIconBadge } from '../../lib/categoryIcons'
import { formatCurrency, formatDate } from '../../lib/format'

const DONUT_COLORS = ['var(--color-brand-500)', 'var(--color-expense-vivid)', 'var(--color-alert-vivid)', '#8e8e93']

export function DashboardPage() {
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  const creditCardsQuery = useQuery({ queryKey: ['credit-cards'], queryFn: creditCardsApi.list })
  const transactionsQuery = useQuery({ queryKey: ['transactions'], queryFn: transactionsApi.list })

  const totalBalance = useMemo(
    () => (accountsQuery.data ?? []).reduce((sum, account) => sum + account.balance, 0),
    [accountsQuery.data],
  )

  const totalCreditLimit = useMemo(
    () => (creditCardsQuery.data ?? []).reduce((sum, card) => sum + card.creditLimit, 0),
    [creditCardsQuery.data],
  )

  const monthTransactions = useMemo(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return (transactionsQuery.data ?? []).filter((t) => t.date.startsWith(currentMonth))
  }, [transactionsQuery.data])

  const monthSummary = useMemo(() => {
    const income = monthTransactions.filter((t) => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0)
    const expense = monthTransactions.filter((t) => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0)
    return { income, expense }
  }, [monthTransactions])

  const categoryBreakdown = useMemo(() => {
    const expenses = monthTransactions.filter((t) => t.type === 'EXPENSE')
    const total = expenses.reduce((sum, t) => sum + t.amount, 0)
    if (total <= 0) return { slices: [], total: 0 }

    const byCategory = new Map<string, number>()
    for (const t of expenses) {
      byCategory.set(t.categoryName, (byCategory.get(t.categoryName) ?? 0) + t.amount)
    }
    const sorted = [...byCategory.entries()].sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 3)
    const restSum = sorted.slice(3).reduce((sum, [, amount]) => sum + amount, 0)
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
    () =>
      [...(transactionsQuery.data ?? [])]
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        .slice(0, 5),
    [transactionsQuery.data],
  )

  const isLoading = accountsQuery.isLoading || creditCardsQuery.isLoading || transactionsQuery.isLoading
  const isError = accountsQuery.isError || creditCardsQuery.isError || transactionsQuery.isError

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Visão geral</h1>
        <Link to="/transacoes">
          <Button className="hidden sm:inline-flex">
            <Plus size={15} />
            Nova transação
          </Button>
        </Link>
      </div>

      {isError && <ErrorBanner error={accountsQuery.error ?? creditCardsQuery.error ?? transactionsQuery.error} />}

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-black/[.06]" />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardKicker>Saldo em contas</CardKicker>
              <p className="mt-1.5 font-heading text-xl tabular-nums text-ink">{formatCurrency(totalBalance)}</p>
            </Card>
            <Card>
              <CardKicker>Limite de cartões</CardKicker>
              <p className="mt-1.5 font-heading text-xl tabular-nums text-ink">{formatCurrency(totalCreditLimit)}</p>
            </Card>
            <Card>
              <CardKicker>Receitas no mês</CardKicker>
              <p className="mt-1.5 font-heading text-xl tabular-nums text-income">{formatCurrency(monthSummary.income)}</p>
            </Card>
            <Card>
              <CardKicker>Despesas no mês</CardKicker>
              <p className="mt-1.5 font-heading text-xl tabular-nums text-expense">{formatCurrency(monthSummary.expense)}</p>
            </Card>
          </div>

          {categoryBreakdown.slices.length > 0 && (
            <Card>
              <CardKicker className="mb-3 block">Gastos por categoria</CardKicker>
              <div className="flex items-center gap-5">
                <div
                  className="relative h-24 w-24 flex-none rounded-full"
                  style={{
                    background: `conic-gradient(${categoryBreakdown.slices
                      .map((s) => `${s.color} ${s.from}% ${s.to}%`)
                      .join(', ')})`,
                  }}
                >
                  <div className="absolute inset-[15px] rounded-full bg-page" />
                </div>
                <div className="flex flex-col gap-1.5 text-[11.5px]">
                  {categoryBreakdown.slices.map((slice) => (
                    <div key={slice.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 flex-none rounded-full" style={{ background: slice.color }} />
                      {slice.name} · {slice.pct.toFixed(0)}%
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

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
                <p className="text-sm text-ink/60">Nenhuma transação registrada ainda.</p>
              </div>
            ) : (
              <ul className="flex flex-col">
                {recentTransactions.map((transaction) => (
                  <li key={transaction.uuid}>
                    <Link
                      to={`/transacoes/${transaction.uuid}`}
                      className="flex items-center gap-3 border-b border-black/[.06] py-2.5 last:border-b-0 hover:opacity-80"
                    >
                      <CategoryIconBadge name={transaction.categoryName} type={transaction.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink">{transaction.description}</p>
                        <p className="text-xs text-ink/60">
                          {transaction.categoryName} · {formatDate(transaction.date)}
                        </p>
                      </div>
                      <p
                        className={`font-heading text-sm tabular-nums ${
                          transaction.type === 'EXPENSE' ? 'text-expense' : 'text-income'
                        }`}
                      >
                        {transaction.type === 'EXPENSE' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {(accountsQuery.data?.length ?? 0) === 0 && (creditCardsQuery.data?.length ?? 0) === 0 && (
            <Card className="flex flex-col items-center gap-2 py-8 text-center">
              <Wallet size={28} className="text-ink/35" />
              <h3 className="font-heading text-base font-semibold text-ink">Nenhuma conta cadastrada</h3>
              <p className="max-w-xs text-[12.5px] text-ink/65">
                Cadastre uma conta ou cartão para começar a acompanhar seu saldo.
              </p>
              <Link to="/contas">
                <Button className="mt-1">Cadastrar conta</Button>
              </Link>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
