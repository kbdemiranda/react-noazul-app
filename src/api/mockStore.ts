import type { Account, Attachment, AuthTokens, Category, CreditCard, Transaction, User } from '../types/domain'
import type { AccountPayload } from './accounts'
import type { CreditCardPayload } from './creditCards'
import type { CategoryPayload } from './categories'
import type { TransactionPayload } from './transactions'

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

let mockUser: User = { uuid: 'mock-user', name: 'Marina Souza', email: 'marina.souza@example.com' }

const categories: Category[] = seedCategories.map((c) => ({ ...c }))
const archivedCategoryUuids = new Set<string>()

let accounts: Account[] = []
let creditCards: CreditCard[] = []
let transactions: Transaction[] = []
const archivedTransactionUuids = new Set<string>()
const attachmentsByTransaction = new Map<string, Attachment[]>()

function adjustAccountBalance(transaction: Transaction, sign: 1 | -1): void {
  if (transaction.type === 'TRANSFER') {
    const from = transaction.fromAccountUuid ? accounts.find((a) => a.uuid === transaction.fromAccountUuid) : undefined
    const to = transaction.toAccountUuid ? accounts.find((a) => a.uuid === transaction.toAccountUuid) : undefined
    if (from) from.balance -= transaction.amount * sign
    if (to) to.balance += transaction.amount * sign
    return
  }
  if (!transaction.fromAccountUuid) return
  const account = accounts.find((a) => a.uuid === transaction.fromAccountUuid)
  if (!account) return
  const delta = transaction.type === 'EXPENSE' ? -transaction.amount : transaction.amount
  account.balance += delta * sign
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
  async create(payload: AccountPayload): Promise<Account> {
    const account: Account = { uuid: uuid(), ...payload }
    accounts.push(account)
    return delay(account)
  },
  async update(uuidStr: string, payload: AccountPayload): Promise<Account> {
    accounts = accounts.map((a) => (a.uuid === uuidStr ? { ...a, ...payload } : a))
    return delay(accounts.find((a) => a.uuid === uuidStr)!)
  },
  async archive(uuidStr: string): Promise<void> {
    accounts = accounts.filter((a) => a.uuid !== uuidStr)
    return delay(undefined)
  },
}

export const mockCreditCards = {
  async list(): Promise<CreditCard[]> {
    return delay([...creditCards])
  },
  async find(uuidStr: string): Promise<CreditCard> {
    const found = creditCards.find((c) => c.uuid === uuidStr)
    if (!found) throw new Error('Cartão não encontrado.')
    return delay(found)
  },
  async create(payload: CreditCardPayload): Promise<CreditCard> {
    const card: CreditCard = { uuid: uuid(), ...payload }
    creditCards.push(card)
    return delay(card)
  },
  async update(uuidStr: string, payload: CreditCardPayload): Promise<CreditCard> {
    creditCards = creditCards.map((c) => (c.uuid === uuidStr ? { ...c, ...payload } : c))
    return delay(creditCards.find((c) => c.uuid === uuidStr)!)
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
  async list(): Promise<Transaction[]> {
    return delay(transactions.filter((t) => !archivedTransactionUuids.has(t.uuid)))
  },
  async find(uuidStr: string): Promise<Transaction> {
    const found = transactions.find((t) => t.uuid === uuidStr)
    if (!found) throw new Error('Transação não encontrada.')
    return delay(found)
  },
  async create(payload: TransactionPayload): Promise<Transaction> {
    const category = categories.find((c) => c.uuid === payload.categoryUuid)
    const account = payload.fromAccountUuid ? accounts.find((a) => a.uuid === payload.fromAccountUuid) : undefined
    const creditCard = payload.fromCreditCardUuid
      ? creditCards.find((c) => c.uuid === payload.fromCreditCardUuid)
      : undefined
    const toAccount = payload.toAccountUuid ? accounts.find((a) => a.uuid === payload.toAccountUuid) : undefined
    const now = new Date().toISOString()
    const transaction: Transaction = {
      uuid: uuid(),
      description: payload.description,
      amount: payload.amount,
      type: payload.type,
      date: payload.date,
      time: payload.time ?? new Date().toTimeString().slice(0, 8),
      categoryUuid: payload.categoryUuid,
      categoryName: category?.name ?? '',
      fromAccountUuid: account?.uuid ?? null,
      fromAccountName: account?.name ?? null,
      fromCreditCardUuid: creditCard?.uuid ?? null,
      fromCreditCardName: creditCard?.name ?? null,
      toAccountUuid: toAccount?.uuid ?? null,
      toAccountName: toAccount?.name ?? null,
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

    const category = categories.find((c) => c.uuid === payload.categoryUuid)
    const account = payload.fromAccountUuid ? accounts.find((a) => a.uuid === payload.fromAccountUuid) : undefined
    const creditCard = payload.fromCreditCardUuid
      ? creditCards.find((c) => c.uuid === payload.fromCreditCardUuid)
      : undefined
    const toAccount = payload.toAccountUuid ? accounts.find((a) => a.uuid === payload.toAccountUuid) : undefined

    const updated: Transaction = {
      ...previous,
      description: payload.description,
      amount: payload.amount,
      type: payload.type,
      date: payload.date,
      time: payload.time ?? previous.time,
      categoryUuid: payload.categoryUuid,
      categoryName: category?.name ?? previous.categoryName,
      fromAccountUuid: account?.uuid ?? null,
      fromAccountName: account?.name ?? null,
      fromCreditCardUuid: creditCard?.uuid ?? null,
      fromCreditCardName: creditCard?.name ?? null,
      toAccountUuid: toAccount?.uuid ?? null,
      toAccountName: toAccount?.name ?? null,
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
