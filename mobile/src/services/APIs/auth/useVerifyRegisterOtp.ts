import { useMutation } from '@tanstack/react-query';
import { verifyRegisterOtpApi } from './authServices';
import {
  VerifyRegisterOtpRequest,
  AuthTokensResponse,
} from '../../../types/Auth';
import { Logger } from '../../../store';
import { setAuthTokens } from '../../../utils/handlers';

export const useVerifyRegisterOtp = () => {
  return useMutation<AuthTokensResponse, Error, VerifyRegisterOtpRequest>({
    mutationFn: verifyRegisterOtpApi,

    onSuccess: async res => {
      if (res && res.data) {
        await setAuthTokens({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          expiresIn: res.data.expiresIn,
          tokenType: res.data.tokenType,
        });

        Logger.success(
          `User ${res.data.user.firstName} registered successfully`,
        );
      }
    },
    onError: error => {
      Logger.error(`OTP verification failed: ${error.message}`, {
        error,
      });
    },
  });
};
