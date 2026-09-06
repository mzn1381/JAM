import { useQuery } from '@tanstack/react-query'

import { getDashboard } from '../../api/dashboard/dashboardApi'
import { dashboardQueryKeys } from '../utils/queryKeys'

type UseDashboardQueryParams = {
  userId: string
  organizationId: string
  enabled?: boolean
}

export function useDashboardQuery({
  userId,
  organizationId,
  enabled = true,
}: UseDashboardQueryParams) {
  return useQuery({
    queryKey: dashboardQueryKeys.detail(userId, organizationId),
    queryFn: () =>
      getDashboard({
        user_id: undefined,
        organization_id: organizationId,
      }),
    enabled: enabled && Boolean(userId) && Boolean(organizationId),
  })
}
