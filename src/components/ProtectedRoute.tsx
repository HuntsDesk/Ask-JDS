import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useEffect, useState, Suspense, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // For debugging only
  useEffect(() => {
    console.log('ProtectedRoute - Auth state:', { user, loading, isAuthResolved, loadingTimeout, redirectLock });
    
    return () => {
      isMountedRef.current = false;
    };
  }, [user, loading, isAuthResolved, loadingTimeout, redirectLock]);

  // Add a safety timeout for loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // If auth hasn't resolved after a delay, show timeout message
    if (!isAuthResolved && !loadingTimeout) {
      console.log('ProtectedRoute: Setting loading safety timeout');
      timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('ProtectedRoute: Loading safety timeout triggered');
          setLoadingTimeout(true);
        }
      }, 5000); // 5 seconds timeout for better chance of success
    }
    
    return () => {
      if (timeoutId) {
        console.log('ProtectedRoute: Clearing loading safety timeout');
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthResolved, loadingTimeout]);

  // Recovery mechanism if loading persists too long
  useEffect(() => {
    let recoveryTimeoutId: NodeJS.Timeout | null = null;
    
    if (loadingTimeout && !isAuthResolved) {
      // If loading has timed out, set a recovery action to force auth resolution
      recoveryTimeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('ProtectedRoute: Recovery timeout triggered - forcing page reload');
          window.location.reload();
        }
      }, 10000); // 10 seconds until force reload
    }
    
    return () => {
      if (recoveryTimeoutId) {
        clearTimeout(recoveryTimeoutId);
      }
    };
  }, [loadingTimeout, isAuthResolved]);

  // Check for redirect loops and prevent them
  useEffect(() => {
    if (isAuthResolved && !user && !redirectLock) {
      // Check if we're in a potential redirect loop
      const prevRedirectAttempts = parseInt(sessionStorage.getItem('protected_redirect_attempts') || '0');
      
      console.log('ProtectedRoute: Checking redirect counter:', prevRedirectAttempts);
      
      if (prevRedirectAttempts > 3) {
        console.warn('ProtectedRoute: Too many redirects detected, stopping redirect loop');
        sessionStorage.removeItem('protected_redirect_attempts');
        setRedirectLock(true);
        // Force authentication refresh after a delay
        setTimeout(() => {
          console.log('ProtectedRoute: Forcing refresh after redirect loop');
          window.location.reload();
        }, 2000);
        return;
      }
      
      // Increment the counter for future checks
      sessionStorage.setItem('protected_redirect_attempts', (prevRedirectAttempts + 1).toString());
    } else if (user) {
      // Reset counter when user is authenticated
      sessionStorage.removeItem('protected_redirect_attempts');
    }
  }, [isAuthResolved, user, redirectLock]);

  // CRITICAL: Show loading state when authentication is still being checked
  // We must not redirect until isAuthResolved = true, regardless of user status
  if (!isAuthResolved) {
    console.log('ProtectedRoute: Auth not yet resolved, showing loading state');
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {loadingTimeout 
              ? "Taking longer than expected..." 
              : "Checking authorization..."}
          </p>
          {loadingTimeout && (
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 max-w-md text-center">
              This is taking longer than usual. If this persists, try refreshing the page.
            </p>
          )}
        </div>
      </div>
    );
  }

  // If authenticated, render the content
  if (user) {
    console.log("ProtectedRoute - User authenticated, rendering content");
    
    // Wrap children in Suspense boundary to handle lazy-loaded components
    return <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading content...</p>
        </div>
      </div>
    }>
      {children}
    </Suspense>;
  }

  // If we get here, authentication is resolved and user is not logged in
  // Check if we're in a redirect lockdown (preventing loop)
  if (redirectLock) {
    console.log("ProtectedRoute - Redirect locked due to loop prevention");
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">Authentication Error</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            There was a problem with authentication. Please try again.
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  console.log("ProtectedRoute - Auth resolved, no user found, redirecting to", redirectTo);
  return <Navigate to={redirectTo} />;
} 