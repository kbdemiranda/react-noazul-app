import { apiClient } from './client'
import { USE_MOCKS } from '../lib/mockConfig'
import { mockAccounts } from './mockStore'
import type { Account, AccountBalance, AccountType, Currency } from '../types/domain'

export interface AccountCreatePayload {
  name: string
  bankName: string
  type: AccountType
  currency: Currency
  balance: number
}

// Unlike creation, currency/balance aren't editable here — see addBalance to
// give an existing account a new currency (making it multi-currency, e.g. Wise).
export interface AccountUpdatePayload {
  name: string
  bankName: string
  type: AccountType
}

export interface AccountBalancePayload {
  currency: Currency
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
  async create(payload: AccountCreatePayload): Promise<Account> {
    if (USE_MOCKS) return mockAccounts.create(payload)
    const { data } = await apiClient.post<Account>('/accounts', payload)
    return data
  },
  async update(uuid: string, payload: AccountUpdatePayload): Promise<Account> {
    if (USE_MOCKS) return mockAccounts.update(uuid, payload)
    const { data } = await apiClient.patch<Account>(`/accounts/${uuid}`, payload)
    return data
  },
  async archive(uuid: string): Promise<void> {
    if (USE_MOCKS) return mockAccounts.archive(uuid)
    await apiClient.delete(`/accounts/${uuid}`)
  },
  async addBalance(uuid: string, payload: AccountBalancePayload): Promise<AccountBalance> {
    if (USE_MOCKS) return mockAccounts.addBalance(uuid, payload)
    const { data } = await apiClient.post<AccountBalance>(`/accounts/${uuid}/balances`, payload)
    return data
  },
  async removeBalance(uuid: string, balanceUuid: string): Promise<void> {
    if (USE_MOCKS) return mockAccounts.removeBalance(uuid, balanceUuid)
    await apiClient.delete(`/accounts/${uuid}/balances/${balanceUuid}`)
  },
}
