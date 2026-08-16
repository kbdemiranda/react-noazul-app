import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../api/auth'
import { setSessionExpiredHandler } from '../api/client'
import { usersApi } from '../api/users'
import { tokenStorage } from '../lib/tokenStorage'
import type { User } from '../types/domain'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    setSessionExpiredHandler(clearSession)
  }, [clearSession])

  useEffect(() => {
    async function bootstrap() {
      // The access token lives only in memory, so after a reload the session's
      // marker is the persisted refresh token; the api client's 401 interceptor
      // rotates it into a fresh access token on the first call below.
      if (!tokenStorage.getRefreshToken()) {
        setIsBootstrapping(false)
        return
      }
      try {
        const profile = await usersApi.me()
        setUser(profile)
      } catch {
        clearSession()
      } finally {
        setIsBootstrapping(false)
      }
    }
    bootstrap()
  }, [clearSession])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login({ email, password })
    tokenStorage.save(tokens)
    const profile = await usersApi.me()
    setUser(profile)
  }, [])

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      await authApi.signup({ name, email, password })
      // Signup returns only the created user, not tokens — log in right after
      // with the same credentials for a one-step signup UX.
      await login(email, password)
    },
    [login],
  )

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken()
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // best-effort: still clear local session even if the server call fails
      }
    }
    clearSession()
  }, [clearSession])

  const refreshProfile = useCallback(async () => {
    const profile = await usersApi.me()
    setUser(profile)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isBootstrapping, login, signup, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
