import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { QueryObserverResult } from '@tanstack/react-query';
import { useFetchIdentityUserInfo } from '../../services/APIs/user/useFetchIdentityUserInfo';
import { useSetGuestSession } from '../../services/APIs/user/useSetGuestSession';
import { Logger, useStore } from '../../store';
import { User, UserResponse } from '../../types/User';
import {
  ApiError,
  clearAuthTokens,
  getAuthTokens,
} from '../../utils/handlers';

type CheckAuth = () => Promise<QueryObserverResult<UserResponse, ApiError>>;

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  checkAuth: CheckAuth;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  checkAuth: async () => ({}) as QueryObserverResult<UserResponse, ApiError>,
});

type Props = {
  children: ReactNode;
};

const isInvalidTokenError = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) {
    return false;
  }

  const data = error.data;
  const errorCode =
    data && typeof data === 'object' && 'message' in data
      ? (data.message as { code?: string } | undefined)?.code
      : undefined;

  return error.status === 401 || errorCode === 'INVALID_TOKEN';
};

export const AuthProvider = ({ children }: Props) => {
  const user = useStore(state => state.user);
  const setUser = useStore(state => state.setUser);
  const logout = useStore(state => state.logout);
  const [isInitializing, setIsInitializing] = useState(true);

  const initializationStartedRef = useRef(false);

  const { mutateAsync: createGuestSession, isPending: isCreatingGuestSession } =
    useSetGuestSession();

  const {
    refetch,
    isFetching,
  } = useFetchIdentityUserInfo();

  const checkAuth = useCallback<CheckAuth>(async () => {
    const result = await refetch();

    if (result.data?.success && result.data.data) {
      setUser(result.data.data);
    }

    return result;
  }, [refetch, setUser]);

  const initializeAuth = useCallback(async () => {
    // Prevent duplicate initialization calls.
    if (initializationStartedRef.current) {
      return;
    }

    initializationStartedRef.current = true;

    try {
      const tokens = await getAuthTokens();

      // No session exists → create guest session normally.
      if (!tokens?.accessToken) {
        logout();
        await createGuestSession();
      }

      // Validate current session.
      const authResult = await checkAuth();

      // Session is invalid/expired → recreate guest session and retry once.
      if (authResult.isError && isInvalidTokenError(authResult.error)) {
        Logger.warn(
          'Authentication token is invalid or expired. Creating a new guest session.',
        );

        await clearAuthTokens();
        logout();
        await createGuestSession();

        // Retry exactly once.
        await checkAuth();
      }
    } catch (error) {
      Logger.warn('Failed to initialize authentication', error);
    } finally {
      setIsInitializing(false);
    }
  }, [checkAuth, createGuestSession, logout]);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isInitializing || isFetching || isCreatingGuestSession,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
