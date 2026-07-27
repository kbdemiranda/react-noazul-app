import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { accountsApi } from '../../api/accounts'
import { creditCardsApi } from '../../api/creditCards'
import { AuthSplitLayout } from '../../components/AuthSplitLayout'
import { Button } from '../../components/Button'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { SegmentedControl } from '../../components/SegmentedControl'
import { useAuth } from '../../context/AuthContext'
import { accountTypeLabels } from '../../lib/labels'
import type { AccountType } from '../../types/domain'

const accountSchema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  bankName: z.string().min(1, 'Informe o banco'),
  type: z.enum(['CHECKING', 'SAVINGS', 'DIGITAL_WALLET', 'OTHER']),
  balance: z.coerce.number({ message: 'Informe um valor válido' }),
})
type AccountFormInput = z.input<typeof accountSchema>
type AccountFormValues = z.output<typeof accountSchema>

const cardSchema = z.object({
  name: z.string().min(1, 'Informe um nome'),
  issuer: z.string().min(1, 'Informe a bandeira'),
  creditLimit: z.coerce.number().positive('Informe um limite maior que zero'),
  closingDay: z.coerce.number().int().min(1).max(31),
  dueDay: z.coerce.number().int().min(1).max(31),
})
type CardFormInput = z.input<typeof cardSchema>
type CardFormValues = z.output<typeof cardSchema>

type Origin = 'account' | 'card'

export function OnboardingPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [origin, setOrigin] = useState<Origin>('account')
  const [submitError, setSubmitError] = useState<unknown>(null)

  const accountForm = useForm<AccountFormInput, unknown, AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { type: 'CHECKING', balance: 0 },
  })
  const cardForm = useForm<CardFormInput, unknown, CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { closingDay: 1, dueDay: 10 },
  })

  const accountType = accountForm.watch('type')

  const submitAccount = accountForm.handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      // Onboarding always starts a plain BRL account — additional currencies
      // (making it multi-currency, e.g. Wise) can be added later from the
      // Accounts page.
      await accountsApi.create({ ...values, currency: 'BRL' })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(error)
    }
  })

  const submitCard = cardForm.handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await creditCardsApi.create({ ...values, currency: 'BRL' })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(error)
    }
  })

  return (
    <AuthSplitLayout
      heading="Quase lá."
      description="Finalize seu cadastro adicionando uma conta bancária ou um cartão de crédito para começar a acompanhar receitas, despesas e faturas com clareza."
    >
      <h1 className="mb-1 text-2xl font-semibold text-ink">Vamos começar</h1>
      <p className="mb-6 text-sm text-ink/65">
        Para usar o NoAzul, cadastre pelo menos uma conta bancária ou um cartão de crédito.
      </p>

      <SegmentedControl
        name="origin"
        value={origin}
        onChange={setOrigin}
        options={[
          { value: 'account', label: 'Conta bancária' },
          { value: 'card', label: 'Cartão de crédito' },
        ]}
        className="mb-6 w-full"
      />

      {Boolean(submitError) && <ErrorBanner error={submitError} />}

      {origin === 'account' ? (
        <form onSubmit={submitAccount} className="flex flex-col gap-4">
          <Field label="Nome" htmlFor="ob-name" error={accountForm.formState.errors.name?.message}>
            <input
              id="ob-name"
              className={inputClass}
              placeholder="Conta principal"
              {...accountForm.register('name')}
            />
          </Field>
          <Field label="Banco" htmlFor="ob-bank" error={accountForm.formState.errors.bankName?.message}>
            <input
              id="ob-bank"
              className={inputClass}
              placeholder="Itaú, Nubank, Inter..."
              {...accountForm.register('bankName')}
            />
          </Field>
          <Field label="Tipo" htmlFor="ob-type" error={accountForm.formState.errors.type?.message}>
            <SegmentedControl
              name="ob-type"
              value={accountType}
              onChange={(value) => accountForm.setValue('type', value, { shouldValidate: true })}
              options={Object.entries(accountTypeLabels).map(([value, label]) => ({
                value: value as AccountType,
                label,
              }))}
              className="w-full"
            />
          </Field>
          <Field label="Saldo inicial" htmlFor="ob-balance" error={accountForm.formState.errors.balance?.message}>
            <input id="ob-balance" type="number" step="0.01" className={inputClass} {...accountForm.register('balance')} />
          </Field>

          <Button type="submit" isLoading={accountForm.formState.isSubmitting} className="mt-2 w-full">
            Concluir cadastro
          </Button>
        </form>
      ) : (
        <form onSubmit={submitCard} className="flex flex-col gap-4">
          <Field label="Nome" htmlFor="ob-card-name" error={cardForm.formState.errors.name?.message}>
            <input
              id="ob-card-name"
              className={inputClass}
              placeholder="Cartão principal"
              {...cardForm.register('name')}
            />
          </Field>
          <Field label="Bandeira" htmlFor="ob-issuer" error={cardForm.formState.errors.issuer?.message}>
            <input
              id="ob-issuer"
              className={inputClass}
              placeholder="Visa, Mastercard..."
              {...cardForm.register('issuer')}
            />
          </Field>
          <Field label="Limite" htmlFor="ob-limit" error={cardForm.formState.errors.creditLimit?.message}>
            <input id="ob-limit" type="number" step="0.01" className={inputClass} {...cardForm.register('creditLimit')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dia de fechamento" htmlFor="ob-closing" error={cardForm.formState.errors.closingDay?.message}>
              <input
                id="ob-closing"
                type="number"
                min={1}
                max={31}
                className={inputClass}
                {...cardForm.register('closingDay')}
              />
            </Field>
            <Field label="Dia de vencimento" htmlFor="ob-due" error={cardForm.formState.errors.dueDay?.message}>
              <input id="ob-due" type="number" min={1} max={31} className={inputClass} {...cardForm.register('dueDay')} />
            </Field>
          </div>

          <Button type="submit" isLoading={cardForm.formState.isSubmitting} className="mt-2 w-full">
            Concluir cadastro
          </Button>
        </form>
      )}

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => navigate('/dashboard', { replace: true })}
          className="font-medium text-ink/55 hover:text-ink"
        >
          Pular por agora
        </button>
        <button type="button" onClick={() => logout()} className="font-medium text-ink/55 hover:text-ink">
          Sair
        </button>
      </div>
    </AuthSplitLayout>
  )
}
