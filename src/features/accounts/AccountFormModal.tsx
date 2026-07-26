import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components/Button'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { SegmentedControl } from '../../components/SegmentedControl'
import { CURRENCIES, accountTypeLabels } from '../../lib/labels'
import type { Account, AccountType, Currency } from '../../types/domain'
import type { AccountCreatePayload, AccountUpdatePayload } from '../../api/accounts'
import { useState } from 'react'

function buildSchema(isCreate: boolean) {
  return z
    .object({
      name: z.string().min(1, 'Informe um nome'),
      bankName: z.string().min(1, 'Informe o banco'),
      type: z.enum(['CHECKING', 'SAVINGS', 'DIGITAL_WALLET', 'OTHER']),
      currency: z.enum(['BRL', 'USD', 'EUR', 'GBP', 'ARS']).optional(),
      balance: z.coerce.number({ message: 'Informe um valor válido' }).optional(),
    })
    .superRefine((values, ctx) => {
      if (isCreate && !values.currency) {
        ctx.addIssue({ code: 'custom', message: 'Escolha uma moeda', path: ['currency'] })
      }
    })
}

type FormInput = z.input<ReturnType<typeof buildSchema>>
type FormValues = z.output<ReturnType<typeof buildSchema>>

interface AccountFormModalProps {
  account?: Account
  onClose: () => void
  onSubmit: (payload: AccountCreatePayload | AccountUpdatePayload) => Promise<void>
}

export function AccountFormModal({ account, onClose, onSubmit }: AccountFormModalProps) {
  const [submitError, setSubmitError] = useState<unknown>(null)
  const isCreate = !account
  const schema = buildSchema(isCreate)

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
      : { type: 'CHECKING' as AccountType, currency: 'BRL' as Currency, balance: 0 },
  })

  const selectedType = watch('type')
  const selectedCurrency = watch('currency')

  const submit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      if (isCreate) {
        const payload: AccountCreatePayload = {
          name: values.name,
          bankName: values.bankName,
          type: values.type,
          currency: values.currency!,
          balance: values.balance ?? 0,
        }
        await onSubmit(payload)
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
            <Field label="Moeda" htmlFor="currency" error={errors.currency?.message}>
              <SegmentedControl
                name="currency"
                value={selectedCurrency ?? 'BRL'}
                onChange={(value) => setValue('currency', value, { shouldValidate: true })}
                options={CURRENCIES.map((currency) => ({ value: currency, label: currency }))}
                className="w-full"
              />
            </Field>
            <Field label="Saldo" htmlFor="balance" error={errors.balance?.message}>
              <input id="balance" type="number" step="0.01" className={inputClass} {...register('balance')} />
            </Field>
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
