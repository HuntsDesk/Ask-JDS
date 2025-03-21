import { useState, useEffect } from 'react';

/**
 * A hook that returns whether a media query matches
 * @param query The media query to check
 * @returns boolean indicating if the media query matches
 */
export default function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create the media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set the initial value
    setMatches(mediaQuery.matches);

    // Define the event listener
    const updateMatches = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add event listener
    mediaQuery.addEventListener('change', updateMatches);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', updateMatches);
    };
  }, [query]);

  return matches;
}

/**
 * Helper hook to detect if the current device is a tablet
 * Tablets are considered to be between 768px and 1023px width
 * @returns boolean indicating if the current device is a tablet
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Helper hook to detect if the current device is mobile (phone)
 * Mobile is considered to be less than 768px width
 * @returns boolean indicating if the current device is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Helper hook to detect if the current device is desktop
 * Desktop is considered to be 1024px or wider
 * @returns boolean indicating if the current device is desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
} 