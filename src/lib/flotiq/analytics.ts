import { v4 as uuidv4 } from 'uuid';

// Environment variables
const FLOTIQ_API_URL = import.meta.env.VITE_FLOTIQ_API_URL || 'https://api.flotiq.com';
const FLOTIQ_API_KEY = import.meta.env.VITE_FLOTIQ_API_KEY;
const FLOTIQ_ADMIN_DASHBOARD_KEY = import.meta.env.VITE_FLOTIQ_ADMIN_DASHBOARD_KEY;

// Event types
export enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  COURSE_VIEW = 'course_view',
  LESSON_VIEW = 'lesson_view',
  COURSE_ENROLLMENT = 'course_enrollment',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  CHECKOUT_INITIATED = 'checkout_initiated',
  CHECKOUT_COMPLETED = 'checkout_completed',
  CHECKOUT_FAILED = 'checkout_failed',
}

// Event properties interface
export interface AnalyticsEventProperties {
  [key: string]: any;
}

// Analytics event interface
export interface AnalyticsEvent {
  id: string;
  event_type: string;
  user_id?: string;
  properties: AnalyticsEventProperties;
  session_id?: string;
  created_at: string;
}

// Get session ID from local storage or create a new one
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('jds_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('jds_session_id', sessionId);
  }
  return sessionId;
};

// Track an event
export const trackEvent = async (
  eventType: AnalyticsEventType | string,
  userId?: string,
  properties: AnalyticsEventProperties = {}
): Promise<boolean> => {
  try {
    // Create the event object
    const event: AnalyticsEvent = {
      id: uuidv4(),
      event_type: eventType,
      user_id: userId,
      properties,
      session_id: getSessionId(),
      created_at: new Date().toISOString(),
    };

    // First, store the event in Supabase
    await storeEventInDatabase(event);

    // Then send to Flotiq if API key is available
    if (FLOTIQ_API_KEY) {
      await sendEventToFlotiq(event);
    }

    return true;
  } catch (error) {
    console.error('Error tracking event:', error);
    return false;
  }
};

// Store event in Supabase
const storeEventInDatabase = async (event: AnalyticsEvent): Promise<void> => {
  try {
    const { id, event_type, user_id, properties, session_id, created_at } = event;
    
    // Call Supabase function to store event
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        event_type,
        user_id,
        properties,
        session_id,
        created_at,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to store event: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error storing event in database:', error);
  }
};

// Send event to Flotiq
const sendEventToFlotiq = async (event: AnalyticsEvent): Promise<void> => {
  try {
    const response = await fetch(`${FLOTIQ_API_URL}/api/v1/content/analytics_event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-TOKEN': FLOTIQ_API_KEY,
      },
      body: JSON.stringify({
        id: event.id,
        event_type: event.event_type,
        user_id: event.user_id || null,
        properties: event.properties,
        session_id: event.session_id,
        created_at: event.created_at,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send event to Flotiq: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending event to Flotiq:', error);
  }
};

// Get analytics data for admin dashboard
export const getAnalyticsData = async (
  startDate: string,
  endDate: string,
  eventTypes?: string[]
): Promise<any> => {
  try {
    // Only allow this function to be called with admin key
    if (!FLOTIQ_ADMIN_DASHBOARD_KEY) {
      throw new Error('Admin dashboard key not available');
    }

    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    
    if (eventTypes && eventTypes.length > 0) {
      eventTypes.forEach(type => params.append('eventTypes', type));
    }

    const response = await fetch(
      `${FLOTIQ_API_URL}/api/v1/content/analytics_event/summary?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-AUTH-TOKEN': FLOTIQ_ADMIN_DASHBOARD_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get analytics data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting analytics data:', error);
    throw error;
  }
};

// Track page view
export const trackPageView = (
  pathname: string, 
  userId?: string,
  additionalProperties: AnalyticsEventProperties = {}
): Promise<boolean> => {
  return trackEvent(
    AnalyticsEventType.PAGE_VIEW,
    userId,
    {
      pathname,
      title: document.title,
      referrer: document.referrer,
      ...additionalProperties,
    }
  );
};

