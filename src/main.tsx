import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// JD Simplified styles are already included in the main index.css
import { AuthProvider } from './lib/auth';
import { initializeTheme } from './lib/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Initialize theme before rendering the app
initializeTheme();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime in v5)
      refetchOnWindowFocus: false,
      placeholderData: undefined, // replaces keepPreviousData
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  // React StrictMode intentionally mounts components twice in development to help find issues
  // This is why you might see two AuthProvider mounts in the console - it's normal in dev mode
  // IMPORTANT: There should only be ONE AuthProvider in the entire app tree.
  // This double mounting is ONLY in development and doesn't indicate a bug.
  // DO NOT add additional AuthProviders in your route components!
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
      {/* Temporarily disabled for testing */}
      {/* {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  </React.StrictMode>
);