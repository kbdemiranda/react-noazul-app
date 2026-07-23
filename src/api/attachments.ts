import { apiClient } from './client'
import { USE_MOCKS } from '../lib/mockConfig'
import { mockAttachments } from './mockStore'
import type { Attachment } from '../types/domain'

export const attachmentsApi = {
  async list(transactionUuid: string): Promise<Attachment[]> {
    if (USE_MOCKS) return mockAttachments.list(transactionUuid)
    const { data } = await apiClient.get<Attachment[]>(`/transactions/${transactionUuid}/attachments`)
    return data
  },
  async upload(transactionUuid: string, file: File): Promise<Attachment> {
    if (USE_MOCKS) return mockAttachments.upload(transactionUuid, file)
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post<Attachment>(
      `/transactions/${transactionUuid}/attachments`,
      formData,
    )
    return data
  },
  async remove(transactionUuid: string, attachmentUuid: string): Promise<void> {
    if (USE_MOCKS) return mockAttachments.remove(transactionUuid, attachmentUuid)
    await apiClient.delete(`/transactions/${transactionUuid}/attachments/${attachmentUuid}`)
  },
  /** Downloads require the bearer token, so a plain `<a href>` won't work — fetch as a blob instead. */
  async download(transactionUuid: string, attachmentUuid: string): Promise<Blob> {
    if (USE_MOCKS) return mockAttachments.download()
    const { data } = await apiClient.get<Blob>(
      `/transactions/${transactionUuid}/attachments/${attachmentUuid}`,
      { responseType: 'blob' },
    )
    return data
  },
}
