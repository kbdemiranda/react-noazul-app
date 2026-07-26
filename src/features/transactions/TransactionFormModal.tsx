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
import { flowTypeLabels } from '../../lib/labels'

const schema = z
  .object({
    description: z.string().min(1, 'Informe uma descrição'),
    amount: z.coerce.number().positive('Informe um valor maior que zero'),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'EXCHANGE']),
    date: z.string().min(1, 'Informe a data'),
    time: z.string().optional(),
    categoryUuid: z.string().optional(),
    destination: z.enum(['account', 'creditCard']),
    accountBalanceUuid: z.string().optional(),
    creditCardUuid: z.string().optional(),
    toAccountBalanceUuid: z.string().optional(),
    convertedAmount: z.coerce.number().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'EXCHANGE') {
      if (!values.accountBalanceUuid) {
        ctx.addIssue({ code: 'custom', message: 'Escolha o saldo de origem', path: ['accountBalanceUuid'] })
      }
      if (!values.toAccountBalanceUuid) {
        ctx.addIssue({ code: 'custom', message: 'Escolha o saldo de destino', path: ['toAccountBalanceUuid'] })
      }
      if (!values.convertedAmount || values.convertedAmount <= 0) {
        ctx.addIssue({ code: 'custom', message: 'Informe o valor convertido', path: ['convertedAmount'] })
      }
      return
    }
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
  currency: string
  label: string
}

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

  const balanceOptions = useMemo<BalanceOption[]>(
    () =>
      accounts.flatMap((account) =>
        account.balances.map((balance) => ({
          balanceUuid: balance.uuid,
          accountUuid: account.uuid,
          currency: balance.currency,
          label: `${account.name} · ${balance.currency}`,
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
          type: transaction.type,
          date: transaction.date,
          time: transaction.time?.slice(0, 5),
          categoryUuid: transaction.categoryUuid ?? undefined,
          destination: transaction.fromAccountBalanceUuid ? 'account' : 'creditCard',
          accountBalanceUuid: transaction.fromAccountBalanceUuid ?? undefined,
          creditCardUuid: transaction.fromCreditCardUuid ?? undefined,
          toAccountBalanceUuid: transaction.toAccountBalanceUuid ?? undefined,
          convertedAmount: transaction.convertedAmount ?? undefined,
        }
      : {
          type: 'EXPENSE',
          date: todayIsoDate(),
          destination: accounts.length > 0 ? 'account' : 'creditCard',
        },
  })

  const selectedType = watch('type')
  const destination = watch('destination')
  const sourceBalanceUuid = watch('accountBalanceUuid')
  const isTransfer = selectedType === 'TRANSFER'
  const isExchange = selectedType === 'EXCHANGE'
  const notEnoughAccountsForTransfer =
    isTransfer && new Set(balanceOptions.map((option) => option.accountUuid)).size < 2
  const notEnoughBalancesForExchange = isExchange && !accounts.some((account) => account.balances.length >= 2)

  const sourceBalance = balanceOptions.find((option) => option.balanceUuid === sourceBalanceUuid)
  const transferTargetOptions = balanceOptions.filter((option) => option.accountUuid !== sourceBalance?.accountUuid)
  const exchangeTargetOptions = balanceOptions.filter(
    (option) => option.accountUuid === sourceBalance?.accountUuid && option.balanceUuid !== sourceBalanceUuid,
  )

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const categoryOptions = useMemo(
    () =>
      isTransfer ? (categoriesQuery.data ?? []) : (categoriesQuery.data ?? []).filter((c) => c.type === selectedType),
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
        categoryUuid: values.type === 'EXCHANGE' ? null : (values.categoryUuid ?? null),
        fromAccountBalanceUuid:
          values.type === 'TRANSFER' || values.type === 'EXCHANGE'
            ? values.accountBalanceUuid
            : values.destination === 'account'
              ? values.accountBalanceUuid
              : null,
        fromCreditCardUuid:
          values.type === 'TRANSFER' || values.type === 'EXCHANGE'
            ? null
            : values.destination === 'creditCard'
              ? values.creditCardUuid
              : null,
        toAccountBalanceUuid:
          values.type === 'TRANSFER' || values.type === 'EXCHANGE' ? values.toAccountBalanceUuid : null,
        convertedAmount: values.type === 'EXCHANGE' ? values.convertedAmount : null,
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
            { value: 'EXPENSE', label: flowTypeLabels.EXPENSE },
            { value: 'INCOME', label: flowTypeLabels.INCOME },
            { value: 'TRANSFER', label: flowTypeLabels.TRANSFER },
            { value: 'EXCHANGE', label: flowTypeLabels.EXCHANGE },
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

        {!isExchange && (
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
        )}

        {isTransfer && (
          <>
            <Field label="Conta de origem" htmlFor="accountBalanceUuid" error={errors.accountBalanceUuid?.message}>
              <select id="accountBalanceUuid" className={inputClass} {...register('accountBalanceUuid')}>
                <option value="">Selecione...</option>
                {balanceOptions.map((option) => (
                  <option key={option.balanceUuid} value={option.balanceUuid}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Conta de destino" htmlFor="toAccountBalanceUuid" error={errors.toAccountBalanceUuid?.message}>
              <select id="toAccountBalanceUuid" className={inputClass} {...register('toAccountBalanceUuid')}>
                <option value="">Selecione...</option>
                {transferTargetOptions.map((option) => (
                  <option key={option.balanceUuid} value={option.balanceUuid}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            {notEnoughAccountsForTransfer && (
              <WarningBanner>Você precisa de pelo menos duas contas bancárias para transferir.</WarningBanner>
            )}
          </>
        )}

        {isExchange && (
          <>
            <Field label="Saldo de origem" htmlFor="accountBalanceUuid" error={errors.accountBalanceUuid?.message}>
              <select id="accountBalanceUuid" className={inputClass} {...register('accountBalanceUuid')}>
                <option value="">Selecione...</option>
                {balanceOptions.map((option) => (
                  <option key={option.balanceUuid} value={option.balanceUuid}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Saldo de destino" htmlFor="toAccountBalanceUuid" error={errors.toAccountBalanceUuid?.message}>
              <select id="toAccountBalanceUuid" className={inputClass} {...register('toAccountBalanceUuid')}>
                <option value="">Selecione...</option>
                {exchangeTargetOptions.map((option) => (
                  <option key={option.balanceUuid} value={option.balanceUuid}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Valor convertido (moeda de destino)" htmlFor="convertedAmount" error={errors.convertedAmount?.message}>
              <input id="convertedAmount" type="number" step="0.01" className={inputClass} {...register('convertedAmount')} />
            </Field>
            {notEnoughBalancesForExchange && (
              <WarningBanner>
                Você precisa de uma conta com pelo menos duas moedas para fazer um câmbio interno.
              </WarningBanner>
            )}
          </>
        )}

        {!isTransfer && !isExchange && (
          <Field label="Conta ou cartão" htmlFor="accountBalanceUuid">
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
              <select id="accountBalanceUuid" className={inputClass} {...register('accountBalanceUuid')}>
                <option value="">Selecione...</option>
                {balanceOptions.map((option) => (
                  <option key={option.balanceUuid} value={option.balanceUuid}>
                    {option.label}
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
            {errors.accountBalanceUuid?.message && (
              <span className="text-xs text-expense">{errors.accountBalanceUuid.message}</span>
            )}
          </Field>
        )}

        {Boolean(submitError) && <ErrorBanner error={submitError} />}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={notEnoughAccountsForTransfer || notEnoughBalancesForExchange}
          >
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
