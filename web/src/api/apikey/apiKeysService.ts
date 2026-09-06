import { httpClient } from '../httpClient'
import type {
  ApiKey,
  ApiKeyListResponse,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  DeleteApiKeyResponse,
} from '../../admin/types/apiKeys'

type ListApiKeysParams = {
  organizationId: string
  page: number
  pageSize: number
}

type CreateApiKeyParams = {
  organizationId: string
  request: CreateApiKeyRequest
}

type DeleteApiKeyParams = {
  organizationId: string
  keyId: string
}

type RawApiKey = Partial<ApiKey> & {
  last_used?: string | null
}

function normalizeApiKey(item: RawApiKey): ApiKey {
  return {
    id: item.id ?? '',
    name: item.name ?? '',
    created_at: item.created_at ?? '',
    last_used_at: item.last_used_at ?? item.last_used ?? null,
    expires_at: item.expires_at ?? null,
    revoked_at: item.revoked_at ?? null,
  }
}

export async function listApiKeys({
  organizationId,
  page,
  pageSize,
}: ListApiKeysParams): Promise<ApiKeyListResponse> {
  const response = await httpClient.get<ApiKeyListResponse>(
    `/api/v1/usage/organizations/${organizationId}/api-keys`,
    {
      params: {
        page,
        page_size: pageSize,
      },
    },
  )

  return {
    ...response.data,
    data: {
      ...response.data.data,
      items: response.data.data.items.map((item) => normalizeApiKey(item)),
    },
  }
}

export async function createApiKey({
  organizationId,
  request,
}: CreateApiKeyParams): Promise<CreateApiKeyResponse> {
  const response = await httpClient.post<CreateApiKeyResponse>(
    `/api/v1/usage/organizations/${organizationId}/api-keys`,
    request,
  )

  return {
    ...response.data,
    data: {
      ...response.data.data,
      key: normalizeApiKey(response.data.data.key),
    },
  }
}

export async function deleteApiKey({
  organizationId,
  keyId,
}: DeleteApiKeyParams): Promise<DeleteApiKeyResponse> {
  const response = await httpClient.delete<DeleteApiKeyResponse>(
    `/api/v1/usage/organizations/${organizationId}/api-keys/${keyId}`,
  )

  return response.data
}
