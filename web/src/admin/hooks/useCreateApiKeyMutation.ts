import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import { getErrorMessage } from '../utils/httpError'
import { apiKeysQueryKeys } from '../utils/queryKeys'
import { createApiKey } from '../../api/apikey/apiKeysService'
import type {
  CreateApiKeyRequest,
  CreateApiKeyResponse,
} from '../types/apiKeys'

type UseCreateApiKeyMutationOptions = {
  organizationId: string
  onSuccess?: (response: CreateApiKeyResponse) => void
}

export function useCreateApiKeyMutation({
  organizationId,
  onSuccess,
}: UseCreateApiKeyMutationOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateApiKeyRequest) =>
      createApiKey({ organizationId, request }),
    onSuccess(response) {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.all })
      onSuccess?.(response)
    },
    onError(error) {
      toast.error(getErrorMessage(error))
    },
  })
}
