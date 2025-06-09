import { useEffect, useLayoutEffect } from 'react';

/**
 * A hook that uses `useLayoutEffect` on the client and `useEffect` on the server.
 * This helps prevent hydration mismatches and provides stability during hot module replacement.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect; 