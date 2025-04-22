/// <reference lib="deno.ns" />
/// <reference types="https://deno.land/x/stripe@v3.14.0/types/mod.d.ts" />
// @deno-types="npm:@types/node"
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define types
type SubscriptionTier = 'premium' | 'unlimited';
type BillingInterval = 'monthly' | 'annual';

// Define interfaces
interface CheckoutRequest {
  type: 'course' | 'subscription';
  courseId?: string;
  checkoutMode?: 'payment';
  returnUrl?: string;
  subscriptionTier?: SubscriptionTier;
  interval?: BillingInterval;
  trialDays?: number;
  userId?: string;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Start the server
console.info('Checkout session server started');

// Grab environment variables needed
const SUBSCRIPTION_PRICE_IDS: Record<SubscriptionTier, Record<BillingInterval, string>> = {
  premium: {
    monthly: Deno.env.get('VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID') || '',
    annual: Deno.env.get('VITE_STRIPE_PREMIUM_ANNUAL_PRICE_ID') || '',
  },
  unlimited: {
    monthly: Deno.env.get('VITE_STRIPE_UNLIMITED_MONTHLY_PRICE_ID') || '',
    annual: Deno.env.get('VITE_STRIPE_UNLIMITED_ANNUAL_PRICE_ID') || '',
  }
};

// Log the subscription price IDs for debugging
console.log('Subscription Price IDs:', {
  premium: {
    monthly: SUBSCRIPTION_PRICE_IDS.premium.monthly || 'Missing',
    annual: SUBSCRIPTION_PRICE_IDS.premium.annual || 'Missing',
  },
  unlimited: {
    monthly: SUBSCRIPTION_PRICE_IDS.unlimited.monthly || 'Missing',
    annual: SUBSCRIPTION_PRICE_IDS.unlimited.annual || 'Missing',
  },
});

// Check all environment variables
console.log('Environment variables status:', {
  VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID: Deno.env.get('VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID') ? 'Available' : 'Missing',
  VITE_STRIPE_PREMIUM_ANNUAL_PRICE_ID: Deno.env.get('VITE_STRIPE_PREMIUM_ANNUAL_PRICE_ID') ? 'Available' : 'Missing',
  VITE_STRIPE_UNLIMITED_MONTHLY_PRICE_ID: Deno.env.get('VITE_STRIPE_UNLIMITED_MONTHLY_PRICE_ID') ? 'Available' : 'Missing',
  VITE_STRIPE_UNLIMITED_ANNUAL_PRICE_ID: Deno.env.get('VITE_STRIPE_UNLIMITED_ANNUAL_PRICE_ID') ? 'Available' : 'Missing',
});

// Initialize the Stripe client with the API key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Serve HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  // Set CORS headers for all responses
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.error('Method not allowed');
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405, 
        headers 
      });
    }

    // Parse the request body
    const { 
      type, 
      courseId, 
      checkoutMode = 'payment', 
      returnUrl,
      subscriptionTier,
      interval,
      trialDays = 0,
      userId
    }: CheckoutRequest = await req.json();

    // Get the userId from the auth token if not provided in the request
    let authenticatedUserId = userId;
    if (!authenticatedUserId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (error) throw error;
          if (user) authenticatedUserId = user.id;
        } catch (error) {
          console.error('Authentication error:', error);
        }
      }
    }

    if (!authenticatedUserId) {
      console.error('User not authenticated');
      return new Response(JSON.stringify({ error: 'User not authenticated' }), { 
        status: 401, 
        headers 
      });
    }

    // Log environment variables availability
    console.log('Environment check:', {
      supabaseUrl: Deno.env.get('SUPABASE_URL') ? 'Available' : 'Missing',
      supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Available' : 'Missing',
      stripeSecret: Deno.env.get('STRIPE_SECRET_KEY') ? 'Available' : 'Missing',
      stripeLiveSecret: Deno.env.get('VITE_STRIPE_LIVE_SECRET_KEY') ? 'Available' : 'Missing',
    });

    // Determine if we're in production mode
    const isProduction = Deno.env.get('NODE_ENV') === 'production';
    console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);

    // Select the appropriate Stripe API key based on environment
    const stripeSecretKey = isProduction
      ? Deno.env.get('VITE_STRIPE_LIVE_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      console.error('Stripe secret key not found');
      return new Response(JSON.stringify({ error: 'Stripe configuration error' }), { 
        status: 500, 
        headers 
      });
    }

    // Get country code for localization
    let countryCode = 'US'; // Default
    try {
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
      console.info(`IP address: ${ipAddress}`);
      
      try {
        const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
        if (response.ok) {
          const data = await response.json();
          countryCode = data.countryCode;
          console.info(`Country: ${countryCode}`);
        }
      } catch (error) {
        console.error('Error determining country:', error);
      }
    } catch (error) {
      console.error('Error processing IP address:', error);
    }

    // Create checkout session based on type
    if (type === 'course') {
      // Course checkout
      if (!courseId) {
        console.error('Course ID is required');
        return new Response(JSON.stringify({ error: 'Course ID is required' }), { 
          status: 400, 
          headers 
        });
      }

      // Get course details from the database
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError || !course) {
        console.error('Error fetching course:', courseError);
        return new Response(JSON.stringify({ error: 'Course not found' }), { 
          status: 404, 
          headers 
        });
      }

      console.log('Creating course checkout for:', { courseId, course: course.title, userId: authenticatedUserId });

      // Create a checkout session for the course
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: course.title,
                description: course.description,
              },
              unit_amount: Math.round(course.price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: checkoutMode,
        success_url: `${returnUrl || Deno.env.get('VITE_APP_URL')}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl || Deno.env.get('VITE_APP_URL')}/courses/${courseId}`,
        client_reference_id: authenticatedUserId,
        metadata: {
          courseId,
          userId: authenticatedUserId,
          type: 'course',
        },
      });

      console.log('Checkout session created:', session.id);
      return new Response(JSON.stringify({ url: session.url }), { 
        status: 200, 
        headers 
      });
      
    } else if (type === 'subscription') {
      // Subscription checkout
      if (!subscriptionTier || !interval) {
        console.error('Subscription tier and interval are required');
        return new Response(JSON.stringify({ error: 'Subscription tier and interval are required' }), { 
          status: 400, 
          headers 
        });
      }

      const priceId = SUBSCRIPTION_PRICE_IDS[subscriptionTier]?.[interval];
      if (!priceId) {
        console.error('Invalid subscription tier or interval');
        return new Response(JSON.stringify({ error: 'Invalid subscription tier or interval' }), { 
          status: 400, 
          headers 
        });
      }

      console.log('Creating subscription checkout for:', { tier: subscriptionTier, interval, userId: authenticatedUserId });

      // Create a checkout session for the subscription
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        subscription_data: {
          trial_period_days: trialDays > 0 ? trialDays : undefined,
        },
        success_url: `${returnUrl || Deno.env.get('VITE_APP_URL')}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl || Deno.env.get('VITE_APP_URL')}/subscribe`,
        client_reference_id: authenticatedUserId,
        metadata: {
          subscriptionTier,
          interval,
          userId: authenticatedUserId,
          type: 'subscription',
        },
      });

      console.log('Subscription session created:', session.id);
      return new Response(JSON.stringify({ url: session.url }), { 
        status: 200, 
        headers 
      });
      
    } else {
      console.error('Invalid checkout type');
      return new Response(JSON.stringify({ error: 'Invalid checkout type' }), { 
        status: 400, 
        headers 
      });
    }
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers 
    });
  }
});

// For Supabase Edge Functions compatibility
export const config = {
  api: {
    bodyParser: true,
  },
}; 