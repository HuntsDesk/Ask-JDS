import React, { createContext, useContext, ReactNode } from 'react';
import { useSubscription, SubscriptionDetails } from '@/hooks/useSubscription'; // Adjust path as needed

interface SubscriptionContextType {
  subscription: SubscriptionDetails | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refreshSubscription: () => void;
  isActive: boolean;
  tierName: string | null;
  // Add other convenient accessors as needed
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const {
    subscription,
    isLoading,
    isError,
    error,
    refreshSubscription,
    isActive,
    tierName,
  } = useSubscription();

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      isLoading,
      isError,
      error,
      refreshSubscription,
      isActive,
      tierName
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}; 