'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// Create a client
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 1 minute
      staleTime: 60 * 1000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Don't retry on error
      retry: false,
      // Don't refetch on window focus
      refetchOnWindowFocus: false,
    },
  },
});

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create a new QueryClient instance for each session
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
