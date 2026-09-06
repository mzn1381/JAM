import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Props = {
  children: ReactNode;
};

// 1. Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // React Native specific options (optional)
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function CustomQueryClientProvider({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export default CustomQueryClientProvider;
