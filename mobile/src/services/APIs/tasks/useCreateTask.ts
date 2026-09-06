import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTaskApi, TASKS_QUERY_KEY } from './tasksServices';

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTaskApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      console.log('Post created successfully! Refetching posts list.');
    },
  });
};
