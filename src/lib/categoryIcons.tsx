import {
  ArrowLeftRight,
  ArrowRightLeft,
  BadgePercent,
  Banknote,
  Bus,
  Car,
  CreditCard,
  FileWarning,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  HeartPulse,
  Home,
  Landmark,
  MoreHorizontal,
  PawPrint,
  Percent,
  PiggyBank,
  Plane,
  RefreshCw,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Undo2,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { FlowType } from '../types/domain'

const ICONS_BY_CATEGORY_NAME: Record<string, LucideIcon> = {
  // Despesas
  'Alimentação': ShoppingBag,
  'Assinaturas': RefreshCw,
  'Câmbio': ArrowLeftRight,
  'Cartão de Crédito': CreditCard,
  'Compras': ShoppingBag,
  'Cuidados pessoais': Sparkles,
  'Dívidas': FileWarning,
  'Doações': HeartHandshake,
  'Educação': GraduationCap,
  'Família e filhos': Users,
  'Impostos e Taxas': Percent,
  'Investimentos': TrendingUp,
  'Lazer e hobbies': Gamepad2,
  'Mercado': ShoppingCart,
  'Moradia': Home,
  'Outros': MoreHorizontal,
  'Pets': PawPrint,
  'Presentes': Gift,
  'Roupas': Shirt,
  'Saques': Banknote,
  'Saúde': HeartPulse,
  'Serviços': Wrench,
  'Transferências': ArrowRightLeft,
  'Transporte': Bus,
  'Veículo': Car,
  'Viagem': Plane,
  // Compartilhado entre despesa e receita
  'Empréstimos': HandCoins,
  // Receitas
  'Cashback': BadgePercent,
  'Outras receitas': MoreHorizontal,
  'Reembolso': Undo2,
  'Rendimentos': TrendingUp,
  'Resgate': PiggyBank,
  'Salário': Landmark,
}

const DEFAULT_ICON: LucideIcon = MoreHorizontal

export function iconForCategory(name: string): LucideIcon {
  return ICONS_BY_CATEGORY_NAME[name] ?? DEFAULT_ICON
}

const sizeClasses = {
  sm: { wrapper: 'h-7 w-7', icon: 14 },
  md: { wrapper: 'h-8 w-8', icon: 16 },
  lg: { wrapper: 'h-11 w-11', icon: 22 },
} as const

interface CategoryIconBadgeProps {
  name: string
  type: FlowType
  size?: keyof typeof sizeClasses
  className?: string
}

export function CategoryIconBadge({ name, type, size = 'md', className = '' }: CategoryIconBadgeProps) {
  const Icon = iconForCategory(name)
  const { wrapper, icon } = sizeClasses[size]
  const tone = type === 'EXPENSE' ? 'bg-expense-vivid/12 text-expense' : 'bg-income-vivid/12 text-income'

  return (
    <span className={`flex flex-none items-center justify-center rounded-full ${wrapper} ${tone} ${className}`}>
      <Icon size={icon} strokeWidth={1.5} />
    </span>
  )
}
