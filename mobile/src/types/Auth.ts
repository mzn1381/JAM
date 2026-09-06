import { User } from './User';

export interface RegisterOtpRequest {
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
}
export interface RegisterOtpResponse {
  data: {
    expiresInSeconds: number;
  };
  success: boolean;
  message: string;
  errorCode: number;
  traceId?: string;
}

export interface VerifyRegisterOtpRequest {
  phoneNumber: string;
  code: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}
export interface AuthTokensResponse {
  data: AuthTokens & {
    user: User;
  };
  success: boolean;
  message: string;
  errorCode: number;
  traceId?: string;
}

export interface LogoutResponse {
  data: boolean;
  success: boolean;
  message: string;
  errorCode: number;
  traceId?: string; // appended by apiClient
}

export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

export interface GuestSessionData {
  access_token: string;
  token_type: string;
  expires_at: string;
  guest_user_id: string;
}

export interface GuestSessionResponse {
  data: GuestSessionData;
  success: boolean;
  message: string;
  errorCode: number;
  traceId?: string;
}
