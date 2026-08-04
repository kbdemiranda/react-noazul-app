import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { resolveIsDark, themeStorage } from '../lib/themeStorage'
import type { Theme } from '../types/domain'
import { useAuth } from './AuthContext'

interface ThemeContextValue {
  theme: Theme
  isDark: boolean
  /** Applies immediately and caches locally. Does not persist to the server —
   * callers that own a saved preference (SystemSettingsPage) still call
   * usersApi.updatePreferences themselves. */
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [theme, setThemeState] = useState<Theme>(() => themeStorage.get() ?? 'SYSTEM')
  const [isDark, setIsDark] = useState(() => resolveIsDark(theme))

  const setTheme = (next: Theme) => {
    themeStorage.set(next)
    setThemeState(next)
  }

  // The logged-in user's saved preference is the source of truth once known
  // — e.g. right after login, or on page reload once the profile loads.
  useEffect(() => {
    if (user && user.theme !== theme) setTheme(user.theme)
  }, [user])

  useEffect(() => {
    setIsDark(resolveIsDark(theme))
    if (theme !== 'SYSTEM') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setIsDark(resolveIsDark('SYSTEM'))
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return <ThemeContext.Provider value={{ theme, isDark, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
