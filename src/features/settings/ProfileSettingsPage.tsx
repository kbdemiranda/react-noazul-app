import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toApiUrl } from '../../api/client'
import { usersApi } from '../../api/users'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { Card, CardKicker } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { useAuth } from '../../context/AuthContext'

const nameSchema = z.object({ name: z.string().min(1, 'Informe seu nome') })
type NameFormValues = z.infer<typeof nameSchema>

export function ProfileSettingsPage() {
  const { user, refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nameError, setNameError] = useState<unknown>(null)
  const [nameSuccess, setNameSuccess] = useState(false)
  const nameForm = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.name ?? '' },
  })

  const [avatarError, setAvatarError] = useState<unknown>(null)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)

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

  const handleAvatarSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return

    setAvatarError(null)
    setIsSavingAvatar(true)
    try {
      await usersApi.uploadAvatar(file)
      await refreshProfile()
    } catch (error) {
      setAvatarError(error)
    } finally {
      setIsSavingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setAvatarError(null)
    setIsSavingAvatar(true)
    try {
      await usersApi.deleteAvatar()
      await refreshProfile()
    } catch (error) {
      setAvatarError(error)
    } finally {
      setIsSavingAvatar(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-ink">Perfil</h2>

      <Card className="flex flex-col gap-4">
        <CardKicker>Dados pessoais</CardKicker>

        <div className="flex items-center gap-4">
          <Avatar src={user?.avatarUrl ? toApiUrl(user.avatarUrl) : null} name={user?.name ?? ''} size={64} />
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleAvatarSelected}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                isLoading={isSavingAvatar}
                className="w-fit"
                onClick={() => fileInputRef.current?.click()}
              >
                Alterar foto
              </Button>
              {user?.avatarUrl && (
                <Button type="button" variant="ghost" className="w-fit" onClick={handleRemoveAvatar}>
                  Remover foto
                </Button>
              )}
            </div>
            {Boolean(avatarError) && <ErrorBanner error={avatarError} />}
          </div>
        </div>

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
