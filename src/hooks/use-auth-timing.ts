import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { debugLogger } from '@/lib/debug-logger';

export interface AuthTimingOptions {
  timeout?: number; // default 1500ms
  debugContext?: string; // for logging
}

export interface AuthTimingResult {
  isAuthReady: boolean;
  authTimeoutReached: boolean;
  timingDebugInfo: string;
  userId?: string;
}

/**
 * Hook to handle auth timing with graceful fallback for React Query enabled conditions.
 * Solves race conditions where auth state changes faster than React Query can react.
 */
export function useAuthTiming(options: AuthTimingOptions = {}): AuthTimingResult {
  const { timeout = 1500, debugContext = 'query' } = options;
  const { user, isAuthResolved } = useAuth();
  const [authTimeoutReached, setAuthTimeoutReached] = useState(false);
  
  const userId = user?.id;
  
  // Set up timeout fallback
  useEffect(() => {
    // Reset timeout state when auth state changes
    setAuthTimeoutReached(false);
    
    // If auth is already resolved, no need for timeout
    if (isAuthResolved) {
      return;
    }
    
    debugLogger.info('auth', `[${debugContext}] Setting auth timeout fallback: ${timeout}ms`);
    
    const timer = setTimeout(() => {
      debugLogger.warn('auth', `[${debugContext}] Auth timeout reached after ${timeout}ms, proceeding with fallback`);
      setAuthTimeoutReached(true);
    }, timeout);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isAuthResolved, timeout, debugContext]);
  
  // Compute if auth is ready for queries
  const isAuthReady = !!userId && (isAuthResolved || authTimeoutReached);
  
  // Create debug info string
  const timingDebugInfo = `isAuthResolved=${isAuthResolved}, timeoutReached=${authTimeoutReached}, hasUserId=${!!userId}, ready=${isAuthReady}`;
  
  // Log state changes for debugging
  useEffect(() => {
    debugLogger.info('auth', `[${debugContext}] Auth timing state: ${timingDebugInfo}`);
  }, [isAuthReady, debugContext, timingDebugInfo]);
  
  return {
    isAuthReady,
    authTimeoutReached,
    timingDebugInfo,
    userId
  };
} 