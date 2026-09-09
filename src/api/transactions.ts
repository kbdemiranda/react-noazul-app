import { apiClient } from './client'
import { USE_MOCKS } from '../lib/mockConfig'
import { mockTransactions } from './mockStore'
import type { FlowType, Transaction } from '../types/domain'

export interface TransactionPayload {
  description: string
  amount: number
  type: FlowType
  date: string // yyyy-MM-dd
  time?: string | null // HH:mm:ss
  // Required for every type except EXCHANGE, which must omit it.
  categoryUuid?: string | null
  fromAccountBalanceUuid?: string | null
  fromCreditCardUuid?: string | null
  // Populated for TRANSFER and EXCHANGE only.
  toAccountBalanceUuid?: string | null
  // Only for a TRANSFER paying down a credit card — mutually exclusive with
  // toAccountBalanceUuid. This is how "pay the invoice" is recorded.
  toCreditCardUuid?: string | null
  // Only for EXCHANGE — the amount credited to toAccountBalanceUuid, in its
  // own currency.
  convertedAmount?: number | null
}

export interface TransactionFilters {
  dateFrom: string // yyyy-MM-dd
  dateTo: string // yyyy-MM-dd
  description?: string
  type?: FlowType
  categoryUuid?: string
  accountBalanceUuids?: string[]
  creditCardUuids?: string[]
}

export const transactionsApi = {
  async list(filters: TransactionFilters): Promise<Transaction[]> {
    if (USE_MOCKS) return mockTransactions.list(filters)
    // Comma-joined into a plain string, not passed as an array: axios's default
    // paramsSerializer renders an array param as `key[]=v1&key[]=v2`, which
    // Spring's `@RequestParam List<UUID>` won't bind (it expects the bare key).
    const params = {
      ...filters,
      accountBalanceUuids: filters.accountBalanceUuids?.length ? filters.accountBalanceUuids.join(',') : undefined,
      creditCardUuids: filters.creditCardUuids?.length ? filters.creditCardUuids.join(',') : undefined,
    }
    const { data } = await apiClient.get<Transaction[]>('/transactions', { params })
    return data
  },
  async find(uuid: string): Promise<Transaction> {
    if (USE_MOCKS) return mockTransactions.find(uuid)
    const { data } = await apiClient.get<Transaction>(`/transactions/${uuid}`)
    return data
  },
  async create(payload: TransactionPayload): Promise<Transaction> {
    if (USE_MOCKS) return mockTransactions.create(payload)
    const { data } = await apiClient.post<Transaction>('/transactions', payload)
    return data
  },
  async update(uuid: string, payload: TransactionPayload): Promise<Transaction> {
    if (USE_MOCKS) return mockTransactions.update(uuid, payload)
    const { data } = await apiClient.patch<Transaction>(`/transactions/${uuid}`, payload)
    return data
  },
  async archive(uuid: string): Promise<void> {
    if (USE_MOCKS) return mockTransactions.archive(uuid)
    await apiClient.post(`/transactions/${uuid}/archive`)
  },
  async remove(uuid: string): Promise<void> {
    if (USE_MOCKS) return mockTransactions.remove(uuid)
    await apiClient.delete(`/transactions/${uuid}`)
  },
  async removeAll(): Promise<void> {
    if (USE_MOCKS) return mockTransactions.removeAll()
    await apiClient.delete('/transactions')
  },
}
