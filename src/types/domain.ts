// Mirrors java-noazul-api's enums and DTOs (com.noazul.api.model / com.noazul.api.dto).

export type FlowType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export type AccountType = 'CHECKING' | 'SAVINGS' | 'DIGITAL_WALLET' | 'OTHER'

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

export interface Account {
  uuid: string
  name: string
  bankName: string
  type: AccountType
  // BigDecimal on the backend, serialized by Jackson as a JSON number.
  balance: number
}

export interface CreditCard {
  uuid: string
  name: string
  issuer: string
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
  categoryUuid: string
  categoryName: string
  fromAccountUuid: string | null
  fromAccountName: string | null
  fromCreditCardUuid: string | null
  fromCreditCardName: string | null
  toAccountUuid: string | null
  toAccountName: string | null
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
