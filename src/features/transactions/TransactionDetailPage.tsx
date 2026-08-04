import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ArrowLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { accountsApi } from '../../api/accounts'
import { creditCardsApi } from '../../api/creditCards'
import { transactionsApi, type TransactionPayload } from '../../api/transactions'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { Modal } from '../../components/Modal'
import { AttachmentsList } from '../attachments/AttachmentsList'
import { CategoryIconBadge, categoryColor } from '../../lib/categoryIcons'
import { flowTone } from '../../lib/flow'
import { formatCurrency, formatDate, formatTime } from '../../lib/format'
import { flowTypeLabels } from '../../lib/labels'
import { ExchangeFormModal } from '../exchange/ExchangeFormModal'
import { TransactionFormModal } from './TransactionFormModal'

export function TransactionDetailPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const transactionQuery = useQuery({
    queryKey: ['transactions', uuid],
    queryFn: () => transactionsApi.find(uuid!),
    enabled: !!uuid,
  })
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  const creditCardsQuery = useQuery({ queryKey: ['credit-cards'], queryFn: creditCardsApi.list })

  const updateMutation = useMutation({
    mutationFn: (payload: TransactionPayload) => transactionsApi.update(uuid!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => transactionsApi.archive(uuid!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      navigate('/transacoes')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => transactionsApi.remove(uuid!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      navigate('/transacoes')
    },
  })

  if (!uuid) return null
  if (transactionQuery.isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-ink/[.06]" />
  }
  if (transactionQuery.isError) return <ErrorBanner error={transactionQuery.error} />

  const transaction = transactionQuery.data
  if (!transaction) return null
  const tone = flowTone(transaction.type)
  const { text: categoryText, bg: categoryBg } = categoryColor(transaction.categoryName ?? 'Câmbio', transaction.type)

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => navigate('/transacoes')}
        className="flex w-fit items-center gap-1.5 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={14} />
        Voltar para transações
      </button>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <CategoryIconBadge name={transaction.categoryName ?? 'Câmbio'} type={transaction.type} size="lg" />
          <div>
            <h1 className="font-heading text-base font-semibold text-ink">{transaction.description}</h1>
            <span
              className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${categoryBg} ${categoryText}`}
            >
              {flowTypeLabels[transaction.type]} · {transaction.categoryName ?? 'Câmbio'}
            </span>
          </div>
        </div>

        <p className={`font-heading text-4xl tabular-nums ${tone.text}`}>
          {tone.sign}
          {formatCurrency(transaction.amount, transaction.fromAccountCurrency ?? undefined)}
        </p>

        <dl className="flex flex-col gap-2 border-y border-ink/[.08] py-3.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-ink/60">Data</dt>
            <dd className="text-ink">
              {formatDate(transaction.date)} às {formatTime(transaction.time)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink/60">Origem</dt>
            <dd className="text-ink">{transaction.fromAccountName ?? transaction.fromCreditCardName}</dd>
          </div>
          {(transaction.type === 'TRANSFER' || transaction.type === 'EXCHANGE') && (
            <div className="flex items-center justify-between">
              <dt className="text-ink/60">Conta de destino</dt>
              <dd className="text-ink">{transaction.toAccountName}</dd>
            </div>
          )}
          {transaction.type === 'EXCHANGE' && transaction.convertedAmount != null && (
            <div className="flex items-center justify-between">
              <dt className="text-ink/60">Valor convertido</dt>
              <dd className="text-ink">
                {formatCurrency(transaction.convertedAmount, transaction.toAccountCurrency ?? undefined)}
              </dd>
            </div>
          )}
        </dl>

        {archiveMutation.isError && <ErrorBanner error={archiveMutation.error} />}
        {deleteMutation.isError && <ErrorBanner error={deleteMutation.error} />}

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setIsEditing(true)}>
            Editar
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            isLoading={archiveMutation.isPending}
            onClick={() => archiveMutation.mutate()}
          >
            <Archive size={14} />
            Arquivar
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => setIsConfirmingDelete(true)}>
            <Trash2 size={14} />
            Excluir
          </Button>
        </div>
      </Card>

      <Card>
        <AttachmentsList transactionUuid={uuid} />
      </Card>

      {isEditing && transaction.type === 'EXCHANGE' && (
        <ExchangeFormModal
          transaction={transaction}
          // Same "holds more than one currency" filter ExchangePage uses —
          // a câmbio can only ever involve one of these accounts.
          accounts={(accountsQuery.data ?? []).filter((account) => account.balances.length > 1)}
          onClose={() => setIsEditing(false)}
          onSubmit={async (payload) => {
            await updateMutation.mutateAsync(payload)
          }}
        />
      )}

      {isEditing && transaction.type !== 'EXCHANGE' && (
        <TransactionFormModal
          transaction={transaction}
          accounts={accountsQuery.data ?? []}
          creditCards={creditCardsQuery.data ?? []}
          onClose={() => setIsEditing(false)}
          onSubmit={(payload) => updateMutation.mutateAsync(payload)}
        />
      )}

      {isConfirmingDelete && (
        <Modal title="Excluir lançamento?" onClose={() => setIsConfirmingDelete(false)}>
          <p className="text-sm text-ink/80">
            Esta ação é permanente e não pode ser desfeita — diferente de arquivar. &ldquo;{transaction.description}
            &rdquo; será removido definitivamente.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsConfirmingDelete(false)}>
              Cancelar
            </Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Excluir permanentemente
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
