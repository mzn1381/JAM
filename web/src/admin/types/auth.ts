export type ApiResponse<TData> = {
  data: TData
  success: boolean
  message: string
  errorCode: number
  traceId: string
}

export type LoginRequest = {
  user_name: string
  password: string
}

export type AuthenticatedUser = {
  id: string
  phone_number?: string
  email?: string
  full_name: string
  status?: string
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type Organization = {
  id: string
  slug: string
  name: string
  status: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type Membership = {
  organization_id: string
  user_id: string
  role: string
  created_at: string
  updated_at: string
}
export type LoginPayload = {
  access_token: string
  token_type: 'Bearer' | string
  expires_at: string
  user: AuthenticatedUser
}

export type LoginResponse = ApiResponse<LoginPayload>

export type IdentityUserInfoPayload = {
  user: Pick<
    AuthenticatedUser,
    | 'id'
    | 'email'
    | 'phone_number'
    | 'full_name'
    | 'status'
    | 'metadata'
    | 'created_at'
    | 'updated_at'
  >
  organizations: Organization[]
  memberships: Membership[]
}

export type IdentityUserInfoResponse = ApiResponse<IdentityUserInfoPayload>

export type LogoutResponse = ApiResponse<Record<string, never>>
