/**
 * Utilities for Stripe checkout flows
 */
import { trackEvent } from '../analytics/track';
import { supabase } from '../supabase';
import { toast } from '@/hooks/use-toast';

// Checkout session interface with standardized response format
interface CheckoutResponse {
  url: string;
  sessionId: string;
}

interface CheckoutError {
  message: string;
  code?: string;
}

/**
 * Validate a Stripe checkout URL
 * @param url URL to validate
 * @returns boolean indicating if URL is valid
 */
function isValidStripeUrl(url: string): boolean {
  return url.startsWith('https://checkout.stripe.com');
}

/**
 * Handle errors from checkout API calls
 * @param error Error object from API call
 * @param context Context for error tracking
 * @returns Structured error object
 */
function handleCheckoutError(error: any, context: Record<string, any>): CheckoutError {
  console.error(`Error in ${context.action}:`, error);
  
  // Track the checkout error
  trackEvent('checkout_failed', {
    error_message: error.message || 'Unknown error',
    error_code: error.code,
    ...context
  });
  
  // Show toast notification
  toast({
    title: 'Checkout Error',
    description: error.message || 'Failed to create checkout session',
    variant: 'destructive'
  });
  
  return {
    message: error.message || 'Unknown error',
    code: error.code
  };
}

/**
 * Create a checkout session for course purchase
 * 
 * @param courseId Course ID
 * @returns Checkout session response with URL and ID
 */
export async function createCourseCheckout(
  courseId: string
): Promise<CheckoutResponse> {
  console.log(`Starting checkout process for course ${courseId}`);
  
  if (!courseId) {
    const error = new Error('Missing required parameter: courseId');
    throw handleCheckoutError(error, { action: 'createCourseCheckout', course_id: courseId });
  }
  
  try {
    // Get authenticated session for API call
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error('Authentication required');
    }
    
    // Get course details for tracking
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, price, days_of_access')
      .eq('id', courseId)
      .single();
      
    if (courseError || !course) {
      throw new Error(`Course not found: ${courseError?.message || 'Unknown error'}`);
    }
    
    if (!course.price && course.price !== 0) {
      throw new Error('Course price not set');
    }
    
    // Determine environment
    const isProduction = import.meta.env.PROD;
    
    console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);
    
    // Log the supabase URL 
    console.log('Using Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    
    // Call checkout edge function
    console.log('Calling checkout edge function with payload:', {
      courseId,
      isRenewal: false,
      origin: window.location.origin
    });

    const edgeFunctionURL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;
    console.log('Edge Function URL:', edgeFunctionURL);
    console.log('Auth token for request:', session.access_token.substring(0, 15) + '...');

    try {
      const response = await fetch(edgeFunctionURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          courseId,
          mode: 'payment',
          isRenewal: false,
          successUrl: `${window.location.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/courses/${courseId}`,
          metadata: {
            source: 'client'
          }
        }),
      });
      
      // Log the response status
      console.log('Checkout response status:', response.status);
      console.log('Checkout response status text:', response.statusText);
      
      if (!response.ok) {
        let errorMessage = response.statusText;
        let errorData = null;
        try {
          errorData = await response.json();
          console.error('Error response body:', errorData);
          errorMessage = errorData.error || errorMessage;
          
          throw {
            message: errorMessage,
            code: errorData.errorCode,
            status: response.status
          };
        } catch (e) {
          console.error('Could not parse error response as JSON:', e);
          throw new Error(`Checkout failed: ${errorMessage}`);
        }
      }
      
      const data = await response.json();
      console.log('Checkout successful, parsed response:', data);
      
      if (data.status === 'error') {
        throw {
          message: data.error || 'Unknown error',
          code: data.errorCode,
          status: response.status
        };
      }
      
      // Make sure we have a URL before continuing
      if (!data.url) {
        console.error('Checkout successful but missing URL in response:', data);
        throw new Error('Checkout response missing URL');
      }
      
      // Verify the URL is from Stripe
      if (!isValidStripeUrl(data.url)) {
        console.error('Non-Stripe URL returned:', data.url);
        throw new Error('Invalid checkout URL returned');
      }
      
      console.log('Redirecting to URL from response:', data.url?.substring(0, 50) + '...');
      
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
    } catch (fetchError) {
      console.error('Fetch error in createCourseCheckout:', fetchError);
      throw fetchError;
    }
  } catch (error: any) {
    return Promise.reject(handleCheckoutError(error, { 
      action: 'createCourseCheckout', 
      course_id: courseId 
    }));
  }
}

