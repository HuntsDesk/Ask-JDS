/**
 * Performance monitoring utilities
 */

import React from 'react';
import { logger } from './logger';

interface PerformanceMetrics {
  operation: string;
  duration: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: PerformanceMetrics[] = [];
  
  /**
   * Start timing an operation
   */
  mark(operation: string): void {
    this.marks.set(operation, performance.now());
  }
  
  /**
   * End timing and log the result
   */
  measure(operation: string, metadata?: Record<string, any>): number | null {
    const startTime = this.marks.get(operation);
    if (!startTime) {
      logger.warn(`No start mark found for operation: ${operation}`);
      return null;
    }
    
    const duration = performance.now() - startTime;
    this.marks.delete(operation);
    
    const metrics: PerformanceMetrics = {
      operation,
      duration,
      metadata
    };
    
    this.measures.push(metrics);
    
    // Log if it's a slow operation
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`, metadata);
    } else {
      logger.performance(operation, duration, metadata);
    }
    
    return duration;
  }
  
  /**
   * Decorator for timing async functions
   */
  static async timeAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const monitor = new PerformanceMonitor();
    monitor.mark(operation);
    
    try {
      const result = await fn();
      monitor.measure(operation, metadata);
      return result;
    } catch (error) {
      monitor.measure(operation, { ...metadata, error: true });
      throw error;
    }
  }
  
  /**
   * Decorator for timing sync functions
   */
  static time<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const monitor = new PerformanceMonitor();
    monitor.mark(operation);
    
    try {
      const result = fn();
      monitor.measure(operation, metadata);
      return result;
    } catch (error) {
      monitor.measure(operation, { ...metadata, error: true });
      throw error;
    }
  }
  
  /**
   * Get all measures (for reporting)
   */
  getMeasures(): PerformanceMetrics[] {
    return [...this.measures];
  }
  
  /**
   * Clear all measures
   */
  clear(): void {
    this.marks.clear();
    this.measures = [];
  }
}

// Export singleton instance for global usage
export const performanceMonitor = new PerformanceMonitor();

// Export static methods for convenience
export const timeAsync = PerformanceMonitor.timeAsync;
export const time = PerformanceMonitor.time;

// React hook for component render timing
export function useRenderTiming(componentName: string) {
  if (!import.meta.env.DEV) return;
  
  const renderCount = React.useRef(0);
  const renderStart = React.useRef(performance.now());
  
  React.useEffect(() => {
    renderCount.current++;
    const renderDuration = performance.now() - renderStart.current;
    
    if (renderDuration > 16) { // More than one frame (60fps)
      logger.performance(`${componentName} render #${renderCount.current}`, renderDuration, {
        component: componentName,
        renderCount: renderCount.current
      });
    }
    
    renderStart.current = performance.now();
  });
}

// Web Vitals integration
export function reportWebVitals(metric: any) {
  const { name, value, id } = metric;
  
  // Log to our logger
  logger.performance(`Web Vital: ${name}`, value, {
    metricId: id,
    metricName: name
  });
  
  // Send to analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, {
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      metric_id: id,
      metric_value: value,
      metric_delta: metric.delta,
    });
  }
} 