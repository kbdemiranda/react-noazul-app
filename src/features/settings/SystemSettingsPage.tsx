import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersApi } from '../../api/users'
import { Button } from '../../components/Button'
import { Card, CardKicker } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { SegmentedControl } from '../../components/SegmentedControl'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import type { Currency, Theme } from '../../types/domain'

const themeOptions: { value: Theme; label: string }[] = [
  { value: 'LIGHT', label: 'Claro' },
  { value: 'DARK', label: 'Escuro' },
  { value: 'SYSTEM', label: 'Automático' },
]

const currencyOptions: { value: Currency; label: string }[] = [
  { value: 'BRL', label: 'BRL — Real brasileiro' },
  { value: 'USD', label: 'USD — Dólar americano' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — Libra esterlina' },
  { value: 'ARS', label: 'ARS — Peso argentino' },
]

export function SystemSettingsPage() {
  const { user, refreshProfile, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [defaultCurrency, setDefaultCurrency] = useState<Currency>(user?.defaultCurrency ?? 'BRL')
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(user?.emailNotificationsEnabled ?? true)
  const [preferencesError, setPreferencesError] = useState<unknown>(null)
  const [preferencesSuccess, setPreferencesSuccess] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<unknown>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSavePreferences = async () => {
    setPreferencesError(null)
    setPreferencesSuccess(false)
    setIsSavingPreferences(true)
    try {
      await usersApi.updatePreferences({ theme, defaultCurrency, emailNotificationsEnabled })
      await refreshProfile()
      setPreferencesSuccess(true)
    } catch (error) {
      setPreferencesError(error)
    } finally {
      setIsSavingPreferences(false)
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
      <h2 className="text-lg font-semibold text-ink">Sistema</h2>

      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <CardKicker>Preferências</CardKicker>

          <Field label="Tema do aplicativo" htmlFor="theme">
            <SegmentedControl name="theme" options={themeOptions} value={theme} onChange={setTheme} />
          </Field>

          <Field label="Moeda padrão" htmlFor="defaultCurrency">
            <select
              id="defaultCurrency"
              className={inputClass}
              value={defaultCurrency}
              onChange={(event) => setDefaultCurrency(event.target.value as Currency)}
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <label htmlFor="emailNotifications" className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-ink">Notificações por e-mail</span>
            <input
              id="emailNotifications"
              type="checkbox"
              className="h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-ink/[.15] transition-colors checked:bg-brand-500 relative before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
              checked={emailNotificationsEnabled}
              onChange={(event) => setEmailNotificationsEnabled(event.target.checked)}
            />
          </label>

          {Boolean(preferencesError) && <ErrorBanner error={preferencesError} />}
          {preferencesSuccess && <p className="text-sm text-income">Preferências salvas.</p>}
          <Button
            variant="secondary"
            isLoading={isSavingPreferences}
            onClick={handleSavePreferences}
            className="w-fit"
          >
            Salvar preferências
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
