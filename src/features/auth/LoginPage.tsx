import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthSplitLayout } from '../../components/AuthSplitLayout'
import { Button } from '../../components/Button'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { useAuth } from '../../context/AuthContext'

const schema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<unknown>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      await login(values.email, values.password)
      const redirectTo = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setSubmitError(error)
    }
  }

  return (
    <AuthSplitLayout
      heading="Suas finanças, sem julgamento."
      description="Registre receitas e despesas, acompanhe contas e cartões, e entenda para onde vai cada real — com clareza, não com culpa."
    >
      <h1 className="mb-1 text-2xl font-semibold text-ink">Entrar</h1>
      <p className="mb-6 text-sm text-ink/65">Controle suas finanças com clareza.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {Boolean(submitError) && <ErrorBanner error={submitError} />}

        <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className={inputClass} {...register('email')} />
        </Field>
        <Field label="Senha" htmlFor="password" error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={inputClass}
            {...register('password')}
          />
        </Field>

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/65">
        Não tem conta?{' '}
        <Link to="/signup" className="font-semibold text-brand-500 hover:text-brand-700">
          Criar conta
        </Link>
      </p>
    </AuthSplitLayout>
  )
}
