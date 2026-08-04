import { useState } from 'react'
import { LogOut, Menu, Settings, X } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { toApiUrl } from '../api/client'
import { Avatar } from '../components/Avatar'
import { BrandMark } from '../components/BrandMark'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Visão geral', end: true },
  { to: '/transacoes', label: 'Transações' },
  { to: '/cambio', label: 'Câmbio' },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <header className="glass-surface sticky top-0 z-20 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3.5 md:gap-6 md:px-6">
          <span className="flex items-center gap-2 font-heading text-base font-semibold text-ink">
            <BrandMark size={20} />
            NoAzul
          </span>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'text-ink/70 hover:bg-ink/[.05]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Avatar src={user?.avatarUrl ? toApiUrl(user.avatarUrl) : null} name={user?.name ?? ''} size={28} />
            <span className="mr-1.5 text-sm text-ink/70">{user?.name}</span>
            <NavLink
              to="/configuracoes"
              aria-label="Configurações"
              className={({ isActive }) =>
                `flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  isActive ? 'bg-brand-100 text-brand-700' : 'bg-ink/[.06] text-ink/70 hover:bg-ink/[.1] hover:text-ink'
                }`
              }
            >
              <Settings size={15} />
            </NavLink>
            <button
              type="button"
              onClick={() => logout()}
              aria-label="Sair"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/[.06] text-ink/70 hover:bg-ink/[.1] hover:text-ink"
            >
              <LogOut size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Menu"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-ink/[.06] text-ink/70 md:hidden"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-page md:hidden">
          <div className="flex items-center justify-between border-b border-ink/[.08] px-5 py-4">
            <span className="flex items-center gap-2 font-heading text-base font-semibold text-ink">
              <BrandMark size={18} />
              NoAzul
            </span>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Fechar"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[.06] text-ink/70"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `border-b border-ink/[.08] px-5 py-3.5 text-[15px] ${isActive ? 'text-brand-700' : 'text-ink'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="flex items-center gap-2 text-sm text-ink/70">
              <Avatar src={user?.avatarUrl ? toApiUrl(user.avatarUrl) : null} name={user?.name ?? ''} size={24} />
              {user?.name}
            </span>
            <div className="flex items-center gap-1.5">
              <NavLink
                to="/configuracoes"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Configurações"
                className={({ isActive }) =>
                  `flex h-8 w-8 items-center justify-center rounded-full ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'text-ink/70 hover:bg-ink/[.06]'
                  }`
                }
              >
                <Settings size={16} />
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false)
                  logout()
                }}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand-500 hover:bg-brand-100"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Outlet />
      </main>
    </div>
  )
}
