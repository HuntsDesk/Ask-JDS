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
  // Default fallback values in case of errors
  const fallbackValues = {
    subscription: null,
    isLoading: false,
    isError: true,
    error: new Error("Failed to load subscription data"),
    refreshSubscription: () => console.warn("Refresh unavailable due to error"),
    isActive: false,
    tierName: "Free",
  };

  try {
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
  } catch (e) {
    console.error("Error in SubscriptionProvider:", e);
    
    // Return fallback values if useSubscription throws an error
    return (
      <SubscriptionContext.Provider value={fallbackValues}>
        {children}
      </SubscriptionContext.Provider>
    );
  }
};

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}; 