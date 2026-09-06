import { useQuery } from '@tanstack/react-query';
import { fetchUserApi } from './userSarvices';
import { User, UserResponse } from '../../../types/User';

// Define a constant for your query key
export const USER_QUERY_KEY = ['user'];

export const useFetchCurrentUser = (userId: string) => {
  return useQuery<UserResponse, Error>({
    // The unique key for caching and refetching
    queryKey: USER_QUERY_KEY,
    // The function that fetches the data
    enabled: false,
    queryFn: () => fetchUserApi(userId),
  });
};
