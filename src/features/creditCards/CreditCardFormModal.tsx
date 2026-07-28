import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { CreditCardPayload } from '../../api/creditCards'
import { Button } from '../../components/Button'
import { CurrencyInput } from '../../components/CurrencyInput'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { SegmentedControl } from '../../components/SegmentedControl'
import { CURRENCIES } from '../../lib/labels'
import type { Currency, CreditCard } from '../../types/domain'

const schema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  issuer: z.string().min(1, 'Informe o emissor'),
  currency: z.enum(['BRL', 'USD', 'EUR', 'GBP', 'ARS']),
  creditLimit: z.coerce.number().positive('Informe um limite maior que zero'),
  closingDay: z.coerce.number().int().min(1).max(31),
  dueDay: z.coerce.number().int().min(1).max(31),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface CreditCardFormModalProps {
  card?: CreditCard
  onClose: () => void
  onSubmit: (payload: CreditCardPayload) => Promise<void>
}

export function CreditCardFormModal({ card, onClose, onSubmit }: CreditCardFormModalProps) {
  const [submitError, setSubmitError] = useState<unknown>(null)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: card
      ? {
          name: card.name,
          issuer: card.issuer,
          currency: card.currency,
          creditLimit: card.creditLimit,
          closingDay: card.closingDay,
          dueDay: card.dueDay,
        }
      : { currency: 'BRL' as Currency, closingDay: 1, dueDay: 10 },
  })

  const selectedCurrency = watch('currency')
  const creditLimit = watch('creditLimit')

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
    <Modal title={card ? 'Editar cartão' : 'Novo cartão'} onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <Field label="Nome" htmlFor="name" error={errors.name?.message}>
          <input id="name" className={inputClass} placeholder="Cartão principal" {...register('name')} />
        </Field>
        <Field label="Emissor" htmlFor="issuer" error={errors.issuer?.message}>
          <input id="issuer" className={inputClass} placeholder="Itaucard, Inter..." {...register('issuer')} />
        </Field>
        <Field label="Moeda" htmlFor="currency" error={errors.currency?.message}>
          <SegmentedControl
            name="currency"
            value={selectedCurrency}
            onChange={(value) => setValue('currency', value, { shouldValidate: true })}
            options={CURRENCIES.map((currency) => ({ value: currency, label: currency }))}
            className="w-full"
          />
        </Field>
        <Field label="Limite" htmlFor="creditLimit" error={errors.creditLimit?.message}>
          <CurrencyInput
            id="creditLimit"
            currency={selectedCurrency}
            value={typeof creditLimit === 'number' ? creditLimit : 0}
            onChange={(value) => setValue('creditLimit', value, { shouldValidate: true })}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Dia de fechamento" htmlFor="closingDay" error={errors.closingDay?.message}>
            <input id="closingDay" type="number" min={1} max={31} className={inputClass} {...register('closingDay')} />
          </Field>
          <Field label="Dia de vencimento" htmlFor="dueDay" error={errors.dueDay?.message}>
            <input id="dueDay" type="number" min={1} max={31} className={inputClass} {...register('dueDay')} />
          </Field>
        </div>

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
