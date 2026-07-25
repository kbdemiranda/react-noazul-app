import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Account, CreditCard, Transaction } from '../../types/domain'
import { categoriesApi } from '../../api/categories'
import type { TransactionPayload } from '../../api/transactions'
import { Button } from '../../components/Button'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { SegmentedControl } from '../../components/SegmentedControl'
import { WarningBanner } from '../../components/WarningBanner'
import { todayIsoDate } from '../../lib/format'

const schema = z
  .object({
    description: z.string().min(1, 'Informe uma descrição'),
    amount: z.coerce.number().positive('Informe um valor maior que zero'),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    date: z.string().min(1, 'Informe a data'),
    time: z.string().optional(),
    categoryUuid: z.string().min(1, 'Escolha uma categoria'),
    destination: z.enum(['account', 'creditCard']),
    accountUuid: z.string().optional(),
    creditCardUuid: z.string().optional(),
    toAccountUuid: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'TRANSFER') {
      if (!values.accountUuid) {
        ctx.addIssue({ code: 'custom', message: 'Escolha a conta de origem', path: ['accountUuid'] })
      }
      if (!values.toAccountUuid) {
        ctx.addIssue({ code: 'custom', message: 'Escolha a conta de destino', path: ['toAccountUuid'] })
      } else if (values.accountUuid && values.accountUuid === values.toAccountUuid) {
        ctx.addIssue({
          code: 'custom',
          message: 'Origem e destino devem ser contas diferentes.',
          path: ['toAccountUuid'],
        })
      }
      return
    }
    if (values.destination === 'account' ? !values.accountUuid : !values.creditCardUuid) {
      ctx.addIssue({ code: 'custom', message: 'Escolha uma conta ou cartão', path: ['accountUuid'] })
    }
  })

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

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
          type: transaction.type,
          date: transaction.date,
          time: transaction.time?.slice(0, 5),
          categoryUuid: transaction.categoryUuid,
          destination: transaction.fromAccountUuid ? 'account' : 'creditCard',
          accountUuid: transaction.fromAccountUuid ?? undefined,
          creditCardUuid: transaction.fromCreditCardUuid ?? undefined,
          toAccountUuid: transaction.toAccountUuid ?? undefined,
        }
      : {
          type: 'EXPENSE',
          date: todayIsoDate(),
          destination: accounts.length > 0 ? 'account' : 'creditCard',
        },
  })

  const selectedType = watch('type')
  const destination = watch('destination')
  const isTransfer = selectedType === 'TRANSFER'
  const notEnoughAccountsForTransfer = isTransfer && accounts.length < 2
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const categoryOptions = useMemo(
    () => (isTransfer ? (categoriesQuery.data ?? []) : (categoriesQuery.data ?? []).filter((c) => c.type === selectedType)),
    [categoriesQuery.data, selectedType, isTransfer],
  )

  const submit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      await onSubmit({
        description: values.description,
        amount: values.amount,
        type: values.type,
        date: values.date,
        time: values.time ? `${values.time}:00` : null,
        categoryUuid: values.categoryUuid,
        fromAccountUuid: values.type === 'TRANSFER' ? values.accountUuid : values.destination === 'account' ? values.accountUuid : null,
        fromCreditCardUuid: values.type === 'TRANSFER' ? null : values.destination === 'creditCard' ? values.creditCardUuid : null,
        toAccountUuid: values.type === 'TRANSFER' ? values.toAccountUuid : null,
      })
      onClose()
    } catch (error) {
      setSubmitError(error)
    }
  }

  return (
    <Modal title={transaction ? 'Editar transação' : 'Nova transação'} onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <SegmentedControl
          name="type"
          value={selectedType}
          onChange={(value) => setValue('type', value, { shouldValidate: true })}
          options={[
            { value: 'EXPENSE', label: 'Despesa' },
            { value: 'INCOME', label: 'Receita' },
            { value: 'TRANSFER', label: 'Transferência' },
          ]}
        />

        <Field label="Descrição" htmlFor="description" error={errors.description?.message}>
          <input id="description" className={inputClass} placeholder="Mercado do mês" {...register('description')} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Valor" htmlFor="amount" error={errors.amount?.message}>
            <input id="amount" type="number" step="0.01" className={inputClass} {...register('amount')} />
          </Field>
          <Field label="Data" htmlFor="date" error={errors.date?.message}>
            <input id="date" type="date" className={inputClass} {...register('date')} />
          </Field>
        </div>

        <Field label="Hora (opcional)" htmlFor="time" error={errors.time?.message}>
          <input id="time" type="time" className={inputClass} {...register('time')} />
        </Field>

        <Field label="Categoria" htmlFor="categoryUuid" error={errors.categoryUuid?.message}>
          <select id="categoryUuid" className={inputClass} {...register('categoryUuid')}>
            <option value="">Selecione...</option>
            {categoryOptions.map((category) => (
              <option key={category.uuid} value={category.uuid}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        {isTransfer ? (
          <>
            <Field label="Conta de origem" htmlFor="accountUuid" error={errors.accountUuid?.message}>
              <select id="accountUuid" className={inputClass} {...register('accountUuid')}>
                <option value="">Selecione...</option>
                {accounts.map((account) => (
                  <option key={account.uuid} value={account.uuid}>
                    {account.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Conta de destino" htmlFor="toAccountUuid" error={errors.toAccountUuid?.message}>
              <select id="toAccountUuid" className={inputClass} {...register('toAccountUuid')}>
                <option value="">Selecione...</option>
                {accounts.map((account) => (
                  <option key={account.uuid} value={account.uuid}>
                    {account.name}
                  </option>
                ))}
              </select>
            </Field>
            {notEnoughAccountsForTransfer && (
              <WarningBanner>Você precisa de pelo menos duas contas bancárias para transferir.</WarningBanner>
            )}
          </>
        ) : (
          <Field label="Conta ou cartão" htmlFor="accountUuid">
            <SegmentedControl
              name="destination"
              value={destination}
              onChange={(value) => setValue('destination', value, { shouldValidate: true })}
              options={[
                { value: 'account', label: 'Conta' },
                { value: 'creditCard', label: 'Cartão' },
              ]}
              className="mb-2"
            />
            {destination === 'account' ? (
              <select id="accountUuid" className={inputClass} {...register('accountUuid')}>
                <option value="">Selecione...</option>
                {accounts.map((account) => (
                  <option key={account.uuid} value={account.uuid}>
                    {account.name}
                  </option>
                ))}
              </select>
            ) : (
              <select id="creditCardUuid" className={inputClass} {...register('creditCardUuid')}>
                <option value="">Selecione...</option>
                {creditCards.map((card) => (
                  <option key={card.uuid} value={card.uuid}>
                    {card.name}
                  </option>
                ))}
              </select>
            )}
            {errors.accountUuid?.message && <span className="text-xs text-expense">{errors.accountUuid.message}</span>}
          </Field>
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
