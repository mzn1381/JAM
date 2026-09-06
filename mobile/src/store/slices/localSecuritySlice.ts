import { StateCreator } from 'zustand';
import { sha256 } from 'js-sha256';
import {
  checkBiometricAvailability,
  promptBiometric,
} from '../../hooks/useBiometric';
// import { authenticateBiometric, canUseBiometrics } from '../biometric';

export interface LocalSecuritySlice {
  isLockEnabled: boolean;
  isLocked: boolean;

  passwordHash: string | null;
  isBiometricEnabled: boolean;
  biometricType?: string | null;

  enableLock: (password: string) => void;
  disableLock: () => void;

  lockApp: () => void;
  unlockWithPassword: (password: string) => boolean;
  unlockWithBiometric: () => Promise<boolean>;

  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => void;

  changePassword: (oldPass: string, newPass: string) => boolean;
  activeBiometric: (value: boolean) => void;
}

export const createLocalSecuritySlice: StateCreator<LocalSecuritySlice> = (
  set,
  get,
) => ({
  isLockEnabled: false,
  isLocked: false,

  passwordHash: null,
  isBiometricEnabled: true,

  enableLock: password => {
    set({
      isLockEnabled: true,
      isLocked: true,
      passwordHash: sha256(password),
    });
  },

  disableLock: () => {
    set({
      isLockEnabled: false,
      isLocked: false,
      passwordHash: null,
      isBiometricEnabled: false,
    });
  },

  lockApp: () => {
    if (get().isLockEnabled) {
      set({ isLocked: true });
    }
  },

  unlockWithPassword: password => {
    const { passwordHash } = get();
    if (!passwordHash) return false;

    const success = sha256(password) === passwordHash;
    if (success) {
      set({ isLocked: false });
    }

    return success;
  },

  enableBiometric: async () => {
    const { isAvailable, biometricType } = await checkBiometricAvailability();

    if (!isAvailable) return false;

    set({
      isBiometricEnabled: true,
      biometricType,
    });

    return true;
  },

  disableBiometric: () => {
    set({
      isBiometricEnabled: false,
      biometricType: null,
    });
  },

  unlockWithBiometric: async () => {
    const { isLockEnabled, isBiometricEnabled } = get();
    if (!isLockEnabled || !isBiometricEnabled) return false;

    const success = await promptBiometric('Unlock app');

    if (success) {
      set({ isLocked: false });
    }

    return success;
  },

  changePassword: (oldPass, newPass) => {
    const { passwordHash } = get();
    if (!passwordHash) return false;

    if (sha256(oldPass) !== passwordHash) return false;

    set({ passwordHash: sha256(newPass) });
    return true;
  },
  activeBiometric: (value: boolean) => {
    set({ isLockEnabled: value });
  },
});
