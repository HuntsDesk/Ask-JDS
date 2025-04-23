/**
 * Test utilities for Stripe checkout process
 * Use this to debug checkout issues directly
 */
import { supabase } from '../supabase';

/**
 * Test the checkout edge function directly
 * @param courseId The ID of the course to test checkout with
 */
export async function testCheckoutEdgeFunction(courseId: string): Promise<void> {
  try {
    console.log('Starting direct checkout test...');
    
    // Get authenticated session for the API call
    const { data: { session, user } } = await supabase.auth.getSession();
    
    if (!session || !user) {
      throw new Error('Authentication required for checkout test');
    }

    console.log('User authenticated:', { 
      id: user.id,
      email: user.email 
    });
    
    // Get course details including price IDs
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
    
    console.log('Course details:', {
      id: courseId,
      title: course.title,
      price: course.price,
      daysOfAccess: course.days_of_access,
      stripePriceId: course.stripe_price_id,
      stripePriceIdDev: course.stripe_price_id_dev
    });
    
    // Check if we're in production or development
    const isProduction = window.location.hostname.includes('askjds.com');
    console.log(`Environment detected: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    
    // Refresh the session token to ensure it's valid
    console.log('Refreshing authentication token...');
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('Token refresh warning (proceeding with current session):', refreshError);
    } else {
      console.log('Token refreshed successfully');
    }
    
    // Get the latest session after refreshing
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      throw new Error('Session became invalid after refresh');
    }
    
    // Call checkout edge function directly
    console.log('Calling checkout edge function...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    console.log('Supabase URL:', supabaseUrl);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`,
      },
      body: JSON.stringify({
        userId: user.id,
        courseId,
        stripePriceId: isProduction ? course.stripe_price_id : course.stripe_price_id_dev,
        isRenewal: false,
        origin: window.location.origin
      }),
    });
    
    const responseStatus = response.status;
    let responseData: any;
    let responseText: string;
    
    try {
      responseText = await response.text();
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { error: 'Failed to parse response as JSON', raw: responseText };
      }
    } catch (e) {
      responseData = { error: 'Failed to read response body' };
    }
    
    console.log('Edge function response:', {
      status: responseStatus,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    if (!response.ok) {
      throw new Error(`Checkout edge function error: ${responseData.error || responseData.details || response.statusText}`);
    }
    
    if (responseData.url) {
      console.log('Checkout session created! URL:', responseData.url);
      
      // Optional: Open the checkout URL automatically
      if (confirm('Checkout session created. Open in new tab?')) {
        window.open(responseData.url, '_blank');
      }
    } else {
      throw new Error('No checkout URL returned from edge function');
    }
  } catch (error) {
    console.error('Checkout test error:', error);
    alert(`Checkout test failed: ${error.message}`);
  }
} 

/**
 * Test subscription checkout directly
 * @param type Subscription type ('premium' or 'unlimited')
 * @param interval Billing interval ('month' or 'year')
 */
export async function testSubscriptionCheckout(
  type: 'premium' | 'unlimited',
  interval: 'month' | 'year' = 'month'
): Promise<void> {
  try {
    console.log(`Starting ${type} subscription test (${interval})...`);
    
    // Get authenticated session for the API call
    const { data: { session, user } } = await supabase.auth.getSession();
    
    if (!session || !user) {
      throw new Error('Authentication required for subscription test');
    }

    console.log('User authenticated:', { 
      id: user.id,
      email: user.email 
    });
    
    // Refresh the session token to ensure it's valid
    console.log('Refreshing authentication token...');
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('Token refresh warning (proceeding with current session):', refreshError);
    } else {
      console.log('Token refreshed successfully');
    }
    
    // Get the latest session after refreshing
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      throw new Error('Session became invalid after refresh');
    }
    
    // Call checkout edge function directly
    console.log('Calling checkout edge function...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`,
      },
      body: JSON.stringify({
        userId: user.id,
        subscriptionType: type,
        interval,
        origin: window.location.origin
      }),
    });
    
    const responseStatus = response.status;
    let responseData: any;
    let responseText: string;
    
    try {
      responseText = await response.text();
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { error: 'Failed to parse response as JSON', raw: responseText };
      }
    } catch (e) {
      responseData = { error: 'Failed to read response body' };
    }
    
    console.log('Edge function response:', {
      status: responseStatus,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    if (!response.ok) {
      throw new Error(`Subscription checkout error: ${responseData.error || responseData.details || response.statusText}`);
    }
    
    if (responseData.url) {
      console.log('Checkout session created! URL:', responseData.url);
      
      // Optional: Open the checkout URL automatically
      if (confirm('Subscription checkout created. Open in new tab?')) {
        window.open(responseData.url, '_blank');
      }
    } else {
      throw new Error('No checkout URL returned from edge function');
    }
  } catch (error) {
    console.error('Subscription test error:', error);
    alert(`Subscription test failed: ${error.message}`);
  }
} 