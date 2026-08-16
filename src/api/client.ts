import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from '../lib/tokenStorage'
import type { ApiErrorBody, AuthTokens } from '../types/domain'

export class ApiError extends Error {
  code: string

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.code = body.code
  }
}

let onSessionExpired: (() => void) | null = null

/** Registered once by AuthProvider so a failed refresh can force a logout + redirect. */
export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler
}

const API_BASE_URL = '/api'

/**
 * Resolves a backend-relative path (e.g. `user.avatarUrl`) to a fetchable URL,
 * for use outside apiClient (like a plain `<img src>`). Passes through
 * already-absolute URLs unchanged — USE_MOCKS returns a local `blob:` URL for
 * avatars, which must not be prefixed.
 */
export function toApiUrl(path: string): string {
  if (/^(blob:|https?:)/.test(path)) return path
  return `${API_BASE_URL}${path}`
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  config.headers.set('Accept-Language', 'pt-BR')
  return config
})

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

let refreshPromise: Promise<AuthTokens> | null = null

async function refreshTokens(): Promise<AuthTokens> {
  // Cross-tab lock: two tabs refreshing concurrently would both send the same
  // token, and the API treats a replayed (already-rotated) refresh token as
  // theft, revoking every session. Under the lock the second tab re-reads
  // storage and finds the first tab's fresh token instead.
  if (navigator.locks) {
    return navigator.locks.request('noazul.token-refresh', doRefreshTokens)
  }
  return doRefreshTokens()
}

async function doRefreshTokens(): Promise<AuthTokens> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }
  // Plain axios call: bypasses the interceptors above so the (stale) access
  // token isn't attached and a 401 here doesn't recurse into this same flow.
  const response = await axios.post<AuthTokens>('/api/auth/refresh', { refreshToken })
  tokenStorage.save(response.data)
  return response.data
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config as RetriableRequestConfig | undefined

    const isAuthEndpoint = config?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true
      try {
        refreshPromise ??= refreshTokens().finally(() => {
          refreshPromise = null
        })
        const tokens = await refreshPromise
        config.headers.set('Authorization', `Bearer ${tokens.accessToken}`)
        return apiClient.request(config)
      } catch {
        tokenStorage.clear()
        onSessionExpired?.()
        return Promise.reject(error)
      }
    }

    if (error.response?.data?.code) {
      return Promise.reject(new ApiError(error.response.data))
    }
    return Promise.reject(error)
  },
)
