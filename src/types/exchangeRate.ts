// Not part of java-noazul-api — these quotes are fetched client-side, directly
// from BCB/Frankfurter (see ../api/exchangeRates.ts), so they don't belong
// among the backend-mirrored DTOs in ./domain.
import type { Currency } from './domain'

export interface ExchangeRateQuote {
  currency: Currency
  // How many BRL one unit of `currency` is worth.
  rateToBrl: number
  quotedAt: string // ISO datetime
}
