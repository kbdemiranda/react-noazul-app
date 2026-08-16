import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Landmark, Layers, Plus, Receipt, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { accountsApi } from '../../api/accounts'
import { categoriesApi } from '../../api/categories'
import { creditCardsApi } from '../../api/creditCards'
import { transactionsApi, type TransactionFilters, type TransactionPayload } from '../../api/transactions'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { MultiPickerField } from '../../components/MultiPickerField'
import { PickerField, type PickerOption } from '../../components/PickerField'
import { SegmentedControl } from '../../components/SegmentedControl'
import { WarningBanner } from '../../components/WarningBanner'
import { BankLogo } from '../../lib/bankLogos'
import { CategoryIconBadge, categoryColor } from '../../lib/categoryIcons'
import { flowTone } from '../../lib/flow'
import { formatCurrency, formatDate } from '../../lib/format'
import { accountTypeLabels } from '../../lib/labels'
import { TransactionFormModal } from './TransactionFormModal'

type Filter = 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'EXCHANGE'

const filterOptions: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'EXPENSE', label: 'Despesas' },
  { value: 'INCOME', label: 'Receitas' },
  { value: 'TRANSFER', label: 'Transferências' },
  { value: 'EXCHANGE', label: 'Câmbios' },
]

const ALL_CATEGORIES = ''
const ALL_ACCOUNTS = ''
const ALL_ACCOUNTS_LABEL = 'Todas as contas/cartões'

