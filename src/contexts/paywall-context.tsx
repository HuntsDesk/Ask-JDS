import React, { createContext, useContext, useState, ReactNode } from 'react';

type PaywallContextType = {
  paywallActive: boolean;
  setPaywallActive: (active: boolean) => void;
};

const PaywallContext = createContext<PaywallContextType>({
  paywallActive: false,
  setPaywallActive: () => {},
});

export const PaywallProvider = ({ children }: { children: ReactNode }) => {
  const [paywallActive, setPaywallActive] = useState(false);

  return (
    <PaywallContext.Provider value={{ paywallActive, setPaywallActive }}>
      {children}
    </PaywallContext.Provider>
  );
};

export const usePaywall = () => useContext(PaywallContext); 