/**
 * Create a checkout session for course renewal
 * 
 * @param courseId Course ID
 * @returns Checkout session URL
 */
export async function createCourseRenewalCheckout(
  courseId: string
): Promise<CheckoutResponse> {
  if (!courseId) {
    const error = new Error('Missing required parameter: courseId');
    throw handleCheckoutError(error, { action: 'createCourseRenewalCheckout', course_id: courseId });
  }
  
  try {
    // Get authenticated session for the API call
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
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
        mode: 'payment',
        isRenewal: true,
        successUrl: `${window.location.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/courses/${courseId}`,
        metadata: {
          source: 'client'
        }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw {
        message: errorData.error || response.statusText,
        code: errorData.errorCode,
        status: response.status
      };
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw {
        message: data.error || 'Unknown error',
        code: data.errorCode
      };
    }
    
    if (!data.url || !isValidStripeUrl(data.url)) {
      throw new Error('Invalid checkout URL returned');
    }
    
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
    return Promise.reject(handleCheckoutError(error, { 
      action: 'createCourseRenewalCheckout', 
      course_id: courseId,
      is_renewal: true
    }));
  }
}

/**
 * Create an unlimited subscription checkout
 * 
 * @param interval Billing interval (month/year)
 * @returns Checkout response
 */
export async function createUnlimitedSubscriptionCheckout(
  interval: 'month' | 'year'
): Promise<CheckoutResponse> {
  try {
    if (!interval || !['month', 'year'].includes(interval)) {
      throw new Error(`Invalid interval: ${interval}`);
    }
    
    // Get authenticated session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error('Authentication required');
    }
    
    // Check if user already has an active subscription
    const { data: existingSubscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('id, tier, status')
      .eq('status', 'active')
      .maybeSingle();
      
    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', subscriptionError);
    }
    
    const isUpgrade = existingSubscription?.tier === 'askjds';
    
    // Call checkout API
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        subscriptionTier: 'unlimited',
        interval,
        mode: 'subscription',
        successUrl: `${window.location.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/subscribe`,
        metadata: {
          isUpgrade: isUpgrade ? 'true' : 'false',
          previousTier: isUpgrade ? 'askjds' : '',
          source: 'client'
        }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw {
        message: errorData.error || response.statusText,
        code: errorData.errorCode,
        status: response.status
      };
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw {
        message: data.error || 'Unknown error',
        code: data.errorCode
      };
    }
    
    if (!data.url || !isValidStripeUrl(data.url)) {
      throw new Error('Invalid checkout URL returned');
    }
    
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
    return Promise.reject(handleCheckoutError(error, { 
      action: 'createUnlimitedSubscriptionCheckout',
      subscription_type: 'unlimited',
      interval
    }));
  }
}

/**
 * Create a standard subscription checkout
 * @param params Subscription parameters
 * @returns Checkout response or error
 */
