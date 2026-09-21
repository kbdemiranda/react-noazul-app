import { apiClient } from './client'

/** Institution data used by the account and credit-card forms. */
export interface FinancialInstitution {
  id: number
  code: number | null
  name: string
  fullName: string | null
  logoUrl: string | null
}

export const financialInstitutionsApi = {
  async search(name: string): Promise<FinancialInstitution[]> {
    const { data } = await apiClient.get<FinancialInstitution[]>('/financial-institutions', { params: { name } })
    return data
  },

  async findByCode(code: number): Promise<FinancialInstitution[]> {
    const { data } = await apiClient.get<FinancialInstitution[]>(`/financial-institutions/code/${code}`)
    return data
  },

  async find(id: number): Promise<FinancialInstitution> {
    const { data } = await apiClient.get<FinancialInstitution>(`/financial-institutions/${id}`)
    return data
  },
}
