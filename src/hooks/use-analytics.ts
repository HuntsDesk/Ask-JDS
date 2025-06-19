import { useUsermaven, usePageView } from '@usermaven/react';
import { useUsermavenContext } from '@/contexts/UsermavenContext';
import { useAuth } from '@/lib/auth';
import { useEffect, useCallback } from 'react';

/**
 * Custom hook that provides analytics tracking capabilities
 * Combines Usermaven's hooks with user authentication data
 * 
 * @returns Analytics tracking methods
 */
export const useAnalytics = () => {
  const { initialized } = useUsermavenContext();
  const { user } = useAuth();
  const usermaven = useUsermaven();
  
  // Set up automatic page view tracking
  usePageView({
    before: (um) => {
      // Before tracking a page view, try to identify the user if they're logged in
      if (user?.id && user?.email) {
        identifyUser(um, user);
      }
    }
  });
  
  // Identify user when they log in
  useEffect(() => {
    if (!initialized || !user?.id || !user?.email) return;
    identifyUser(usermaven, user);
  }, [initialized, user?.id, user?.email, usermaven]);
  
  /**
   * Helper function to identify a user with consistent properties
   */
  const identifyUser = (client: any, userData: any) => {
    try {
      client.id({
        id: userData.id,
        email: userData.email,
        created_at: userData.created_at || new Date().toISOString(),
        first_name: userData.user_metadata?.first_name,
        last_name: userData.user_metadata?.last_name,
        custom: {
          subscription_plan: userData.subscription_tier || 'free',
          subscription_status: userData.subscription_status || 'inactive',
          last_login: new Date().toISOString(),
          has_completed_profile: Boolean(userData.user_metadata?.first_name),
          courses_enrolled: userData.enrolled_courses?.length || 0
        }
      });
    } catch (error) {
      console.error('Failed to identify user with Usermaven:', error);
    }
  };
  
  /**
   * Track a custom event
   * 
   * @param eventName - Name of the event to track
   * @param properties - Additional properties to include with the event
   */
  const trackEvent = useCallback((eventName: string, properties: Record<string, any> = {}) => {
    if (!initialized) return;
    
    // Add common properties to all events
    const enhancedProperties = {
      page_path: window.location.pathname,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      ...properties
    };
    
    usermaven.track(eventName, enhancedProperties);
  }, [initialized, usermaven]);
  
  /**
   * Track a conversion event (e.g., sign up, purchase, etc.)
   * 
   * @param conversionType - Type of conversion
   * @param properties - Additional properties about the conversion
   */
  const trackConversion = useCallback((
    conversionType: 'signed_up' | 'purchase_complete' | 'subscription_started' | 'course_enrollment' | string, 
    properties: Record<string, any> = {}
  ) => {
    if (!initialized) return;
    
    usermaven.track('conversion', {
      conversion_type: conversionType,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [initialized, usermaven]);
  
  /**
   * Track authentication events
   */
  const trackAuth = {
    signUp: (method: string = 'email', properties: Record<string, any> = {}) => {
      trackEvent('signed_up', { auth_method: method, ...properties });
      trackConversion('signed_up', { auth_method: method, ...properties });
    },
    
    logIn: (method: string = 'email', properties: Record<string, any> = {}) => {
      trackEvent('logged_in', { auth_method: method, ...properties });
    },
    
    logOut: (properties: Record<string, any> = {}) => {
      trackEvent('logged_out', properties);
    }
  };
  
  /**
   * Track chat interactions
   */
  const trackChat = {
    threadCreated: (threadId: string, title: string, properties: Record<string, any> = {}) => {
      trackEvent('chat_thread_created', { thread_id: threadId, thread_title: title, ...properties });
    },
    
    messageSent: (threadId: string, messageId: string, properties: Record<string, any> = {}) => {
      trackEvent('chat_message_sent', { thread_id: threadId, message_id: messageId, ...properties });
    },
    
    responseReceived: (threadId: string, messageId: string, properties: Record<string, any> = {}) => {
      trackEvent('chat_response_received', { thread_id: threadId, message_id: messageId, ...properties });
    }
  };
  
  /**
   * Track course interactions
   */
  const trackCourse = {
    viewed: (courseId: string, courseName: string, properties: Record<string, any> = {}) => {
      trackEvent('view_course', { course_id: courseId, course_name: courseName, ...properties });
    },
    
    lessonCompleted: (courseId: string, lessonId: string, properties: Record<string, any> = {}) => {
      trackEvent('lesson_completed', { course_id: courseId, lesson_id: lessonId, ...properties });
    },
    
    enrolled: (courseId: string, courseName: string, properties: Record<string, any> = {}) => {
      trackEvent('course_enrolled', { course_id: courseId, course_name: courseName, ...properties });
      trackConversion('course_enrollment', { course_id: courseId, course_name: courseName, ...properties });
    }
  };
  
  /**
   * Track subscription events
   */
  const trackSubscription = {
    checkoutStarted: (plan: string, interval: string, price: number, properties: Record<string, any> = {}) => {
      trackEvent('initiate_checkout', { plan, interval, price, currency: 'USD', ...properties });
    },
    
    purchased: (orderId: string, plan: string, interval: string, price: number, properties: Record<string, any> = {}) => {
      trackEvent('purchase_complete', { order_id: orderId, plan, interval, price, currency: 'USD', ...properties });
      trackConversion('subscription_started', { order_id: orderId, plan, interval, price, currency: 'USD', ...properties });
    },
    
    cancelled: (plan: string, reason: string, properties: Record<string, any> = {}) => {
      trackEvent('subscription_canceled', { plan, cancellation_reason: reason, ...properties });
    }
  };
  
  /**
   * Track flashcard interactions
   */
  const trackFlashcards = {
    created: (deckId: string, deckName: string, properties: Record<string, any> = {}) => {
      trackEvent('flashcard_created', { deck_id: deckId, deck_name: deckName, ...properties });
    },
    
    studied: (deckId: string, deckName: string, cardCount: number, properties: Record<string, any> = {}) => {
      trackEvent('flashcard_studied', { deck_id: deckId, deck_name: deckName, card_count: cardCount, ...properties });
    }
  };
  
  /**
   * Track search and navigation
   */
  const trackSearch = {
    performed: (query: string, resultsCount: number, properties: Record<string, any> = {}) => {
      trackEvent('search', { search_term: query, results_count: resultsCount, ...properties });
    },
    
    filterApplied: (filterType: string, filterValue: string, properties: Record<string, any> = {}) => {
      trackEvent('filter_applied', { filter_type: filterType, filter_value: filterValue, ...properties });
    }
  };
  
  return {
    initialized,
    trackEvent,
    trackConversion,
    trackPageView: usermaven.trackPageView,
    identify: usermaven.id,
    trackAuth,
    trackChat,
    trackCourse,
    trackSubscription,
    trackFlashcards,
    trackSearch
  };
}; 