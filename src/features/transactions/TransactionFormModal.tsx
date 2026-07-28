import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { addMonths, addWeeks, addYears, parseISO } from 'date-fns'
import { MessageSquareText, Paperclip, Repeat2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Account, AccountType, CreditCard, Currency, Transaction } from '../../types/domain'
import { categoriesApi } from '../../api/categories'
import type { TransactionPayload } from '../../api/transactions'
import { Button } from '../../components/Button'
import { CurrencyInput } from '../../components/CurrencyInput'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { PickerField, type PickerOption } from '../../components/PickerField'
import { TimeField } from '../../components/TimeField'
import { WarningBanner } from '../../components/WarningBanner'
import { BankLogo } from '../../lib/bankLogos'
import { CategoryIconBadge } from '../../lib/categoryIcons'
import { formatCurrency, formatDayMonthYearPtBR, todayIsoDate } from '../../lib/format'
import { accountTypeLabels } from '../../lib/labels'

const schema = z
  .object({
    description: z.string().min(1, 'Informe uma descrição'),
    amount: z.coerce.number().positive('Informe um valor maior que zero'),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    date: z.string().min(1, 'Informe a data'),
    time: z.string().optional(),
    categoryUuid: z.string().optional(),
    destination: z.enum(['account', 'creditCard']),
    accountBalanceUuid: z.string().optional(),
    creditCardUuid: z.string().optional(),
    toAccountBalanceUuid: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'TRANSFER') {
      if (!values.accountBalanceUuid) {
        ctx.addIssue({ code: 'custom', message: 'Escolha a conta de origem', path: ['accountBalanceUuid'] })
      }
      if (!values.toAccountBalanceUuid) {
        ctx.addIssue({ code: 'custom', message: 'Escolha a conta de destino', path: ['toAccountBalanceUuid'] })
      } else if (values.accountBalanceUuid && values.accountBalanceUuid === values.toAccountBalanceUuid) {
        ctx.addIssue({
          code: 'custom',
          message: 'Origem e destino devem ser saldos diferentes.',
          path: ['toAccountBalanceUuid'],
        })
      }
      if (!values.categoryUuid) {
        ctx.addIssue({ code: 'custom', message: 'Escolha uma categoria', path: ['categoryUuid'] })
      }
      return
    }
    if (!values.categoryUuid) {
      ctx.addIssue({ code: 'custom', message: 'Escolha uma categoria', path: ['categoryUuid'] })
    }
    if (values.destination === 'account' ? !values.accountBalanceUuid : !values.creditCardUuid) {
      ctx.addIssue({ code: 'custom', message: 'Escolha uma conta ou cartão', path: ['accountBalanceUuid'] })
    }
  })

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface BalanceOption {
  balanceUuid: string
  accountUuid: string
  accountName: string
  bankName: string
  accountType: AccountType
  currency: Currency
}

const TYPE_OPTIONS: { value: 'EXPENSE' | 'INCOME' | 'TRANSFER'; label: string; dot: string }[] = [
  { value: 'EXPENSE', label: 'Despesa', dot: 'bg-expense' },
  { value: 'INCOME', label: 'Receita', dot: 'bg-income' },
  { value: 'TRANSFER', label: 'Transferência', dot: 'bg-brand-500' },
]

interface TransactionFormModalProps {
  transaction?: Transaction
  accounts: Account[]
  creditCards: CreditCard[]
  onClose: () => void
  onSubmit: (payload: TransactionPayload) => Promise<void>
}

