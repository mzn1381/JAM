import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import AuthLoadingScreen from '../components/layout/AuthLoadingScreen'
import { useAuth } from '../hooks/useAuth'

type PublicRouteProps = {
  children: ReactNode
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isAuthLoading } = useAuth()

  if (isAuthLoading) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
