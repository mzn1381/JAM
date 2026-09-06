import { StateCreator } from 'zustand';
import { User } from '../../types/User';
import { NetInfoStateType } from '@react-native-community/netinfo';

interface NetInfo {
  type: NetInfoStateType;
  isConnected: boolean | null;
}

export interface UserSlice {
  user: User | null;
  isAuthenticated: boolean;
  netInfo: NetInfo | null;
  isPendingChat: boolean;
  loginModalVisibility: boolean;

  isOnboarded: boolean;
  isSelectedPreferences: boolean;

  pishkarAvatar: string;

  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;

  completeOnboarding: () => void;
  setIsOnboarded: (value: boolean) => void;

  completeSelectedPreferences: () => void;

  setIsPendingChat: (pending: boolean) => void;
  setNetInfo: (netInfo: NetInfo) => void;
  setLoginModalVisibility: (isOpen: boolean) => void;
  setPishkarAvatar: (avatar: string) => void;
}

export const createUserSlice: StateCreator<UserSlice> = set => ({
  user: null,
  isAuthenticated: false,
  netInfo: null,
  isPendingChat: false,
  loginModalVisibility: false,
  isOnboarded: false,
  isSelectedPreferences: false,
  pishkarAvatar: 'https://i.pravatar.cc/150?img=47',

  setUser: user => set({ user, isAuthenticated: true }),

  updateUser: updates =>
    set(state => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      // optional: reset flags on logout
    }),

  completeOnboarding: () => set({ isOnboarded: true }),

  setIsOnboarded: value => set({ isOnboarded: value }),

  completeSelectedPreferences: () => set({ isSelectedPreferences: true }),

  setIsPendingChat: pending => set({ isPendingChat: pending }),

  setNetInfo: netInfo => set({ netInfo }),

  setLoginModalVisibility: isOpen => set({ loginModalVisibility: isOpen }),

  setPishkarAvatar: avatar => set({ pishkarAvatar: avatar }),
});
