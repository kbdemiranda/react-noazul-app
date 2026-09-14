import { apiClient } from './client'
import { USE_MOCKS } from '../lib/mockConfig'
import { mockCreditCards } from './mockStore'
import type { CreditCard, Currency, Invoice } from '../types/domain'

export interface CreditCardPayload {
  name: string
  issuer: string
  currency: Currency
  creditLimit: number
  closingDay: number
  dueDay: number
}

export const creditCardsApi = {
  async list(): Promise<CreditCard[]> {
    if (USE_MOCKS) return mockCreditCards.list()
    const { data } = await apiClient.get<CreditCard[]>('/credit-cards')
    return data
  },
  async find(uuid: string): Promise<CreditCard> {
    if (USE_MOCKS) return mockCreditCards.find(uuid)
    const { data } = await apiClient.get<CreditCard>(`/credit-cards/${uuid}`)
    return data
  },
  async listInvoices(uuid: string): Promise<Invoice[]> {
    if (USE_MOCKS) return mockCreditCards.listInvoices(uuid)
    const { data } = await apiClient.get<Invoice[]>(`/credit-cards/${uuid}/invoices`)
    return data
  },
  async create(payload: CreditCardPayload): Promise<CreditCard> {
    if (USE_MOCKS) return mockCreditCards.create(payload)
    const { data } = await apiClient.post<CreditCard>('/credit-cards', payload)
    return data
  },
  async update(uuid: string, payload: CreditCardPayload): Promise<CreditCard> {
    if (USE_MOCKS) return mockCreditCards.update(uuid, payload)
    const { data } = await apiClient.patch<CreditCard>(`/credit-cards/${uuid}`, payload)
    return data
  },
  async archive(uuid: string): Promise<void> {
    if (USE_MOCKS) return mockCreditCards.archive(uuid)
    await apiClient.delete(`/credit-cards/${uuid}`)
  },
}
