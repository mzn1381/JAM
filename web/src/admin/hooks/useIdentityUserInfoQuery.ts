import { useQuery } from '@tanstack/react-query'

import { getIdentityUserInfo } from '../../api/auth/authApi'
import { authQueryKeys } from '../utils/queryKeys'

export function useIdentityUserInfoQuery(enabled: boolean) {
  return useQuery({
    queryKey: authQueryKeys.identityUserInfo,
    queryFn: getIdentityUserInfo,
    enabled,
    retry: false,
  })
}
