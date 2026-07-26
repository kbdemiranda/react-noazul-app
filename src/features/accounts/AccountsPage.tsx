import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Landmark, Plus } from 'lucide-react'
import { useState } from 'react'
import {
  accountsApi,
  type AccountBalancePayload,
  type AccountCreatePayload,
  type AccountUpdatePayload,
} from '../../api/accounts'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { BankLogo } from '../../lib/bankLogos'
import { accountTypeLabels, currencyLabels } from '../../lib/labels'
import { formatCurrency } from '../../lib/format'
import type { Account } from '../../types/domain'
import { AccountFormModal } from './AccountFormModal'
import { AddAccountBalanceModal } from './AddAccountBalanceModal'

export function AccountsPage() {
  const queryClient = useQueryClient()
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined)
  const [addingBalanceTo, setAddingBalanceTo] = useState<Account | undefined>(undefined)
  const [isCreating, setIsCreating] = useState(false)

  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })

  const createMutation = useMutation({
    mutationFn: (payload: AccountCreatePayload) => accountsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: AccountUpdatePayload }) =>
      accountsApi.update(uuid, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })

  const archiveMutation = useMutation({
    mutationFn: (uuid: string) => accountsApi.archive(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })

  const addBalanceMutation = useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: AccountBalancePayload }) =>
      accountsApi.addBalance(uuid, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Contas</h1>
        <Button onClick={() => setIsCreating(true)} aria-label="Nova conta">
          <Plus size={15} />
          <span className="hidden sm:inline">Nova conta</span>
        </Button>
      </div>

      {accountsQuery.isError && <ErrorBanner error={accountsQuery.error} />}
      {archiveMutation.isError && <ErrorBanner error={archiveMutation.error} />}

      {accountsQuery.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-black/[.06]" />
          ))}
        </div>
      )}

      {accountsQuery.data?.length === 0 && (
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <Landmark size={28} className="text-ink/35" />
          <h3 className="font-heading text-base font-semibold text-ink">Nenhuma conta cadastrada</h3>
          <p className="max-w-xs text-[12.5px] text-ink/65">
            Cadastre sua primeira conta para começar a lançar transações.
          </p>
          <Button className="mt-1" onClick={() => setIsCreating(true)}>
            Cadastrar conta
          </Button>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accountsQuery.data?.map((account) => {
          return (
            <Card key={account.uuid} className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <BankLogo name={account.bankName} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-[15px] text-ink">{account.name}</p>
                  <Badge variant="neutral">{accountTypeLabels[account.type]}</Badge>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {account.balances.map((balance) => (
                  <div key={balance.uuid} className="flex items-baseline justify-between gap-2">
                    <p className="font-heading text-2xl tabular-nums text-ink">
                      {formatCurrency(balance.balance, balance.currency)}
                    </p>
                    <Badge variant="neutral" title={currencyLabels[balance.currency]}>
                      {balance.currency}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setEditingAccount(account)}>
                  Editar
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setAddingBalanceTo(account)}>
                  + Moeda
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  isLoading={archiveMutation.isPending && archiveMutation.variables === account.uuid}
                  onClick={() => archiveMutation.mutate(account.uuid)}
                >
                  Arquivar
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {isCreating && (
        <AccountFormModal
          onClose={() => setIsCreating(false)}
          onSubmit={async (payload) => {
            await createMutation.mutateAsync(payload as AccountCreatePayload)
          }}
        />
      )}

      {editingAccount && (
        <AccountFormModal
          account={editingAccount}
          onClose={() => setEditingAccount(undefined)}
          onSubmit={async (payload) => {
            await updateMutation.mutateAsync({ uuid: editingAccount.uuid, payload: payload as AccountUpdatePayload })
          }}
        />
      )}

      {addingBalanceTo && (
        <AddAccountBalanceModal
          account={addingBalanceTo}
          onClose={() => setAddingBalanceTo(undefined)}
          onSubmit={async (payload) => {
            await addBalanceMutation.mutateAsync({ uuid: addingBalanceTo.uuid, payload })
          }}
        />
      )}
    </div>
  )
}
