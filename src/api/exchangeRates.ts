// Ports the exchange-rate sourcing logic from kotlin-splitfy-api's
// BcbExchangeRateService — same two providers, same escalating BCB lookback
// windows, same retry policy — but runs directly in the browser instead of
// through a backend, since both providers already allow CORS from web
// clients. Unlike that service, this one has no in-memory cache/stale-serving
// layer: callers are expected to get that from react-query's own
// staleTime/gcTime (react-query already keeps the last successful `data`
// around when a refetch fails, which is this app's equivalent of "serve a
// stale quote if the providers are down").
import axios from 'axios'
import { format, subDays } from 'date-fns'
import type { Currency } from '../types/domain'
import type { ExchangeRateQuote } from '../types/exchangeRate'

const BCB_BASE_URL = 'https://olinda.bcb.gov.br'
const FALLBACK_BASE_URL = 'https://api.frankfurter.dev/v1'
const REQUEST_TIMEOUT_MS = 4000
const MAX_ATTEMPTS = 3
const BACKOFF_MS = 300
// PTAX has no quote on weekends/holidays — if the shortest window comes up
// empty, widen the search instead of giving up (mirrors the Kotlin service).
const BCB_LOOKBACK_WINDOWS_DAYS = [10, 30, 90]

const bcbClient = axios.create({ baseURL: BCB_BASE_URL, timeout: REQUEST_TIMEOUT_MS })
const fallbackClient = axios.create({ baseURL: FALLBACK_BASE_URL, timeout: REQUEST_TIMEOUT_MS })

interface BcbCotacaoItem {
  cotacaoVenda: number
  dataHoraCotacao?: string
}

interface BcbCotacaoResponse {
  value?: BcbCotacaoItem[]
}

interface FallbackRateResponse {
  date?: string
  rates?: Record<string, number>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retries `run` on thrown errors only (network/HTTP failures) — a call that
 * resolves without throwing but finds nothing usable returns null straight
 * away, same as BcbExchangeRateService.executeWithRetry.
 */
async function withRetry<T>(label: string, run: () => Promise<T | null>): Promise<T | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await run()
    } catch (error) {
      const isLastAttempt = attempt === MAX_ATTEMPTS
      console.warn(`[exchangeRates] ${label} failed (attempt ${attempt}/${MAX_ATTEMPTS})`, error)
      if (isLastAttempt) return null
      await sleep(BACKOFF_MS * attempt)
    }
  }
  return null
}

// BCB returns "yyyy-MM-dd HH:mm:ss[.fraction]" with no timezone (it's always
// America/Sao_Paulo wall-clock time). Truncating to the whole-second prefix
// and parsing it as a local ISO datetime mirrors the Kotlin service reading
// it as an unzoned LocalDateTime.
function parseQuotedAt(raw?: string): Date | null {
  if (!raw) return null
  const date = new Date(raw.slice(0, 19).replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

function buildBcbPath(currency: Currency, startDate: Date, endDate: Date): string {
  const start = format(startDate, 'MM-dd-yyyy')
  const end = format(endDate, 'MM-dd-yyyy')
  return (
    '/olinda/servico/PTAX/versao/v1/odata/' +
    'CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)' +
    `?@moeda='${currency}'` +
    `&@dataInicial='${start}'` +
    `&@dataFinalCotacao='${end}'` +
    '&$top=1' +
    '&$orderby=dataHoraCotacao%20desc' +
    '&$format=json'
  )
}

async function fetchFromBcb(currency: Currency, endDate: Date): Promise<ExchangeRateQuote | null> {
  const windows = [...new Set(BCB_LOOKBACK_WINDOWS_DAYS)]
  for (const window of windows) {
    const startDate = subDays(endDate, window)
    const quote = await withRetry(`BCB[${currency}][${window}d]`, async () => {
      const { data } = await bcbClient.get<BcbCotacaoResponse>(buildBcbPath(currency, startDate, endDate))

      const latest = (data.value ?? [])
        .map((item) => {
          const quotedAt = parseQuotedAt(item.dataHoraCotacao)
          return quotedAt && { item, quotedAt }
        })
        .filter((entry): entry is { item: BcbCotacaoItem; quotedAt: Date } => Boolean(entry))
        .sort((a, b) => b.quotedAt.getTime() - a.quotedAt.getTime())[0]

      if (!latest) return null

      const result: ExchangeRateQuote = {
        currency,
        rateToBrl: latest.item.cotacaoVenda,
        quotedAt: latest.quotedAt.toISOString(),
      }
      return result
    })

    if (quote) return quote
  }

  return null
}

async function fetchFromFallback(currency: Currency): Promise<ExchangeRateQuote | null> {
  return withRetry(`Fallback[${currency}]`, async () => {
    const { data } = await fallbackClient.get<FallbackRateResponse>(`/latest?from=${currency}&to=BRL`)
    const rate = data.rates?.BRL
    if (!data.date || rate === undefined) return null

    return {
      currency,
      rateToBrl: rate,
      quotedAt: `${data.date}T12:00:00`,
    }
  })
}

async function getLatestBrlRate(currency: Currency): Promise<ExchangeRateQuote | null> {
  if (currency === 'BRL') {
    return { currency: 'BRL', rateToBrl: 1, quotedAt: new Date().toISOString() }
  }

  const bcbQuote = await fetchFromBcb(currency, new Date())
  if (bcbQuote) return bcbQuote

  return fetchFromFallback(currency)
}

export const exchangeRatesApi = {
  getLatestBrlRate,
}
