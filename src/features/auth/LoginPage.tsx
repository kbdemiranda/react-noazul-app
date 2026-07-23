import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { BrandMark } from '../../components/BrandMark'
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
    // Mock default só para agilizar login em dev — remover quando integrar de verdade.
    defaultValues: { email: 'marina.souza@example.com', password: 'senha12345' },
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
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl shadow-lg lg:grid-cols-2">
        <div className="hidden flex-col justify-center bg-linear-to-br from-brand-900 to-brand-700 p-16 text-white lg:flex">
          <span className="mb-7 flex items-center gap-2 font-heading text-xl font-semibold">
            <BrandMark size={22} className="text-white" />
            NoAzul
          </span>
          <h2 className="mb-3 font-heading text-3xl font-semibold text-white">Suas finanças, sem julgamento.</h2>
          <p className="text-sm text-white/75">
            Registre receitas e despesas, acompanhe contas e cartões, e entenda para onde vai cada real — com
            clareza, não com culpa.
          </p>
        </div>

        <div className="glass-surface flex flex-col justify-center bg-white/85 p-8 sm:p-12">
          <span className="mb-7 flex items-center gap-2 font-heading text-lg font-semibold text-ink lg:hidden">
            <BrandMark size={20} />
            NoAzul
          </span>
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
        </div>
      </div>
    </div>
  )
}
