/**
 * Standard breakpoints for responsive design
 */
export const BREAKPOINTS = {
  mobile: 640,  // max-width for mobile
  tablet: 1024, // max-width for tablet
  desktop: 1280 // min-width for desktop
};

/**
 * Standard padding values based on sidebar state and screen size
 */
export const PADDING = {
  mobile: 'px-3', // tighter on mobile
  tablet: 'px-4',
  desktop: {
    expanded: {
      pinned: 'px-16',
      unpinned: 'px-6'
    },
    collapsed: {
      pinned: 'px-12',
      unpinned: 'px-4'
    }
  }
};

/**
 * Standard margin values based on sidebar state and screen size
 * Used for fixed position elements that need to align with content
 */
export const MARGIN = {
  mobile: 'ml-3', // tighter on mobile
  tablet: 'ml-4',
  desktop: {
    expanded: {
      pinned: 'ml-16',
      unpinned: 'ml-6'
    },
    collapsed: {
      pinned: 'ml-12',
      unpinned: 'ml-4'
    }
  }
};

/**
 * Max width values for different content types
 */
export const MAX_WIDTH = {
  default: '1280px',
  narrow: '960px',
  wide: '1440px'
};

/**
 * Transition settings for layout animations
 */
export const TRANSITIONS = {
  default: 'transition-all duration-300 ease-in-out'
}; 