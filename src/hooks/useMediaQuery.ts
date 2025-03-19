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