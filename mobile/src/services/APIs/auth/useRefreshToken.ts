import { useMutation } from '@tanstack/react-query';
import { refreshTokenApi } from './authServices';
import { Logger } from '../../../store';
import { setAuthTokens } from '../../../utils/handlers';

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: refreshTokenApi,
    onSuccess: async res => {
      Logger.success(`User ${res.data.user.firstName} registered successfully`);

      await setAuthTokens({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        expiresIn: res.data.expiresIn,
        tokenType: res.data.tokenType,
      });
    },
  });
};
