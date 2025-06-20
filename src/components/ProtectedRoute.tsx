import { logger } from '@/lib/logger';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useEffect, useState, Suspense, useRef, startTransition } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

// Constants for session storage keys
const REDIRECT_ATTEMPTS_KEY = 'protected_redirect_attempts';
const SESSION_FOUND_KEY = 'auth-session-detected';
const SESSION_USER_ID_KEY = 'auth-session-user-id';
const SESSION_TIMESTAMP_KEY = 'auth-session-timestamp';

// Handle auth state properly
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = "/auth" 
}: ProtectedRouteProps) {
  // Get auth state including the isAuthResolved flag
  const { user, loading, isAuthResolved } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const isMountedRef = useRef(true);
  const [redirectLock, setRedirectLock] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [manualSessionChecked, setManualSessionChecked] = useState(false);
  const [hasManualSession, setHasManualSession] = useState(false);
  const didCheckSessionRef = useRef<boolean>(false);

  // For debugging only - but reduce frequency to avoid console spam
  useEffect(() => {
    if (user || hasManualSession || redirectLock) {
      logger.debug('[ProtectedRoute] Auth state:', {
        user: user ? `found` : null,
        isAuthResolved,
        hasManualSession,
        redirectLock
      });
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [user, isAuthResolved, hasManualSession, redirectLock]);

  // Add a safety timeout for loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // If auth hasn't resolved after a delay, show timeout message
    if (!isAuthResolved && !loadingTimeout) {
      logger.debug('ProtectedRoute: Setting loading safety timeout');
      timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          logger.debug('ProtectedRoute: Loading safety timeout triggered');
          setLoadingTimeout(true);
        }
      }, 2000); // Reduced to 2 seconds for faster perceived loading
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthResolved, loadingTimeout]);

  // Check for session directly with Supabase if context says no user
  useEffect(() => {
    // Only check once per component instance and only if needed
    if (isAuthResolved && !user && !isCheckingSession && !manualSessionChecked && !didCheckSessionRef.current) {
      const checkSessionDirectly = async () => {
        try {
          setIsCheckingSession(true);
          didCheckSessionRef.current = true;
          logger.debug('[ProtectedRoute] Context shows no user but auth is resolved. Checking session directly with Supabase...');
          
          // First check if we have a recent session marker in storage
          const sessionMarker = sessionStorage.getItem(SESSION_FOUND_KEY);
          const sessionUserId = sessionStorage.getItem(SESSION_USER_ID_KEY);
          const sessionTimestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
          
          // If we have a recent session marker (last 5 minutes), trust it
          if (sessionMarker === 'true' && sessionUserId && sessionTimestamp) {
            const timestamp = parseInt(sessionTimestamp, 10);
            const now = Date.now();
            const fiveMinutesAgo = now - (5 * 60 * 1000);
            
            if (timestamp > fiveMinutesAgo) {
              logger.debug('[ProtectedRoute] Found recent session marker in storage, using it');
              setHasManualSession(true);
              setManualSessionChecked(true);
              setIsCheckingSession(false);
              return;
            }
          }
          
          // If no recent marker or it's expired, check with Supabase
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            logger.error('[ProtectedRoute] Error checking session directly:', error);
            setManualSessionChecked(true);
            setHasManualSession(false);
            setIsCheckingSession(false);
            return;
          }
          
          if (data?.session?.user) {
            logger.debug('[ProtectedRoute] Found valid session directly from Supabase, preventing redirect loop');
            
            // Store session information to help coordinate with AuthPage
            sessionStorage.setItem(SESSION_FOUND_KEY, 'true');
            sessionStorage.setItem(SESSION_USER_ID_KEY, data.session.user.id);
            sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
            
            setHasManualSession(true);
            // Wait briefly for context to sync
            setTimeout(() => {
              if (isMountedRef.current) {
                setIsCheckingSession(false);
              }
            }, 500);
          } else {
            logger.debug('[ProtectedRoute] No session found directly from Supabase');
            
            // Clear any previous session markers
            sessionStorage.removeItem(SESSION_FOUND_KEY);
            sessionStorage.removeItem(SESSION_USER_ID_KEY);
            sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
            
            setHasManualSession(false);
            setIsCheckingSession(false);
          }
          
          setManualSessionChecked(true);
        } catch (err) {
          logger.error('[ProtectedRoute] Exception checking session directly:', err);
          setManualSessionChecked(true);
          setHasManualSession(false);
          setIsCheckingSession(false);
        }
      };
      
      checkSessionDirectly();
    }
  }, [isAuthResolved, user, isCheckingSession, manualSessionChecked]);

  // Check for redirect loops and prevent them
  useEffect(() => {
    if (isAuthResolved && !user && !redirectLock && !isCheckingSession && !hasManualSession) {
      // Check if we're in a potential redirect loop
      const prevRedirectAttempts = parseInt(sessionStorage.getItem(REDIRECT_ATTEMPTS_KEY) || '0');
      
      if (prevRedirectAttempts > 3) {
        logger.warn('ProtectedRoute: Too many redirects detected, stopping redirect loop');
        sessionStorage.removeItem(REDIRECT_ATTEMPTS_KEY);
        setRedirectLock(true);
        // Force authentication refresh after a delay
        setTimeout(() => {
          logger.debug('ProtectedRoute: Forcing refresh after redirect loop');
          window.location.reload();
        }, 2000);
        return;
      }
      
      // Increment the counter for future checks
      sessionStorage.setItem(REDIRECT_ATTEMPTS_KEY, (prevRedirectAttempts + 1).toString());
    } else if (user || hasManualSession) {
      // Reset counter when user is authenticated
      sessionStorage.removeItem(REDIRECT_ATTEMPTS_KEY);
    }
  }, [isAuthResolved, user, redirectLock, isCheckingSession, hasManualSession]);

  // CRITICAL: Show loading state when authentication is still being checked
  // We must not redirect until isAuthResolved = true, regardless of user status
  // Only show loading for necessary auth checks, not always
  if (!isAuthResolved || isCheckingSession) {
    // Don't show loading immediately - give auth a chance to resolve quickly
    if (!loadingTimeout) {
      return (
        <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Checking authorization...
            </p>
          </div>
        </div>
      );
    }
    
    // Show extended loading state only if needed
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Taking longer than expected...
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 max-w-md text-center">
            This is taking longer than usual. If this persists, try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  // If authenticated via context OR manual session check, render the content
  if (user || hasManualSession) {
    // Remove Suspense fallback to eliminate "Loading content..." indicator
    // Individual components handle their own loading states
    return <>{children}</>;
  }

  // Redirect if manually prevented
  if (redirectLock) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center max-w-md mx-auto px-4 text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Authorization Issue</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            We detected a potential redirect loop. This usually happens when there's a session mismatch.
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
              variant="default"
            >
              Reload Page
            </Button>
            <Button 
              onClick={() => {
                sessionStorage.clear();
                localStorage.removeItem('ask-jds-last-visited-page');
                window.location.href = '/auth';
              }} 
              className="w-full"
              variant="outline"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return <Navigate to={redirectTo} />;
} 