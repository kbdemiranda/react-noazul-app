import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Paperclip, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { accountsApi } from '../../api/accounts'
import { attachmentsApi } from '../../api/attachments'
import { categoriesApi } from '../../api/categories'
import { transactionsApi } from '../../api/transactions'
import { Button } from '../../components/Button'
import { CurrencyInput } from '../../components/CurrencyInput'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { PickerField, type PickerOption } from '../../components/PickerField'
import { TimeField } from '../../components/TimeField'
import { BankLogo } from '../../lib/bankLogos'
import { formatFileSize, todayIsoDate } from '../../lib/format'
import { accountTypeLabels } from '../../lib/labels'
import type { CreditCard } from '../../types/domain'

// "Cartão de Crédito" is one of the 34 shared SYSTEM categories seeded on both
// the backend (V4__seed_system_categories.sql) and the mock store — reused
// here so a payment always has a category (required for TRANSFER, though not
// type-checked) without asking the user to pick one for what's really debt
// repayment, not a purchase.
const PAYMENT_CATEGORY_NAME = 'Cartão de Crédito'

const schema = z.object({
  amount: z.coerce.number().positive('Informe um valor maior que zero'),
  date: z.string().min(1, 'Informe a data'),
  time: z.string().optional(),
  accountBalanceUuid: z.string().min(1, 'Escolha a conta de pagamento'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface PayCreditCardInvoiceModalProps {
  card: CreditCard
  onClose: () => void
}

export function PayCreditCardInvoiceModal({ card, onClose }: PayCreditCardInvoiceModalProps) {
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<unknown>(null)
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([])
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })

  // Paying a card is a same-currency transfer, same rule as an
  // account-to-account transfer — only balances in the card's own currency
  // can be picked as the payment source.
  const balanceOptions = useMemo(
    () =>
      (accountsQuery.data ?? []).flatMap((account) =>
        account.balances
          .filter((balance) => balance.currency === card.currency)
          .map((balance) => ({
            balanceUuid: balance.uuid,
            accountName: account.name,
            bankName: account.bankName,
            accountType: account.type,
          })),
      ),
    [accountsQuery.data, card.currency],
  )

  const accountPickerOptions = useMemo<PickerOption[]>(
    () =>
      balanceOptions.map((option) => ({
        value: option.balanceUuid,
        label: option.accountName,
        sublabel: `${accountTypeLabels[option.accountType]} · ${card.currency}`,
        leading: <BankLogo name={option.bankName} size={22} />,
      })),
    [balanceOptions, card.currency],
  )

  // The true amount currently owed on the card, not just this cycle's
  // charges — `currentInvoiceTotal + previousBalance` would double-count a
  // payment already made within the still-open current cycle.
  const totalDue = card.creditLimit - card.availableLimit

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: totalDue,
      date: todayIsoDate(),
      accountBalanceUuid: balanceOptions[0]?.balanceUuid,
    },
  })

  const amountValue = watch('amount')
  const timeValue = watch('time')
  const accountBalanceUuid = watch('accountBalanceUuid')

  const payMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const category =
        categoriesQuery.data?.find((c) => c.name === PAYMENT_CATEGORY_NAME) ?? categoriesQuery.data?.[0]
      const transaction = await transactionsApi.create({
        description: `Pagamento fatura ${card.name}`,
        amount: values.amount,
        type: 'TRANSFER',
        date: values.date,
        time: values.time ? `${values.time}:00` : null,
        categoryUuid: category?.uuid ?? null,
        fromAccountBalanceUuid: values.accountBalanceUuid,
        toCreditCardUuid: card.uuid,
      })
      for (const file of pendingAttachments) {
        await attachmentsApi.upload(transaction.uuid, file)
      }
      return transaction
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      onClose()
    },
  })

  const submit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      await payMutation.mutateAsync(values)
    } catch (error) {
      setSubmitError(error)
    }
  }

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPendingAttachments((current) => [...current, file])
    if (attachmentInputRef.current) attachmentInputRef.current.value = ''
  }

  const removeAttachment = (index: number) => {
    setPendingAttachments((current) => current.filter((_, i) => i !== index))
  }

  return (
    <Modal title="Pagar fatura" onClose={onClose}>
      <p className="-mt-3 mb-4 text-[12.5px] text-ink/55">
        Confirme os dados do pagamento da fatura {card.name}.
      </p>

      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        {balanceOptions.length === 0 && !accountsQuery.isLoading && (
          <ErrorBanner error={new Error(`Cadastre uma conta em ${card.currency} para pagar esta fatura.`)} />
        )}

        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <Field label="Valor a pagar" htmlFor="amount" error={errors.amount?.message}>
              <CurrencyInput
                id="amount"
                currency={card.currency}
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

        <PickerField
          label="Conta de pagamento"
          placeholder="Selecione..."
          options={accountPickerOptions}
          value={accountBalanceUuid}
          onChange={(value) => setValue('accountBalanceUuid', value, { shouldValidate: true })}
          error={errors.accountBalanceUuid?.message}
        />

        <div className="flex flex-col gap-2 rounded-2xl bg-surface p-3">
          {pendingAttachments.length === 0 && (
            <p className="text-[12.5px] text-ink/60">
              Anexe o comprovante de pagamento — enviado assim que a fatura for paga.
            </p>
          )}
          {pendingAttachments.length > 0 && (
            <ul className="flex flex-col">
              {pendingAttachments.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center gap-2.5 border-b border-ink/[.06] py-2 last:border-b-0">
                  <FileText size={16} className="flex-none text-ink/50" />
                  <div className="min-w-0 flex-1 text-[12.5px]">
                    <p className="truncate text-ink">{file.name}</p>
                    <p className="text-[11px] text-ink/55">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remover ${file.name}`}
                    className="rounded-full p-1.5 text-expense hover:bg-expense-vivid/12"
                    onClick={() => removeAttachment(index)}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={attachmentInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleAttachmentChange}
          />
          <Button type="button" variant="ghost" className="w-fit px-0" onClick={() => attachmentInputRef.current?.click()}>
            <Paperclip size={14} />
            Anexar comprovante
          </Button>
        </div>

        {Boolean(submitError) && <ErrorBanner error={submitError} />}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="success" isLoading={isSubmitting} disabled={balanceOptions.length === 0}>
            Pagar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
