import { UserResponse } from '../../../types/User';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../../../utils/handlers';
import { fetchIdentityUserInfoApi } from './userSarvices';

// ---- Query Key ----
export const IDENTITY_USER_INFO_QUERY_KEY = ['identity-user-info'];

// ---- React Query Hook ----
export const useFetchIdentityUserInfo = () => {
  return useQuery<UserResponse, ApiError>({
    queryKey: IDENTITY_USER_INFO_QUERY_KEY,
    enabled: false,
    queryFn: () => fetchIdentityUserInfoApi(),
    retry: false,
  });
};
