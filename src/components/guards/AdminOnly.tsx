import React from 'react';
import { useDomainGuard } from '@/hooks/useDomainGuard';

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that only renders its children if the current user is an admin.
 * Useful for conditionally showing admin-only UI elements.
 */
export const AdminOnly: React.FC<AdminOnlyProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { isAdmin } = useDomainGuard();
  
  if (!isAdmin) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}; 