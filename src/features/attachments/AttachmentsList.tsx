import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileText, Paperclip, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { attachmentsApi } from '../../api/attachments'
import { Button } from '../../components/Button'
import { CardKicker } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { formatFileSize } from '../../lib/format'

export const ACCEPTED_ATTACHMENT_TYPES = '.pdf,.jpg,.jpeg,.png,.webp'

export function AttachmentsList({ transactionUuid }: { transactionUuid: string }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<unknown>(null)

  const attachmentsQuery = useQuery({
    queryKey: ['attachments', transactionUuid],
    queryFn: () => attachmentsApi.list(transactionUuid),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(transactionUuid, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', transactionUuid] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (attachmentUuid: string) => attachmentsApi.remove(transactionUuid, attachmentUuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', transactionUuid] }),
  })

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await uploadMutation.mutateAsync(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDownload = async (attachmentUuid: string, fileName: string) => {
    setDownloadError(null)
    setDownloadingUuid(attachmentUuid)
    try {
      const blob = await attachmentsApi.download(transactionUuid, attachmentUuid)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setDownloadError(error)
    } finally {
      setDownloadingUuid(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <CardKicker>Comprovantes</CardKicker>

      {attachmentsQuery.isError && <ErrorBanner error={attachmentsQuery.error} />}
      {uploadMutation.isError && <ErrorBanner error={uploadMutation.error} />}
      {Boolean(downloadError) && <ErrorBanner error={downloadError} />}

      {attachmentsQuery.data?.length === 0 && (
        <p className="text-[12.5px] text-ink/60">Nenhum comprovante anexado. Formatos aceitos: PDF, JPG, PNG, WEBP.</p>
      )}

      <ul className="flex flex-col">
        {attachmentsQuery.data?.map((attachment) => (
          <li
            key={attachment.uuid}
            className="flex items-center gap-2.5 border-b border-black/[.06] py-2.5 last:border-b-0"
          >
            <FileText size={16} className="flex-none text-ink/50" />
            <div className="min-w-0 flex-1 text-[12.5px]">
              <p className="truncate text-ink">{attachment.fileName}</p>
              <p className="text-[11px] text-ink/55">{formatFileSize(attachment.fileSize)}</p>
            </div>
            <button
              type="button"
              aria-label={`Baixar ${attachment.fileName}`}
              className="rounded-full p-1.5 text-ink/60 hover:bg-black/[.06] disabled:opacity-50"
              disabled={downloadingUuid === attachment.uuid}
              onClick={() => handleDownload(attachment.uuid, attachment.fileName)}
            >
              <Download size={15} />
            </button>
            <button
              type="button"
              aria-label={`Excluir ${attachment.fileName}`}
              className="rounded-full p-1.5 text-expense hover:bg-expense-vivid/12 disabled:opacity-50"
              disabled={deleteMutation.isPending && deleteMutation.variables === attachment.uuid}
              onClick={() => deleteMutation.mutate(attachment.uuid)}
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_ATTACHMENT_TYPES}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="ghost"
        className="w-fit px-0"
        isLoading={uploadMutation.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip size={14} />
        Anexar comprovante
      </Button>
    </div>
  )
}
