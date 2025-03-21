import useMediaQuery from './useMediaQuery';

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