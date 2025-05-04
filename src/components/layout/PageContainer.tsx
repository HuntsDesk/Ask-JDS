import { PropsWithChildren } from 'react';
import { useLayoutState } from '@/hooks/useLayoutState';
import { cn } from '@/lib/utils';
import { MAX_WIDTH, TRANSITIONS } from '@/constants/layout';

export interface PageContainerProps extends PropsWithChildren {
  /**
   * Disable the default horizontal padding that's applied based on sidebar state.
   * Use this when you need to control padding manually.
   */
  disablePadding?: boolean;
  
  /**
   * Disable the default overflow-auto rule. Use this for components that need
   * to control their own overflow/scrolling behavior (like chat interfaces).
   */
  noOverflow?: boolean;
  
  /**
   * Override the default max-width (1280px) of the container.
   * Use 'narrow', 'default', 'wide', or a custom value.
   */
  maxWidth?: 'narrow' | 'default' | 'wide' | string;
  
  /**
   * Make the container take full height of the parent.
   * Use this for full-height layouts like chat interfaces.
   */
  fullHeight?: boolean;
  
  /**
   * Disable smooth transitions when layout changes.
   */
  noTransitions?: boolean;
  
  /**
   * Add a subtle visual boundary when sidebar is pinned and expanded.
   */
  showBoundary?: boolean;
  
  /**
   * Use flex column layout to prevent sidebar overlap.
   * Recommended for pages that need proper stacking under the sidebar.
   */
  flexColumn?: boolean;
  
  /**
   * Bare mode - removes all layout constraints (maxWidth, padding, flex, overflow).
   * Use for components that need complete layout control like chat interfaces.
   */
  bare?: boolean;
  
  /**
   * Additional CSS classes to apply to the container.
   */
  className?: string;
}

export default function PageContainer({ 
  children, 
  disablePadding = false,
  noOverflow = false,
  maxWidth = 'default',
  fullHeight = true,
  noTransitions = false,
  showBoundary = false,
  flexColumn = false,
  bare = false,
  className 
}: PageContainerProps) {
  const { contentPadding, isPinned, isExpanded } = useLayoutState();

  // Determine the max width based on the provided value
  const maxWidthValue = typeof maxWidth === 'string' && 
    Object.keys(MAX_WIDTH).includes(maxWidth) ? 
    MAX_WIDTH[maxWidth as keyof typeof MAX_WIDTH] : maxWidth;

  // If bare mode is enabled, we don't apply any of our layout classes
  if (bare) {
    return (
      <div className={cn('PageContainer-bare', className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full flex-1',
        flexColumn && 'flex flex-col',
        !disablePadding && contentPadding,
        !noOverflow && 'overflow-auto',
        fullHeight && 'h-full',
        !noTransitions && TRANSITIONS.default,
        showBoundary && isPinned && isExpanded && 'border-l border-slate-200 dark:border-slate-700',
        className
      )}
      style={maxWidth === 'full' ? undefined : { maxWidth: maxWidthValue }}
    >
      {children}
    </div>
  );
} 