import { useMutation } from '@tanstack/react-query';
import { Logger } from '../../../store';
import { GuestSessionResponse } from '../../../types/Auth';
import { setAuthTokens } from '../../../utils/handlers';
import { setGuestSessionApi } from './userSarvices';

const getExpiresInSeconds = (expiresAt: string) => {
  const expiresAtMs = new Date(expiresAt).getTime();

  if (Number.isNaN(expiresAtMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
};

export const useSetGuestSession = () => {
  return useMutation<GuestSessionResponse, Error>({
    mutationFn: async () => {
      const res = await setGuestSessionApi();

      if (!res?.success || !res?.data?.access_token) {
        throw new Error(res?.message || 'Guest session response is invalid');
      }

      await setAuthTokens({
        accessToken: res.data.access_token,
        refreshToken: '',
        expiresIn: getExpiresInSeconds(res.data.expires_at),
        tokenType: res.data.token_type,
      });

      return res;
    },
    onSuccess: () => {
      Logger.success('Guest session created successfully');
    },
    onError: error => {
      Logger.error(`Guest session creation failed: ${error.message}`, {
        error,
      });
    },
  });
};
