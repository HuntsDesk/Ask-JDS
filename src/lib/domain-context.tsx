import React, { createContext, useContext, useEffect, useState } from 'react';

export type Domain = 'askjds' | 'jdsimplified' | 'admin';

interface DomainContextType {
  currentDomain: Domain;
  isJDSimplified: boolean;
  isAskJDS: boolean;
  isAdmin: boolean;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export function DomainProvider({ children }: { children: React.ReactNode }) {
  // Get the initial domain - environment variables always take precedence
  const getInitialDomain = (): Domain => {
    const envMode = import.meta.env.MODE;
    
    // Environment variable takes precedence over everything else
    if (envMode === 'jds') {
      return 'jdsimplified';
    } else if (envMode === 'askjds') {
      return 'askjds';
    } else if (envMode === 'admin') {
      return 'admin';
    }
    
    // If no environment variable is set explicitly, then use localStorage
    if (typeof window !== 'undefined') {
      const storedDomain = localStorage.getItem('current_domain');
      if (storedDomain === 'jdsimplified' || storedDomain === 'askjds' || storedDomain === 'admin') {
        return storedDomain as Domain;
      }
    }
    
    return 'askjds'; // Default fallback
  };

  const [currentDomain, setCurrentDomain] = useState<Domain>(getInitialDomain());

  useEffect(() => {
    // Check for environment variable first (for npm run dev:jds/askjds/admin)
    const envMode = import.meta.env.MODE;
    console.log('Domain detection:', {
      envMode,
      currentMode: envMode === 'jds' ? 'jdsimplified' : envMode === 'askjds' ? 'askjds' : envMode === 'admin' ? 'admin' : 'default',
      hostname: window.location.hostname,
      port: window.location.port,
      allEnv: import.meta.env
    });

    let detectedDomain: Domain;

    // Environment variables always take precedence
    if (envMode === 'jds') {
      console.log('Setting domain to JD Simplified based on environment variable');
      detectedDomain = 'jdsimplified';
    } else if (envMode === 'askjds') {
      console.log('Setting domain to Ask JDS based on environment variable');
      detectedDomain = 'askjds';
    } else if (envMode === 'admin') {
      console.log('Setting domain to Admin based on environment variable');
      detectedDomain = 'admin';
    } else {
      // If no environment variable, check hostname
      const hostname = window.location.hostname;
      
      // Check if we're on localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Use path for local development
        const path = window.location.pathname;
        if (path.startsWith('/admin')) {
          detectedDomain = 'admin';
        } else if (path.startsWith('/jds')) {
          detectedDomain = 'jdsimplified';
        } else {
          detectedDomain = 'askjds';
        }
      } else {
        // Use hostname for production
        if (hostname.includes('admin.jdsimplified.com') || hostname.includes(import.meta.env.VITE_ADMIN_DOMAIN || '')) {
          detectedDomain = 'admin';
        } else if (hostname.includes('jdsimplified.com') || hostname.includes(import.meta.env.VITE_JDSIMPLIFIED_DOMAIN || '')) {
          detectedDomain = 'jdsimplified';
        } else {
          detectedDomain = 'askjds';
        }
      }
    }
    
    // Save to localStorage to prevent flashing between domains on future loads
    localStorage.setItem('current_domain', detectedDomain);
    setCurrentDomain(detectedDomain);
  }, []);

  const value = {
    currentDomain,
    isJDSimplified: currentDomain === 'jdsimplified',
    isAskJDS: currentDomain === 'askjds',
    isAdmin: currentDomain === 'admin',
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