import { createClient } from "npm:@supabase/supabase-js@2.7.1";
import Stripe from "npm:stripe@12.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.info('Checkout session server started');

// Price ID mapping for subscription tiers
const SUBSCRIPTION_PRICE_IDS = {
  premium: {
    month: {
      production: Deno.env.get('VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID'),
      development: Deno.env.get('VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID_DEV'),
    },
    year: {
      production: Deno.env.get('VITE_STRIPE_PREMIUM_ANNUAL_PRICE_ID'),
      development: Deno.env.get('VITE_STRIPE_PREMIUM_ANNUAL_PRICE_ID_DEV'),
    },
  },
  unlimited: {
    month: {
      production: Deno.env.get('VITE_STRIPE_LIVE_UNLIMITED_MONTHLY_PRICE_ID'),
      development: Deno.env.get('VITE_STRIPE_UNLIMITED_MONTHLY_PRICE_ID'),
    },
    year: {
      production: Deno.env.get('VITE_STRIPE_LIVE_UNLIMITED_ANNUAL_PRICE_ID'),
      development: Deno.env.get('VITE_STRIPE_UNLIMITED_ANNUAL_PRICE_ID'),
    },
  },
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const { 
      priceId,
      stripePriceId,
      userId,
      courseId,
      isRenewal = false,
      subscriptionType,
      interval = 'month',
      origin
    } = await req.json();
    
    console.log('Creating checkout session for:', { 
      userId, 
      priceId,
      stripePriceId,
      courseId,
      subscriptionType,
      interval 
    });

    // Validate required parameters
    if (!userId) {
      console.error('Missing userId in request');
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
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

    // Get the appropriate Stripe key based on the request origin
    // Test keys for development, production keys for production
    const isProduction = origin?.includes('askjds.com') || false;
    console.log(`Using ${isProduction ? 'production' : 'development'} Stripe keys`);
    
    const stripeSecretKey = isProduction
      ? Deno.env.get('STRIPE_LIVE_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY');
    
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
            userId,
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

    // Create checkout session based on type
    try {
      let session;
      
      // Handle course purchase
      if (courseId) {
        // Get course details with price IDs
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('title, price, days_of_access, stripe_price_id, stripe_price_id_dev')
          .eq('id', courseId)
          .single();
          
        if (courseError || !course) {
          console.error('Error fetching course:', courseError);
          return new Response(
            JSON.stringify({ error: 'Course not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (!course.price) {
          console.error('Course price not set');
          return new Response(
            JSON.stringify({ error: 'Course price not set' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Determine the price ID to use
        let actualPriceId = priceId || stripePriceId;
        
        // If no price ID provided, use the one from the course
        if (!actualPriceId) {
          actualPriceId = isProduction ? course.stripe_price_id : course.stripe_price_id_dev;
        }
        
        console.log('Using price ID for course:', actualPriceId || 'None (will create dynamic price)');
        
        // Create one-time payment session for course
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [],
          mode: 'payment',
          success_url: `${origin || req.headers.get('origin') || Deno.env.get('PUBLIC_APP_URL')}/courses/${courseId}?checkout_success=true`,
          cancel_url: `${origin || req.headers.get('origin') || Deno.env.get('PUBLIC_APP_URL')}/courses/${courseId}?checkout_canceled=true`,
          metadata: {
            userId,
            courseId,
            isRenewal: isRenewal ? 'true' : 'false',
            daysOfAccess: course.days_of_access.toString(),
          },
        };
        
        // If we have a price ID, use it
        if (actualPriceId) {
          sessionParams.line_items = [{
            price: actualPriceId,
            quantity: 1,
          }];
        } else {
          // Otherwise create a price dynamically
          sessionParams.line_items = [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: isRenewal ? `Renew Access: ${course.title}` : course.title,
                description: `${course.days_of_access} days of access`,
              },
              unit_amount: Math.round(course.price * 100), // Convert to cents
            },
            quantity: 1,
          }];
        }
        
        session = await stripe.checkout.sessions.create(sessionParams);
      } 
      // Handle subscription
      else if (priceId || (subscriptionType && interval)) {
        // Determine price ID if not directly provided
        let actualPriceId = priceId;
        
        // Validate subscription type
        if (subscriptionType && !['premium', 'unlimited'].includes(subscriptionType)) {
          return new Response(
            JSON.stringify({ error: 'Invalid subscription type' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Validate interval
        if (interval && !['month', 'year'].includes(interval)) {
          return new Response(
            JSON.stringify({ error: 'Invalid billing interval' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (!actualPriceId && subscriptionType) {
          // Get the appropriate price ID from our mapping
          const envType = isProduction ? 'production' : 'development';
          actualPriceId = SUBSCRIPTION_PRICE_IDS[subscriptionType]?.[interval]?.[envType];
          
          if (!actualPriceId) {
            console.error(`Missing Stripe price ID for ${subscriptionType} (${interval}) in ${envType} mode`);
            return new Response(
              JSON.stringify({ error: 'Stripe price configuration missing' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        
        console.log(`Using price ID for ${subscriptionType} subscription:`, actualPriceId);
        
        // Create subscription session
        session = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [
            {
              price: actualPriceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${origin || req.headers.get('origin') || Deno.env.get('PUBLIC_APP_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin || req.headers.get('origin') || Deno.env.get('PUBLIC_APP_URL')}/subscription/canceled`,
          metadata: {
            userId,
            subscriptionType,
            interval,
          },
        });
      } else {
        console.error('Invalid checkout parameters');
        return new Response(
          JSON.stringify({ error: 'Invalid checkout parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return the checkout URL and session ID
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