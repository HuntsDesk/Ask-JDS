import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Import JD Simplified CSS files
import '../jdsimplified/src/index.css';
import { AuthProvider } from './lib/auth';
import { initializeTheme } from './lib/theme';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/query-client';

// Initialize theme before rendering the app
initializeTheme();

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