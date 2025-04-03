import React, { createContext, useContext, useEffect, useState } from 'react';

export type Domain = 'askjds' | 'jdsimplified';

interface DomainContextType {
  currentDomain: Domain;
  isJDSimplified: boolean;
  isAskJDS: boolean;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export function DomainProvider({ children }: { children: React.ReactNode }) {
  const [currentDomain, setCurrentDomain] = useState<Domain>('askjds');

  useEffect(() => {
    // Check for environment variable first (for npm run dev:jds)
    const envMode = import.meta.env.MODE;
    console.log('Domain detection:', {
      envDomain: envMode === 'jds' ? 'jdsimplified' : 'askjds',
      hostname: window.location.hostname,
      port: window.location.port,
      allEnv: import.meta.env
    });

    if (envMode === 'jds') {
      console.log('Setting domain to JD Simplified based on environment variable');
      setCurrentDomain('jdsimplified');
      return;
    }
    
    // If no environment variable, check hostname
    const hostname = window.location.hostname;
    
    // Check if we're on localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Use path for local development
      const path = window.location.pathname;
      setCurrentDomain(path.startsWith('/jds') ? 'jdsimplified' : 'askjds');
    } else {
      // Use hostname for production
      setCurrentDomain(
        hostname.includes('jdsimplified.com') ? 'jdsimplified' : 'askjds'
      );
    }
  }, []);

  const value = {
    currentDomain,
    isJDSimplified: currentDomain === 'jdsimplified',
    isAskJDS: currentDomain === 'askjds',
  };

  return (
    <DomainContext.Provider value={value}>
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain() {
  const context = useContext(DomainContext);
  if (context === undefined) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  return context;
} 