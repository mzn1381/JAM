import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import PrivateRoute from './PrivateRoute'
import PublicRoute from './PublicRoute'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'
import ApiKeysPage from '../pages/ApiKeys'
import SupportPage from '../pages/SupportPage'
import DocumentationRouter from '../../docWebsite/router/DocumentationRouter'

function HomeRedirect() {
  const { isAuthenticated } = useAuth()

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/login"
        element={<PublicRoute>{<LoginPage />}</PublicRoute>}
      />
      <Route path="/docs/*" element={<DocumentationRouter />} />
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/api-keys" element={<ApiKeysPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
