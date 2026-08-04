import type { Theme } from '../types/domain'

const THEME_KEY = 'noazul.theme'

export const themeStorage = {
  get(): Theme | null {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'LIGHT' || value === 'DARK' || value === 'SYSTEM' ? value : null
  },
  set(theme: Theme): void {
    localStorage.setItem(THEME_KEY, theme)
  },
}

export function prefersDarkSystem(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveIsDark(theme: Theme): boolean {
  return theme === 'DARK' || (theme === 'SYSTEM' && prefersDarkSystem())
}
