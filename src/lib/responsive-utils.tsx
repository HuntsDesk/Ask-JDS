import React, { ReactNode } from 'react';
import { useIsTablet, useIsMobile, useIsDesktop } from '@/hooks/useMediaQuery';

interface ResponsiveWrapperProps {
  children: ReactNode;
  mobileStyles?: string;
  tabletStyles?: string;
  desktopStyles?: string;
  className?: string;
}

/**
 * A wrapper component that applies different styles based on screen size
 * Useful for applying tablet-specific styling without modifying existing CSS
 */
export function ResponsiveWrapper({
  children,
  mobileStyles = '',
  tabletStyles = '',
  desktopStyles = '',
  className = '',
}: ResponsiveWrapperProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  let responsiveStyles = className;

  if (isMobile && mobileStyles) {
    responsiveStyles += ' ' + mobileStyles;
  } else if (isTablet && tabletStyles) {
    responsiveStyles += ' ' + tabletStyles;
  } else if (isDesktop && desktopStyles) {
    responsiveStyles += ' ' + desktopStyles;
  }

  return (
    <div className={responsiveStyles}>
      {children}
    </div>
  );
}

/**
 * Higher-order component that applies responsive styles to a component
 * 
 * @param Component The component to wrap
 * @returns A wrapped component with responsive styles
 */
export function withResponsiveStyles<P extends {}>(
  Component: React.ComponentType<P>,
  mobileStyles?: string,
  tabletStyles?: string,
  desktopStyles?: string,
) {
  return function WrappedComponent(props: P) {
    return (
      <ResponsiveWrapper
        mobileStyles={mobileStyles}
        tabletStyles={tabletStyles}
        desktopStyles={desktopStyles}
      >
        <Component {...props} />
      </ResponsiveWrapper>
    );
  };
}

/**
 * Hook that returns Tailwind classes based on the current screen size
 * 
 * @param mobileCls Classes to apply on mobile
 * @param tabletCls Classes to apply on tablet
 * @param desktopCls Classes to apply on desktop
 * @returns Tailwind classes for the current screen size
 */
export function useResponsiveClasses(
  mobileCls: string = '',
  tabletCls: string = '',
  desktopCls: string = '',
): string {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  if (isMobile) return mobileCls;
  if (isTablet) return tabletCls;
  return desktopCls;
}

/**
 * Component that renders different content based on screen size
 */
export function ResponsiveContent({
  mobile,
  tablet,
  desktop,
}: {
  mobile?: ReactNode;
  tablet?: ReactNode;
  desktop?: ReactNode;
}) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  if (isMobile && mobile) return <>{mobile}</>;
  if (isTablet && tablet) return <>{tablet}</>;
  if (desktop) return <>{desktop}</>;
  
  // Fallback: tablet uses desktop and mobile is tablet isn't provided
  if (isTablet && !tablet && desktop) return <>{desktop}</>;
  if (isMobile && !mobile && tablet) return <>{tablet}</>;
  
  return null;
} 