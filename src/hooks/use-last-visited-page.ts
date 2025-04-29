import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'ask-jds-last-visited-page';

/**
 * Hook to track and store the last visited page
 * 
 * @param ignorePaths Array of paths that should not be stored (e.g., login, auth pages)
 * @returns Object with getLastVisitedPage function and clearLastVisitedPage function
 */
export function useLastVisitedPage(ignorePaths: string[] = ['/auth', '/login']) {
  const location = useLocation();

  // Store the current path in localStorage when it changes
  useEffect(() => {
    // Don't store paths that should be ignored
    if (ignorePaths.some(path => location.pathname.startsWith(path))) {
      return;
    }
    
    // Only store protected/authenticated routes (those that should require login)
    if (location.pathname === '/' || location.pathname === '') {
      return;
    }
    
    // Store the current path
    localStorage.setItem(STORAGE_KEY, location.pathname + location.search);
  }, [location.pathname, location.search, ignorePaths]);

  // Function to get the last visited page
  const getLastVisitedPage = (): string => {
    const lastPath = localStorage.getItem(STORAGE_KEY);
    // Default to '/chat' if no last path is found
    return lastPath || '/chat';
  };

  // Function to clear the last visited page
  const clearLastVisitedPage = (): void => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    getLastVisitedPage,
    clearLastVisitedPage
  };
} 