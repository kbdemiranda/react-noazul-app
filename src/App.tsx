import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LoginPage } from './features/auth/LoginPage'
import { SignupPage } from './features/auth/SignupPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { AccountsPage } from './features/accounts/AccountsPage'
import { CreditCardsPage } from './features/creditCards/CreditCardsPage'
import { TransactionsPage } from './features/transactions/TransactionsPage'
import { TransactionDetailPage } from './features/transactions/TransactionDetailPage'
import { CategoriesPage } from './features/categories/CategoriesPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { AppLayout } from './layout/AppLayout'
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
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="/transacoes" element={<TransactionsPage />} />
                <Route path="/transacoes/:uuid" element={<TransactionDetailPage />} />
                <Route path="/contas" element={<AccountsPage />} />
                <Route path="/cartoes" element={<CreditCardsPage />} />
                <Route path="/categorias" element={<CategoriesPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
