import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDomain } from './domain-context';

interface SimplifiedModeProps {
  children: ReactNode;
  redirectTo?: string;
}

export function SimplifiedMode({ 
  children, 
  redirectTo = '/courses' 
}: SimplifiedModeProps) {
  const { isJDSimplified } = useDomain();
  const location = useLocation();
  
  useEffect(() => {
    console.log('SimplifiedMode: Path =', location.pathname, 'isJDSimplified =', isJDSimplified);
    
    if (!isJDSimplified) {
      console.log('SimplifiedMode: Redirecting to', redirectTo, 'from', location.pathname);
    }
  }, [isJDSimplified, location.pathname, redirectTo]);
  
  // If in JD Simplified mode, render the children
  // Otherwise, redirect to the specified path (default: /courses)
  return isJDSimplified ? <>{children}</> : <Navigate to={redirectTo} replace />;
}

export default SimplifiedMode; 