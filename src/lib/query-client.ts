import { QueryClient, QueryCache } from '@tanstack/react-query';

// Create a client with enhanced settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Increased stale time to reduce refetching
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Increased garbage collection time
      gcTime: 15 * 60 * 1000, // 15 minutes
      // Retry failed queries 1 time
      retry: 1,
      // Retry delay (increases with each retry)
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus by default (can be enabled per query)
      refetchOnWindowFocus: false,
      // Only refetch on mount if data is stale
      refetchOnMount: false,
      // Don't refetch on reconnect 
      refetchOnReconnect: false,
    },
    mutations: {
      // Don't retry mutations by default
      retry: 0,
      // Throw on mutation errors
      throwOnError: true,
    },
  },
  // Add query cache with global error handler
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('Query error:', error);
      // We could add global error reporting here
    },
  }),
});

// Note: If we want to add persistence, we would add the following:
// 
// import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
// import { persistQueryClient } from '@tanstack/react-query-persist-client';
// 
// const localStoragePersister = createSyncStoragePersister({
//   storage: window.localStorage,
// });
// 
// persistQueryClient({
//   queryClient,
//   persister: localStoragePersister,
//   maxAge: 24 * 60 * 60 * 1000, // 24 hours
//   buster: import.meta.env.VITE_APP_VERSION || '1.0.0',
// }); 