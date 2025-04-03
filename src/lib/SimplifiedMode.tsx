import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
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
  
  // If in JD Simplified mode, render the children
  // Otherwise, redirect to the specified path (default: /courses)
  return isJDSimplified ? <>{children}</> : <Navigate to={redirectTo} replace />;
}

export default SimplifiedMode; 