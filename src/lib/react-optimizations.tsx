/**
 * React optimization utilities
 * Provides utilities for component memoization and performance optimization
 */

import React, { memo, useMemo, useCallback } from 'react';
import { logger } from './logger';

/**
 * Custom memo function with debugging in development
 */
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string,
  arePropsEqual?: (prevProps: P, nextProps: P) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  // Set display name for debugging
  const componentName = displayName || Component.displayName || Component.name || 'Component';
  
  // In development, log when components re-render
  if (import.meta.env.DEV) {
    const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
      const isEqual = arePropsEqual ? arePropsEqual(prevProps, nextProps) : undefined;
      
      if (isEqual === false) {
        logger.debug(`${componentName} will re-render`, {
          prevProps,
          nextProps
        });
      }
      
      return isEqual ?? false;
    });
    
    MemoizedComponent.displayName = `Memo(${componentName})`;
    return MemoizedComponent;
  }
  
  // In production, just use React.memo
  const MemoizedComponent = memo(Component, arePropsEqual);
  MemoizedComponent.displayName = `Memo(${componentName})`;
  return MemoizedComponent;
}

/**
 * Hook for memoizing expensive computations with debug logging
 */
export function useDebugMemo<T>(
  factory: () => T,
  deps: React.DependencyList | undefined,
  debugName: string
): T {
  if (import.meta.env.DEV) {
    // Track when the memo is recalculated
    React.useEffect(() => {
      logger.debug(`${debugName} dependencies changed`, { deps });
    }, deps);
  }
  
  return useMemo(factory, deps);
}

/**
 * Hook for memoizing callbacks with debug logging
 */
export function useDebugCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  debugName: string
): T {
  if (import.meta.env.DEV) {
    // Track when the callback is recreated
    React.useEffect(() => {
      logger.debug(`${debugName} callback dependencies changed`, { deps });
    }, deps);
  }
  
  return useCallback(callback, deps);
}

/**
 * Higher-order component for adding performance tracking
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  if (!import.meta.env.DEV) {
    return Component;
  }
  
  return function PerformanceTrackedComponent(props: P) {
    const renderStart = React.useRef(performance.now());
    const renderCount = React.useRef(0);
    
    React.useEffect(() => {
      renderCount.current++;
      const renderDuration = performance.now() - renderStart.current;
      
      if (renderDuration > 16) { // More than one frame
        logger.performance(`${componentName} render #${renderCount.current}`, renderDuration, {
          component: componentName,
          renderCount: renderCount.current
        });
      }
      
      renderStart.current = performance.now();
    });
    
    return <Component {...props} />;
  };
}

/**
 * Props comparison helpers
 */

// Shallow comparison that ignores functions
export function arePropsEqualIgnoreFunctions<T extends Record<string, any>>(
  prevProps: T,
  nextProps: T
): boolean {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  
  for (const key of prevKeys) {
    if (typeof prevProps[key] !== 'function' && prevProps[key] !== nextProps[key]) {
      return false;
    }
  }
  
  return true;
}

// Deep comparison for specific props
export function createSelectivePropsComparison<T extends Record<string, any>>(
  propsToCompare: Array<keyof T>
) {
  return function areSelectedPropsEqual(prevProps: T, nextProps: T): boolean {
    for (const prop of propsToCompare) {
      if (prevProps[prop] !== nextProps[prop]) {
        return false;
      }
    }
    return true;
  };
}

/**
 * List optimization utilities
 */

// Key extractor for lists
export function createStableKeyExtractor<T extends object>(
  getKey: (item: T, index: number) => string | number
) {
  const keyCache = new WeakMap<T, string | number>();
  
  return function stableKeyExtractor(item: T, index: number): string | number {
    if (keyCache.has(item)) {
      return keyCache.get(item)!;
    }
    
    const key = getKey(item, index);
    keyCache.set(item, key);
    return key;
  };
}

/**
 * Virtualization helper for large lists
 */
export interface VirtualizedListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualizedList<T>(
  items: T[],
  options: VirtualizedListOptions
) {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex + 1),
      offsetY: startIndex * itemHeight
    };
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan]);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  const totalHeight = items.length * itemHeight;
  
  return {
    visibleRange,
    handleScroll,
    totalHeight
  };
} 