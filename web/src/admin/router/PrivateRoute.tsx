import { Navigate, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'

import AuthLoadingScreen from '../components/layout/AuthLoadingScreen'
import { useAuth } from '../hooks/useAuth'

type PrivateRouteProps = {
  children?: ReactNode
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, isAuthLoading } = useAuth()

  if (isAuthLoading) {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
