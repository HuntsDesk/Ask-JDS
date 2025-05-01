import { useContext } from 'react';
import { SidebarContext } from '@/App';
import { usePersistedState } from './use-persisted-state';
import useMediaQuery from './useMediaQuery';

/**
 * A hook that provides consistent layout state information across the application.
 * This centralizes sidebar state management to ensure consistent padding and layout.
 * 
 * @returns {Object} Layout state object including:
 *   - isDesktop: Whether the current viewport is desktop-sized
 *   - isPinned: Whether the sidebar is pinned
 *   - setIsPinned: Function to update the pinned state
 *   - isExpanded: Whether the sidebar is expanded
 *   - contentPadding: Tailwind class for horizontal padding based on sidebar state
 *   - contentMargin: Tailwind class for left margin based on sidebar state
 */
export function useLayoutState() {
  // Get context values if they exist, otherwise use sensible defaults
  const sidebarContext = useContext(SidebarContext);
  const isExpanded = sidebarContext?.isExpanded ?? true;
  const isMobile = sidebarContext?.isMobile ?? false;

  // Use media query for consistent desktop detection
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Get persisted state values for sidebar pinning - IMPORTANT: Return both the state and setter
  const [isPinned, setIsPinned] = usePersistedState<boolean>('sidebar-is-pinned', false);
  
  // Calculate horizontal padding based on sidebar state
  const contentPadding = isDesktop
    ? isPinned
      ? isExpanded
        ? 'px-16' // Padding for pinned, expanded sidebar
        : 'px-12' // Collapsed pinned sidebar
      : isExpanded
        ? 'px-6'  // Expanded but not pinned
        : 'px-4'  // Collapsed and not pinned
    : 'px-4';     // Mobile view: consistent padding
  
  // Calculate left margin/padding for fixed elements to align with sidebar
  const contentMargin = isDesktop
    ? isPinned
      ? isExpanded
        ? 'pl-16' // Margin for pinned, expanded sidebar
        : 'pl-12' // Collapsed pinned sidebar
      : isExpanded
        ? 'pl-6'  // Expanded but not pinned
        : 'pl-4'  // Collapsed and not pinned
    : 'pl-4';     // Mobile view: consistent padding

  return {
    isDesktop,
    isPinned,
    setIsPinned, // Include the setter function
    isExpanded,
    isMobile,
    contentPadding,
    contentMargin
  };
} 