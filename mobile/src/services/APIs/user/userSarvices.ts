// src/services/userService.ts
import {
  IdentityUserInfoErrorResponse,
  UserResponse,
  UserContextRequest,
  UserContextResponse,
} from '../../../types/User';
import { GuestSessionResponse } from '../../../types/Auth';
import {
  ApiError,
  apiClient,
  apiClientWithMetadata,
} from '../../../utils/handlers';

export const fetchUserApi = async (userId: string): Promise<UserResponse> => {
  const response = await apiClient(`/api/v1/Users/${userId}`);
  return response;
};

export const updateUserContextApi = async (
  payload: UserContextRequest,
): Promise<UserContextResponse> => {
  return await apiClient('/api/v1/UserContext', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const fetchIdentityUserInfoApi = async (): Promise<UserResponse> => {
  const { data, ok, status } = await apiClientWithMetadata<
    UserResponse | IdentityUserInfoErrorResponse
  >('/api/v1/identity/identity_user_info');

  const errorCode =
    typeof data.message === 'object' ? data.message?.code : undefined;

  if (!ok || (!data.success && errorCode === 'INVALID_TOKEN')) {
    const errorMessage =
      typeof data.message === 'object'
        ? data.message?.message
        : data.message;

    throw new ApiError(
      errorMessage || 'Failed to fetch identity user information',
      status,
      data,
    );
  }

  return data as UserResponse;
};

export const setGuestSessionApi = async (): Promise<GuestSessionResponse> => {
  return (await apiClient('/api/v1/identity/guest-session', {
    method: 'POST',
    body: JSON.stringify({}),
  })) as GuestSessionResponse;
};
