import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useEffect, useState, Suspense, useRef } from 'react';

// 7. Handle auth state properly
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = "/auth" 
}: ProtectedRouteProps) {
  const { user, loading, authInitialized } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [fallbackChecked, setFallbackChecked] = useState(false);
  const [fallbackAuth, setFallbackAuth] = useState<boolean | null>(null);
  const isMountedRef = useRef(true);
  const location = useLocation();

  // For debugging only
  useEffect(() => {
    console.log('ProtectedRoute - Auth state:', { user, loading, authInitialized, loadingTimeout });
    
    return () => {
      isMountedRef.current = false;
    };
  }, [user, loading, authInitialized, loadingTimeout]);

  // Try to recover from localStorage if auth is taking too long
  useEffect(() => {
    if (!user && !fallbackChecked && (loading || loadingTimeout)) {
      const checkLocalStorage = async () => {
        try {
          const authStorage = localStorage.getItem('ask-jds-auth-storage');
          const userId = localStorage.getItem('auth-user-id');
          
          if (authStorage && userId) {
            const authData = JSON.parse(authStorage);
            if (authData?.access_token && authData?.expires_at) {
              // Check if token is still valid
              const expiresAt = new Date(authData.expires_at);
              if (expiresAt > new Date()) {
                console.log('ProtectedRoute: Found valid session in localStorage');
                if (isMountedRef.current) {
                  setFallbackAuth(true);
                }
              } else {
                console.log('ProtectedRoute: Found expired session in localStorage');
                if (isMountedRef.current) {
                  setFallbackAuth(false);
                }
              }
            }
          } else {
            if (isMountedRef.current) {
              setFallbackAuth(false);
            }
          }
        } catch (e) {
          console.error('Error checking localStorage for session:', e);
          if (isMountedRef.current) {
            setFallbackAuth(false);
          }
        }
        
        if (isMountedRef.current) {
          setFallbackChecked(true);
        }
      };
      
      checkLocalStorage();
    }
  }, [user, loading, loadingTimeout, fallbackChecked]);

  // Add a safety timeout for loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // If still loading after a delay, show timeout message
    if ((loading || !authInitialized) && !loadingTimeout) {
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
  }, [loading, authInitialized, loadingTimeout]);

  // If authenticated through either method, render the content
  if (user || fallbackAuth === true) {
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

  // Show loading state when authentication is being checked
  if ((loading || !authInitialized) && !loadingTimeout && fallbackAuth !== false) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // If authentication failed or user is not logged in, redirect
  // Store the current path to return to after login
  const returnPath = location.pathname + location.search;
  console.log("ProtectedRoute - No user, redirecting to", redirectTo, "with returnUrl:", returnPath);
  
  // Save the current location to localStorage for redirection after login
  localStorage.setItem('auth-return-url', returnPath);
  
  return <Navigate to={redirectTo} state={{ returnUrl: returnPath }} />;
} 