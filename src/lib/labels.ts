import type { AccountType, Currency, FlowType } from '../types/domain'

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
  EXCHANGE: 'Câmbio',
}

export const currencyLabels: Record<Currency, string> = {
  BRL: 'Real brasileiro',
  USD: 'Dólar americano',
  EUR: 'Euro',
  GBP: 'Libra esterlina',
  ARS: 'Peso argentino',
}

export const CURRENCIES: Currency[] = ['BRL', 'USD', 'EUR', 'GBP', 'ARS']
