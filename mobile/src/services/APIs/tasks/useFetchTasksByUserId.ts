import { useQuery } from '@tanstack/react-query';
import { Task } from '../../../types/Tasks';
import { fetchTasksApi, TASKS_QUERY_KEY } from './tasksServices';

export const useFetchTasksByUserId = () => {
  return useQuery<Task[], Error>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchTasksApi,
  });
};
