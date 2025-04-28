import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Import JD Simplified CSS files
import '../jdsimplified/src/index.css';
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
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
);