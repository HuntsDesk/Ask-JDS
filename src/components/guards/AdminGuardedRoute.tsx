import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useDomain } from '@/lib/domain-context';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface AdminGuardedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export const AdminGuardedRoute: React.FC<AdminGuardedRouteProps> = ({ 
  children, 
  fallbackPath = '/unauthorized' 
}) => {
  const { user, loading } = useAuth();
  const { isAdmin: isAdminDomain } = useDomain();
  
  // Check if user has admin permissions from metadata
  const isAdmin = user?.user_metadata?.is_admin === true;
  
  // First use ProtectedRoute to ensure user is authenticated
  return (
    <ProtectedRoute>
      {/* Then check for admin permissions */}
      {isAdmin ? (
        <>{children}</>
      ) : (
        <Navigate to={fallbackPath} replace />
      )}
    </ProtectedRoute>
  );
}; 