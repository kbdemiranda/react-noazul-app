import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { usersApi } from '../../api/users'
import { Button } from '../../components/Button'
import { Card, CardKicker } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { useAuth } from '../../context/AuthContext'

const nameSchema = z.object({ name: z.string().min(1, 'Informe seu nome') })
type NameFormValues = z.infer<typeof nameSchema>

export function ProfileSettingsPage() {
  const { user, refreshProfile } = useAuth()

  const [nameError, setNameError] = useState<unknown>(null)
  const [nameSuccess, setNameSuccess] = useState(false)
  const nameForm = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.name ?? '' },
  })

  const onSubmitName = async (values: NameFormValues) => {
    setNameError(null)
    setNameSuccess(false)
    try {
      await usersApi.updateProfile({ name: values.name })
      await refreshProfile()
      setNameSuccess(true)
    } catch (error) {
      setNameError(error)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-ink">Perfil</h2>

      <Card className="flex flex-col gap-3">
        <CardKicker>Dados pessoais</CardKicker>
        <form onSubmit={nameForm.handleSubmit(onSubmitName)} className="flex flex-col gap-3">
          <Field label="E-mail" htmlFor="email">
            <input id="email" className={`${inputClass} opacity-60`} value={user?.email ?? ''} disabled />
          </Field>
          <Field label="Nome" htmlFor="name" error={nameForm.formState.errors.name?.message}>
            <input id="name" className={inputClass} {...nameForm.register('name')} />
          </Field>
          {Boolean(nameError) && <ErrorBanner error={nameError} />}
          {nameSuccess && <p className="text-sm text-income">Nome atualizado.</p>}
          <Button type="submit" variant="secondary" isLoading={nameForm.formState.isSubmitting} className="w-fit">
            Salvar alterações
          </Button>
        </form>
      </Card>
    </div>
  )
}
