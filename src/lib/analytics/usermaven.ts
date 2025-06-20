import { logger } from '@/lib/logger';
/**
 * Usermaven analytics integration
 * This file provides utilities for tracking events and user identification with Usermaven
 */
import { createClient } from '@usermaven/react';

// Define a type for the Usermaven client based on what the createClient function returns
type UsermavenClient = ReturnType<typeof createClient>;

/**
 * Initialize the Usermaven client
 * 
 * @returns Usermaven client configuration object
 */
export const getUsermavenConfig = () => {
  return {
    key: import.meta.env.VITE_USERMAVEN_KEY,
    trackingHost: import.meta.env.VITE_USERMAVEN_TRACKING_HOST || 'https://events.usermaven.com',
    
    // Optional configuration
    autocapture: true,       // Enable automatic event capturing
    autoPageview: true,      // Automatically track page views
    randomizeUrl: true,      // Randomize URLs to avoid PII collection
    
    // Cross-domain Tracking (Optional)
    crossDomainLinking: true,  // Enable cross-domain tracking
    domains: 'jdsimplified.com,askjds.com,admin.jdsimplified.com',  // Specify allowed domains (match Usermaven dashboard)
  };
};

/**
 * Track a custom event
 * 
 * @param client - Usermaven client instance
 * @param eventName - Name of the event to track
 * @param properties - Optional properties to include with the event
 */
export const trackEvent = (client: UsermavenClient, eventName: string, properties: Record<string, any> = {}) => {
  try {
    client.track(eventName, properties);
  } catch (error) {
    logger.error('Failed to track event with Usermaven:', error);
  }
};

/**
 * Identify a user
 * 
 * @param client - Usermaven client instance
 * @param userId - Unique identifier for the user
 * @param email - User's email address
 * @param properties - Additional user properties
 */
export const identifyUser = (
  client: UsermavenClient, 
  userId: string, 
  email: string, 
  properties: Record<string, any> = {}
) => {
  try {
    client.id({
      id: userId,
      email: email,
      created_at: properties.created_at || new Date().toISOString(),
      first_name: properties.first_name,
      last_name: properties.last_name,
      custom: {
        subscription_plan: properties.subscription_plan || 'free',
        ...properties.custom
      }
    });
  } catch (error) {
    logger.error('Failed to identify user with Usermaven:', error);
  }
};

/**
 * Track a page view
 * 
 * @param client - Usermaven client instance
 * @param path - Optional page path
 */
export const trackPageView = (client: UsermavenClient, path?: string) => {
  try {
    if (path) {
      client.track('pageview', { path });
    } else {
      client.track('pageview');
    }
  } catch (error) {
    logger.error('Failed to track page view with Usermaven:', error);
  }
}; 