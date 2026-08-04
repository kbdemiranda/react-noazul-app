import { addMonths, getDaysInMonth, isAfter, setDate, subMonths } from 'date-fns'
import type { Account, AccountBalance, Attachment, AuthTokens, Category, CreditCard, Transaction, User } from '../types/domain'
import type { AccountBalancePayload, AccountCreatePayload, AccountUpdatePayload } from './accounts'
import type { CreditCardPayload } from './creditCards'
import type { CategoryPayload } from './categories'
import type { TransactionFilters, TransactionPayload } from './transactions'
import type { UpdatePreferencesPayload } from './users'
import type {
  BankImportCandidate,
  BankImportCommitParams,
  BankImportCommitResult,
  BankImportParseParams,
} from './bankImports'

function uuid(): string {
  return crypto.randomUUID()
}

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

// Mesmas 34 categorias padrão seedadas pelo backend real (V4__seed_system_categories.sql).
const seedCategories: Category[] = [
  { uuid: '7fa32421-fb76-4221-8435-447c18a0f1f4', name: 'Alimentação', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: 'e33ddeee-bb22-4397-9a7e-fdfeebe79907', name: 'Assinaturas', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '52a8f455-1dc0-419a-a36e-9fbdb31336f0', name: 'Câmbio', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: 'd999302e-3baa-4aee-ba58-ec7bf2fcb33b', name: 'Cartão de Crédito', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '30c7e287-ddb8-4625-9497-88012461fd39', name: 'Compras', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '8a4dc279-4056-4a35-9cfa-5487c565cd6c', name: 'Cuidados pessoais', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '5cf8c025-2582-4936-9ccf-34ad3319f953', name: 'Dívidas', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: 'f1577b91-4c01-4e67-838e-45c2b9c5d7d9', name: 'Doações', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '9c8af2b1-7bcd-4dfa-949c-a77009955257', name: 'Educação', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '98788694-a0d3-4c3a-96db-0278e5136910', name: 'Empréstimos', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: 'f799a6ef-f212-4644-ae9a-90f9cec37604', name: 'Família e filhos', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: 'c121366d-971c-41e4-bf58-effe6017f178', name: 'Impostos e Taxas', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '76db99f5-5d5e-45b5-9954-af1cb3b48a21', name: 'Investimentos', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '63ddf4dd-5d06-440e-9dfc-61cc5d9cb3f8', name: 'Lazer e hobbies', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '7fe077ad-ab87-48dd-ab75-985474bce282', name: 'Mercado', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '718a3452-3496-4ac8-8ef2-da86577f006d', name: 'Moradia', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '2392ab3c-4753-4ff8-aa5b-039b68fe3272', name: 'Outros', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '2a06215a-5d86-4fed-95a0-9aa4b8363168', name: 'Pets', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: 'bd906293-6d31-4540-96f9-7f3887282044', name: 'Presentes', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '246c705b-58aa-449d-9e51-d50b36ea8ff7', name: 'Roupas', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '24328e8a-5ecb-4fa2-bb92-933211e583b7', name: 'Saques', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '84a30d7b-1e52-41c8-a330-54bd2bfd2cd0', name: 'Saúde', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '2988e76c-02a7-41a8-9063-1960dd9fdef2', name: 'Serviços', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '021aabb0-57c5-4679-ae7e-05ca45318733', name: 'Transferências', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '85805f40-c8fb-4e31-b627-893f1006ab6d', name: 'Transporte', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '9c177096-e7cd-494a-bf99-67b10ec1f1fe', name: 'Veículo', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '7bb77708-22c8-4653-88c2-43997517ae46', name: 'Viagem', type: 'EXPENSE', origin: 'SYSTEM', parentUuid: null },
  { uuid: '3448ee9f-d1af-48a6-be41-05f5591235af', name: 'Cashback', type: 'INCOME', origin: 'SYSTEM', parentUuid: null },
  { uuid: '4e61fd1c-cc21-4209-8c0c-9d7e86dba068', name: 'Empréstimos', type: 'INCOME', origin: 'SYSTEM', parentUuid: null },
  { uuid: 'a02a6ccb-3d47-49b0-b364-e09f11d34148', name: 'Outras receitas', type: 'INCOME', origin: 'SYSTEM', parentUuid: null },
  { uuid: '8054a637-b4c6-48f2-ab63-a6465f5b5fe6', name: 'Reembolso', type: 'INCOME', origin: 'SYSTEM', parentUuid: null },
  { uuid: '009bc093-1ae6-4134-8342-0964e394cc56', name: 'Rendimentos', type: 'INCOME', origin: 'SYSTEM', parentUuid: null },
  { uuid: 'da78d62f-7499-40a3-801f-fc8e84cfaa3c', name: 'Resgate', type: 'INCOME', origin: 'SYSTEM', parentUuid: null },
  { uuid: '34b3e1cd-2609-497a-b807-29530ceb1774', name: 'Salário', type: 'INCOME', origin: 'SYSTEM', parentUuid: null },
]

