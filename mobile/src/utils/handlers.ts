import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger, useStore } from '../store';
import { AuthTokens } from '../types/Auth';
import { BASE_URL } from './constants';

export const randomText = (listMessage: string[]) =>
  listMessage[Math.floor(Math.random() * listMessage.length)];

export class ApiError<TData = unknown> extends Error {
  readonly status: number;
  readonly data: TData;

  constructor(message: string, status: number, data: TData) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type ApiClientResult<TData> = {
  data: TData;
  status: number;
  ok: boolean;
};

export const apiClientWithMetadata = async <TData>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiClientResult<TData>> => {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const tokens = await getAuthTokens();

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: tokens?.accessToken
        ? `Bearer ${tokens.accessToken}`
        : 'Bearer ',
      ...(options.headers || {}),
    },
  });

  const traceId = res.headers.get('x-trace-id') ?? undefined;
  const response = (await res.json()) as TData;

  return {
    data:
      response && typeof response === 'object'
        ? ({ ...response, traceId } as TData)
        : response,
    status: res.status,
    ok: res.ok,
  };
};

export const apiClient = async <TData = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<TData> => {
  const { data } = await apiClientWithMetadata<TData>(endpoint, options);
  return data;
};

const AUTH_STORAGE_KEY = 'auth';
export const getAuthTokens = async (): Promise<AuthTokens | null> => {
  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

    if (!stored) return null;

    return JSON.parse(stored) as AuthTokens;
  } catch (error) {
    Logger.error('Failed to parse auth', error);
    return null;
  }
};

export const setAuthTokens = async (tokens: AuthTokens): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    Logger.error('Failed to store auth tokens', error);
    throw error;
  }
};

export const clearAuthTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    Logger.error('Failed to clear auth tokens', error);
    throw error;
  }
};

export const getDisplayText = (text: string) => {
  //This code for select a doctor for show profile. (solution for avoiding unnecessary LLM call)
  if (!text) return '';
  const parts = text.split('###');
  return parts.length > 1 ? parts[parts.length - 1] : text;
};
