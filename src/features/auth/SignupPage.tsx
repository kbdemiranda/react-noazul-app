import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { BrandMark } from '../../components/BrandMark'
import { Button } from '../../components/Button'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Field, inputClass } from '../../components/Field'
import { useAuth } from '../../context/AuthContext'

const schema = z.object({
  name: z.string().min(1, 'Informe seu nome'),
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres'),
})

type FormValues = z.infer<typeof schema>

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<unknown>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      await signup(values.name, values.email, values.password)
      navigate('/', { replace: true })
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
          <h2 className="mb-3 font-heading text-3xl font-semibold text-white">Comece a organizar suas finanças.</h2>
          <p className="text-sm text-white/75">
            Leva menos de um minuto para cadastrar sua conta e começar a registrar receitas e despesas.
          </p>
        </div>

        <div className="glass-surface flex flex-col justify-center bg-white/85 p-8 sm:p-12">
          <span className="mb-7 flex items-center gap-2 font-heading text-lg font-semibold text-ink lg:hidden">
            <BrandMark size={20} />
            NoAzul
          </span>
          <h1 className="mb-1 text-2xl font-semibold text-ink">Criar conta</h1>
          <p className="mb-6 text-sm text-ink/65">Leva menos de um minuto.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {Boolean(submitError) && <ErrorBanner error={submitError} />}

            <Field label="Nome" htmlFor="name" error={errors.name?.message}>
              <input id="name" autoComplete="name" className={inputClass} {...register('name')} />
            </Field>
            <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
              <input id="email" type="email" autoComplete="email" className={inputClass} {...register('email')} />
            </Field>
            <Field label="Senha" htmlFor="password" error={errors.password?.message}>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                {...register('password')}
              />
              <span className="text-[11.5px] text-ink/55">Use ao menos 8 caracteres.</span>
            </Field>

            <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
              Criar conta
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/65">
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-700">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
