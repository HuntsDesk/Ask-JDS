import { useUsermaven, usePageView } from '@usermaven/react';
import { useUsermavenContext } from '@/contexts/UsermavenContext';
import { useAuth } from '@/lib/auth';
import { useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Custom hook that provides analytics tracking capabilities
 * Combines Usermaven's hooks with user authentication data
 * 
 * @returns Analytics tracking methods
 */
export const useAnalytics = () => {
  const { initialized } = useUsermavenContext();
  const { user } = useAuth();
  const identifyCallMadeRef = useRef(false);
  
  // Create stable refs for usermaven client to prevent excessive re-renders
  const usermavenRef = useRef<any>(null);
  const initializedRef = useRef(initialized);
  initializedRef.current = initialized;
  
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [ANALYTICS DEBUG] Hook called with initialized:', initialized);
  }
  
  // Call hooks unconditionally (required by React rules)
  let usermaven: any = null;
  let pageViewError: any = null;
  
  try {
    // Always call the hooks - React requires this
    usermaven = useUsermaven();
    
    // Update the ref to keep the most recent client
    usermavenRef.current = usermaven;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [ANALYTICS DEBUG] usermaven client:', usermaven ? 'available' : 'null');
    }
    
    // Set up automatic page view tracking
    usePageView({
      before: (um) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [ANALYTICS DEBUG] usePageView before callback called');
        }
        // Before tracking a page view, try to identify the user if they're logged in
        if (user?.id && user?.email && !identifyCallMadeRef.current) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [ANALYTICS DEBUG] Identifying user before page view');
          }
          identifyUser(um, user);
          identifyCallMadeRef.current = true;
        }
      }
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [ANALYTICS DEBUG] usePageView hook set up successfully');
    }
  } catch (error) {
    console.error('🔍 [ANALYTICS DEBUG] Error setting up Usermaven hooks:', error);
    pageViewError = error;
  }
  
  // If not initialized, make the functions no-ops
  if (!initialized) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [ANALYTICS DEBUG] Analytics not initialized, returning no-op functions');
    }
    usermavenRef.current = null;
  }
  
  // Identify user when they log in (memoized to prevent excessive calls)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [ANALYTICS DEBUG] useEffect triggered with:', {
        initialized,
        hasUsermaven: !!usermaven,
        hasUser: !!user?.id,
        userEmail: user?.email,
        identifyCallMade: identifyCallMadeRef.current
      });
    }
    
    if (!initialized || !usermaven || !user?.id || !user?.email || identifyCallMadeRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [ANALYTICS DEBUG] Skipping user identification - missing requirements or already called');
      }
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [ANALYTICS DEBUG] Identifying user and sending test event');
    }
    identifyUser(usermaven, user);
    identifyCallMadeRef.current = true;
    
    // Send a test event to verify analytics is working (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Sending test analytics event...');
      try {
        usermaven.track('analytics_test', {
          timestamp: new Date().toISOString(),
          page: window.location.pathname,
          test: true
        });
        console.log('✅ [ANALYTICS DEBUG] Test event sent successfully');
      } catch (error) {
        console.error('❌ [ANALYTICS DEBUG] Failed to send test event:', error);
      }
    }
  }, [initialized, user?.id, user?.email]); // Removed usermaven from deps to prevent infinite loops
  
  // Reset identify call flag when user changes
  useEffect(() => {
    identifyCallMadeRef.current = false;
  }, [user?.id]);
  
  /**
   * Helper function to identify a user with consistent properties
   */
  const identifyUser = useCallback((client: any, userData: any) => {
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
  }, []);
  
  /**
   * Track a custom event
   * 
   * @param eventName - Name of the event to track
   * @param properties - Additional properties to include with the event
   */
  const trackEvent = useCallback((eventName: string, properties: Record<string, any> = {}) => {
    if (!initializedRef.current || !usermavenRef.current) return;
    
    // Add common properties to all events
    const enhancedProperties = {
      page_path: window.location.pathname,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      ...properties
    };
    
    usermavenRef.current.track(eventName, enhancedProperties);
  }, []); // Empty dependency array since we use refs
  
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
    if (!initializedRef.current || !usermavenRef.current) return;
    
    usermavenRef.current.track('conversion', {
      conversion_type: conversionType,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, []); // Empty dependency array since we use refs
  
  /**
   * Track authentication events
   */
  const trackAuth = useMemo(() => ({
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
  }), [trackEvent, trackConversion]);
  
  /**
   * Track chat interactions
   */
  const trackChat = useMemo(() => ({
    threadCreated: (threadId: string, title: string, properties: Record<string, any> = {}) => {
      trackEvent('chat_thread_created', { thread_id: threadId, thread_title: title, ...properties });
    },
    
    messageSent: (threadId: string, messageId: string, properties: Record<string, any> = {}) => {
      trackEvent('chat_message_sent', { thread_id: threadId, message_id: messageId, ...properties });
    },
    
    responseReceived: (threadId: string, messageId: string, properties: Record<string, any> = {}) => {
      trackEvent('chat_response_received', { thread_id: threadId, message_id: messageId, ...properties });
    }
  }), [trackEvent]);
  
  /**
   * Track course interactions
   */
  const trackCourse = useMemo(() => ({
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
  }), [trackEvent, trackConversion]);
  
  /**
   * Track subscription events
   */
  const trackSubscription = useMemo(() => ({
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
  }), [trackEvent, trackConversion]);
  
  /**
   * Track flashcard interactions
   */
  const trackFlashcards = useMemo(() => ({
    created: (deckId: string, deckName: string, properties: Record<string, any> = {}) => {
      trackEvent('flashcard_created', { deck_id: deckId, deck_name: deckName, ...properties });
    },
    
    studied: (deckId: string, deckName: string, cardCount: number, properties: Record<string, any> = {}) => {
      trackEvent('flashcard_studied', { deck_id: deckId, deck_name: deckName, card_count: cardCount, ...properties });
    }
  }), [trackEvent]);
  
  /**
   * Track search and navigation
   */
  const trackSearch = useMemo(() => ({
    performed: (query: string, resultsCount: number, properties: Record<string, any> = {}) => {
      trackEvent('search', { search_term: query, results_count: resultsCount, ...properties });
    },
    
    filterApplied: (filterType: string, filterValue: string, properties: Record<string, any> = {}) => {
      trackEvent('filter_applied', { filter_type: filterType, filter_value: filterValue, ...properties });
    }
  }), [trackEvent]);
  
  return useMemo(() => ({
    initialized,
    trackEvent,
    trackConversion,
    trackPageView: usermavenRef.current?.trackPageView || (() => {}),
    identify: usermavenRef.current?.id || (() => {}),
    trackAuth,
    trackChat,
    trackCourse,
    trackSubscription,
    trackFlashcards,
    trackSearch
  }), [initialized, trackEvent, trackConversion, trackAuth, trackChat, trackCourse, trackSubscription, trackFlashcards, trackSearch]);
}; 