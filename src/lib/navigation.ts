/**
 * Navigation utility functions for the application
 */

/**
 * Get the correct login path based on domain
 * @param domain The current domain (optional)
 * @returns The appropriate login path
 */
export function getLoginPath(domain?: string): string {
  // Default path
  let loginPath = '/auth';
  
  // If domain is provided, use it for domain-specific paths
  if (domain) {
    if (domain.includes('admin')) {
      loginPath = '/admin/login';
    } else if (domain.includes('jds') || domain.includes('simplified')) {
      loginPath = '/login';
    }
  } else {
    // If no domain provided, try to detect from hostname
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('admin')) {
        loginPath = '/admin/login';
      } else if (hostname.includes('jds') || hostname.includes('simplified')) {
        loginPath = '/login';
      }
    }
  }
  
  return loginPath;
}

/**
 * Get the correct dashboard path based on user role and domain
 * @param isAdmin Whether the user is an admin
 * @param domain The current domain (optional)
 * @returns The appropriate dashboard path
 */
export function getDashboardPath(isAdmin: boolean, domain?: string): string {
  if (isAdmin) {
    return '/admin/dashboard';
  }
  
  // Default path
  let dashboardPath = '/dashboard';
  
  // If domain is provided, use it for domain-specific paths
  if (domain) {
    if (domain.includes('jds') || domain.includes('simplified')) {
      dashboardPath = '/dashboard';
    }
  }
  
  return dashboardPath;
} 