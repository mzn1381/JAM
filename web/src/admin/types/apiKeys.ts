import type { ApiResponse } from './auth'

export type ApiKey = {
  id: string
  name: string
  created_at: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
}

export type ApiKeyListPayload = {
  items: ApiKey[]
  page: number
  page_size: number
  total: number
}

export type ApiKeyListResponse = ApiResponse<ApiKeyListPayload>

export type CreateApiKeyRequest = {
  name: string
}

export type CreateApiKeyPayload = {
  api_key: string
  token_type: 'Bearer' | string
  key: ApiKey
}

export type CreateApiKeyResponse = ApiResponse<CreateApiKeyPayload>

export type DeleteApiKeyResponse = ApiResponse<Record<string, never>>
