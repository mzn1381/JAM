import { httpClient } from '../httpClient'
import type {
  IdentityUserInfoResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from '../../admin/types/auth'

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await httpClient.post<LoginResponse>(
    '/api/v1/identity/login',
    request,
  )

  return response.data
}

export async function logout(): Promise<LogoutResponse> {
  const response = await httpClient.post<LogoutResponse>(
    '/api/v1/identity/logout',
  )

  return response.data
}

export async function getIdentityUserInfo(): Promise<IdentityUserInfoResponse> {
  const response = await httpClient.get<IdentityUserInfoResponse>(
    '/api/v1/identity/identity_user_info',
  )

  return response.data
}
