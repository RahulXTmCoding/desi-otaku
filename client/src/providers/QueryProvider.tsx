import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Create localStorage persister
const localStoragePersister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'react-query-cache',
  throttleTime: 1000,
});

// Create a single client instance that persists across navigations
let singletonQueryClient: QueryClient | null = null;

const createQueryClient = () => {
  if (!singletonQueryClient) {
    singletonQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Stale time: 10 minutes (longer fresh period)
          staleTime: 10 * 60 * 1000,
          // Cache time: 30 minutes (longer cache persistence)
          gcTime: 30 * 60 * 1000,
          // Retry failed requests 2 times
          retry: 2,
          // Retry delay increases exponentially
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          // Strict cache settings to prevent unnecessary refetches
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchOnMount: false,
          // Network mode for better cache utilization
          networkMode: 'online',
          // Structural sharing for better performance
          structuralSharing: true,
        },
      },
    });
    
    // Initialize persistence for the client
    if (typeof window !== 'undefined') {
      persistQueryClient({
        queryClient: singletonQueryClient,
        persister: localStoragePersister,
        maxAge: 30 * 60 * 1000, // 30 minutes
        dehydrateOptions: {
          // Only persist product queries to avoid cluttering localStorage
          shouldDehydrateQuery: (query) => {
            return query.queryKey[0] === 'product' || 
                   query.queryKey[0] === 'products' ||
                   query.queryKey[0] === 'filteredProducts';
          },
        },
      });
      
      // Only log in development
      if (import.meta.env.DEV) {
        console.log('🗄️ React Query persistence enabled with localStorage');
      }
    }
    
    // Add cache persistence debugging (dev only)
    if (import.meta.env.DEV) {
      console.log('QueryClient created with enhanced caching:', singletonQueryClient);
    }
  }
  return singletonQueryClient;
};

// Get the singleton client
const getQueryClient = () => createQueryClient();

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const client = getQueryClient();
  return (
    <QueryClientProvider client={client}>
      {children}
      {/* Only show DevTools in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

export { getQueryClient };
export const queryClient = getQueryClient();
