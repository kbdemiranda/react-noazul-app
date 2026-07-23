import { apiClient } from './client'
import { USE_MOCKS } from '../lib/mockConfig'
import { mockCategories } from './mockStore'
import type { Category, FlowType } from '../types/domain'

export interface CategoryPayload {
  name: string
  type?: FlowType
  parentUuid?: string | null
}

export const categoriesApi = {
  async list(): Promise<Category[]> {
    if (USE_MOCKS) return mockCategories.list()
    const { data } = await apiClient.get<Category[]>('/categories')
    return data
  },
  async create(payload: CategoryPayload): Promise<Category> {
    if (USE_MOCKS) return mockCategories.create(payload)
    const { data } = await apiClient.post<Category>('/categories', payload)
    return data
  },
  async rename(uuid: string, name: string): Promise<Category> {
    if (USE_MOCKS) return mockCategories.rename(uuid, name)
    const { data } = await apiClient.patch<Category>(`/categories/${uuid}`, { name })
    return data
  },
  async archive(uuid: string): Promise<void> {
    if (USE_MOCKS) return mockCategories.archive(uuid)
    await apiClient.delete(`/categories/${uuid}`)
  },
}
