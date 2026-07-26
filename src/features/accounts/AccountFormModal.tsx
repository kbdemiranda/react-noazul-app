import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components/Button'
import { CurrencyInput } from '../../components/CurrencyInput'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { SegmentedControl } from '../../components/SegmentedControl'
import { CURRENCIES, accountTypeLabels } from '../../lib/labels'
import type { Account, AccountType, Currency } from '../../types/domain'
import type { AccountBalancePayload, AccountCreatePayload, AccountUpdatePayload } from '../../api/accounts'
import { useState } from 'react'

const schema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  bankName: z.string().min(1, 'Informe o banco'),
  type: z.enum(['CHECKING', 'SAVINGS', 'DIGITAL_WALLET', 'OTHER']),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface AccountFormModalProps {
  account?: Account
  onClose: () => void
  // extraBalances is only populated on create, for every currency selected
  // besides the first — the account itself is created with the first
  // currency, then a balance is added for each of the rest.
  onSubmit: (payload: AccountCreatePayload | AccountUpdatePayload, extraBalances?: AccountBalancePayload[]) => Promise<void>
}

export function AccountFormModal({ account, onClose, onSubmit }: AccountFormModalProps) {
  const [submitError, setSubmitError] = useState<unknown>(null)
  const isCreate = !account
  // Selecting more than one currency here is how an account becomes
  // multi-currency (e.g. Wise) right from creation — the same thing "+
  // Moeda" does later for an existing account, just batched up front.
  const [selectedCurrencies, setSelectedCurrencies] = useState<Currency[]>(['BRL'])
  const [balances, setBalances] = useState<Partial<Record<Currency, number>>>({ BRL: 0 })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: account
      ? { name: account.name, bankName: account.bankName, type: account.type }
      : { type: 'CHECKING' as AccountType },
  })

  const selectedType = watch('type')

  function toggleCurrency(currency: Currency) {
    setSelectedCurrencies((prev) => {
      if (prev.includes(currency)) {
        if (prev.length === 1) return prev // at least one currency stays selected
        return prev.filter((c) => c !== currency)
      }
      return [...prev, currency]
    })
    setBalances((prev) => (currency in prev ? prev : { ...prev, [currency]: 0 }))
  }

  const submit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      if (isCreate) {
        const [firstCurrency, ...restCurrencies] = selectedCurrencies
        const payload: AccountCreatePayload = {
          name: values.name,
          bankName: values.bankName,
          type: values.type,
          currency: firstCurrency,
          balance: balances[firstCurrency] ?? 0,
        }
        const extraBalances: AccountBalancePayload[] = restCurrencies.map((currency) => ({
          currency,
          balance: balances[currency] ?? 0,
        }))
        await onSubmit(payload, extraBalances)
      } else {
        const payload: AccountUpdatePayload = { name: values.name, bankName: values.bankName, type: values.type }
        await onSubmit(payload)
      }
      onClose()
    } catch (error) {
      setSubmitError(error)
    }
  }

  return (
    <Modal title={account ? 'Editar conta' : 'Nova conta'} onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <Field label="Nome" htmlFor="name" error={errors.name?.message}>
          <input id="name" className={inputClass} placeholder="Conta principal" {...register('name')} />
        </Field>
        <Field label="Instituição | Banco" htmlFor="bankName" error={errors.bankName?.message}>
          <input id="bankName" className={inputClass} placeholder="Itaú" {...register('bankName')} />
        </Field>
        <Field label="Tipo" htmlFor="type" error={errors.type?.message}>
          <SegmentedControl
            name="type"
            value={selectedType}
            onChange={(value) => setValue('type', value, { shouldValidate: true })}
            options={Object.entries(accountTypeLabels).map(([value, label]) => ({
              value: value as AccountType,
              label,
            }))}
            className="w-full"
          />
        </Field>
        {isCreate && (
          <>
            <div className="flex flex-col gap-1.5">
              <span id="currencies-label" className="text-[13px] font-semibold text-ink">
                Moedas
              </span>
              <div role="group" aria-labelledby="currencies-label" className="inline-flex flex-wrap gap-1 rounded-full bg-black/[.06] p-1">
                {CURRENCIES.map((currency) => {
                  const active = selectedCurrencies.includes(currency)
                  return (
                    <button
                      key={currency}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleCurrency(currency)}
                      className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                        active ? 'bg-white text-ink shadow-sm' : 'text-ink/60 hover:text-ink'
                      }`}
                    >
                      {currency}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-ink/55">
                Selecione mais de uma moeda para criar uma conta multi-moeda (ex: Wise, Revolut).
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <span id="initial-balances-label" className="text-[13px] font-semibold text-ink">
                Saldo inicial
              </span>
              <div role="group" aria-labelledby="initial-balances-label" className="grid grid-cols-2 gap-3">
                {selectedCurrencies.map((currency) => (
                  <div key={currency} className="flex flex-col gap-1">
                    <label htmlFor={`balance-${currency}`} className="text-xs font-medium text-ink/60">
                      {currency}
                    </label>
                    <CurrencyInput
                      id={`balance-${currency}`}
                      currency={currency}
                      value={balances[currency] ?? 0}
                      onChange={(value) => setBalances((prev) => ({ ...prev, [currency]: value }))}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {Boolean(submitError) && <ErrorBanner error={submitError} />}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
