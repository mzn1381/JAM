import { createContext } from 'react'

import type { AuthenticatedUser, LoginPayload } from '../types/auth'

export type AuthUser = Pick<
  AuthenticatedUser,
  | 'id'
  | 'email'
  | 'phone_number'
  | 'full_name'
  | 'status'
  | 'metadata'
  | 'created_at'
  | 'updated_at'
> & {
  organizationId: string
}

export type AuthContextValue = {
  isAuthenticated: boolean
  isAuthLoading: boolean
  user: AuthUser | null
  organizationId: string
  setAuthenticatedSession: (payload: LoginPayload) => void
  clearAuthSession: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
