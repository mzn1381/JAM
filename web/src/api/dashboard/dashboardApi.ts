import { httpClient } from '../httpClient'
import type {
  DashboardRequest,
  DashboardResponse,
} from '../../admin/types/dashboard'

export async function getDashboard(
  params: DashboardRequest,
): Promise<DashboardResponse> {
  const response = await httpClient.get<DashboardResponse>(
    '/api/v1/usage/dashboard',
    {
      params,
    },
  )

  return response.data
}
