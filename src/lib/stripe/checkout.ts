/**
 * Utilities for Stripe checkout flows
 */
import { createClient } from '@supabase/supabase-js';
import { trackEvent } from '../analytics/track';

// Create a supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Checkout session interface
interface CheckoutResponse {
  url: string;
  sessionId: string;
}

/**
 * Create a checkout session for a course purchase
 * 
 * @param userId User ID
 * @param courseId Course ID
 * @returns Checkout session URL
 */
export async function createCourseCheckout(
  userId: string, 
  courseId: string
): Promise<CheckoutResponse> {
  if (!userId || !courseId) {
    throw new Error('Missing required parameters');
  }
  
  try {
    // Get authenticated session for the API call
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, price, days_of_access')
      .eq('id', courseId)
      .single();
      
    if (courseError || !course) {
      throw new Error(`Course not found: ${courseError?.message}`);
    }
    
    if (!course.price) {
      throw new Error('Course price not set');
    }
    
    // Call checkout edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        courseId,
        isRenewal: false,
        origin: window.location.origin
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Checkout failed: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Track the checkout initiation
    trackEvent('checkout_initiated', {
      course_id: courseId,
      course_title: course.title,
      payment_amount: course.price,
      checkout_session_id: data.sessionId,
      days_of_access: course.days_of_access
    });
    
    return {
      url: data.url,
      sessionId: data.sessionId
    };
  } catch (error: any) {
    console.error('Error creating course checkout:', error);
    
    // Track checkout error
    trackEvent('checkout_failed', {
      error_message: error.message,
      course_id: courseId,
      user_id: userId
    });
    
    throw error;
  }
}

/**
 * Create a checkout session for course renewal
 * 
 * @param userId User ID
 * @param courseId Course ID
 * @returns Checkout session URL
 */
export async function createCourseRenewalCheckout(
  userId: string,
  courseId: string
): Promise<CheckoutResponse> {
  if (!userId || !courseId) {
    throw new Error('Missing required parameters');
  }
  
  try {
    // Get authenticated session for the API call
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, price, days_of_access')
      .eq('id', courseId)
      .single();
      
    if (courseError || !course) {
      throw new Error(`Course not found: ${courseError?.message}`);
    }
    
    if (!course.price) {
      throw new Error('Course price not set');
    }
    
    // Call checkout edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        courseId,
        isRenewal: true,
        origin: window.location.origin
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Renewal checkout failed: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Track the renewal initiation
    trackEvent('checkout_initiated', {
      course_id: courseId,
      course_title: course.title,
      payment_amount: course.price,
      checkout_session_id: data.sessionId,
      days_of_access: course.days_of_access,
      is_renewal: true
    });
    
    return {
      url: data.url,
      sessionId: data.sessionId
    };
  } catch (error: any) {
    console.error('Error creating course renewal checkout:', error);
    
    // Track renewal error
    trackEvent('checkout_failed', {
      error_message: error.message,
      course_id: courseId,
      user_id: userId,
      is_renewal: true
    });
    
    throw error;
  }
}

/**
 * Create a checkout session for unlimited subscription
 * 
 * @param userId User ID
 * @param interval Subscription interval (month/year)
 * @returns Checkout session URL
 */
export async function createUnlimitedSubscriptionCheckout(
  userId: string,
  interval: 'month' | 'year'
): Promise<CheckoutResponse> {
  if (!userId) {
    throw new Error('Missing required parameters');
  }
  
  try {
    // Get authenticated session for the API call
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }
    
    // Call checkout edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        subscriptionType: 'unlimited',
        interval,
        origin: window.location.origin
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Subscription checkout failed: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Get current tier for tracking
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('price_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
      
    const isUpgrade = userData?.price_id === 'price_askjds_monthly';
    
    // Track the subscription initiation
    trackEvent('checkout_initiated', {
      subscription_plan_type: `unlimited_${interval}`,
      checkout_session_id: data.sessionId,
      is_upgrade: isUpgrade
    });
    
    return {
      url: data.url,
      sessionId: data.sessionId
    };
  } catch (error: any) {
    console.error('Error creating unlimited subscription checkout:', error);
    
    // Track subscription error
    trackEvent('checkout_failed', {
      error_message: error.message,
      user_id: userId,
      subscription_type: 'unlimited',
      interval
    });
    
    throw error;
  }
} 