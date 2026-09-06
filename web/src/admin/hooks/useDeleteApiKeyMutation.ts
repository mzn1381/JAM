import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import { deleteApiKey } from '../../api/apikey/apiKeysService'
import { getErrorMessage } from '../utils/httpError'
import { apiKeysQueryKeys } from '../utils/queryKeys'

type UseDeleteApiKeyMutationOptions = {
  organizationId: string
  onSuccess?: () => void
}

export function useDeleteApiKeyMutation({
  organizationId,
  onSuccess,
}: UseDeleteApiKeyMutationOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (keyId: string) => deleteApiKey({ organizationId, keyId }),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.all })
      onSuccess?.()
    },
    onError(error) {
      toast.error(getErrorMessage(error))
    },
  })
}