export function TransactionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const initialAccountBalanceUuid = searchParams.get('accountBalanceUuid')
  const initialCreditCardUuid = searchParams.get('creditCardUuid')
  const initialAccountOrCardUuid = initialCreditCardUuid
    ? `card:${initialCreditCardUuid}`
    : (initialAccountBalanceUuid ?? ALL_ACCOUNTS)

  const [isCreating, setIsCreating] = useState(false)
  const [filter, setFilter] = useState<Filter>('ALL')

  const [descriptionInput, setDescriptionInput] = useState('')
  const [description, setDescription] = useState('')
  const [categoryUuid, setCategoryUuid] = useState(ALL_CATEGORIES)
  const [accountOrCardUuids, setAccountOrCardUuids] = useState<string[]>(() =>
    initialAccountOrCardUuid === ALL_ACCOUNTS ? [] : [initialAccountOrCardUuid],
  )
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(initialAccountOrCardUuid !== ALL_ACCOUNTS)

  useEffect(() => {
    const timeout = setTimeout(() => setDescription(descriptionInput.trim()), 300)
    return () => clearTimeout(timeout)
  }, [descriptionInput])

  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  const creditCardsQuery = useQuery({ queryKey: ['credit-cards'], queryFn: creditCardsApi.list })
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })

  const filters: TransactionFilters = useMemo(() => {
    const accountBalanceUuids = accountOrCardUuids.filter((value) => !value.startsWith('card:'))
    const creditCardUuids = accountOrCardUuids
      .filter((value) => value.startsWith('card:'))
      .map((value) => value.slice('card:'.length))
    return {
      description: description || undefined,
      type: filter === 'ALL' ? undefined : filter,
      categoryUuid: categoryUuid || undefined,
      accountBalanceUuids: accountBalanceUuids.length ? accountBalanceUuids : undefined,
      creditCardUuids: creditCardUuids.length ? creditCardUuids : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }
  }, [description, filter, categoryUuid, accountOrCardUuids, dateFrom, dateTo])

  const transactionsQuery = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsApi.list(filters),
  })

  const createMutation = useMutation({
    mutationFn: (payload: TransactionPayload) => transactionsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  })

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

  const accountOrCardOptions = useMemo<PickerOption[]>(
    () => [
      {
        value: ALL_ACCOUNTS,
        label: ALL_ACCOUNTS_LABEL,
        leading: <Landmark size={16} className="text-ink/45" />,
      },
      ...(accountsQuery.data ?? []).flatMap((account) =>
        account.balances.map((balance) => ({
          value: balance.uuid,
          label: account.name,
          sublabel: `${accountTypeLabels[account.type]} · ${balance.currency}`,
          leading: <BankLogo name={account.bankName} size={22} />,
        })),
      ),
      ...(creditCardsQuery.data ?? []).map((card) => ({
        value: `card:${card.uuid}`,
        label: card.name,
        sublabel: 'Cartão de crédito',
        leading: <BankLogo name={card.issuer} size={22} />,
      })),
    ],
    [accountsQuery.data, creditCardsQuery.data],
  )

  const extraFiltersCount = [
    descriptionInput.trim(),
    categoryUuid,
    accountOrCardUuids.length > 0,
    dateFrom,
    dateTo,
  ].filter(Boolean).length
  const hasActiveFilters = filter !== 'ALL' || extraFiltersCount > 0

  function clearFilters() {
    setFilter('ALL')
    setDescriptionInput('')
    setDescription('')
    setCategoryUuid(ALL_CATEGORIES)
    setAccountOrCardUuids([])
    setDateFrom('')
    setDateTo('')
  }

  const transactions = transactionsQuery.data ?? []

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

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl name="filtro" options={filterOptions} value={filter} onChange={setFilter} className="w-fit" />

        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className={`inline-flex h-11 items-center gap-1.5 rounded-2xl px-3.5 text-sm font-medium transition-colors ${
            filtersOpen || extraFiltersCount > 0 ? 'bg-brand-100 text-brand-700' : 'bg-surface text-ink/70 hover:text-ink'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filtros
          {extraFiltersCount > 0 && (
            <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
              {extraFiltersCount}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-11 items-center gap-1 rounded-2xl px-3 text-sm font-medium text-ink/55 hover:text-ink"
          >
            <X size={14} />
            Limpar
          </button>
        )}
      </div>

      {filtersOpen && (
        <Card className="relative z-20 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label htmlFor="descriptionFilter" className="text-[13px] font-semibold text-ink">
              Descrição
            </label>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink/40" />
              <input
                id="descriptionFilter"
                value={descriptionInput}
                onChange={(event) => setDescriptionInput(event.target.value)}
                placeholder="Buscar por descrição..."
                className={`${inputClass} w-full pl-9`}
              />
            </div>
          </div>
          <PickerField
            label="Categoria"
            placeholder="Todas as categorias"
            options={categoryOptions}
            value={categoryUuid}
            onChange={setCategoryUuid}
          />
          <MultiPickerField
            label="Conta / Cartão"
            placeholder={ALL_ACCOUNTS_LABEL}
            options={accountOrCardOptions}
            allValue={ALL_ACCOUNTS}
            values={accountOrCardUuids}
            onChange={setAccountOrCardUuids}
          />
          <Field label="De" htmlFor="dateFrom">
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
              className={`${inputClass} min-w-0 flex-1`}
            />
          </Field>
          <Field label="Até" htmlFor="dateTo">
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
              className={`${inputClass} min-w-0 flex-1`}
            />
          </Field>
        </Card>
      )}

      {transactionsQuery.isError && <ErrorBanner error={transactionsQuery.error} />}

      {transactionsQuery.isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-2xl bg-ink/[.06]" />
          ))}
        </div>
      )}

      {transactions.length === 0 && !transactionsQuery.isLoading && (
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <Receipt size={28} className="text-ink/35" />
          <p className="text-sm text-ink/60">
            {hasActiveFilters ? 'Nenhuma transação encontrada para esses filtros.' : 'Nenhuma transação encontrada.'}
          </p>
        </Card>
      )}

      {transactions.length > 0 && (
        <>
          <div className="flex flex-col gap-2 lg:hidden">
            {transactions.map((transaction) => {
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
                <tr className="border-b border-ink/[.08] text-left text-[11px] tracking-wide text-ink/60 uppercase">
                  <th className="px-4 py-2.5 font-medium">Descrição</th>
                  <th className="px-4 py-2.5 font-medium">Categoria</th>
                  <th className="px-4 py-2.5 font-medium">Conta / Cartão</th>
                  <th className="px-4 py-2.5 font-medium">Data</th>
                  <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const tone = flowTone(transaction.type)
                  const { text: categoryText, bg: categoryBg } = categoryColor(
                    transaction.categoryName ?? 'Câmbio',
                    transaction.type,
                  )
                  return (
                    <tr
                      key={transaction.uuid}
                      className="cursor-pointer border-b border-ink/[.06] last:border-b-0 hover:bg-ink/[.03]"
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
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      )}
    </div>
  )
}
