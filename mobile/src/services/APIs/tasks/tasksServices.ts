import { NewTask, Task } from '../../../types/Tasks';
import { apiClient } from '../../../utils/handlers';

export const TASKS_QUERY_KEY = ['Tasks'];

export const fetchTasksApi = async (): Promise<Task[]> => {
  return await apiClient('/tasks');
};

export const createTaskApi = async (newTask: NewTask) => {
  return await apiClient('/tasks', {
    method: 'POST',
    body: JSON.stringify({ ...newTask, userId: 1 }), // Example ID
  });
};
