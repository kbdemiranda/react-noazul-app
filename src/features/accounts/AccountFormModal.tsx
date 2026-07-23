import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components/Button'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { SegmentedControl } from '../../components/SegmentedControl'
import { accountTypeLabels } from '../../lib/labels'
import type { Account, AccountType } from '../../types/domain'
import type { AccountPayload } from '../../api/accounts'
import { useState } from 'react'

const schema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  bankName: z.string().min(1, 'Informe o banco'),
  type: z.enum(['CHECKING', 'SAVINGS', 'DIGITAL_WALLET', 'OTHER']),
  balance: z.coerce.number({ message: 'Informe um valor válido' }),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface AccountFormModalProps {
  account?: Account
  onClose: () => void
  onSubmit: (payload: AccountPayload) => Promise<void>
}

export function AccountFormModal({ account, onClose, onSubmit }: AccountFormModalProps) {
  const [submitError, setSubmitError] = useState<unknown>(null)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: account
      ? { name: account.name, bankName: account.bankName, type: account.type, balance: account.balance }
      : { type: 'CHECKING' as AccountType, balance: 0 },
  })

  const selectedType = watch('type')

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
    <Modal title={account ? 'Editar conta' : 'Nova conta'} onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <Field label="Nome" htmlFor="name" error={errors.name?.message}>
          <input id="name" className={inputClass} placeholder="Conta principal" {...register('name')} />
        </Field>
        <Field label="Banco" htmlFor="bankName" error={errors.bankName?.message}>
          <input id="bankName" className={inputClass} placeholder="Itaú, Nubank, Inter..." {...register('bankName')} />
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
        <Field label="Saldo" htmlFor="balance" error={errors.balance?.message}>
          <input id="balance" type="number" step="0.01" className={inputClass} {...register('balance')} />
        </Field>

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
