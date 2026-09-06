import { useQuery } from '@tanstack/react-query'

import { listApiKeys } from '../../api/apikey/apiKeysService'
import { apiKeysQueryKeys } from '../utils/queryKeys'

type UseApiKeysQueryParams = {
  organizationId: string
  page?: number
  pageSize?: number
  enabled?: boolean
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

export function useApiKeysQuery({
  organizationId,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseApiKeysQueryParams) {
  return useQuery({
    queryKey: apiKeysQueryKeys.list(organizationId, page, pageSize),
    queryFn: () =>
      listApiKeys({
        organizationId,
        page,
        pageSize,
      }),
    enabled: enabled && Boolean(organizationId),
  })
}
