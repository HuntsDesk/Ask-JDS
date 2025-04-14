/**
 * Analytics tracking utilities for Flotiq integration
 */
import { v4 as uuidv4 } from 'uuid';
import { getUserInfo } from './user-info';

type EventCategory = 'purchase' | 'engagement' | 'subscription' | 'system' | 'error' | 'debug' | 'content';
type EventType = 
  'course_view' | 
  'course_purchase' | 
  'course_renewal' | 
  'subscription_start' | 
  'subscription_cancel' | 
  'lesson_complete' | 
  'login' | 
  'failed_payment' | 
  'upgrade' | 
  'purchase_error' | 
  'webhook_test' | 
  'access_check';

interface EventProperties {
  [key: string]: any;
}

// Session ID that persists for current browser session
let sessionId = '';

// Initialize session ID if not already set
const getSessionId = (): string => {
  if (!sessionId) {
    // Try to get from sessionStorage first
    const storedId = sessionStorage.getItem('jds_analytics_session');
    if (storedId) {
      sessionId = storedId;
    } else {
      // Generate a new one
      sessionId = uuidv4();
      sessionStorage.setItem('jds_analytics_session', sessionId);
    }
  }
  return sessionId;
};

/**
 * Track an event in Flotiq analytics
 * 
 * @param eventCategory - The category of the event
 * @param eventType - The specific event type
 * @param properties - Additional properties for the event
 */
export async function trackEvent(
  eventCategory: EventCategory, 
  eventType: EventType, 
  properties: EventProperties = {}
): Promise<void> {
  // Early return if API key isn't available (development environment without key)
  if (!import.meta.env.VITE_FLOTIQ_EVENT_COLLECTION_KEY) {
    console.log('Analytics event not tracked (missing API key):', { eventCategory, eventType, properties });
    return;
  }
  
  try {
    // Get user and browser information
    const { user, browser, device } = await getUserInfo();
    
    // Build the event data
    const eventData = {
      event_category: eventCategory,
      event_type: eventType,
      occurred_at: new Date().toISOString(),
      user_id: user?.id || null,
      anonymous_id: !user?.id ? uuidv4() : null,
      session_id: getSessionId(),
      platform_type: 'web',
      user_browser: browser?.name || null,
      user_os: browser?.os || null,
      user_device_type: device?.type || null,
      user_screen_size: `${window.innerWidth}x${window.innerHeight}`,
      ...properties
    };
    
    // Fire and forget - no need to await this for UX performance
    fetch('https://api.flotiq.com/api/v1/content/jdsanalytics-event', {
      method: 'POST',
      headers: {
        'X-AUTH-TOKEN': import.meta.env.VITE_FLOTIQ_EVENT_COLLECTION_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    }).catch(error => {
      console.error('Analytics error:', error);
    });
  } catch (error) {
    // Fail gracefully - analytics should never break the app
    console.error('Failed to track analytics event:', error);
  }
}

/**
 * Track a course view event
 * 
 * @param courseId - The ID of the course being viewed
 * @param courseTitle - The title of the course
 */
export function trackCourseView(courseId: string, courseTitle: string): void {
  trackEvent('engagement', 'course_view', { 
    course_id: courseId, 
    course_title: courseTitle 
  });
}

/**
 * Track a course purchase event
 * 
 * @param courseId - The ID of the purchased course
 * @param courseTitle - The title of the course
 * @param amount - The purchase amount
 * @param transactionId - The Stripe transaction ID
 */
export function trackCoursePurchase(
  courseId: string, 
  courseTitle: string, 
  amount: number,
  transactionId?: string
): void {
  trackEvent('purchase', 'course_purchase', { 
    course_id: courseId, 
    course_title: courseTitle,
    payment_amount: amount,
    payment_transaction_id: transactionId
  });
}

/**
 * Track a subscription event
 * 
 * @param subscriptionType - The type of subscription
 * @param subscriptionId - The Stripe subscription ID
 * @param amount - The subscription amount
 */
export function trackSubscription(
  subscriptionType: 'askjds' | 'unlimited_monthly' | 'unlimited_annual',
  subscriptionId: string,
  amount: number
): void {
  trackEvent('subscription', 'subscription_start', {
    subscription_plan_type: subscriptionType,
    subscription_id: subscriptionId,
    payment_amount: amount
  });
}

/**
 * Track a debug event (development only)
 * 
 * @param type - The type of debug event
 * @param data - Additional debug data
 */
export function trackDebug(type: string, data: any = {}): void {
  if (import.meta.env.MODE !== 'production') {
    trackEvent('debug', 'webhook_test' as EventType, {
      debug_type: type,
      debug_id: uuidv4(),
      ...data
    });
  }
} 