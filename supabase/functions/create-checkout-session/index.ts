import { createClient } from "npm:@supabase/supabase-js@2.7.1";
import Stripe from "npm:stripe@12.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.info('Checkout session server started');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body - now support multiple checkout types
    const { 
      priceId,
      userId,
      mode = 'subscription', // Default to subscription
      courseId = null,       // For course purchases
      isRenewal = false,     // For course renewals
      daysOfAccess = 30,     // Default days of access
      interval = 'month',    // For subscription interval (month/year)
      subscriptionTier = 'unlimited' // Default tier
    } = await req.json();
    
    console.log('Creating checkout session:', { 
      userId, 
      mode,
      courseId,
      priceId,
      isRenewal,
      interval,
      subscriptionTier
    });

    // Validate required parameter
    if (!userId) {
      console.error('Missing userId in request');
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Additional validation based on mode
    if (mode === 'subscription' && !priceId) {
      console.error('Missing priceId for subscription checkout');
      return new Response(
        JSON.stringify({ error: 'Price ID is required for subscription checkout' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (mode === 'payment' && !courseId) {
      console.error('Missing courseId for course purchase');
      return new Response(
        JSON.stringify({ error: 'Course ID is required for course purchase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile to get email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe - use the right key based on environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('Missing Stripe secret key');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Check if user already has a Stripe customer ID
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError && !subscriptionError.message.includes('No rows found')) {
      console.error('Error checking existing subscription:', subscriptionError);
      return new Response(
        JSON.stringify({ error: 'Error checking subscription status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let customerId = subscription?.stripe_customer_id;

    // If no customer ID exists, create a new customer
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: profile.email,
          metadata: {
            user_id: userId, // Use consistent key name
          },
        });
        customerId = customer.id;
        console.log('Created new Stripe customer:', customerId);
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create customer' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Set up success and cancel URLs
    const origin = req.headers.get('origin') || Deno.env.get('PUBLIC_APP_URL') || 'https://askjds.com';
    const successUrl = `${origin}/${mode === 'payment' ? 'thank-you' : 'subscription/success'}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = mode === 'payment' 
      ? `${origin}/courses/${courseId}?checkout_cancelled=true`
      : `${origin}/subscribe`;
    
    let session;
    
    try {
      // Create the appropriate checkout session based on mode
      if (mode === 'payment') {
        // Course purchase mode - get course details
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('title, price, days_of_access')
          .eq('id', courseId)
          .single();
          
        if (courseError || !course) {
          console.error('Error fetching course:', courseError);
          return new Response(
            JSON.stringify({ error: 'Course not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Create a session for one-time payment
        session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: isRenewal ? `Renew: ${course.title}` : course.title,
                  description: `${course.days_of_access || daysOfAccess} days of access`,
                },
                unit_amount: Math.round(course.price * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            user_id: userId, // IMPORTANT: Always include user_id for webhook processing
            course_id: courseId,
            is_renewal: isRenewal ? 'true' : 'false',
            days_of_access: (course.days_of_access || daysOfAccess).toString(),
            purchase_type: 'course',
          },
        });
        
        console.log('Created course purchase checkout session:', session.id);
      } else {
        // Subscription mode
        session = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            user_id: userId, // IMPORTANT: Always include user_id for webhook processing
            subscription_tier: subscriptionTier,
            interval: interval,
            purchase_type: 'subscription',
          },
        });
        
        console.log('Created subscription checkout session:', session.id);
      }

      // Track the checkout session
      await supabase.from('checkout_sessions').insert({
        user_id: userId,
        checkout_type: mode === 'payment' ? (isRenewal ? 'course_renewal' : 'course_purchase') : 'subscription',
        course_id: courseId,
        subscription_tier: mode === 'subscription' ? subscriptionTier : null,
        interval: mode === 'subscription' ? interval : null,
        success_url: successUrl.replace('{CHECKOUT_SESSION_ID}', session.id),
        cancel_url: cancelUrl,
        metadata: session.metadata,
        stripe_session_id: session.id
      });

      // Return the checkout URL
      return new Response(
        JSON.stringify({ 
          url: session.url,
          sessionId: session.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create checkout session',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 