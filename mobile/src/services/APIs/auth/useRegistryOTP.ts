import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Logger } from '../../../store';
import Toast from 'react-native-toast-message';
import { RegisterOtpRequest, RegisterOtpResponse } from '../../../types/Auth';
import { registerOtpApi } from './authServices';

export const useRegisterOtp = () => {
  return useMutation<RegisterOtpResponse, Error, RegisterOtpRequest>({
    mutationFn: registerOtpApi,

    onSuccess: data => {
      Logger.success(
        `OTP sent successfully. Expires in ${data.data.expiresInSeconds} seconds.`,
      );
    },

    onError: error => {
      Logger.error(`Register OTP failed: ${error.message}`);
    },
  });
};
