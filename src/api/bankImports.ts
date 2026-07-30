import { apiClient } from './client'
import { USE_MOCKS } from '../lib/mockConfig'
import { mockBankImports } from './mockStore'
import type { FlowType, Transaction } from '../types/domain'

export type BankImportTargetType = 'ACCOUNT_BALANCE' | 'CREDIT_CARD'

export interface BankImportCandidate {
  externalRef: string
  date: string // yyyy-MM-dd
  description: string
  amount: number
  type: Extract<FlowType, 'INCOME' | 'EXPENSE'>
  likelyDuplicate: boolean
  duplicateOfTransactionUuid: string | null
}

export interface BankImportParseParams {
  file: File
  targetType: BankImportTargetType
  accountBalanceUuid?: string
  creditCardUuid?: string
}

// A candidate plus the category the user assigned to it during review —
// categoryUuid stays '' until the user picks one, and the confirm button on
// BankImportPage stays disabled until every included row has a non-empty value.
export interface BankImportLine extends BankImportCandidate {
  categoryUuid: string
}

export interface BankImportCommitParams {
  targetType: BankImportTargetType
  accountBalanceUuid?: string
  creditCardUuid?: string
  lines: BankImportLine[]
}

export interface BankImportCommitResult {
  importedCount: number
  skippedDuplicateCount: number
  transactions: Transaction[]
}

export const bankImportsApi = {
  async parse(params: BankImportParseParams): Promise<BankImportCandidate[]> {
    if (USE_MOCKS) return mockBankImports.parse(params)
    const formData = new FormData()
    formData.append('file', params.file)
    formData.append('targetType', params.targetType)
    if (params.accountBalanceUuid) formData.append('accountBalanceUuid', params.accountBalanceUuid)
    if (params.creditCardUuid) formData.append('creditCardUuid', params.creditCardUuid)
    const { data } = await apiClient.post<{ candidates: BankImportCandidate[] }>(
      '/bank-imports/parse',
      formData,
    )
    return data.candidates
  },
  async commit(params: BankImportCommitParams): Promise<BankImportCommitResult> {
    if (USE_MOCKS) return mockBankImports.commit(params)
    const { data } = await apiClient.post<BankImportCommitResult>('/bank-imports/commit', params)
    return data
  },
}
