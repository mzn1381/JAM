/**
 * Web fallback for the networking setup hook.
 *
 * The native version uses @react-native-community/netinfo; the browser exposes
 * connectivity through `navigator.onLine` + the online/offline events. It keeps
 * the same public API (`useSetupNetworking` returning { isConnected, connectionType })
 * and installs the same global fetch logger used on native.
 */
import { useEffect, useRef } from 'react';
import Toast from 'react-native-toast-message';
import { NetInfoStateType } from '@react-native-community/netinfo';
import { useStore, Logger } from '../store';
import { typography } from '../theme/typography';

function getIsOnline(): boolean {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  return true;
}

export function useSetupNetworking() {
  const setNetInfo = useStore(state => state.setNetInfo);

  const previousConnectionState = useRef<boolean | null>(null);
  const isInitialMount = useRef(true);
  const loggerSetup = useRef(false);

  // Setup the global fetch logger once.
  useEffect(() => {
    if (!loggerSetup.current) {
      setupNetworkLogger();
      Logger.info('Network logger initialized (web)');
      loggerSetup.current = true;
    }
  }, []);

  useEffect(() => {
    const apply = (isConnected: boolean) => {
      const type = isConnected ? NetInfoStateType.wifi : NetInfoStateType.none;

      setNetInfo({ type, isConnected });

      if (isInitialMount.current) {
        isInitialMount.current = false;
        previousConnectionState.current = isConnected;
        Logger.info(
          isConnected
            ? 'App mounted - online (web)'
            : 'App mounted - offline (web)',
        );
        return;
      }

      if (previousConnectionState.current === isConnected) {
        return;
      }

      if (isConnected) {
        Logger.success('Network connected (web)');
      } else {
        Logger.warn('Network disconnected (web)');
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
    };

    apply(getIsOnline());

    const handleOnline = () => apply(true);
    const handleOffline = () => apply(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [setNetInfo]);

  return {
    isConnected: getIsOnline(),
    connectionType: getIsOnline()
      ? NetInfoStateType.wifi
      : NetInfoStateType.none,
  };
}

// =====================================
// Network Logger Setup (Internal)
// =====================================
function setupNetworkLogger() {
  if ((globalThis as any).__networkLoggerSetup) {
    return;
  }
  (globalThis as any).__networkLoggerSetup = true;

  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (...args: Parameters<typeof fetch>) => {
    const [url, options] = args;
    const method = options?.method || 'GET';
    const startTime = Date.now();

    Logger.network(`→ ${method} ${String(url)}`);

    try {
      const response = await originalFetch(...args);
      const duration = Date.now() - startTime;

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
