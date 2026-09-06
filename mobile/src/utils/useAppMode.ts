// src/utils/useAppMode.ts
import { useMemo } from 'react';

export type AppMode = 'demo' | 'embed' | 'internal' | 'default';

export function getAppMode(): AppMode {
  if (typeof window === 'undefined') return 'default'; // native / SSR guard
  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === 'demo' || mode === 'embed' || mode === 'internal') return mode;
  return 'default';
}

// export function useAppMode(): AppMode {
//   return useMemo(getAppMode, []); // query param won't change without a reload, so compute once
// }
