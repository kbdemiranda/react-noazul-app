import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components/Button'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { SegmentedControl } from '../../components/SegmentedControl'
import { CURRENCIES } from '../../lib/labels'
import type { Account, Currency } from '../../types/domain'
import type { AccountBalancePayload } from '../../api/accounts'
import { useState } from 'react'

const schema = z.object({
  currency: z.enum(['BRL', 'USD', 'EUR', 'GBP', 'ARS']),
  balance: z.coerce.number({ message: 'Informe um valor válido' }),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface AddAccountBalanceModalProps {
  account: Account
  onClose: () => void
  onSubmit: (payload: AccountBalancePayload) => Promise<void>
}

export function AddAccountBalanceModal({ account, onClose, onSubmit }: AddAccountBalanceModalProps) {
  const [submitError, setSubmitError] = useState<unknown>(null)
  const availableCurrencies = CURRENCIES.filter(
    (currency) => !account.balances.some((balance) => balance.currency === currency),
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: (availableCurrencies[0] ?? 'BRL') as Currency, balance: 0 },
  })

  const selectedCurrency = watch('currency')

  const submit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      await onSubmit(values)
      onClose()
    } catch (error) {
      setSubmitError(error)
    }
  }

  return (
    <Modal title={`Adicionar moeda — ${account.name}`} onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        {availableCurrencies.length === 0 ? (
          <p className="text-[13px] text-ink/65">Esta conta já possui saldo em todas as moedas disponíveis.</p>
        ) : (
          <>
            <Field label="Moeda" htmlFor="currency" error={errors.currency?.message}>
              <SegmentedControl
                name="currency"
                value={selectedCurrency}
                onChange={(value) => setValue('currency', value, { shouldValidate: true })}
                options={availableCurrencies.map((currency) => ({ value: currency, label: currency }))}
                className="w-full"
              />
            </Field>
            <Field label="Saldo inicial" htmlFor="balance" error={errors.balance?.message}>
              <input id="balance" type="number" step="0.01" className={inputClass} {...register('balance')} />
            </Field>
          </>
        )}

        {Boolean(submitError) && <ErrorBanner error={submitError} />}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={availableCurrencies.length === 0}>
            Adicionar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
