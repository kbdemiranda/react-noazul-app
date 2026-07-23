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
  categoryUuid: string
  fromAccountUuid?: string | null
  fromCreditCardUuid?: string | null
}

export const transactionsApi = {
  async list(): Promise<Transaction[]> {
    if (USE_MOCKS) return mockTransactions.list()
    const { data } = await apiClient.get<Transaction[]>('/transactions')
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
}
