import { useEffect, useRef } from 'react';
import { useNetInfoInstance } from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { useStore, Logger } from '../store';
import { typography } from '../theme/typography';
import { useFetchCurrentUser } from '../services/APIs/user/useFetchCurrentUser';

// useNetwork - All-in-One Hook
export function useSetupNetworking() {
  const setNetInfo = useStore(state => state.setNetInfo);
  const setUser = useStore(state => state.setUser);

  // // Fetch user data
  // const { data: response, refetch: fetchUser } = useFetchCurrentUser(
  //   'c2309f10-a9ad-4db3-9234-f4c4a955543e',
  // );

  const {
    netInfo: { type, isConnected },
  } = useNetInfoInstance();

  const previousConnectionState = useRef<boolean | null>(null);
  const isInitialMount = useRef(true);
  const loggerSetup = useRef(false);

  // Setup network logger once
  useEffect(() => {
    if (!loggerSetup.current) {
      setupNetworkLogger();
      Logger.info('Network logger initialized');
      loggerSetup.current = true;
    }
  }, []);

  // // Handle user data response
  // useEffect(() => {
  //   if (response?.data && response.success) {
  //     setUser(response.data);
  //     Logger.success('User data loaded', { ...response });
  //   }
  // }, [response]);

  // Handle network state changes
  useEffect(() => {
    // Update store with network info
    setNetInfo({ type, isConnected });

    // Skip toast on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousConnectionState.current = isConnected;

      // Fetch user data if connected on mount
      if (isConnected) {
        Logger.info('App mounted - online, fetching user data');
        // fetchUser();
      } else {
        Logger.warn('App mounted - offline');
      }
      return;
    }

    // Only show toast if connection state actually changed
    if (previousConnectionState.current === isConnected) {
      return;
    }

    // Handle connection state changes
    if (isConnected) {
      Logger.success('Network connected', { type });

      // Toast.show({
      //   type: 'success',
      //   text2: 'شما آنلاین هستید',
      //   text2Style: {
      //     fontFamily: typography.fontFamily,
      //     fontSize: 14,
      //   },
      //   visibilityTime: 2000,
      // });

      // // Fetch user data when coming back online
      // fetchUser();
    } else {
      Logger.warn('Network disconnected');
      Toast.show({
        type: 'info',
        text2: 'شما آفلاین هستید.',
        text2Style: {
          fontFamily: typography.fontFamily,
          fontSize: 14,
        },
        visibilityTime: 3000,
      });
    }

    previousConnectionState.current = isConnected;
  }, [type, isConnected, setNetInfo]);

  return {
    isConnected,
    connectionType: type,
  };
}

// =====================================
// Network Logger Setup (Internal)
// =====================================
function setupNetworkLogger() {
  // Prevent multiple setups
  if ((globalThis as any).__networkLoggerSetup) {
    return;
  }
  (globalThis as any).__networkLoggerSetup = true;

  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (...args: Parameters<typeof fetch>) => {
    const [url, options] = args;
    const method = options?.method || 'GET';
    const startTime = Date.now();

    // Log outgoing request
    Logger.network(`→ ${method} ${String(url)}`);

    try {
      const response = await originalFetch(...args);
      const duration = Date.now() - startTime;

      // Log successful response
      Logger.network(
        `← ${response.status} ${method} ${String(url)} (${duration}ms)`,
        {
          status: response.status,
          statusText: response.statusText,
          duration,
          url: String(url),
          method,
        },
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log failed request
      Logger.error(`✗ ${method} ${String(url)} Failed (${duration}ms)`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        url: String(url),
        method,
      });

      throw error;
    }
  };
}
