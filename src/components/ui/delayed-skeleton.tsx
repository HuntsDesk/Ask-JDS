import { useState, useEffect, ReactNode } from 'react';

interface DelayedSkeletonProps {
  /**
   * Delay in milliseconds before showing the skeleton
   * @default 200
   */
  delay?: number;
  
  /**
   * Children to render when showing the skeleton
   */
  children: ReactNode;
}

export function DelayedSkeleton({
  delay = 200,
  children
}: DelayedSkeletonProps) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(true);
    }, delay);
    
    // Clean up the timer when the component unmounts
    return () => {
      clearTimeout(timer);
    };
  }, [delay]);
  
  // Don't render anything if we're still within the delay period
  if (!showSkeleton) {
    return null;
  }
  
  // Once delay passes, render the skeleton
  return <>{children}</>;
} 