/**
 * Constants for responsive breakpoints
 * These align with Tailwind's default breakpoints but add explicit tablet range
 */

// Breakpoint values in pixels
export const BREAKPOINTS = {
  MOBILE_MAX: 767,     // Max width for mobile devices
  TABLET_MIN: 768,     // Min width for tablet devices
  TABLET_MAX: 1023,    // Max width for tablet devices
  DESKTOP_MIN: 1024,   // Min width for desktop devices
};

// Media query strings for useMediaQuery hook
export const MEDIA_QUERIES = {
  IS_MOBILE: `(max-width: ${BREAKPOINTS.MOBILE_MAX}px)`,
  IS_TABLET: `(min-width: ${BREAKPOINTS.TABLET_MIN}px) and (max-width: ${BREAKPOINTS.TABLET_MAX}px)`,
  IS_DESKTOP: `(min-width: ${BREAKPOINTS.DESKTOP_MIN}px)`,
  IS_MOBILE_OR_TABLET: `(max-width: ${BREAKPOINTS.TABLET_MAX}px)`,
  IS_TABLET_OR_DESKTOP: `(min-width: ${BREAKPOINTS.TABLET_MIN}px)`,
};

// Tailwind class helpers for responsive design
export const TAILWIND_RESPONSIVE = {
  // Column layouts
  GRID_COLS: {
    DEFAULT: 'grid-cols-1',
    TABLET: 'md:grid-cols-2 lg:grid-cols-3',
    TABLET_CUSTOM: 'md:grid-cols-2',
    DESKTOP: 'lg:grid-cols-3',
  },
  
  // Flex layouts
  FLEX_DIRECTION: {
    DEFAULT: 'flex-col',
    TABLET: 'md:flex-row',
  },
  
  // Width utilities
  WIDTH: {
    DEFAULT: 'w-full',
    TABLET: 'md:w-auto',
    TABLET_HALF: 'md:w-1/2',
    TABLET_TWO_THIRDS: 'md:w-2/3',
    DESKTOP_HALF: 'lg:w-1/2',
  },
  
  // Padding utilities
  PADDING: {
    DEFAULT: 'p-4',
    TABLET: 'md:p-6',
    DESKTOP: 'lg:p-8',
  },
  
  // Text utilities
  TEXT: {
    DEFAULT: 'text-sm',
    TABLET: 'md:text-base',
    DESKTOP: 'lg:text-lg',
  },
}; 