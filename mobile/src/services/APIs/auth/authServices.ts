import {
  LogoutResponse,
  RegisterOtpRequest,
  RegisterOtpResponse,
  VerifyRegisterOtpRequest,
  AuthTokensResponse,
  RefreshTokenRequest,
} from '../../../types/Auth';
import { apiClient } from '../../../utils/handlers';

export const registerOtpApi = async (
  payload: RegisterOtpRequest,
): Promise<RegisterOtpResponse> => {
  return (await apiClient('/api/v1/Auth/register-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  })) as RegisterOtpResponse;
};

export const verifyRegisterOtpApi = async (
  payload: VerifyRegisterOtpRequest,
): Promise<AuthTokensResponse> => {
  return (await apiClient('/api/v1/Auth/register-otp/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  })) as AuthTokensResponse;
};

export const logoutApi = async (): Promise<LogoutResponse> => {
  return (await apiClient('/api/v1/Auth/logout', {
    method: 'POST',
    body: JSON.stringify({}), // since input is empty object
  })) as LogoutResponse;
};

export const refreshTokenApi = async (
  payload: RefreshTokenRequest,
): Promise<AuthTokensResponse> => {
  return (await apiClient('/api/v1/Auth/refresh', {
    method: 'POST',
    body: JSON.stringify(payload),
  })) as AuthTokensResponse;
};
