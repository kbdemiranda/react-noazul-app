import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  CreditCard,
  PieChart,
  Receipt,
  ShieldCheck,
  Tag,
  Wallet,
} from 'lucide-react'
import { Navigate, Link } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { BrandMark } from '../../components/BrandMark'
import { Button } from '../../components/Button'
import { Card, CardKicker } from '../../components/Card'
import { useAuth } from '../../context/AuthContext'

const features = [
  {
    icon: Wallet,
    title: 'Contas em um só lugar',
    description: 'Reúna contas correntes, poupanças e carteiras digitais e veja o saldo de cada uma sem trocar de app.',
  },
  {
    icon: CreditCard,
    title: 'Cartões sob controle',
    description: 'Acompanhe faturas, limites e datas de fechamento antes que elas te surpreendam.',
  },
  {
    icon: Receipt,
    title: 'Transações organizadas',
    description: 'Registre receitas e despesas em segundos e mantenha um histórico completo de para onde vai o dinheiro.',
  },
  {
    icon: Tag,
    title: 'Categorias sob medida',
    description: 'Classifique gastos do seu jeito e entenda padrões que uma planilha genérica não mostra.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Câmbio sem susto',
    description: 'Lide com contas em outras moedas e converta valores sem perder a precisão de cada centavo.',
  },
  {
    icon: PieChart,
    title: 'Visão geral clara',
    description: 'Um painel único mostra saldo, faturas e para onde foi cada real do mês, sem julgamento.',
  },
]

const steps = [
  { title: 'Cadastre suas contas e cartões', description: 'Leva menos de um minuto para colocar seu dinheiro no NoAzul.' },
  { title: 'Registre o dia a dia', description: 'Anote receitas e despesas conforme elas acontecem, com categorias e anexos.' },
  { title: 'Entenda para onde vai cada real', description: 'Acompanhe o painel e tome decisões com clareza, não com culpa.' },
]

export function LandingPage() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen">
      <header className="glass-surface sticky top-0 z-20 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3.5 md:px-6">
          <span className="flex items-center gap-2 font-heading text-base font-semibold text-ink">
            <BrandMark size={20} />
            NoAzul
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary">Criar conta</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <section className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="outline">Controle financeiro pessoal</Badge>
            <h1 className="mt-5 font-heading text-4xl font-semibold text-ink sm:text-5xl">
              Suas finanças, <span className="text-brand-500">sem julgamento</span>.
            </h1>
            <p className="mt-5 max-w-md text-base text-ink/65">
              Registre receitas e despesas, acompanhe contas e cartões, e entenda para onde vai cada real — com
              clareza, não com planilhas.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button variant="primary" className="gap-2 px-6">
                  Criar conta gratuita
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="px-6">Já tenho conta</Button>
              </Link>
            </div>

            <ul className="mt-8 flex flex-col gap-2 text-sm text-ink/65">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-income" />
                Suas contas, seus cartões, no seu controle
              </li>
            </ul>
          </div>

          <Card className="p-6 shadow-lg sm:p-8">
            <CardKicker>Visão geral</CardKicker>
            <p className="mt-2 text-sm text-ink/60">Saldo total</p>
            <p className="mt-1 font-data text-3xl font-semibold text-ink">R$ 12.480,32</p>

            <div className="mt-6 flex flex-col gap-3">
              {[
                { name: 'Itaú', value: 'R$ 6.230,10' },
                { name: 'Nubank', value: 'R$ 4.150,90' },
                { name: 'Inter', value: 'R$ 2.099,32' },
              ].map((account) => (
                <div
                  key={account.name}
                  className="flex items-center justify-between rounded-2xl bg-ink/[.03] px-4 py-3"
                >
                  <span className="text-sm font-medium text-ink/80">{account.name}</span>
                  <span className="font-data text-sm font-semibold text-ink">{account.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-brand-100 px-4 py-3">
              <span className="text-sm font-semibold text-brand-700">Fatura do mês</span>
              <span className="font-data text-sm font-semibold text-brand-700">R$ 1.847,55</span>
            </div>
          </Card>
        </section>

        <section id="recursos" className="mt-28">
          <div className="max-w-xl">
            <CardKicker>Recursos</CardKicker>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-ink">Tudo que você precisa para não perder o azul</h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="flex flex-col gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <Icon size={18} />
                </span>
                <h3 className="font-heading text-lg font-semibold text-ink">{title}</h3>
                <p className="text-sm text-ink/65">{description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="mt-28">
          <div className="max-w-xl">
            <CardKicker>Como funciona</CardKicker>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-ink">Três passos até a clareza</h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 font-data text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-ink/65">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-28 flex flex-col items-center gap-4 rounded-3xl bg-linear-to-br from-brand-900 to-brand-500 px-6 py-14 text-center text-white sm:px-12">
          <ShieldCheck size={28} />
          <h2 className="max-w-lg font-heading text-3xl font-semibold">Comece a organizar suas finanças hoje</h2>
          <p className="max-w-md text-white/75">
            Grátis para começar. Leve menos de um minuto para cadastrar sua primeira conta ou cartão.
          </p>
          <Link to="/signup" className="mt-2">
            <Button variant="secondary" className="gap-2 px-6">
              Criar conta gratuita
              <ArrowRight size={16} />
            </Button>
          </Link>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-ink/50 md:px-6">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-divider pt-8 sm:flex-row">
          <span className="flex items-center gap-2 font-heading text-sm font-semibold text-ink/70">
            <BrandMark size={16} />
            NoAzul
          </span>
          <span>© {new Date().getFullYear()} NoAzul. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
