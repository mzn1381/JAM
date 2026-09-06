import { StateCreator } from 'zustand';

export interface AuthSlice {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenType: string | null;

  setTokens: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  }) => void;

  updateTokens: (
    updates: Partial<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: string;
    }>,
  ) => void;

  clearTokens: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = set => ({
  accessToken: null,
  refreshToken: null,
  expiresIn: null,
  tokenType: null,

  setTokens: tokens =>
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
    }),

  updateTokens: updates =>
    set(state => ({
      accessToken: updates.accessToken ?? state.accessToken,
      refreshToken: updates.refreshToken ?? state.refreshToken,
      expiresIn: updates.expiresIn ?? state.expiresIn,
      tokenType: updates.tokenType ?? state.tokenType,
    })),

  clearTokens: () =>
    set({
      accessToken: null,
      refreshToken: null,
      expiresIn: null,
      tokenType: null,
    }),
});
