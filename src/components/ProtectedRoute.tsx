import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useEffect, useState, Suspense, useRef } from 'react';

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

  // For debugging only
  useEffect(() => {
    console.log('ProtectedRoute - Auth state:', { user, loading, isAuthResolved, loadingTimeout });
    
    return () => {
      isMountedRef.current = false;
    };
  }, [user, loading, isAuthResolved, loadingTimeout]);

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
      }, 4000); // 4 seconds timeout for better chance of success
    }
    
    return () => {
      if (timeoutId) {
        console.log('ProtectedRoute: Clearing loading safety timeout');
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthResolved, loadingTimeout]);

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
  console.log("ProtectedRoute - Auth resolved, no user found, redirecting to", redirectTo);
  return <Navigate to={redirectTo} />;
} 