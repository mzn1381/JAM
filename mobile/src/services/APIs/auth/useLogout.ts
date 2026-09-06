import { useMutation } from '@tanstack/react-query';
import { logoutApi } from './authServices';
import { clearAuthTokens } from '../../../utils/handlers';
import { useStore } from '../../../store';
import { useContext } from 'react';
import { AuthContext } from '../../../common/providers/AuthProvider';
import Toast from 'react-native-toast-message';
import { typography } from '../../../theme';

export const useLogout = () => {
  const logout = useStore().logout;

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: async () => {
      await clearAuthTokens();
      await logout();

      Toast.show({
        type: 'info',
        text2: `از حساب خود خارج شدید!`,
        text2Style: {
          fontFamily: typography.fontFamily,
          fontSize: 14,
        },
        visibilityTime: 3000,
      });
    },
    onError: async () => {
      //when the status is 401 (Unauthorized)
      await clearAuthTokens();
      await logout();
    },
  });
};
