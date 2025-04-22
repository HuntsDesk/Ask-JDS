/**
 * Utilities for Stripe checkout flows
 */
import { supabase } from '../supabase';
import { createSupabaseClient } from '../supabase/client';

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
  
  console.log('Starting course checkout process:', { userId, courseId });
  
  try {
    // Get authenticated session for the API call
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No authenticated session available');
      throw new Error('Authentication required');
    }

    console.log('Authentication successful, fetching course details');

    // Get course details with price IDs
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, price, days_of_access, stripe_price_id, stripe_price_id_dev')
      .eq('id', courseId)
      .single();
      
    if (courseError || !course) {
      console.error('Failed to fetch course:', courseError);
      throw new Error(`Course not found: ${courseError?.message}`);
    }
    
    if (!course.price) {
      console.error('Course price not set for course:', { courseId, title: course.title });
      throw new Error('Course price not set');
    }
    
    console.log('Course details fetched:', { 
      id: courseId, 
      title: course.title, 
      price: course.price,
      daysOfAccess: course.days_of_access,
      stripePriceId: course.stripe_price_id,
      stripePriceIdDev: course.stripe_price_id_dev
    });
    
    // Select the appropriate API URL based on environment
    const isProduction = import.meta.env.MODE === 'production';
    console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    console.log('Using Supabase URL:', supabaseUrl);
    
    // Call checkout edge function
    console.log('Calling checkout edge function...');
    
    // Refresh the token to ensure it's valid
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('Session refresh warning (proceeding with current token):', refreshError.message);
    } else {
      console.log('Session refreshed successfully');
    }
    
    // Get the latest session
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      throw new Error('Session became invalid');
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`,
      },
      body: JSON.stringify({
        userId,
        courseId,
        // Pass the price IDs if available
        stripePriceId: isProduction ? course.stripe_price_id : course.stripe_price_id_dev,
        isRenewal: false,
        origin: window.location.origin
      }),
    });
    
    if (!response.ok) {
      let errorMessage = 'Unknown error';
      let errorData = null;
      
      try {
        errorData = await response.json();
        errorMessage = errorData.error || response.statusText;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `Status ${response.status}: ${response.statusText}`;
      }
      
      console.error('Checkout edge function failed:', { 
        status: response.status, 
        message: errorMessage,
        data: errorData
      });
      
      throw new Error(`Checkout failed: ${errorMessage}`);
    }
    
    console.log('Checkout edge function response received, parsing data...');
    const data = await response.json();
    console.log('Checkout session created:', { 
      sessionId: data.sessionId,
      hasUrl: !!data.url
    });
    
    // Track the checkout if analytics available
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('checkout_initiated', {
        course_id: courseId,
        course_title: course.title,
        payment_amount: course.price,
        checkout_session_id: data.sessionId,
        days_of_access: course.days_of_access
      });
    }
    
    return {
      url: data.url,
      sessionId: data.sessionId
    };
  } catch (error) {
    console.error('Error creating course checkout:', error);
    
    // Track checkout error if analytics available
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('checkout_failed', {
        error_message: error.message,
        course_id: courseId,
        user_id: userId
      });
    }
    
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

    // Get course details with price IDs
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, price, days_of_access, stripe_price_id, stripe_price_id_dev')
      .eq('id', courseId)
      .single();
      
    if (courseError || !course) {
      throw new Error(`Course not found: ${courseError?.message}`);
    }
    
    if (!course.price) {
      throw new Error('Course price not set');
    }
    
    // Select the appropriate API URL based on environment
    const isProduction = import.meta.env.MODE === 'production';
    
    // Call checkout edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        courseId,
        userId,
        stripePriceId: isProduction ? course.stripe_price_id : course.stripe_price_id_dev,
        isRenewal: true,
        origin: window.location.origin
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Renewal checkout failed: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Track the renewal if analytics available
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('checkout_initiated', {
        course_id: courseId,
        course_title: course.title,
        payment_amount: course.price,
        checkout_session_id: data.sessionId,
        days_of_access: course.days_of_access,
        is_renewal: true
      });
    }
    
    return {
      url: data.url,
      sessionId: data.sessionId
    };
  } catch (error) {
    console.error('Error creating course renewal checkout:', error);
    
    // Track renewal error if analytics available
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('checkout_failed', {
        error_message: error.message,
        course_id: courseId,
        user_id: userId,
        is_renewal: true
      });
    }
    
    throw error;
  }
}

type SubscriptionCheckoutParams = {
  tier: 'premium' | 'unlimited';
  interval: 'monthly' | 'yearly';
  userId?: string;
};

export async function createSubscriptionCheckout({
  tier,
  interval,
  userId
}: SubscriptionCheckoutParams) {
  console.log('Starting subscription checkout process', { tier, interval });
  
  // If userId is not provided, try to get it from the authenticated user
  const supabase = createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('Authentication required for subscription checkout');
    return { error: 'Authentication required', url: null };
  }
  
  const finalUserId = userId || user.id;
  console.log('Authenticated user for subscription checkout', { userId: finalUserId });

  try {
    // Check if we're in production or development
    const isProduction = import.meta.env.MODE === 'production';
    console.log('Environment mode:', isProduction ? 'production' : 'development');
    
    // Get the Supabase URL for the Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    console.log('Using Supabase URL:', supabaseUrl);

    // Get the current session to use for authorization
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No authenticated session available');
      return { error: 'Authentication required', url: null };
    }

    // Call the Edge Function to create a checkout
    const functionUrl = `${supabaseUrl}/functions/v1/stripe-create-subscription`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        tier,
        interval,
        userId: finalUserId,
      }),
    });

    const data = await response.json();
    console.log('Subscription checkout response:', data);

    if (data.error) {
      console.error('Error creating subscription checkout:', data.error);
      return { error: data.error, url: null };
    }

    return { error: null, url: data.url };
  } catch (error) {
    console.error('Exception in subscription checkout:', error);
    return { error: 'Failed to create checkout session', url: null };
  }
} 