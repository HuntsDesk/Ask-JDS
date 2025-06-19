import React, { createContext, useContext, ReactNode } from 'react';
import { createClient, UsermavenProvider } from '@usermaven/react';
import { getUsermavenConfig } from '@/lib/analytics/usermaven';

// Create a context to easily access Usermaven functionality
export const UsermavenContext = createContext<{
  initialized: boolean;
}>({
  initialized: false,
});

// Custom hook to use the Usermaven context
export const useUsermavenContext = () => useContext(UsermavenContext);

interface UsermavenAnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the application with Usermaven's analytics context
 * 
 * This should be placed high in the component tree, ideally right inside the app's
 * main layout or inside the root App component
 */
export const UsermavenAnalyticsProvider: React.FC<UsermavenAnalyticsProviderProps> = ({ children }) => {
  // Only initialize if we have the required API key
  const hasApiKey = Boolean(import.meta.env.VITE_USERMAVEN_KEY);
  
  // If we don't have an API key, just render children without Usermaven
  if (!hasApiKey) {
    console.warn('⚠️ Usermaven API key not found. Analytics tracking is disabled.');
    return <>{children}</>;
  }

  console.log('🚀 Usermaven analytics enabled and ready to track events');

  // Create the Usermaven client with our configuration
  const config = getUsermavenConfig();
  const usermavenClient = createClient(config);
  
  return (
    <UsermavenProvider client={usermavenClient}>
      <UsermavenContext.Provider value={{ initialized: true }}>
        {children}
      </UsermavenContext.Provider>
    </UsermavenProvider>
  );
}; 