import type { AccountType, FlowType } from '../types/domain'

export const accountTypeLabels: Record<AccountType, string> = {
  CHECKING: 'Conta corrente',
  SAVINGS: 'Poupança',
  DIGITAL_WALLET: 'Carteira digital',
  OTHER: 'Outro',
}

export const flowTypeLabels: Record<FlowType, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  TRANSFER: 'Transferência',
}