let mockUser: User = {
  uuid: 'mock-user',
  name: 'Marina Souza',
  email: 'marina.souza@example.com',
  theme: 'SYSTEM',
  defaultCurrency: 'BRL',
  emailNotificationsEnabled: true,
  avatarUrl: null,
}

const categories: Category[] = seedCategories.map((c) => ({ ...c }))
const archivedCategoryUuids = new Set<string>()

let accounts: Account[] = []
let creditCards: CreditCard[] = []
let transactions: Transaction[] = []
const archivedTransactionUuids = new Set<string>()
const attachmentsByTransaction = new Map<string, Attachment[]>()

function findAccountAndBalance(
  balanceUuid: string | null | undefined,
): { account: Account; balance: AccountBalance } | undefined {
  if (!balanceUuid) return undefined
  for (const account of accounts) {
    const balance = account.balances.find((b) => b.uuid === balanceUuid)
    if (balance) return { account, balance }
  }
  return undefined
}

function findBalance(balanceUuid: string | null | undefined): AccountBalance | undefined {
  return findAccountAndBalance(balanceUuid)?.balance
}

function findCreditCard(cardUuid: string | null | undefined): CreditCard | undefined {
  if (!cardUuid) return undefined
  return creditCards.find((c) => c.uuid === cardUuid)
}

/** Mirrors the backend's apply_transaction_balance_effect trigger (infra-database-noazul V16/V20). */
function adjustAccountBalance(transaction: Transaction, sign: 1 | -1): void {
  if (transaction.type === 'TRANSFER') {
    const from = findBalance(transaction.fromAccountBalanceUuid)
    if (from) from.balance -= transaction.amount * sign
    const toAccount = findBalance(transaction.toAccountBalanceUuid)
    if (toAccount) {
      toAccount.balance += transaction.amount * sign
      return
    }
    const toCard = findCreditCard(transaction.toCreditCardUuid)
    if (toCard) toCard.availableLimit += transaction.amount * sign
    return
  }
  if (transaction.type === 'EXCHANGE') {
    const from = findBalance(transaction.fromAccountBalanceUuid)
    const to = findBalance(transaction.toAccountBalanceUuid)
    if (from) from.balance -= transaction.amount * sign
    if (to && transaction.convertedAmount != null) to.balance += transaction.convertedAmount * sign
    return
  }
  const delta = transaction.type === 'EXPENSE' ? -transaction.amount : transaction.amount
  const balance = findBalance(transaction.fromAccountBalanceUuid)
  if (balance) {
    balance.balance += delta * sign
    return
  }
  const card = findCreditCard(transaction.fromCreditCardUuid)
  if (card) card.availableLimit += delta * sign
}

function clampDay(month: Date, day: number): Date {
  return setDate(month, Math.min(day, getDaysInMonth(month)))
}