// Track course view
export const trackCourseView = (
  courseId: string,
  courseName: string,
  userId?: string,
  additionalProperties: AnalyticsEventProperties = {}
): Promise<boolean> => {
  return trackEvent(
    AnalyticsEventType.COURSE_VIEW,
    userId,
    {
      course_id: courseId,
      course_name: courseName,
      ...additionalProperties,
    }
  );
};

// Track lesson view
export const trackLessonView = (
  lessonId: string,
  lessonName: string,
  courseId: string,
  userId?: string,
  additionalProperties: AnalyticsEventProperties = {}
): Promise<boolean> => {
  return trackEvent(
    AnalyticsEventType.LESSON_VIEW,
    userId,
    {
      lesson_id: lessonId,
      lesson_name: lessonName,
      course_id: courseId,
      ...additionalProperties,
    }
  );
};

// Track course enrollment
export const trackCourseEnrollment = (
  courseId: string,
  courseName: string,
  source: string,
  price?: number,
  userId?: string,
  additionalProperties: AnalyticsEventProperties = {}
): Promise<boolean> => {
  return trackEvent(
    AnalyticsEventType.COURSE_ENROLLMENT,
    userId,
    {
      course_id: courseId,
      course_name: courseName,
      source,
      price,
      ...additionalProperties,
    }
  );
};

// Track subscription events
export const trackSubscriptionCreated = (
  subscriptionId: string,
  tier: string,
  price: number,
  userId?: string,
  additionalProperties: AnalyticsEventProperties = {}
): Promise<boolean> => {
  return trackEvent(
    AnalyticsEventType.SUBSCRIPTION_CREATED,
    userId,
    {
      subscription_id: subscriptionId,
      tier,
      price,
      ...additionalProperties,
    }
  );
};

export const trackSubscriptionUpdated = (
  subscriptionId: string,
  status: string,
  tier: string,
  userId?: string,
  additionalProperties: AnalyticsEventProperties = {}
): Promise<boolean> => {
  return trackEvent(
    AnalyticsEventType.SUBSCRIPTION_UPDATED,
    userId,
    {
      subscription_id: subscriptionId,
      status,
      tier,
      ...additionalProperties,
    }
  );
};

export const trackSubscriptionCancelled = (
  subscriptionId: string,
  reason?: string,
  userId?: string,
  additionalProperties: AnalyticsEventProperties = {}
): Promise<boolean> => {
  return trackEvent(
    AnalyticsEventType.SUBSCRIPTION_CANCELLED,
    userId,
    {
      subscription_id: subscriptionId,
      reason,
      ...additionalProperties,
    }
  );
};

// Track checkout events
export const trackCheckoutInitiated = (
  checkoutType: 'course' | 'subscription',
  itemId: string,
  price: number,
  userId?: string,
  additionalProperties: AnalyticsEventProperties = {}
): Promise<boolean> => {
  return trackEvent(
    AnalyticsEventType.CHECKOUT_INITIATED,
    userId,
    {
      checkout_type: checkoutType,
      item_id: itemId,
      price,
      ...additionalProperties,
    }
  );
};

export const trackCheckoutCompleted = (
  checkoutType: 'course' | 'subscription',
  itemId: string,
  transactionId: string,
  price: number,
  userId?: string,
  additionalProperties: AnalyticsEventProperties = {}
): Promise<boolean> => {
  return trackEvent(
    AnalyticsEventType.CHECKOUT_COMPLETED,
    userId,
    {
      checkout_type: checkoutType,
      item_id: itemId,
      transaction_id: transactionId,
      price,
      ...additionalProperties,
    }
  );
};

export const trackCheckoutFailed = (
  checkoutType: 'course' | 'subscription',
  itemId: string,
  errorMessage: string,
  price: number,
  userId?: string,
  additionalProperties: AnalyticsEventProperties = {}
): Promise<boolean> => {
  return trackEvent(
    AnalyticsEventType.CHECKOUT_FAILED,
    userId,
    {
      checkout_type: checkoutType,
      item_id: itemId,
      error_message: errorMessage,
      price,
      ...additionalProperties,
    }
  );
}; 