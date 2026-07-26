// Mirrors java-noazul-api's enums and DTOs (com.noazul.api.model / com.noazul.api.dto).

export type FlowType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'EXCHANGE'

export type AccountType = 'CHECKING' | 'SAVINGS' | 'DIGITAL_WALLET' | 'OTHER'

export type Currency = 'BRL' | 'USD' | 'EUR' | 'GBP' | 'ARS'

export type CategoryOrigin = 'SYSTEM' | 'USER'

export interface User {
  uuid: string
  name: string
  email: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AccountBalance {
  uuid: string
  currency: Currency
  // BigDecimal on the backend, serialized by Jackson as a JSON number.
  balance: number
}

export interface Account {
  uuid: string
  name: string
  bankName: string
  type: AccountType
  // One entry per currency the account holds — a single-currency account
  // (the common case) has exactly one; a multi-currency account (Wise,
  // Revolut, ...) has one per currency.
  balances: AccountBalance[]
}

export interface CreditCard {
  uuid: string
  name: string
  issuer: string
  currency: Currency
  creditLimit: number
  closingDay: number
  dueDay: number
}

export interface Category {
  uuid: string
  name: string
  type: FlowType
  origin: CategoryOrigin
  parentUuid: string | null
}

export interface Transaction {
  uuid: string
  description: string
  amount: number
  type: FlowType
  date: string // ISO date (yyyy-MM-dd)
  time: string // ISO local time (HH:mm:ss)
  // null only for EXCHANGE — an internal currency conversion is neither
  // income nor expense.
  categoryUuid: string | null
  categoryName: string | null
  fromAccountBalanceUuid: string | null
  fromAccountName: string | null
  fromAccountCurrency: Currency | null
  fromCreditCardUuid: string | null
  fromCreditCardName: string | null
  // Populated for TRANSFER and EXCHANGE only.
  toAccountBalanceUuid: string | null
  toAccountName: string | null
  toAccountCurrency: Currency | null
  // Only set for EXCHANGE — the amount credited to toAccountBalanceUuid, in
  // its own currency (amount is debited from fromAccountBalanceUuid, in its
  // currency).
  convertedAmount: number | null
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  uuid: string
  fileName: string
  contentType: string
  fileSize: number
  uploadedAt: string
}

export interface ApiErrorBody {
  code: string
  message: string
  timestamp: string
}
