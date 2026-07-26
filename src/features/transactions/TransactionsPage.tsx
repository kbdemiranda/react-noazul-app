import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Receipt } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { accountsApi } from '../../api/accounts'
import { creditCardsApi } from '../../api/creditCards'
import { transactionsApi, type TransactionPayload } from '../../api/transactions'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { SegmentedControl } from '../../components/SegmentedControl'
import { WarningBanner } from '../../components/WarningBanner'
import { CategoryIconBadge, categoryColor } from '../../lib/categoryIcons'
import { flowTone } from '../../lib/flow'
import { formatCurrency, formatDate } from '../../lib/format'
import { TransactionFormModal } from './TransactionFormModal'

type Filter = 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'EXCHANGE'

const filterOptions: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'EXPENSE', label: 'Despesas' },
  { value: 'INCOME', label: 'Receitas' },
  { value: 'TRANSFER', label: 'Transferências' },
  { value: 'EXCHANGE', label: 'Câmbios' },
]

export function TransactionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [filter, setFilter] = useState<Filter>('ALL')

  const transactionsQuery = useQuery({ queryKey: ['transactions'], queryFn: transactionsApi.list })
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  const creditCardsQuery = useQuery({ queryKey: ['credit-cards'], queryFn: creditCardsApi.list })

  const createMutation = useMutation({
    mutationFn: (payload: TransactionPayload) => transactionsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  })

  const filteredTransactions = useMemo(() => {
    const data = transactionsQuery.data ?? []
    if (filter === 'ALL') return data
    return data.filter((t) => t.type === filter)
  }, [transactionsQuery.data, filter])

  const sorted = useMemo(
    () => [...filteredTransactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [filteredTransactions],
  )

  const canCreate = (accountsQuery.data?.length ?? 0) > 0 || (creditCardsQuery.data?.length ?? 0) > 0
  const isReady = !accountsQuery.isLoading && !creditCardsQuery.isLoading

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Transações</h1>
        <Button onClick={() => setIsCreating(true)} disabled={!canCreate} aria-label="Nova transação">
          <Plus size={15} />
          <span className="hidden sm:inline">Nova transação</span>
        </Button>
      </div>

      {!canCreate && isReady && (
        <WarningBanner>Cadastre uma conta ou cartão antes de lançar uma transação.</WarningBanner>
      )}

      <SegmentedControl name="filtro" options={filterOptions} value={filter} onChange={setFilter} className="w-fit" />

      {transactionsQuery.isError && <ErrorBanner error={transactionsQuery.error} />}

      {transactionsQuery.isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-2xl bg-black/[.06]" />
          ))}
        </div>
      )}

      {sorted.length === 0 && !transactionsQuery.isLoading && (
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <Receipt size={28} className="text-ink/35" />
          <p className="text-sm text-ink/60">Nenhuma transação encontrada.</p>
        </Card>
      )}

      {sorted.length > 0 && (
        <>
          <div className="flex flex-col gap-2 lg:hidden">
            {sorted.map((transaction) => {
              const tone = flowTone(transaction.type)
              return (
                <Link key={transaction.uuid} to={`/transacoes/${transaction.uuid}`}>
                  <Card className="flex items-center gap-3 transition-shadow hover:shadow-md">
                    <CategoryIconBadge name={transaction.categoryName ?? 'Câmbio'} type={transaction.type} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{transaction.description}</p>
                      <p className="text-xs text-ink/60">
                        {transaction.categoryName ?? 'Câmbio'} ·{' '}
                        {transaction.fromAccountName ?? transaction.fromCreditCardName} · {formatDate(transaction.date)}
                      </p>
                    </div>
                    <p className={`font-heading text-sm tabular-nums ${tone.text}`}>
                      {tone.sign}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </Card>
                </Link>
              )
            })}
          </div>

          <div className="glass-surface hidden overflow-hidden rounded-2xl shadow-sm lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[.08] text-left text-[11px] tracking-wide text-ink/60 uppercase">
                  <th className="px-4 py-2.5 font-medium">Descrição</th>
                  <th className="px-4 py-2.5 font-medium">Categoria</th>
                  <th className="px-4 py-2.5 font-medium">Conta / Cartão</th>
                  <th className="px-4 py-2.5 font-medium">Data</th>
                  <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((transaction) => {
                  const tone = flowTone(transaction.type)
                  const { text: categoryText, bg: categoryBg } = categoryColor(
                    transaction.categoryName ?? 'Câmbio',
                    transaction.type,
                  )
                  return (
                    <tr
                      key={transaction.uuid}
                      className="cursor-pointer border-b border-black/[.06] last:border-b-0 hover:bg-black/[.03]"
                      onClick={() => navigate(`/transacoes/${transaction.uuid}`)}
                    >
                      <td className="px-4 py-2.5">{transaction.description}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${categoryBg} ${categoryText}`}
                        >
                          {transaction.categoryName ?? 'Câmbio'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{transaction.fromAccountName ?? transaction.fromCreditCardName}</td>
                      <td className="px-4 py-2.5">{formatDate(transaction.date)}</td>
                      <td className={`px-4 py-2.5 text-right font-heading tabular-nums ${tone.text}`}>
                        {tone.sign}
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isCreating && (
        <TransactionFormModal
          accounts={accountsQuery.data ?? []}
          creditCards={creditCardsQuery.data ?? []}
          onClose={() => setIsCreating(false)}
          onSubmit={async (payload) => {
            await createMutation.mutateAsync(payload)
          }}
        />
      )}
    </div>
  )
}