export function TransactionFormModal({
  transaction,
  accounts,
  creditCards,
  onClose,
  onSubmit,
}: TransactionFormModalProps) {
  const [submitError, setSubmitError] = useState<unknown>(null)

  const [showRecurrence, setShowRecurrence] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'installment' | 'recurring'>('installment')
  const [installments, setInstallments] = useState(2)
  const [installmentInterval, setInstallmentInterval] = useState<'Semanas' | 'Meses'>('Meses')
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'Semanal' | 'Mensal' | 'Anual'>('Mensal')
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')
  const [showAttachmentsHint, setShowAttachmentsHint] = useState(false)

  const balanceOptions = useMemo<BalanceOption[]>(
    () =>
      accounts.flatMap((account) =>
        account.balances.map((balance) => ({
          balanceUuid: balance.uuid,
          accountUuid: account.uuid,
          accountName: account.name,
          bankName: account.bankName,
          accountType: account.type,
          currency: balance.currency,
        })),
      ),
    [accounts],
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: transaction
      ? {
          description: transaction.description,
          amount: transaction.amount,
          // This modal no longer creates/edits EXCHANGE transactions (see TransactionDetailPage,
          // which hides the edit action for that type), so the cast is always safe here.
          type: transaction.type as 'INCOME' | 'EXPENSE' | 'TRANSFER',
          date: transaction.date,
          time: transaction.time?.slice(0, 5),
          categoryUuid: transaction.categoryUuid ?? undefined,
          destination: transaction.fromAccountBalanceUuid ? 'account' : 'creditCard',
          accountBalanceUuid: transaction.fromAccountBalanceUuid ?? undefined,
          creditCardUuid: transaction.fromCreditCardUuid ?? undefined,
          toAccountBalanceUuid: transaction.toAccountBalanceUuid ?? undefined,
        }
      : {
          type: 'EXPENSE',
          date: todayIsoDate(),
          destination: accounts.length > 0 ? 'account' : 'creditCard',
        },
  })

  const selectedType = watch('type')
  const destination = watch('destination')
  const accountBalanceUuid = watch('accountBalanceUuid')
  const creditCardUuid = watch('creditCardUuid')
  const toAccountBalanceUuid = watch('toAccountBalanceUuid')
  const categoryUuid = watch('categoryUuid')
  const amountValue = watch('amount')
  const dateValue = watch('date')
  const timeValue = watch('time')
  const isTransfer = selectedType === 'TRANSFER'
  // A transfer only makes sense between two different accounts that share a
  // currency (crossing currencies is an EXCHANGE, not a TRANSFER — enforced
  // by the backend's CurrencyMismatchException). Having 2+ accounts isn't
  // enough on its own if none of them share a currency with another.
  const hasTransferablePair = useMemo(() => {
    const accountsByCurrency = new Map<Currency, Set<string>>()
    for (const option of balanceOptions) {
      const accountUuids = accountsByCurrency.get(option.currency) ?? new Set<string>()
      accountUuids.add(option.accountUuid)
      accountsByCurrency.set(option.currency, accountUuids)
    }
    return [...accountsByCurrency.values()].some((accountUuids) => accountUuids.size >= 2)
  }, [balanceOptions])
  const notEnoughAccountsForTransfer = isTransfer && !hasTransferablePair

  const sourceBalance = balanceOptions.find((option) => option.balanceUuid === accountBalanceUuid)
  const transferTargetOptions = balanceOptions.filter(
    (option) => option.accountUuid !== sourceBalance?.accountUuid && option.currency === sourceBalance?.currency,
  )
  // Which currency the "Valor" mask should follow — the credit card's own
  // currency when paying with a card, otherwise the selected account
  // balance's currency (the same lookup covers a TRANSFER's origin, since it
  // reuses the accountBalanceUuid field).
  const amountCurrency: Currency =
    destination === 'creditCard' && !isTransfer
      ? (creditCards.find((card) => card.uuid === creditCardUuid)?.currency ?? 'BRL')
      : (sourceBalance?.currency ?? 'BRL')

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const categoryOptions = useMemo(
    () =>
      isTransfer ? (categoriesQuery.data ?? []) : (categoriesQuery.data ?? []).filter((c) => c.type === selectedType),
    [categoriesQuery.data, selectedType, isTransfer],
  )

  const accountPickerOptions = useMemo<PickerOption[]>(
    () =>
      balanceOptions.map((option) => ({
        value: option.balanceUuid,
        label: option.accountName,
        sublabel: `${accountTypeLabels[option.accountType]} · ${option.currency}`,
        leading: <BankLogo name={option.bankName} size={22} />,
      })),
    [balanceOptions],
  )

  const originOptions = useMemo<PickerOption[]>(
    () => [
      ...accountPickerOptions,
      ...creditCards.map((card) => ({
        value: `card:${card.uuid}`,
        label: card.name,
        sublabel: 'Cartão de crédito',
        leading: <BankLogo name={card.issuer} size={22} />,
      })),
    ],
    [accountPickerOptions, creditCards],
  )

  const transferTargetPickerOptions = useMemo<PickerOption[]>(
    () => accountPickerOptions.filter((option) => transferTargetOptions.some((o) => o.balanceUuid === option.value)),
    [accountPickerOptions, transferTargetOptions],
  )

  const categoryPickerOptions = useMemo<PickerOption[]>(
    () =>
      categoryOptions.map((category) => ({
        value: category.uuid,
        label: category.name,
        leading: <CategoryIconBadge name={category.name} type={category.type} size="sm" />,
      })),
    [categoryOptions],
  )

  const originValue = destination === 'account' ? accountBalanceUuid : creditCardUuid ? `card:${creditCardUuid}` : undefined

  function handleOriginChange(newValue: string) {
    if (newValue.startsWith('card:')) {
      setValue('destination', 'creditCard', { shouldValidate: true })
      setValue('creditCardUuid', newValue.slice('card:'.length), { shouldValidate: true })
      setValue('accountBalanceUuid', undefined, { shouldValidate: true })
    } else {
      setValue('destination', 'account', { shouldValidate: true })
      setValue('accountBalanceUuid', newValue, { shouldValidate: true })
      setValue('creditCardUuid', undefined, { shouldValidate: true })
    }
  }

  const baseDate = dateValue ? parseISO(dateValue) : new Date()
  const nextRecurrenceDate =
    recurrenceFrequency === 'Semanal'
      ? addWeeks(baseDate, 1)
      : recurrenceFrequency === 'Anual'
        ? addYears(baseDate, 1)
        : addMonths(baseDate, 1)
  const totalAmount = Number(amountValue) || 0
  const baseInstallmentAmount = Math.floor((totalAmount / installments) * 100) / 100
  const lastInstallmentAmount = Math.round((totalAmount - baseInstallmentAmount * (installments - 1)) * 100) / 100

  const submit = async (values: FormValues) => {
    setSubmitError(null)
    if (values.type === 'TRANSFER') {
      const from = balanceOptions.find((option) => option.balanceUuid === values.accountBalanceUuid)
      const to = balanceOptions.find((option) => option.balanceUuid === values.toAccountBalanceUuid)
      if (from && to && from.currency !== to.currency) {
        setSubmitError(new Error('Origem e destino precisam ter a mesma moeda.'))
        return
      }
    }
    try {
      await onSubmit({
        description: values.description,
        amount: values.amount,
        type: values.type,
        date: values.date,
        time: values.time ? `${values.time}:00` : null,
        categoryUuid: values.categoryUuid ?? null,
        fromAccountBalanceUuid:
          values.type === 'TRANSFER'
            ? values.accountBalanceUuid
            : values.destination === 'account'
              ? values.accountBalanceUuid
              : null,
        fromCreditCardUuid:
          values.type === 'TRANSFER' ? null : values.destination === 'creditCard' ? values.creditCardUuid : null,
        toAccountBalanceUuid: values.type === 'TRANSFER' ? values.toAccountBalanceUuid : null,
        convertedAmount: null,
      })
      onClose()
    } catch (error) {
      setSubmitError(error)
    }
  }

  return (
    <Modal title={transaction ? 'Editar transação' : 'Nova transação'} onClose={onClose} maxWidthClassName="max-w-lg">
      <p className="-mt-3 mb-4 text-[12.5px] text-ink/55">
        {transaction
          ? 'Atualize os dados e a regra de repetição.'
          : showRecurrence
            ? 'Preencha os dados e defina se o lançamento se repete.'
            : 'A repetição permanece oculta até ativar Recorrente.'}
      </p>

      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <div className="flex rounded-full bg-black/[.06] p-1">
          {TYPE_OPTIONS.map((option) => {
            const checked = option.value === selectedType
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('type', option.value, { shouldValidate: true })}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  checked ? 'bg-white text-ink shadow-sm' : 'text-ink/60 hover:text-ink'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${option.dot}`} />
                {option.label}
              </button>
            )
          })}
        </div>

        <Field label="Descrição" htmlFor="description" error={errors.description?.message}>
          <input id="description" className={inputClass} placeholder="Mercado do mês" {...register('description')} />
        </Field>

        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <Field label="Valor" htmlFor="amount" error={errors.amount?.message}>
              <CurrencyInput
                id="amount"
                currency={amountCurrency}
                value={typeof amountValue === 'number' ? amountValue : 0}
                onChange={(value) => setValue('amount', value, { shouldValidate: true })}
                className={`${inputClass} w-full`}
              />
            </Field>
          </div>
          <div className="min-w-0 flex-1">
            <Field label="Data" htmlFor="date" error={errors.date?.message}>
              <input id="date" type="date" className={`${inputClass} w-full`} {...register('date')} />
            </Field>
          </div>
          <TimeField
            label="Hora"
            hint="(opcional)"
            value={timeValue}
            onChange={(value) => setValue('time', value, { shouldValidate: true })}
            error={errors.time?.message}
          />
        </div>

        {isTransfer ? (
          <div className="flex gap-3">
            <PickerField
              label="Conta de origem"
              placeholder="Selecione..."
              options={accountPickerOptions}
              value={accountBalanceUuid}
              onChange={(value) => {
                setValue('accountBalanceUuid', value, { shouldValidate: true })
                const newCurrency = balanceOptions.find((option) => option.balanceUuid === value)?.currency
                const currentTarget = balanceOptions.find((option) => option.balanceUuid === toAccountBalanceUuid)
                if (currentTarget && currentTarget.currency !== newCurrency) {
                  setValue('toAccountBalanceUuid', undefined, { shouldValidate: true })
                }
              }}
              error={errors.accountBalanceUuid?.message}
            />
            <PickerField
              label="Conta de destino"
              placeholder={sourceBalance ? 'Selecione...' : 'Escolha a origem primeiro'}
              options={transferTargetPickerOptions}
              value={toAccountBalanceUuid}
              onChange={(value) => setValue('toAccountBalanceUuid', value, { shouldValidate: true })}
              error={errors.toAccountBalanceUuid?.message}
            />
          </div>
        ) : (
          <div className="flex gap-3">
            <PickerField
              label="Conta ou cartão"
              placeholder="Selecione..."
              options={originOptions}
              value={originValue}
              onChange={handleOriginChange}
              error={errors.accountBalanceUuid?.message}
            />
            <PickerField
              label="Categoria"
              placeholder="Selecione..."
              options={categoryPickerOptions}
              value={categoryUuid}
              onChange={(value) => setValue('categoryUuid', value, { shouldValidate: true })}
              error={errors.categoryUuid?.message}
            />
          </div>
        )}

        {isTransfer && (
          <>
            <PickerField
              label="Categoria"
              placeholder="Selecione..."
              options={categoryPickerOptions}
              value={categoryUuid}
              onChange={(value) => setValue('categoryUuid', value, { shouldValidate: true })}
              error={errors.categoryUuid?.message}
            />
            {notEnoughAccountsForTransfer && (
              <WarningBanner>
                Você precisa de pelo menos duas contas com a mesma moeda para transferir.
              </WarningBanner>
            )}
          </>
        )}

        <div className="h-px bg-divider" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRecurrence((v) => !v)}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${showRecurrence ? 'bg-brand-100 text-brand-600' : 'bg-surface text-ink/60'}`}
            >
              <Repeat2 size={16} />
            </span>
            <span className={`text-[11px] font-semibold ${showRecurrence ? 'text-brand-600' : 'text-ink/60'}`}>
              Recorrente
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowNote((v) => !v)}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${showNote ? 'bg-brand-100 text-brand-600' : 'bg-surface text-ink/60'}`}
            >
              <MessageSquareText size={16} />
            </span>
            <span className={`text-[11px] font-semibold ${showNote ? 'text-brand-600' : 'text-ink/60'}`}>
              Observação
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowAttachmentsHint((v) => !v)}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${showAttachmentsHint ? 'bg-brand-100 text-brand-600' : 'bg-surface text-ink/60'}`}
            >
              <Paperclip size={16} />
            </span>
            <span className={`text-[11px] font-semibold ${showAttachmentsHint ? 'text-brand-600' : 'text-ink/60'}`}>
              Anexos
            </span>
          </button>
        </div>

        {showRecurrence && (
          <div className="flex flex-col gap-3 rounded-2xl bg-surface p-3">
            <p className="text-[11px] text-ink/50">Recorrência e parcelamento ainda não são salvos — em breve.</p>

            <div className="flex rounded-full bg-black/[.06] p-1">
              {(
                [
                  { value: 'installment', label: 'Parcelamento' },
                  { value: 'recurring', label: 'Recorrência' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRepeatMode(option.value)}
                  className={`flex flex-1 items-center justify-center rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    repeatMode === option.value ? 'bg-white text-ink shadow-sm' : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {repeatMode === 'installment' ? (
              <div className="flex items-end gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-ink/60">Parcelas</span>
                  <div className="flex h-9 items-center gap-2.5 rounded-xl bg-white px-2.5">
                    <button
                      type="button"
                      onClick={() => setInstallments((n) => Math.max(2, n - 1))}
                      className="text-sm font-semibold text-ink/60"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-semibold text-ink">{installments}</span>
                    <button
                      type="button"
                      onClick={() => setInstallments((n) => Math.min(24, n + 1))}
                      className="text-sm font-semibold text-brand-500"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-ink/60">Intervalo</span>
                  <select
                    value={installmentInterval}
                    onChange={(event) => setInstallmentInterval(event.target.value as 'Semanas' | 'Meses')}
                    className="h-9 rounded-xl bg-white px-2.5 text-sm text-ink outline-none"
                  >
                    <option value="Meses">Meses</option>
                    <option value="Semanas">Semanas</option>
                  </select>
                </div>
                <div className="flex-1 rounded-xl bg-brand-100 px-3 py-2">
                  <p className="font-data text-[13px] font-semibold text-brand-700">
                    {formatCurrency(baseInstallmentAmount)} por parcela
                  </p>
                  <p className="text-[11px] text-brand-700/70">Última: {formatCurrency(lastInstallmentAmount)}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-end gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-ink/60">Frequência</span>
                  <select
                    value={recurrenceFrequency}
                    onChange={(event) => setRecurrenceFrequency(event.target.value as 'Semanal' | 'Mensal' | 'Anual')}
                    className="h-9 rounded-xl bg-white px-2.5 text-sm text-ink outline-none"
                  >
                    <option value="Semanal">Semanal</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
                <div className="flex-1 rounded-xl bg-brand-100 px-3 py-2">
                  <p className="text-[13px] font-semibold text-brand-700">
                    Próximo: {formatDayMonthYearPtBR(nextRecurrenceDate)}
                  </p>
                  <p className="text-[11px] text-brand-700/70">Vale para os próximos lançamentos</p>
                </div>
              </div>
            )}
          </div>
        )}

        {showNote && (
          <Field label="Observação (ainda não salva)" htmlFor="note">
            <textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              placeholder="Adicione uma observação..."
              className="rounded-2xl bg-surface p-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
            />
          </Field>
        )}

        {showAttachmentsHint && (
          <p className="rounded-2xl bg-surface px-3.5 py-2.5 text-xs text-ink/60">
            Anexos ficam disponíveis depois de salvar a transação, na tela de detalhes.
          </p>
        )}

        {Boolean(submitError) && <ErrorBanner error={submitError} />}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={notEnoughAccountsForTransfer}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
