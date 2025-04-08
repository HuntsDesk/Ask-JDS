import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Import JD Simplified CSS files
import '../jdsimplified/src/index.css';
import { AuthProvider } from './lib/auth';
import { initializeTheme } from './lib/theme';

// Initialize theme before rendering the app
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);