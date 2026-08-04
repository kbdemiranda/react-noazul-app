import { CloudUpload, CreditCard, Landmark, Lock, Settings, Tag, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: 'perfil', label: 'Perfil', icon: User },
  { to: 'senhas', label: 'Senhas', icon: Lock },
  { to: 'contas', label: 'Contas', icon: Landmark },
  { to: 'cartoes', label: 'Cartões', icon: CreditCard },
  { to: 'categorias', label: 'Categorias', icon: Tag },
  { to: 'importacao', label: 'Importação', icon: CloudUpload },
  { to: 'sistema', label: 'Sistema', icon: Settings },
]

export function SettingsSidebar() {
  return (
    <nav className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto md:w-48 md:flex-col md:overflow-visible">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors md:rounded-2xl ${
              isActive ? 'bg-brand-100 text-brand-700' : 'text-ink/70 hover:bg-ink/[.05]'
            }`
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
