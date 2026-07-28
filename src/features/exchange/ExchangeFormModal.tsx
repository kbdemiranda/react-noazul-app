import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  ArrowLeftRight,
  Calculator,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Repeat2,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { exchangeRatesApi } from '../../api/exchangeRates'
import type { TransactionPayload } from '../../api/transactions'
import { Button } from '../../components/Button'
import { CurrencyInput } from '../../components/CurrencyInput'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { PickerField, type PickerOption } from '../../components/PickerField'
import { TimeField } from '../../components/TimeField'
import { BankLogo } from '../../lib/bankLogos'
import { formatCurrency, todayIsoDate } from '../../lib/format'
import type { Account, AccountBalance, Currency } from '../../types/domain'

const schema = z
  .object({
    description: z.string().min(1, 'Informe uma descrição'),
    date: z.string().min(1, 'Informe a data'),
    time: z.string().optional(),
    amount: z.coerce.number().positive('Informe um valor maior que zero'),
    convertedAmount: z.coerce.number().positive('Informe um valor maior que zero'),
    accountUuid: z.string().min(1, 'Escolha uma conta'),
    fromAccountBalanceUuid: z.string().optional(),
    toAccountBalanceUuid: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.fromAccountBalanceUuid) {
      ctx.addIssue({ code: 'custom', message: 'Escolha a moeda de origem', path: ['fromAccountBalanceUuid'] })
    }
    if (!values.toAccountBalanceUuid) {
      ctx.addIssue({ code: 'custom', message: 'Escolha a moeda de destino', path: ['toAccountBalanceUuid'] })
    } else if (values.fromAccountBalanceUuid === values.toAccountBalanceUuid) {
      ctx.addIssue({
        code: 'custom',
        message: 'Origem e destino devem ser moedas diferentes.',
        path: ['toAccountBalanceUuid'],
      })
    }
  })

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface ExchangeFormModalProps {
  // Only accounts holding more than one currency make sense here — a
  // câmbio always converts between two balances of the same account.
  accounts: Account[]
  onClose: () => void
  onSubmit: (payload: TransactionPayload) => Promise<void>
}

// Only USD/EUR/GBP get a dedicated accent — those are the currencies the
// design system color-codes. Anything else (BRL, ARS, ...) falls back to the
// neutral brand tint below.
const currencySymbols: Partial<Record<Currency, string>> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BRL: 'R$',
}

const currencyAccents: Partial<Record<Currency, string>> = {
  USD: 'bg-brand-100 text-brand-600',
  EUR: 'bg-violet-vivid/12 text-violet',
  GBP: 'bg-indigo-vivid/12 text-indigo',
}

function balancePickerOptions(balances: AccountBalance[], excludeUuid?: string): PickerOption[] {
  return balances
    .filter((balance) => balance.uuid !== excludeUuid)
    .map((balance) => ({
      value: balance.uuid,
      label: balance.currency,
      sublabel: formatCurrency(balance.balance, balance.currency),
      leading: (
        <span
          className={`flex h-6 w-6 flex-none items-center justify-center rounded-md text-[11px] font-bold ${
            currencyAccents[balance.currency] ?? 'bg-brand-100 text-brand-700'
          }`}
        >
          {currencySymbols[balance.currency] ?? balance.currency.slice(0, 1)}
        </span>
      ),
    }))
}

