import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, CreditCard as CreditCardIcon, FileUp, Landmark } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { accountsApi } from '../../api/accounts'
import { bankImportsApi, type BankImportTargetType } from '../../api/bankImports'
import { categoriesApi } from '../../api/categories'
import { creditCardsApi } from '../../api/creditCards'
import { Button } from '../../components/Button'
import { Card, CardKicker } from '../../components/Card'
import { ErrorBanner } from '../../components/ErrorBanner'
import { PickerField, type PickerOption } from '../../components/PickerField'
import { BankLogo } from '../../lib/bankLogos'
import { accountTypeLabels } from '../../lib/labels'
import type { AccountType, Currency } from '../../types/domain'
import { BankImportReviewTable, type ReviewLine } from './BankImportReviewTable'

const TARGET_OPTIONS: { value: BankImportTargetType; label: string }[] = [
  { value: 'ACCOUNT_BALANCE', label: 'Extrato de conta' },
  { value: 'CREDIT_CARD', label: 'Fatura de cartão' },
]

interface BalanceOption {
  balanceUuid: string
  accountUuid: string
  accountName: string
  bankName: string
  accountType: AccountType
  currency: Currency
}

export function BankImportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [targetType, setTargetType] = useState<BankImportTargetType>('ACCOUNT_BALANCE')
  const [accountBalanceUuid, setAccountBalanceUuid] = useState<string | undefined>()
  const [creditCardUuid, setCreditCardUuid] = useState<string | undefined>()
  const [file, setFile] = useState<File | null>(null)
  const [lines, setLines] = useState<ReviewLine[]>([])
  const [commitResult, setCommitResult] = useState<{ importedCount: number; skippedDuplicateCount: number } | null>(
    null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  const creditCardsQuery = useQuery({ queryKey: ['credit-cards'], queryFn: creditCardsApi.list })
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })

  const balanceOptions = useMemo<BalanceOption[]>(
    () =>
      (accountsQuery.data ?? []).flatMap((account) =>
        account.balances.map((balance) => ({
          balanceUuid: balance.uuid,
          accountUuid: account.uuid,
          accountName: account.name,
          bankName: account.bankName,
          accountType: account.type,
          currency: balance.currency,
        })),
      ),
    [accountsQuery.data],
  )

  const accountPickerOptions = useMemo<PickerOption[]>(
    () =>
      balanceOptions.map((option) => ({
        value: option.balanceUuid,
        label: option.accountName,
        sublabel: `${accountTypeLabels[option.accountType]} · ${option.currency}`,
        leading: <BankLogo name={option.bankName} size={22} />,
      })),
    [balanceOptions],
  )

  const creditCardPickerOptions = useMemo<PickerOption[]>(
    () =>
      (creditCardsQuery.data ?? []).map((card) => ({
        value: card.uuid,
        label: card.name,
        sublabel: 'Cartão de crédito',
        leading: <BankLogo name={card.issuer} size={22} />,
      })),
    [creditCardsQuery.data],
  )

  const selectedBalance = balanceOptions.find((option) => option.balanceUuid === accountBalanceUuid)
  const selectedCard = (creditCardsQuery.data ?? []).find((card) => card.uuid === creditCardUuid)
  const currency = targetType === 'ACCOUNT_BALANCE' ? (selectedBalance?.currency ?? 'BRL') : (selectedCard?.currency ?? 'BRL')

  const parseMutation = useMutation({
    mutationFn: () =>
      bankImportsApi.parse({
        file: file!,
        targetType,
        accountBalanceUuid: targetType === 'ACCOUNT_BALANCE' ? accountBalanceUuid : undefined,
        creditCardUuid: targetType === 'CREDIT_CARD' ? creditCardUuid : undefined,
      }),
    onSuccess: (candidates) => {
      setLines(
        candidates.map((candidate) => ({
          ...candidate,
          categoryUuid: '',
          // Likely duplicates start unchecked — the user can still force-include them.
          included: !candidate.likelyDuplicate,
        })),
      )
      setStep('review')
    },
  })

  const commitMutation = useMutation({
    mutationFn: () =>
      bankImportsApi.commit({
        targetType,
        accountBalanceUuid: targetType === 'ACCOUNT_BALANCE' ? accountBalanceUuid : undefined,
        creditCardUuid: targetType === 'CREDIT_CARD' ? creditCardUuid : undefined,
        lines: lines.filter((line) => line.included),
      }),
    onSuccess: (result) => {
      setCommitResult({ importedCount: result.importedCount, skippedDuplicateCount: result.skippedDuplicateCount })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
    },
  })

  const canParse = Boolean(file) && (targetType === 'ACCOUNT_BALANCE' ? Boolean(accountBalanceUuid) : Boolean(creditCardUuid))
  const includedLines = lines.filter((line) => line.included)
  const canCommit = includedLines.length > 0 && includedLines.every((line) => Boolean(line.categoryUuid))

  function resetAll() {
    setStep('upload')
    setFile(null)
    setLines([])
    setCommitResult(null)
    parseMutation.reset()
    commitMutation.reset()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (commitResult) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-ink">Importação bancária</h1>
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 size={32} className="text-income" />
          <h3 className="font-heading text-base font-semibold text-ink">Importação concluída</h3>
          <p className="text-[13px] text-ink/65">
            {commitResult.importedCount} transaç{commitResult.importedCount === 1 ? 'ão importada' : 'ões importadas'}
            {commitResult.skippedDuplicateCount > 0 &&
              `, ${commitResult.skippedDuplicateCount} ${
                commitResult.skippedDuplicateCount === 1 ? 'ignorada' : 'ignoradas'
              } por já ${commitResult.skippedDuplicateCount === 1 ? 'ter sido importada' : 'terem sido importadas'} antes`}
            .
          </p>
          <div className="mt-1 flex gap-2">
            <Button variant="secondary" onClick={resetAll}>
              Importar outro arquivo
            </Button>
            <Button onClick={() => navigate('/transacoes')}>Ver transações</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink">Importação bancária</h1>

      {step === 'upload' && (
        <Card className="flex flex-col gap-4">
          <div>
            <CardKicker>Tipo de arquivo</CardKicker>
            <div className="mt-2 flex rounded-full bg-black/[.06] p-1">
              {TARGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTargetType(option.value)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    targetType === option.value ? 'bg-white text-ink shadow-sm' : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {option.value === 'ACCOUNT_BALANCE' ? <Landmark size={14} /> : <CreditCardIcon size={14} />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {targetType === 'ACCOUNT_BALANCE' ? (
            <PickerField
              label="Conta"
              placeholder="Selecione a conta..."
              options={accountPickerOptions}
              value={accountBalanceUuid}
              onChange={setAccountBalanceUuid}
            />
          ) : (
            <PickerField
              label="Cartão"
              placeholder="Selecione o cartão..."
              options={creditCardPickerOptions}
              value={creditCardUuid}
              onChange={setCreditCardUuid}
            />
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-ink">Arquivo OFX</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ofx"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="secondary" className="w-fit" onClick={() => fileInputRef.current?.click()}>
              <FileUp size={14} />
              {file ? file.name : 'Escolher arquivo .ofx'}
            </Button>
          </div>

          {parseMutation.isError && <ErrorBanner error={parseMutation.error} />}

          <div className="flex justify-end">
            <Button
              type="button"
              isLoading={parseMutation.isPending}
              disabled={!canParse}
              onClick={() => parseMutation.mutate()}
            >
              Analisar arquivo
            </Button>
          </div>
        </Card>
      )}

      {step === 'review' && (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardKicker>Revisão</CardKicker>
              <p className="text-[12.5px] text-ink/60">
                Escolha a categoria de cada transação (ou aplique em massa) antes de confirmar.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => setStep('upload')}>
              Voltar
            </Button>
          </div>

          {lines.length === 0 ? (
            <p className="text-[13px] text-ink/60">Nenhuma transação encontrada no arquivo.</p>
          ) : (
            <BankImportReviewTable
              lines={lines}
              categories={categoriesQuery.data ?? []}
              currency={currency}
              onChange={setLines}
            />
          )}

          {commitMutation.isError && <ErrorBanner error={commitMutation.error} />}

          <div className="flex justify-end">
            <Button
              type="button"
              isLoading={commitMutation.isPending}
              disabled={!canCommit}
              onClick={() => commitMutation.mutate()}
            >
              Confirmar importação
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
