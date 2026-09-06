// src/hooks/useUpdateUserContext.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserContextApi } from './userSarvices';
import { UserContextRequest, UserContextResponse } from '../../../types/User';
import { Logger } from '../../../store';
import Toast from 'react-native-toast-message';
import { typography } from '../../../theme';

export const useUpdateUserContext = () => {
  // const queryClient = useQueryClient();

  return useMutation<UserContextResponse, Error, UserContextRequest>({
    mutationFn: (payload: UserContextRequest) => updateUserContextApi(payload),
    onSuccess: () => {
      // Optional: Invalidate related queries to refresh data
      // queryClient.invalidateQueries({ queryKey: ['user'] });
      Logger.success('Context updated successfully!');
      Toast.show({
        type: 'success',
        text1: 'تنظیمات با موفقیت به‌روزرسانی شد!',
        text1Style: {
          fontFamily: typography.fontFamily,
        },
      });
    },
    onError: () => {
      Logger.error('Context updated has errored!');
    },
  });
};
