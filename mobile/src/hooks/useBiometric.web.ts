/**
 * Web fallback for useBiometric (native uses react-native-biometrics).
 *
 * Browsers do not expose a simple fingerprint/FaceID prompt equivalent. Rather
 * than pull in a full WebAuthn ceremony (which needs a registered credential
 * and server challenge that this app's architecture doesn't provide yet), we
 * report biometrics as unavailable so the app cleanly falls back to the normal
 * password authentication flow. Public API matches ./useBiometric (native).
 */
import { useState, useCallback } from 'react';

interface BiometricState {
  isAvailable: boolean;
  biometricType: string;
  isLoading: boolean;
  error: string | null;
}

interface PromptOptions {
  promptMessage?: string;
  cancelButtonText?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface BiometricHookReturn extends BiometricState {
  checkBiometricAvailability: () => Promise<void>;
  handleBiometricLogin: (options?: PromptOptions) => Promise<boolean>;
}

const UNAVAILABLE_MESSAGE = 'احراز هویت بیومتریک در نسخه‌ی وب در دسترس نیست.';

export const useBiometric = (): BiometricHookReturn => {
  const [state] = useState<BiometricState>({
    isAvailable: false,
    biometricType: '',
    isLoading: false,
    error: UNAVAILABLE_MESSAGE,
  });

  const checkBiometricAvailability = useCallback(async (): Promise<void> => {
    // No-op on web – biometrics are not available.
  }, []);

  const handleBiometricLogin = useCallback(
    async (options?: PromptOptions): Promise<boolean> => {
      options?.onError?.(UNAVAILABLE_MESSAGE);
      return false;
    },
    [],
  );

  return {
    ...state,
    checkBiometricAvailability,
    handleBiometricLogin,
  };
};

export const checkBiometricAvailability = async () => {
  return {
    isAvailable: false,
    biometricType: '',
  };
};

export const promptBiometric = async (
  _promptMessage = 'Confirm fingerprint to authenticate',
  _cancelButtonText = 'Cancel',
): Promise<boolean> => {
  // Biometrics unavailable on web -> callers fall back to password flow.
  return false;
};
