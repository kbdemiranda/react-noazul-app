import { Outlet } from 'react-router-dom'
import { SettingsSidebar } from '../features/settings/SettingsSidebar'

export function SettingsLayout() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink">Configurações</h1>
      <div className="flex flex-col gap-6 md:flex-row">
        <SettingsSidebar />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