export async function createSubscriptionCheckout({
  tier,
  interval
}: {
  tier: 'premium' | 'unlimited';
  interval: 'monthly' | 'yearly';
}) {
  console.log('Starting subscription checkout process', { tier, interval });
  
  try {
    if (!tier || !['premium', 'unlimited'].includes(tier)) {
      throw new Error(`Invalid tier: ${tier}`);
    }
    
    if (!interval || !['monthly', 'yearly'].includes(interval)) {
      throw new Error(`Invalid interval: ${interval}`);
    }
    
    // Convert interval for API
    const apiInterval = interval === 'monthly' ? 'month' : 'year';
    
    // Check user auth
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    if (!session) {
      throw new Error('Authentication required');
    }
    
    // Get supabase URL from env
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Missing supabase URL configuration');
    }

    // Call the Edge Function to create a checkout
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        subscriptionTier: tier,
        interval: apiInterval,
        mode: 'subscription',
        successUrl: `${window.location.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/subscribe`,
        metadata: {
          source: 'client'
        }
      }),
    });

    const data = await response.json();
    console.log('Subscription checkout response:', data);

    if (data.status === 'error') {
      console.error('Error creating subscription checkout:', data.error);
      
      // Track checkout error
      trackEvent('checkout_failed', {
        error_message: data.error,
        error_code: data.errorCode,
        subscription_type: tier,
        interval
      });
      
      return { error: data.error, url: null };
    }
    
    // Track successful checkout creation
    trackEvent('checkout_initiated', {
      subscription_plan_type: `${tier}_${interval}`,
      checkout_session_id: data.sessionId
    });

    return { error: null, url: data.url };
  } catch (error: any) {
    console.error('Exception in subscription checkout:', error);
    
    // Track checkout error
    trackEvent('checkout_failed', {
      error_message: error.message,
      error_code: error.code,
      subscription_type: tier,
      interval
    });
    
    return { error: 'Failed to create checkout session', url: null };
  }
}

/**
 * Prepare an embedded checkout using Payment Element
 * 
 * @param courseId Course ID for payment
 * @param isRenewal Whether this is a renewal
 * @returns Promise with the clientSecret for Payment Element
 */
export async function prepareEmbeddedCheckout({
  courseId,
  isRenewal = false
}: {
  courseId: string;
  isRenewal?: boolean;
}): Promise<{ clientSecret: string; amount: number; productName: string }> {
  console.log(`Preparing embedded checkout for course ${courseId}`);
  
  try {
    // Get authenticated session for API call
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error('Authentication required');
    }
    
    // Call payment intent edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        courseId,
        mode: 'payment',
        isRenewal,
        metadata: {
          source: 'client'
        }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw {
        message: errorData.error || response.statusText,
        code: errorData.errorCode,
        status: response.status
      };
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw {
        message: data.error || 'Unknown error',
        code: data.errorCode
      };
    }
    
    // Handle free courses
    if (data.clientSecret === 'free_course') {
      return {
        clientSecret: 'free_course',
        amount: 0,
        productName: data.productName
      };
    }
    
    // Track event
    trackEvent('checkout_initiated', {
      course_id: courseId,
      payment_id: data.paymentIntentId,
      is_renewal: isRenewal,
      is_embedded: true
    });
    
    return {
      clientSecret: data.clientSecret,
      amount: data.amount,
      productName: data.productName
    };
  } catch (error: any) {
    return Promise.reject(handleCheckoutError(error, { 
      action: 'prepareEmbeddedCheckout', 
      course_id: courseId,
      is_renewal: isRenewal
    }));
  }
}

/**
 * Prepare an embedded subscription checkout using Payment Element
 * 
 * @param subscriptionTier Subscription tier
 * @param interval Billing interval
 * @returns Promise with the clientSecret for Payment Element
 */
export async function prepareEmbeddedSubscription({
  subscriptionTier,
  interval
}: {
  subscriptionTier: 'premium' | 'unlimited';
  interval: 'month' | 'year';
}): Promise<{ clientSecret: string; amount: number; productName: string }> {
  console.log(`Preparing embedded subscription for ${subscriptionTier} (${interval})`);
  
  try {
    // Get authenticated session for API call
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error('Authentication required');
    }
    
    // Call payment intent edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        subscriptionTier,
        interval,
        mode: 'subscription',
        metadata: {
          source: 'client'
        }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw {
        message: errorData.error || response.statusText,
        code: errorData.errorCode,
        status: response.status
      };
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw {
        message: data.error || 'Unknown error',
        code: data.errorCode
      };
    }
    
    // Track event
    trackEvent('checkout_initiated', {
      subscription_type: subscriptionTier,
      interval: interval,
      payment_id: data.paymentIntentId,
      is_embedded: true
    });
    
    return {
      clientSecret: data.clientSecret,
      amount: data.amount,
      productName: data.productName
    };
  } catch (error: any) {
    return Promise.reject(handleCheckoutError(error, { 
      action: 'prepareEmbeddedSubscription', 
      subscription_type: subscriptionTier,
      interval: interval
    }));
  }
} 