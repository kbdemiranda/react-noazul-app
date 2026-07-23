import { apiClient } from './client'
import { USE_MOCKS } from '../lib/mockConfig'
import { mockAccounts } from './mockStore'
import type { Account, AccountType } from '../types/domain'

export interface AccountPayload {
  name: string
  bankName: string
  type: AccountType
  balance: number
}

export const accountsApi = {
  async list(): Promise<Account[]> {
    if (USE_MOCKS) return mockAccounts.list()
    const { data } = await apiClient.get<Account[]>('/accounts')
    return data
  },
  async find(uuid: string): Promise<Account> {
    if (USE_MOCKS) return mockAccounts.find(uuid)
    const { data } = await apiClient.get<Account>(`/accounts/${uuid}`)
    return data
  },
  async create(payload: AccountPayload): Promise<Account> {
    if (USE_MOCKS) return mockAccounts.create(payload)
    const { data } = await apiClient.post<Account>('/accounts', payload)
    return data
  },
  async update(uuid: string, payload: AccountPayload): Promise<Account> {
    if (USE_MOCKS) return mockAccounts.update(uuid, payload)
    const { data } = await apiClient.patch<Account>(`/accounts/${uuid}`, payload)
    return data
  },
  async archive(uuid: string): Promise<void> {
    if (USE_MOCKS) return mockAccounts.archive(uuid)
    await apiClient.delete(`/accounts/${uuid}`)
  },
}
