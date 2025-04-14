import { useAuth } from '@/lib/auth';
import { useDomain } from '@/lib/domain-context';

export function useDomainGuard() {
  const { currentDomain, isAskJDS, isJDSimplified, isAdmin: isAdminDomain } = useDomain();
  const { user, loading: isLoading } = useAuth();
  
  // Check if user has admin privileges from user metadata
  const isAdmin = user?.user_metadata?.is_admin === true;
  
  // Core access control logic
  // Block access if on admin domain but not an admin
  const blockOnAdminDomain = isAdminDomain && !isAdmin;
  const allowAccess = !blockOnAdminDomain;

  return {
    // Domain info
    currentDomain,
    isAdminDomain,
    isAskJDS,
    isJDSimplified,
    
    // Auth info
    user,
    isAdmin,
    isLoading,
    
    // Access control
    allowAccess,
    blocked: !allowAccess
  };
} 