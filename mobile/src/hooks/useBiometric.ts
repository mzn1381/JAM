// useBiometric.ts
import { useState, useEffect, useCallback } from 'react';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

interface BiometricState {
  isAvailable: boolean;
  biometricType: string;
  isLoading: boolean;
  error: string | null;
}

interface BiometricHookReturn extends BiometricState {
  checkBiometricAvailability: () => Promise<void>;
  handleBiometricLogin: (options?: PromptOptions) => Promise<boolean>;
}

interface PromptOptions {
  promptMessage?: string;
  cancelButtonText?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const rnBiometrics = new ReactNativeBiometrics();

export const useBiometric = (): BiometricHookReturn => {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    biometricType: '',
    isLoading: true,
    error: null,
  });

  const checkBiometricAvailability = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { available, biometryType } =
        await rnBiometrics.isSensorAvailable();

      if (available) {
        let typeString = 'Biometrics';

        switch (biometryType) {
          case BiometryTypes.TouchID:
            typeString = 'TouchID';
            break;
          case BiometryTypes.FaceID:
            typeString = 'FaceID';
            break;
          case BiometryTypes.Biometrics:
            typeString = 'Biometrics';
            break;
          default:
            typeString = 'Fingerprint';
        }

        setState({
          isAvailable: true,
          biometricType: typeString,
          isLoading: false,
          error: null,
        });
      } else {
        setState({
          isAvailable: false,
          biometricType: '',
          isLoading: false,
          error: 'Biometric authentication is not available on this device',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error checking biometric availability:', error);

      setState({
        isAvailable: false,
        biometricType: '',
        isLoading: false,
        error: errorMessage,
      });
    }
  }, []);

  const handleBiometricLogin = useCallback(
    async (options?: PromptOptions): Promise<boolean> => {
      const {
        promptMessage = 'Confirm fingerprint to authenticate',
        cancelButtonText = 'Cancel',
        onSuccess,
        onError,
        onCancel,
      } = options || {};

      try {
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage,
          cancelButtonText,
        });

        if (success) {
          onSuccess?.();
          return true;
        } else {
          onCancel?.();
          return false;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Authentication error';
        console.error('Biometric authentication error:', error);
        onError?.(errorMessage);
        return false;
      }
    },
    [],
  );

  useEffect(() => {
    checkBiometricAvailability();
  }, [checkBiometricAvailability]);

  return {
    ...state,
    checkBiometricAvailability,
    handleBiometricLogin,
  };
};

export const checkBiometricAvailability = async () => {
  const { available, biometryType } = await rnBiometrics.isSensorAvailable();

  let biometricType = 'Biometrics';

  switch (biometryType) {
    case BiometryTypes.TouchID:
      biometricType = 'TouchID';
      break;
    case BiometryTypes.FaceID:
      biometricType = 'FaceID';
      break;
    case BiometryTypes.Biometrics:
      biometricType = 'Biometrics';
      break;
    default:
      biometricType = 'Fingerprint';
  }

  return {
    isAvailable: available,
    biometricType,
  };
};

export const promptBiometric = async (
  promptMessage = 'Confirm fingerprint to authenticate',
  cancelButtonText = 'Cancel',
): Promise<boolean> => {
  const { success } = await rnBiometrics.simplePrompt({
    promptMessage,
    cancelButtonText,
  });

  return success;
};
