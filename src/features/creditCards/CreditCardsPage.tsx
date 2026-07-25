import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard as CreditCardIcon, Plus } from 'lucide-react'
import { useState } from 'react'
import { creditCardsApi, type CreditCardPayload } from '../../api/creditCards'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card, CardKicker } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { BankLogo } from '../../lib/bankLogos'
import { formatCurrency } from '../../lib/format'
import type { CreditCard } from '../../types/domain'
import { CreditCardFormModal } from './CreditCardFormModal'

export function CreditCardsPage() {
  const queryClient = useQueryClient()
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>(undefined)
  const [isCreating, setIsCreating] = useState(false)

  const cardsQuery = useQuery({ queryKey: ['credit-cards'], queryFn: creditCardsApi.list })

  const createMutation = useMutation({
    mutationFn: (payload: CreditCardPayload) => creditCardsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credit-cards'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: CreditCardPayload }) =>
      creditCardsApi.update(uuid, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credit-cards'] }),
  })

  const archiveMutation = useMutation({
    mutationFn: (uuid: string) => creditCardsApi.archive(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credit-cards'] }),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Cartões</h1>
        <Button onClick={() => setIsCreating(true)} aria-label="Novo cartão">
          <Plus size={15} />
          <span className="hidden sm:inline">Novo cartão</span>
        </Button>
      </div>

      {cardsQuery.isError && <ErrorBanner error={cardsQuery.error} />}
      {archiveMutation.isError && <ErrorBanner error={archiveMutation.error} />}

      {cardsQuery.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-black/[.06]" />
          ))}
        </div>
      )}

      {cardsQuery.data?.length === 0 && (
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <CreditCardIcon size={28} className="text-ink/35" />
          <h3 className="font-heading text-base font-semibold text-ink">Nenhum cartão cadastrado</h3>
          <p className="max-w-xs text-[12.5px] text-ink/65">Cadastre seu primeiro cartão de crédito.</p>
          <Button className="mt-1" onClick={() => setIsCreating(true)}>
            Cadastrar cartão
          </Button>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cardsQuery.data?.map((card) => (
          <Card key={card.uuid} className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <BankLogo name={card.issuer} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-[15px] text-ink">{card.name}</p>
                <Badge variant="outline">
                  Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                </Badge>
              </div>
            </div>
            <div>
              <CardKicker>Limite</CardKicker>
              <p className="font-heading text-2xl tabular-nums text-ink">{formatCurrency(card.creditLimit)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setEditingCard(card)}>
                Editar
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                isLoading={archiveMutation.isPending && archiveMutation.variables === card.uuid}
                onClick={() => archiveMutation.mutate(card.uuid)}
              >
                Arquivar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {isCreating && (
        <CreditCardFormModal
          onClose={() => setIsCreating(false)}
          onSubmit={async (payload) => {
            await createMutation.mutateAsync(payload)
          }}
        />
      )}

      {editingCard && (
        <CreditCardFormModal
          card={editingCard}
          onClose={() => setEditingCard(undefined)}
          onSubmit={async (payload) => {
            await updateMutation.mutateAsync({ uuid: editingCard.uuid, payload })
          }}
        />
      )}
    </div>
  )
}
