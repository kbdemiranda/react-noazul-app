import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { usersApi } from '../../api/users'
import { Button } from '../../components/Button'
import { Card, CardKicker } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { useAuth } from '../../context/AuthContext'

const nameSchema = z.object({ name: z.string().min(1, 'Informe seu nome') })
type NameFormValues = z.infer<typeof nameSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z.string().min(8, 'A nova senha precisa ter ao menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })
type PasswordFormValues = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const { user, refreshProfile, logout } = useAuth()
  const navigate = useNavigate()

  const [nameError, setNameError] = useState<unknown>(null)
  const [nameSuccess, setNameSuccess] = useState(false)
  const nameForm = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.name ?? '' },
  })

  const [passwordError, setPasswordError] = useState<unknown>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) })

  const [logoutAllError, setLogoutAllError] = useState<unknown>(null)
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false)

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<unknown>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const onSubmitPassword = async (values: PasswordFormValues) => {
    setPasswordError(null)
    setPasswordSuccess(false)
    try {
      await usersApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      passwordForm.reset()
      setPasswordSuccess(true)
    } catch (error) {
      setPasswordError(error)
    }
  }

  const handleLogoutAllDevices = async () => {
    setLogoutAllError(null)
    setIsLoggingOutAll(true)
    try {
      await usersApi.logoutAllDevices()
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutAllError(error)
    } finally {
      setIsLoggingOutAll(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await usersApi.deleteAccount()
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setDeleteError(error)
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink">Perfil</h1>

      <div className="grid gap-4 lg:grid-cols-2">
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

        <Card className="flex flex-col gap-3">
          <CardKicker>Alterar senha</CardKicker>
          <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="flex flex-col gap-3">
            <Field
              label="Senha atual"
              htmlFor="currentPassword"
              error={passwordForm.formState.errors.currentPassword?.message}
            >
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                className={inputClass}
                {...passwordForm.register('currentPassword')}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nova senha" htmlFor="newPassword" error={passwordForm.formState.errors.newPassword?.message}>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  {...passwordForm.register('newPassword')}
                />
              </Field>
              <Field
                label="Confirmar nova senha"
                htmlFor="confirmPassword"
                error={passwordForm.formState.errors.confirmPassword?.message}
              >
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  {...passwordForm.register('confirmPassword')}
                />
              </Field>
            </div>
            {Boolean(passwordError) && <ErrorBanner error={passwordError} />}
            {passwordSuccess && <p className="text-sm text-income">Senha alterada.</p>}
            <Button
              type="submit"
              variant="secondary"
              isLoading={passwordForm.formState.isSubmitting}
              className="w-fit"
            >
              Atualizar senha
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col gap-3">
          <CardKicker>Sessões</CardKicker>
          <p className="text-[13px] text-ink/65">Encerre o acesso em todos os outros dispositivos conectados à sua conta.</p>
          {Boolean(logoutAllError) && <ErrorBanner error={logoutAllError} />}
          <Button variant="secondary" isLoading={isLoggingOutAll} onClick={handleLogoutAllDevices} className="w-fit">
            Encerrar todas as sessões
          </Button>
        </Card>

        <Card className="flex flex-col gap-3 border border-expense/40">
          <CardKicker className="text-expense">Zona de risco</CardKicker>
          <p className="text-[13px] text-ink/75">
            Excluir sua conta remove o acesso permanentemente. Esta ação não pode ser desfeita pelo usuário.
          </p>
          {Boolean(deleteError) && <ErrorBanner error={deleteError} />}
          <Button variant="danger" onClick={() => setIsConfirmingDelete(true)} className="w-fit">
            Excluir minha conta
          </Button>
        </Card>
      </div>

      {isConfirmingDelete && (
        <Modal title="Excluir sua conta NoAzul?" onClose={() => setIsConfirmingDelete(false)}>
          <p className="text-sm text-ink/80">
            Você perderá o acesso imediatamente. Seus dados ficam retidos de forma segura, mas nenhuma tela do app
            permanece acessível.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsConfirmingDelete(false)}>
              Cancelar
            </Button>
            <Button variant="danger" isLoading={isDeleting} onClick={handleDeleteAccount}>
              Excluir permanentemente
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
