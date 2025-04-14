import { useState, useEffect } from 'react';
import { LoadingSpinner } from './loading-spinner';

interface DelayedLoadingSpinnerProps {
  /**
   * Delay in milliseconds before showing the spinner
   * @default 2000
   */
  delay?: number;
  
  /**
   * Additional class names
   */
  className?: string;
  
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Show the spinner in fullscreen mode
   * @default false
   */
  fullScreen?: boolean;
}

export function DelayedLoadingSpinner({
  delay = 2000,
  className,
  size = 'md',
  fullScreen = false
}: DelayedLoadingSpinnerProps) {
  const [showSpinner, setShowSpinner] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpinner(true);
    }, delay);
    
    // Clean up the timer when the component unmounts
    return () => {
      clearTimeout(timer);
    };
  }, [delay]);
  
  // Don't render anything if we're still within the delay period
  if (!showSpinner) {
    return null;
  }
  
  // Once delay passes, render the normal loading spinner
  return <LoadingSpinner className={className} size={size} fullScreen={fullScreen} />;
} 