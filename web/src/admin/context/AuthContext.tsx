import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

import { useIdentityUserInfoQuery } from '../hooks/useIdentityUserInfoQuery'
import { getErrorMessage } from '../utils/httpError'
import { authQueryKeys } from '../utils/queryKeys'
import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
} from '../utils/token'
import { AuthContext, type AuthContextValue, type AuthUser } from './context'

function resolveOrganizationId(data: {
  organizations?: Array<{ id: string }>
  memberships?: Array<{ organization_id: string }>
}): string {
  return (
    data.organizations?.[0]?.id ?? data.memberships?.[0]?.organization_id ?? ''
  )
}

export function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const hasToken = Boolean(getAccessToken())

  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null)
  const shouldFetchIdentity =
    hasToken && (!sessionUser || !sessionUser.organizationId)

  const identityUserInfoQuery = useIdentityUserInfoQuery(shouldFetchIdentity)
  const identityUserData = identityUserInfoQuery.data?.data.user
  const identityOrganizationsData =
    identityUserInfoQuery.data?.data.organizations ?? []
  const identityMembershipsData =
    identityUserInfoQuery.data?.data.memberships ?? []

  const identityUser = identityUserData
    ? {
        ...identityUserData,
        organizations: identityOrganizationsData,
        memberships: identityMembershipsData,
        organizationId: resolveOrganizationId({
          organizations: identityOrganizationsData,
          memberships: identityMembershipsData,
        }),
      }
    : null

  const user = hasToken ? (identityUser ?? sessionUser) : null
  const isAuthenticated = Boolean(user)
  const isAuthLoading =
    hasToken && !sessionUser && identityUserInfoQuery.isPending

  const organizationId = user?.organizationId ?? ''

  useEffect(() => {
    if (!identityUserInfoQuery.isError) {
      return
    }

    removeAccessToken()
    queryClient.clear()
    toast.error(getErrorMessage(identityUserInfoQuery.error))
    navigate('/login', { replace: true })
  }, [
    identityUserInfoQuery.error,
    identityUserInfoQuery.isError,
    navigate,
    queryClient,
  ])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isAuthLoading,
      user,
      organizationId,
      setAuthenticatedSession(payload) {
        setAccessToken(payload.access_token)

        const identityUser = {
          id: payload.user.id,
          phone_number: payload.user.phone_number,
          email: payload.user.email,
          full_name: payload.user.full_name,
          status: payload.user.status,
          metadata: payload.user.metadata,
          created_at: payload.user.created_at,
          updated_at: payload.user.updated_at,
          organizationId: '',
        }

        setSessionUser(identityUser)
        queryClient.setQueryData(authQueryKeys.identityUserInfo, {
          data: {
            user: {
              id: identityUser.id,
              email: identityUser.email,
              phone_number: identityUser.phone_number,
              full_name: identityUser.full_name,
              status: identityUser.status,
              metadata: identityUser.metadata,
              created_at: identityUser.created_at,
              updated_at: identityUser.updated_at,
            },
            organizations: [],
            memberships: [],
          },
          success: true,
          message: '',
          errorCode: 0,
          traceId: '',
        })
      },
      clearAuthSession() {
        removeAccessToken()
        queryClient.clear()
        setSessionUser(null)
      },
    }),
    [isAuthenticated, isAuthLoading, organizationId, queryClient, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
