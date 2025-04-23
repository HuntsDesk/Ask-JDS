/**
 * Analytics type definitions
 */

interface AnalyticsEventProperties {
  [key: string]: any;
}

interface Analytics {
  track(event: string, properties?: AnalyticsEventProperties): void;
  identify(userId: string, traits?: Record<string, any>): void;
  page(category?: string, name?: string, properties?: Record<string, any>): void;
}

interface Window {
  analytics?: Analytics;
} 