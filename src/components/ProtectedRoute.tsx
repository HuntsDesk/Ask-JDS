import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useEffect, useState, Suspense } from 'react';

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

  console.log('ProtectedRoute - Auth state:', { user, loading, authInitialized, loadingTimeout });

  // Add a safety timeout for loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // If still loading after a delay, show timeout message
    if ((loading || !authInitialized) && !loadingTimeout) {
      console.log('ProtectedRoute: Setting loading safety timeout');
      timeoutId = setTimeout(() => {
        console.log('ProtectedRoute: Loading safety timeout triggered');
        setLoadingTimeout(true);
      }, 1000); // Short timeout for better UX
    }
    
    return () => {
      if (timeoutId) {
        console.log('ProtectedRoute: Clearing loading safety timeout');
        clearTimeout(timeoutId);
      }
    };
  }, [loading, authInitialized, loadingTimeout]);

  // Show loading state when authentication is being checked
  if ((loading || !authInitialized) && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // If authentication failed or user is not logged in, redirect
  if (!user) {
    console.log("ProtectedRoute - No user, redirecting to", redirectTo);
    return <Navigate to={redirectTo} />;
  }

  // If user is authenticated, render the protected content
  console.log("ProtectedRoute - User authenticated, rendering content");
  
  // Wrap children in Suspense boundary to handle lazy-loaded components
  return <Suspense fallback={
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-500">Loading content...</p>
      </div>
    </div>
  }>
    {children}
  </Suspense>;
} 