export function ExchangeFormModal({ accounts, onClose, onSubmit }: ExchangeFormModalProps) {
  const [submitError, setSubmitError] = useState<unknown>(null)
  // Descrição stays open by default — it's required by the backend, unlike
  // Observação (never submitted, matches TransactionFormModal's local-only note).
  const [showDescription, setShowDescription] = useState(true)
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')
  // Tracks the quote fetched by the convert button — independent from form
  // validation, since a failed quote shouldn't block the user from typing
  // both amounts by hand.
  const [quoteStatus, setQuoteStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  // Guards against a slow quote response landing after a newer one started
  // (e.g. the user clicks convert twice in a row, or edits currencies
  // mid-flight).
  const quoteRequestId = useRef(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: todayIsoDate(),
      accountUuid: accounts[0]?.uuid,
    },
  })

  const accountUuid = watch('accountUuid')
  const fromAccountBalanceUuid = watch('fromAccountBalanceUuid')
  const toAccountBalanceUuid = watch('toAccountBalanceUuid')
  const amountValue = watch('amount')
  const convertedAmountValue = watch('convertedAmount')
  const timeValue = watch('time')

  const selectedAccount = accounts.find((account) => account.uuid === accountUuid)
  const balances = useMemo(() => selectedAccount?.balances ?? [], [selectedAccount])
  const fromBalance = balances.find((balance) => balance.uuid === fromAccountBalanceUuid)
  const toBalance = balances.find((balance) => balance.uuid === toAccountBalanceUuid)

  const accountPickerOptions = useMemo<PickerOption[]>(
    () =>
      accounts.map((account) => ({
        value: account.uuid,
        label: account.name,
        sublabel: account.balances.map((balance) => balance.currency).join(' · '),
        leading: <BankLogo name={account.bankName} size={22} />,
      })),
    [accounts],
  )

  const fromOptions = useMemo(
    () => balancePickerOptions(balances, toAccountBalanceUuid),
    [balances, toAccountBalanceUuid],
  )
  const toOptions = useMemo(
    () => balancePickerOptions(balances, fromAccountBalanceUuid),
    [balances, fromAccountBalanceUuid],
  )

  // Informational only — the rate implied by what the user typed in both
  // amount fields, not an auto-fetched quote and not used to fill either
  // field automatically.
  const amountNumber = Number(amountValue) || 0
  const convertedAmountNumber = Number(convertedAmountValue) || 0
  const impliedRate =
    fromBalance && toBalance && amountNumber > 0 && convertedAmountNumber > 0
      ? convertedAmountNumber / amountNumber
      : null

  function handleAccountChange(newAccountUuid: string) {
    setValue('accountUuid', newAccountUuid, { shouldValidate: true })
    setValue('fromAccountBalanceUuid', undefined, { shouldValidate: true })
    setValue('toAccountBalanceUuid', undefined, { shouldValidate: true })
    setQuoteStatus('idle')
  }

  // Fills in whichever amount is missing using a live quote — but that's
  // just a starting point, since the real rate at settlement time may differ
  // from the rate at entry time, so both fields stay freely editable
  // afterwards. If both are already filled, "Valor convertido" wins (it's
  // the one more likely to match what actually landed on a bank statement),
  // so origem gets recalculated from it.
  async function handleConvertClick() {
    if (!fromBalance || !toBalance) return

    const useConvertedAsSource = convertedAmountNumber > 0
    if (!useConvertedAsSource && amountNumber <= 0) return // nothing to convert

    const requestId = ++quoteRequestId.current
    setQuoteStatus('loading')
    try {
      const [fromQuote, toQuote] = await Promise.all([
        exchangeRatesApi.getLatestBrlRate(fromBalance.currency),
        exchangeRatesApi.getLatestBrlRate(toBalance.currency),
      ])
      if (requestId !== quoteRequestId.current) return // superseded by a newer click/edit

      if (!fromQuote || !toQuote) {
        setQuoteStatus('error')
        return
      }

      if (useConvertedAsSource) {
        const origin = Math.round(((convertedAmountNumber * toQuote.rateToBrl) / fromQuote.rateToBrl) * 100) / 100
        setValue('amount', origin, { shouldValidate: true })
      } else {
        const converted = Math.round(((amountNumber * fromQuote.rateToBrl) / toQuote.rateToBrl) * 100) / 100
        setValue('convertedAmount', converted, { shouldValidate: true })
      }
      setQuoteStatus('idle')
    } catch {
      if (requestId === quoteRequestId.current) setQuoteStatus('error')
    }
  }

  const submit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      await onSubmit({
        description: values.description,
        amount: values.amount,
        type: 'EXCHANGE',
        date: values.date,
        time: values.time ? `${values.time}:00` : null,
        categoryUuid: null,
        fromAccountBalanceUuid: values.fromAccountBalanceUuid,
        fromCreditCardUuid: null,
        toAccountBalanceUuid: values.toAccountBalanceUuid,
        convertedAmount: values.convertedAmount,
      })
      onClose()
    } catch (error) {
      setSubmitError(error)
    }
  }

  return (
    <Modal title="Novo câmbio" onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <PickerField
          label="Conta"
          placeholder="Selecione..."
          options={accountPickerOptions}
          value={accountUuid}
          onChange={handleAccountChange}
          error={errors.accountUuid?.message}
        />

        <div className="flex gap-3">
          <PickerField
            label="Moeda de origem"
            placeholder="Selecione..."
            options={fromOptions}
            value={fromAccountBalanceUuid}
            onChange={(value) => {
              setValue('fromAccountBalanceUuid', value, { shouldValidate: true })
              setQuoteStatus('idle')
            }}
            error={errors.fromAccountBalanceUuid?.message}
          />
          <PickerField
            label="Moeda de destino"
            placeholder="Selecione..."
            options={toOptions}
            value={toAccountBalanceUuid}
            onChange={(value) => {
              setValue('toAccountBalanceUuid', value, { shouldValidate: true })
              setQuoteStatus('idle')
            }}
            error={errors.toAccountBalanceUuid?.message}
          />
        </div>

        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <Field label="Valor de origem" htmlFor="amount" error={errors.amount?.message}>
              <CurrencyInput
                id="amount"
                currency={fromBalance?.currency ?? 'BRL'}
                value={typeof amountValue === 'number' ? amountValue : 0}
                onChange={(value) => setValue('amount', value, { shouldValidate: true })}
                className={`${inputClass} w-full`}
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={handleConvertClick}
            disabled={!fromBalance || !toBalance || (amountNumber <= 0 && convertedAmountNumber <= 0)}
            aria-label="Converter usando a cotação atual"
            title="Converter usando a cotação atual"
            className="mb-2.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-100 text-brand-600 transition-colors hover:bg-brand-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {quoteStatus === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowLeftRight size={16} />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <Field label="Valor convertido" htmlFor="convertedAmount" error={errors.convertedAmount?.message}>
              <div className="relative">
                <CurrencyInput
                  id="convertedAmount"
                  currency={toBalance?.currency ?? 'BRL'}
                  value={typeof convertedAmountValue === 'number' ? convertedAmountValue : 0}
                  onChange={(value) => {
                    setValue('convertedAmount', value, { shouldValidate: true })
                    setQuoteStatus('idle')
                  }}
                  className={`${inputClass} w-full bg-brand-100 pr-9 text-brand-700`}
                />
                <Calculator
                  size={15}
                  className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-brand-500"
                />
              </div>
            </Field>
          </div>
        </div>

        {quoteStatus === 'error' && (
          <div className="flex items-center gap-2 rounded-2xl bg-alert-vivid/12 px-3.5 py-2 text-xs text-alert">
            <AlertTriangle size={13} className="flex-none" />
            <span>Não foi possível buscar uma cotação agora. Informe o valor convertido manualmente.</span>
          </div>
        )}

        {impliedRate !== null && fromBalance && toBalance && (
          <div className="flex items-center gap-2 rounded-2xl bg-brand-100/50 px-3.5 py-2 text-xs text-brand-700">
            <RefreshCw size={13} className="flex-none" />
            <span>
              Cotação implícita: 1 {fromBalance.currency} = {impliedRate.toFixed(4)} {toBalance.currency}
            </span>
          </div>
        )}

        <div className="flex gap-3">
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
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-ink">Categoria</span>
            <div className="flex h-11 w-full items-center gap-2 rounded-2xl bg-surface px-3.5 text-sm text-ink/70">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-brand-100 text-brand-600">
                <ArrowLeftRight size={13} />
              </span>
              <span className="min-w-0 flex-1 truncate">Câmbio</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={() => setShowDescription((v) => !v)}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-black/[.06] ${
                showDescription ? 'bg-brand-100 text-brand-600' : 'bg-white text-ink/60'
              }`}
            >
              <FileText size={16} />
            </span>
            <span className={`text-[11px] font-semibold ${showDescription ? 'text-brand-600' : 'text-ink/60'}`}>
              Descrição
            </span>
          </button>
          <button type="button" onClick={() => setShowNote((v) => !v)} className="flex flex-col items-center gap-1.5">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-black/[.06] ${
                showNote ? 'bg-brand-100 text-brand-600' : 'bg-white text-ink/60'
              }`}
            >
              <MessageSquare size={16} />
            </span>
            <span className={`text-[11px] font-semibold ${showNote ? 'text-brand-600' : 'text-ink/60'}`}>
              Observação
            </span>
          </button>
        </div>

        {showDescription && (
          <Field label="Descrição" htmlFor="description" error={errors.description?.message}>
            <input
              id="description"
              className={inputClass}
              placeholder="Conversão para viagem"
              {...register('description')}
            />
          </Field>
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

        {Boolean(submitError) && <ErrorBanner error={submitError} />}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={accounts.length === 0}>
            <Repeat2 size={15} />
            Converter
          </Button>
        </div>
      </form>
    </Modal>
  )
}
