import { useLayoutState } from './useLayoutState';

/**
 * A lightweight hook that returns just the padding and margin values from useLayoutState.
 * This is useful for components that only need these values without the full sidebar state.
 * 
 * @returns {Object} Object containing contentPadding and contentMargin Tailwind classes
 */
export function useLayoutPadding() {
  const { contentPadding, contentMargin } = useLayoutState();
  return { contentPadding, contentMargin };
} 