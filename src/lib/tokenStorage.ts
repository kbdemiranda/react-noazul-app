import type { AuthTokens } from '../types/domain'

// Storage key kept only so clear()/migration can wipe what older builds wrote.
const LEGACY_ACCESS_TOKEN_KEY = 'noazul.accessToken'
const REFRESH_TOKEN_KEY = 'noazul.refreshToken'

// The access token lives only in memory (per tab): an XSS payload can still
// call the API while the page is open, but can't exfiltrate a credential that
// outlives it. Only the refresh token — revocable server-side, and covered by
// the API's reuse detection — persists so the session survives reloads.
let accessToken: string | null = null

// One-time migration: purge the access token persisted by older builds.
localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)

export const tokenStorage = {
  getAccessToken(): string | null {
    return accessToken
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  save(tokens: AuthTokens): void {
    accessToken = tokens.accessToken
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  },
  clear(): void {
    accessToken = null
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  },
}
