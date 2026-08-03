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
import { useAuth } from '../../context/AuthContext'

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

export function PasswordSettingsPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [passwordError, setPasswordError] = useState<unknown>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) })

  const [logoutAllError, setLogoutAllError] = useState<unknown>(null)
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false)

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

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-ink">Senhas</h2>

      <div className="flex flex-col gap-4">
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
      </div>
    </div>
  )
}
