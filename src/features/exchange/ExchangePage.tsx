import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { accountsApi } from '../../api/accounts'
import { transactionsApi, type TransactionPayload } from '../../api/transactions'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { BankLogo } from '../../lib/bankLogos'
import { currencyLabels } from '../../lib/labels'
import { formatCurrency } from '../../lib/format'
import { ExchangeFormModal } from './ExchangeFormModal'

export function ExchangePage() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })

  const createMutation = useMutation({
    mutationFn: (payload: TransactionPayload) => transactionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  // Câmbio only makes sense within an account that holds more than one
  // currency (Wise, Revolut, ...) — a single-currency account has nothing to
  // convert between.
  const multiCurrencyAccounts = (accountsQuery.data ?? []).filter((account) => account.balances.length > 1)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Câmbio</h1>
        {multiCurrencyAccounts.length > 0 && (
          <Button onClick={() => setIsCreating(true)}>Novo câmbio</Button>
        )}
      </div>

      {isCreating && (
        <ExchangeFormModal
          accounts={multiCurrencyAccounts}
          onClose={() => setIsCreating(false)}
          onSubmit={async (payload) => {
            await createMutation.mutateAsync(payload)
          }}
        />
      )}

      {accountsQuery.isError && <ErrorBanner error={accountsQuery.error} />}

      {accountsQuery.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-black/[.06]" />
          ))}
        </div>
      )}

      {!accountsQuery.isLoading && multiCurrencyAccounts.length === 0 && (
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <ArrowLeftRight size={28} className="text-ink/35" />
          <h3 className="font-heading text-base font-semibold text-ink">Nenhuma conta multi-moeda</h3>
          <p className="max-w-xs text-[12.5px] text-ink/65">
            Câmbio só existe entre saldos da mesma conta. Adicione uma segunda moeda a uma conta (ex: Wise, Revolut)
            para começar a converter entre elas.
          </p>
          <Link to="/contas">
            <Button className="mt-1">Ir para Contas</Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {multiCurrencyAccounts.map((account) => (
          <Card key={account.uuid} className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <BankLogo name={account.bankName} size={36} />
              <p className="truncate font-heading text-[15px] text-ink">{account.name}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {account.balances.map((balance) => (
                <div key={balance.uuid} className="flex items-baseline justify-between gap-2">
                  <p className="font-heading text-xl tabular-nums text-ink">
                    {formatCurrency(balance.balance, balance.currency)}
                  </p>
                  <Badge variant="neutral" title={currencyLabels[balance.currency]}>
                    {balance.currency}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