function closingDateOnOrAfter(reference: Date, closingDay: number): Date {
  const thisMonthClosing = clampDay(reference, closingDay)
  return isAfter(reference, thisMonthClosing) ? clampDay(addMonths(reference, 1), closingDay) : thisMonthClosing
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Mirrors the backend's CreditCardService.computeInvoiceSummary. */
function computeInvoiceSummary(
  card: CreditCard,
  referenceDate: Date = new Date(),
): { currentInvoiceTotal: number; previousBalance: number; closingDate: string; dueDate: string } {
  const closingDate = closingDateOnOrAfter(referenceDate, card.closingDay)
  const periodStart = clampDay(subMonths(closingDate, 1), card.closingDay)
  const dueDate = clampDay(closingDate, card.dueDay)

  const currentInvoiceTotal = transactions
    .filter((t) => t.fromCreditCardUuid === card.uuid && t.type === 'EXPENSE')
    .filter((t) => {
      const date = new Date(`${t.date}T00:00:00`)
      return isAfter(date, periodStart) && !isAfter(date, closingDate)
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const outstandingTotal = card.creditLimit - card.availableLimit
  const previousBalance = Math.max(0, outstandingTotal - currentInvoiceTotal)

  return { currentInvoiceTotal, previousBalance, closingDate: toIsoDate(closingDate), dueDate: toIsoDate(dueDate) }
}

function withInvoiceSummary(card: CreditCard): CreditCard {
  return { ...card, ...computeInvoiceSummary(card) }
}

export const mockAuth = {
  async login(): Promise<AuthTokens> {
    return delay({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' })
  },
  async signup(name: string, email: string): Promise<User> {
    mockUser = { ...mockUser, name, email }
    return delay(mockUser)
  },
  async logout(): Promise<void> {
    return delay(undefined)
  },
}

export const mockUsers = {
  async me(): Promise<User> {
    return delay(mockUser)
  },
  async updateProfile(name: string): Promise<User> {
    mockUser = { ...mockUser, name }
    return delay(mockUser)
  },
  async changePassword(): Promise<void> {
    return delay(undefined)
  },
  async deleteAccount(): Promise<void> {
    return delay(undefined)
  },
  async logoutAllDevices(): Promise<void> {
    return delay(undefined)
  },
  async updatePreferences(payload: UpdatePreferencesPayload): Promise<User> {
    mockUser = { ...mockUser, ...payload }
    return delay(mockUser)
  },
  async uploadAvatar(file: File): Promise<User> {
    if (mockUser.avatarUrl?.startsWith('blob:')) URL.revokeObjectURL(mockUser.avatarUrl)
    mockUser = { ...mockUser, avatarUrl: URL.createObjectURL(file) }
    return delay(mockUser)
  },
  async deleteAvatar(): Promise<void> {
    if (mockUser.avatarUrl?.startsWith('blob:')) URL.revokeObjectURL(mockUser.avatarUrl)
    mockUser = { ...mockUser, avatarUrl: null }
    return delay(undefined)
  },
}

export const mockAccounts = {
  async list(): Promise<Account[]> {
    return delay([...accounts])
  },
  async find(uuidStr: string): Promise<Account> {
    const found = accounts.find((a) => a.uuid === uuidStr)
    if (!found) throw new Error('Conta não encontrada.')
    return delay(found)
  },
  async create(payload: AccountCreatePayload): Promise<Account> {
    const account: Account = {
      uuid: uuid(),
      name: payload.name,
      bankName: payload.bankName,
      type: payload.type,
      balances: [{ uuid: uuid(), currency: payload.currency, balance: payload.balance }],
    }
    accounts.push(account)
    return delay(account)
  },
  async update(uuidStr: string, payload: AccountUpdatePayload): Promise<Account> {
    accounts = accounts.map((a) => (a.uuid === uuidStr ? { ...a, ...payload } : a))
    return delay(accounts.find((a) => a.uuid === uuidStr)!)
  },
  async archive(uuidStr: string): Promise<void> {
    accounts = accounts.filter((a) => a.uuid !== uuidStr)
    return delay(undefined)
  },
  async addBalance(uuidStr: string, payload: AccountBalancePayload): Promise<AccountBalance> {
    const account = accounts.find((a) => a.uuid === uuidStr)
    if (!account) throw new Error('Conta não encontrada.')
    if (account.balances.some((b) => b.currency === payload.currency)) {
      throw new Error(`Esta conta já possui um saldo em ${payload.currency}.`)
    }
    const balance: AccountBalance = { uuid: uuid(), currency: payload.currency, balance: payload.balance }
    account.balances.push(balance)
    return delay(balance)
  },
  async removeBalance(uuidStr: string, balanceUuid: string): Promise<void> {
    const account = accounts.find((a) => a.uuid === uuidStr)
    if (!account) throw new Error('Conta não encontrada.')
    const balance = account.balances.find((b) => b.uuid === balanceUuid)
    if (!balance) throw new Error('Saldo de conta não encontrado.')
    if (balance.balance !== 0) {
      throw new Error(`A conta "${account.name}" ainda possui saldo em ${balance.currency}; ele precisa estar zerado para removê-la.`)
    }
    if (account.balances.length <= 1) {
      throw new Error(`A conta "${account.name}" precisa manter pelo menos uma moeda.`)
    }
    account.balances = account.balances.filter((b) => b.uuid !== balanceUuid)
    return delay(undefined)
  },
}

export const mockCreditCards = {
  async list(): Promise<CreditCard[]> {
    return delay(creditCards.map(withInvoiceSummary))
  },
  async find(uuidStr: string): Promise<CreditCard> {
    const found = creditCards.find((c) => c.uuid === uuidStr)
    if (!found) throw new Error('Cartão não encontrado.')
    return delay(withInvoiceSummary(found))
  },
  async create(payload: CreditCardPayload): Promise<CreditCard> {
    const card: CreditCard = {
      uuid: uuid(),
      ...payload,
      availableLimit: payload.creditLimit,
      currentInvoiceTotal: 0,
      previousBalance: 0,
      closingDate: '',
      dueDate: '',
    }
    creditCards.push(card)
    return delay(withInvoiceSummary(card))
  },
  async update(uuidStr: string, payload: CreditCardPayload): Promise<CreditCard> {
    // Mirrors CreditCard.update() on the backend: shifting creditLimit shifts
    // availableLimit by the same delta, so the already-spent amount is
    // preserved instead of reset back to "fully available".
    creditCards = creditCards.map((c) =>
      c.uuid === uuidStr
        ? { ...c, ...payload, availableLimit: c.availableLimit + (payload.creditLimit - c.creditLimit) }
        : c,
    )
    return delay(withInvoiceSummary(creditCards.find((c) => c.uuid === uuidStr)!))
  },
  async archive(uuidStr: string): Promise<void> {
    creditCards = creditCards.filter((c) => c.uuid !== uuidStr)
    return delay(undefined)
  },
}

export const mockCategories = {
  async list(): Promise<Category[]> {
    return delay(categories.filter((c) => !archivedCategoryUuids.has(c.uuid)))
  },
  async create(payload: CategoryPayload): Promise<Category> {
    let type = payload.type
    if (payload.parentUuid) {
      const parent = categories.find((c) => c.uuid === payload.parentUuid)
      type = parent?.type
    }
    const category: Category = {
      uuid: uuid(),
      name: payload.name,
      type: type ?? 'EXPENSE',
      origin: 'USER',
      parentUuid: payload.parentUuid ?? null,
    }
    categories.push(category)
    return delay(category)
  },
  async rename(uuidStr: string, name: string): Promise<Category> {
    const target = categories.find((c) => c.uuid === uuidStr)
    if (!target) throw new Error('Categoria não encontrada.')
    if (target.origin === 'SYSTEM') throw new Error('Categorias do sistema não podem ser renomeadas.')
    target.name = name
    return delay(target)
  },
  async archive(uuidStr: string): Promise<void> {
    archivedCategoryUuids.add(uuidStr)
    return delay(undefined)
  },
}

export const mockTransactions = {
  async list(filters?: TransactionFilters): Promise<Transaction[]> {
    const description = filters?.description?.trim().toLowerCase()
    const matching = transactions
      .filter((t) => !archivedTransactionUuids.has(t.uuid))
      .filter((t) => !description || t.description.toLowerCase().includes(description))
      .filter((t) => !filters?.type || t.type === filters.type)
      .filter((t) => !filters?.categoryUuid || t.categoryUuid === filters.categoryUuid)
      .filter((t) => !filters?.accountBalanceUuid || t.fromAccountBalanceUuid === filters.accountBalanceUuid)
      .filter((t) => !filters?.creditCardUuid || t.fromCreditCardUuid === filters.creditCardUuid)
      .filter((t) => !filters?.dateFrom || t.date >= filters.dateFrom)
      .filter((t) => !filters?.dateTo || t.date <= filters.dateTo)
      .sort((a, b) => (a.date === b.date ? (a.time < b.time ? 1 : -1) : a.date < b.date ? 1 : -1))
    return delay(matching)
  },
  async find(uuidStr: string): Promise<Transaction> {
    const found = transactions.find((t) => t.uuid === uuidStr)
    if (!found) throw new Error('Transação não encontrada.')
    return delay(found)
  },
  async create(payload: TransactionPayload): Promise<Transaction> {
    const category = payload.categoryUuid ? categories.find((c) => c.uuid === payload.categoryUuid) : undefined
    const from = findAccountAndBalance(payload.fromAccountBalanceUuid)
    const creditCard = payload.fromCreditCardUuid
      ? creditCards.find((c) => c.uuid === payload.fromCreditCardUuid)
      : undefined
    const to = findAccountAndBalance(payload.toAccountBalanceUuid)
    const toCard = payload.toCreditCardUuid ? creditCards.find((c) => c.uuid === payload.toCreditCardUuid) : undefined
    const now = new Date().toISOString()
    const transaction: Transaction = {
      uuid: uuid(),
      description: payload.description,
      amount: payload.amount,
      type: payload.type,
      date: payload.date,
      time: payload.time ?? new Date().toTimeString().slice(0, 8),
      categoryUuid: category?.uuid ?? null,
      categoryName: category?.name ?? null,
      fromAccountBalanceUuid: from?.balance.uuid ?? null,
      fromAccountName: from?.account.name ?? null,
      fromAccountCurrency: from?.balance.currency ?? null,
      fromCreditCardUuid: creditCard?.uuid ?? null,
      fromCreditCardName: creditCard?.name ?? null,
      toAccountBalanceUuid: to?.balance.uuid ?? null,
      toAccountName: to?.account.name ?? null,
      toAccountCurrency: to?.balance.currency ?? null,
      toCreditCardUuid: toCard?.uuid ?? null,
      toCreditCardName: toCard?.name ?? null,
      convertedAmount: payload.convertedAmount ?? null,
      createdAt: now,
      updatedAt: now,
    }
    transactions.push(transaction)
    adjustAccountBalance(transaction, 1)
    return delay(transaction)
  },
  async update(uuidStr: string, payload: TransactionPayload): Promise<Transaction> {
    const index = transactions.findIndex((t) => t.uuid === uuidStr)
    if (index === -1) throw new Error('Transação não encontrada.')
    const previous = transactions[index]
    adjustAccountBalance(previous, -1)

    const category = payload.categoryUuid ? categories.find((c) => c.uuid === payload.categoryUuid) : undefined
    const from = findAccountAndBalance(payload.fromAccountBalanceUuid)
    const creditCard = payload.fromCreditCardUuid
      ? creditCards.find((c) => c.uuid === payload.fromCreditCardUuid)
      : undefined
    const to = findAccountAndBalance(payload.toAccountBalanceUuid)
    const toCard = payload.toCreditCardUuid ? creditCards.find((c) => c.uuid === payload.toCreditCardUuid) : undefined

    const updated: Transaction = {
      ...previous,
      description: payload.description,
      amount: payload.amount,
      type: payload.type,
      date: payload.date,
      time: payload.time ?? previous.time,
      categoryUuid: category?.uuid ?? null,
      categoryName: category?.name ?? previous.categoryName,
      fromAccountBalanceUuid: from?.balance.uuid ?? null,
      fromAccountName: from?.account.name ?? null,
      fromAccountCurrency: from?.balance.currency ?? null,
      fromCreditCardUuid: creditCard?.uuid ?? null,
      fromCreditCardName: creditCard?.name ?? null,
      toAccountBalanceUuid: to?.balance.uuid ?? null,
      toAccountName: to?.account.name ?? null,
      toAccountCurrency: to?.balance.currency ?? null,
      toCreditCardUuid: toCard?.uuid ?? null,
      toCreditCardName: toCard?.name ?? null,
      convertedAmount: payload.convertedAmount ?? null,
      updatedAt: new Date().toISOString(),
    }
    transactions[index] = updated
    adjustAccountBalance(updated, 1)
    return delay(updated)
  },
  async archive(uuidStr: string): Promise<void> {
    archivedTransactionUuids.add(uuidStr)
    return delay(undefined)
  },
  async remove(uuidStr: string): Promise<void> {
    const existing = transactions.find((t) => t.uuid === uuidStr)
    if (existing) adjustAccountBalance(existing, -1)
    transactions = transactions.filter((t) => t.uuid !== uuidStr)
    attachmentsByTransaction.delete(uuidStr)
    return delay(undefined)
  },
}

export const mockAttachments = {
  async list(transactionUuid: string): Promise<Attachment[]> {
    return delay([...(attachmentsByTransaction.get(transactionUuid) ?? [])])
  },
  async upload(transactionUuid: string, file: File): Promise<Attachment> {
    const attachment: Attachment = {
      uuid: uuid(),
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    }
    const list = attachmentsByTransaction.get(transactionUuid) ?? []
    list.push(attachment)
    attachmentsByTransaction.set(transactionUuid, list)
    return delay(attachment)
  },
  async remove(transactionUuid: string, attachmentUuid: string): Promise<void> {
    const list = attachmentsByTransaction.get(transactionUuid) ?? []
    attachmentsByTransaction.set(
      transactionUuid,
      list.filter((a) => a.uuid !== attachmentUuid),
    )
    return delay(undefined)
  },
  async download(): Promise<Blob> {
    return delay(new Blob(['Arquivo simulado — modo mock, sem backend.'], { type: 'text/plain' }))
  },
}

// Keyed by targetType + whichever account/card uuid was chosen, tracking which
// externalRef values have already been committed — mirrors the backend's
// per-source FITID uniqueness so re-uploading/re-confirming the same mock file
// flags the same rows as duplicates, without a real .ofx being parsed client-side.
const importedExternalRefsBySource = new Map<string, Set<string>>()

function bankImportSourceKey(params: { targetType: string; accountBalanceUuid?: string; creditCardUuid?: string }): string {
  return `${params.targetType}:${params.accountBalanceUuid ?? params.creditCardUuid ?? ''}`
}

function isoDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

const mockOfxCandidates: Omit<BankImportCandidate, 'likelyDuplicate' | 'duplicateOfTransactionUuid'>[] = [
  { externalRef: 'MOCK-OFX-1', date: isoDateDaysAgo(5), description: 'SUPERMERCADO BOM PRECO', amount: 89.9, type: 'EXPENSE' },
  { externalRef: 'MOCK-OFX-2', date: isoDateDaysAgo(3), description: 'SALARIO', amount: 2500, type: 'INCOME' },
  { externalRef: 'MOCK-OFX-3', date: isoDateDaysAgo(2), description: 'ASSINATURA STREAMING', amount: 39.9, type: 'EXPENSE' },
  { externalRef: 'MOCK-OFX-4', date: isoDateDaysAgo(1), description: 'POSTO DE GASOLINA', amount: 150, type: 'EXPENSE' },
]

export const mockBankImports = {
  async parse(params: BankImportParseParams): Promise<BankImportCandidate[]> {
    const key = bankImportSourceKey(params)
    const imported = importedExternalRefsBySource.get(key) ?? new Set<string>()
    const candidates = mockOfxCandidates.map((candidate) => ({
      ...candidate,
      likelyDuplicate: imported.has(candidate.externalRef),
      duplicateOfTransactionUuid: null,
    }))
    return delay(candidates)
  },
  async commit(params: BankImportCommitParams): Promise<BankImportCommitResult> {
    const key = bankImportSourceKey(params)
    const imported = importedExternalRefsBySource.get(key) ?? new Set<string>()
    const from = params.targetType === 'ACCOUNT_BALANCE' ? findAccountAndBalance(params.accountBalanceUuid) : undefined
    const creditCard =
      params.targetType === 'CREDIT_CARD' ? creditCards.find((c) => c.uuid === params.creditCardUuid) : undefined

    let importedCount = 0
    let skippedDuplicateCount = 0
    const created: Transaction[] = []

    for (const line of params.lines) {
      if (imported.has(line.externalRef)) {
        skippedDuplicateCount += 1
        continue
      }
      const category = categories.find((c) => c.uuid === line.categoryUuid)
      const now = new Date().toISOString()
      const transaction: Transaction = {
        uuid: uuid(),
        description: line.description,
        amount: line.amount,
        type: line.type,
        date: line.date,
        time: '00:00:00',
        categoryUuid: category?.uuid ?? null,
        categoryName: category?.name ?? null,
        fromAccountBalanceUuid: from?.balance.uuid ?? null,
        fromAccountName: from?.account.name ?? null,
        fromAccountCurrency: from?.balance.currency ?? null,
        fromCreditCardUuid: creditCard?.uuid ?? null,
        fromCreditCardName: creditCard?.name ?? null,
        toAccountBalanceUuid: null,
        toAccountName: null,
        toAccountCurrency: null,
        toCreditCardUuid: null,
        toCreditCardName: null,
        convertedAmount: null,
        createdAt: now,
        updatedAt: now,
      }
      transactions.push(transaction)
      adjustAccountBalance(transaction, 1)
      imported.add(line.externalRef)
      created.push(transaction)
      importedCount += 1
    }

    importedExternalRefsBySource.set(key, imported)
    return delay({ importedCount, skippedDuplicateCount, transactions: created })
  },
}
