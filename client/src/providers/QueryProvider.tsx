import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// Create the query client with optimized settings for persistence
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 2 minutes (faster updates)
        staleTime: 2 * 60 * 1000,
        // Cache time: 10 minutes (longer for persistence)
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 2 times
        retry: 2,
        // Retry delay increases exponentially
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Optimized cache settings for persistence
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
};

// Create localStorage persister with error handling
const createPersister = () => {
  if (!isLocalStorageAvailable()) {
    console.warn('🚫 localStorage not available, cache persistence disabled');
    return undefined;
  }

  try {
    return createSyncStoragePersister({
      storage: {
        getItem: (key: string) => {
          try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            
            // Parse and check expiration (5 minutes)
            const parsed = JSON.parse(item);
            const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
            
            if (parsed.timestamp && Date.now() - parsed.timestamp > CACHE_EXPIRY) {
              console.warn('⏰ Cache expired, clearing expired data');
              localStorage.removeItem(key);
              return null;
            }
          
            
            return item;
          } catch (error) {
            console.warn('🚫 Failed to get cached data:', error);
            localStorage.removeItem(key);
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          try {
            // Check size limit (10MB)
            const MAX_STORAGE_SIZE = 10 * 1024 * 1024;
            if (value.length > MAX_STORAGE_SIZE) {
              console.warn('🚫 Cache too large, not persisting');
              return;
            }
            
            // Add timestamp for expiration
            const dataWithTimestamp = JSON.parse(value);
            dataWithTimestamp.timestamp = Date.now();
            const finalValue = JSON.stringify(dataWithTimestamp);
            
            localStorage.setItem(key, finalValue);
            
          } catch (error) {
            console.warn('🚫 Failed to persist cache:', error);
            // Try to clear some space
            localStorage.removeItem(key);
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key);
            if (import.meta.env.DEV) {
            }
          } catch (error) {
            console.warn('🚫 Failed to clear cache:', error);
          }
        },
      },
      key: 'attars-react-query-cache',
      // Throttle persistence to avoid too frequent writes
      throttleTime: 1000,
    });
  } catch (error) {
    console.warn('🚫 Failed to create persister:', error);
    return undefined;
  }
};

// Create singleton instances
let singletonQueryClient: QueryClient | null = null;
let singletonPersister: ReturnType<typeof createPersister> | null = null;

const getQueryClient = () => {
  if (!singletonQueryClient) {
    singletonQueryClient = createQueryClient();
  }
  return singletonQueryClient;
};

const getPersister = () => {
  if (singletonPersister === null) {
    singletonPersister = createPersister();
    
  }
  return singletonPersister;
};

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const client = getQueryClient();
  const persister = getPersister();

  // If persister is available, use PersistQueryClientProvider
  if (persister) {
    return (
      <PersistQueryClientProvider
        client={client}
        persistOptions={{
          persister,
          // Only persist specific query keys to reduce storage size
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // Only persist product-related queries and non-user-specific data
              const queryKey = query.queryKey[0] as string;
              const persistableKeys = [
                'products',
                'categories', 
                'productTypes',
                'subcategories',
                'aov-tiers'
              ];
              
              return persistableKeys.some(key => queryKey?.includes(key));
            },
          },
          // Max age for persisted cache (5 minutes)
          maxAge: 5 * 60 * 1000,
        }}
      >
        {children}
        {/* Only show DevTools in development */}
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </PersistQueryClientProvider>
    );
  }

  // Fallback to regular QueryClientProvider if persistence is not available
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

// Utility function to clear cache (useful for debugging or user logout)
export const clearQueryCache = () => {
  const persister = getPersister();
  if (persister && 'removeClient' in persister) {
    (persister as any).removeClient();
  }
  
  // Also clear localStorage directly
  try {
    localStorage.removeItem('attars-react-query-cache');
  } catch (error) {
    console.warn('Failed to clear localStorage cache:', error);
  }
  
  if (singletonQueryClient) {
    singletonQueryClient.clear();
  }
  
};
