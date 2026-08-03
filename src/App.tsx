import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BackgroundOrbs } from './components/BackgroundOrbs'
import { AuthProvider } from './context/AuthContext'
import { LoginPage } from './features/auth/LoginPage'
import { SignupPage } from './features/auth/SignupPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { LandingPage } from './features/landing/LandingPage'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { AccountsPage } from './features/accounts/AccountsPage'
import { ExchangePage } from './features/exchange/ExchangePage'
import { CreditCardsPage } from './features/creditCards/CreditCardsPage'
import { TransactionsPage } from './features/transactions/TransactionsPage'
import { TransactionDetailPage } from './features/transactions/TransactionDetailPage'
import { BankImportPage } from './features/bankImport/BankImportPage'
import { CategoriesPage } from './features/categories/CategoriesPage'
import { ProfileSettingsPage } from './features/settings/ProfileSettingsPage'
import { PasswordSettingsPage } from './features/settings/PasswordSettingsPage'
import { SystemSettingsPage } from './features/settings/SystemSettingsPage'
import { AppLayout } from './layout/AppLayout'
import { SettingsLayout } from './layout/SettingsLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <BackgroundOrbs />
          <div className="relative z-10">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<OnboardingPage />} />

                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/transacoes" element={<TransactionsPage />} />
                  <Route path="/transacoes/:uuid" element={<TransactionDetailPage />} />
                  <Route path="/contas" element={<AccountsPage />} />
                  <Route path="/cambio" element={<ExchangePage />} />
                  <Route path="/cartoes" element={<CreditCardsPage />} />

                  <Route path="/configuracoes" element={<SettingsLayout />}>
                    <Route index element={<Navigate to="perfil" replace />} />
                    <Route path="perfil" element={<ProfileSettingsPage />} />
                    <Route path="senhas" element={<PasswordSettingsPage />} />
                    <Route path="categorias" element={<CategoriesPage />} />
                    <Route path="importacao" element={<BankImportPage />} />
                    <Route path="sistema" element={<SystemSettingsPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="/perfil" element={<Navigate to="/configuracoes/perfil" replace />} />
              <Route path="/categorias" element={<Navigate to="/configuracoes/categorias" replace />} />
              <Route path="/importacao-bancaria" element={<Navigate to="/configuracoes/importacao" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
