import { ReactNode, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import useCourseAccess from '@/hooks/useCourseAccess';

interface CourseAccessGuardProps {
  children: ReactNode;
  redirectTo?: string;
  debug?: boolean;
}

/**
 * CourseAccessGuard - Protects course routes based on user entitlements
 * Uses the useCourseAccess hook to determine if user has access
 */
export function CourseAccessGuard({ 
  children, 
  redirectTo = '/courses',
  debug = false
}: CourseAccessGuardProps) {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  
  // Use our custom hook to check course access
  const { hasAccess, reason, isLoading } = useCourseAccess(courseId);

  // Debug logging
  useEffect(() => {
    if (debug) {
      console.log('CourseAccessGuard:', {
        courseId,
        userId: user?.id,
        hasAccess,
        reason,
        isLoading
      });
    }
  }, [debug, courseId, user?.id, hasAccess, reason, isLoading]);

  // Show loading state while checking access
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to={`/auth?redirectTo=${encodeURIComponent(window.location.pathname)}`} replace />;
  }

  // If user does not have access, redirect to specified path
  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  // User has access, render children
  return <>{children}</>;
}

export default CourseAccessGuard; 