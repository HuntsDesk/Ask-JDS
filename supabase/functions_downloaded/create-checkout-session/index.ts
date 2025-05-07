/// <reference lib="deno.ns" />
/// <reference types="https://deno.land/x/stripe@v3.14.0/types/mod.d.ts" />
// @deno-types="npm:@types/node"
// deno-lint-ignore-file no-explicit-any
// Edge Function for creating Stripe checkout sessions
// Uses Supabase auth to verify user tokens
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import Stripe from 'npm:stripe@17.7.0';
// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature'
};
// Helper function for error responses
function errorResponse(message, status = 400) {
  console.error(`Error in checkout process: ${message}`);
  return new Response(JSON.stringify({
    error: message
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    status
  });
}
// Start the server
console.info('Checkout session server started');
// Define valid subscription tiers and intervals for validation
const validTiers = [
  'premium',
  'unlimited'
];
const validIntervals = [
  'month',
  'year'
];
// Initialize the Stripe client with the appropriate API key
// Force test mode for now to prevent accidental live charges
// const stripeLiveKey = Deno.env.get('STRIPE_LIVE_SECRET_KEY');
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
// const stripe = new Stripe(stripeLiveKey || stripeSecretKey || '', {
const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2025-03-31.basil'
});
// Log which mode we're running in (without exposing keys)
console.log('Stripe mode: test (forced test mode for development)');
// Define subscription price IDs using environment variables
// Force test price IDs for now
const SUBSCRIPTION_PRICE_IDS = {
  premium: {
    month: Deno.env.get('STRIPE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID'),
    year: Deno.env.get('STRIPE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID')
  },
  unlimited: {
    month: Deno.env.get('STRIPE_UNLIMITED_MONTHLY_PRICE_ID'),
    year: Deno.env.get('STRIPE_UNLIMITED_ANNUAL_PRICE_ID')
  }
};
// Log environment status (without exposing values)
console.log('Environment variables loaded:');
console.log('Premium Monthly Price ID exists:', !!SUBSCRIPTION_PRICE_IDS.premium.month);
console.log('Premium Yearly Price ID exists:', !!SUBSCRIPTION_PRICE_IDS.premium.year);
console.log('Unlimited Monthly Price ID exists:', !!SUBSCRIPTION_PRICE_IDS.unlimited.month);
console.log('Unlimited Yearly Price ID exists:', !!SUBSCRIPTION_PRICE_IDS.unlimited.year);
// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// CORS middleware handler
const handleRequest = async (req)=>{
  console.log(`Received ${req.method} request to ${req.url}`);
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Get the authorization header from the request and extract the token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No auth header found');
      return errorResponse('No auth header', 401);
    }
    const token = authHeader.replace('Bearer ', '');
    // Verify the token from the authorization header
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return errorResponse('Unauthorized', 401);
    }
    // Log the authorized user from JWT token
    console.log('Authorized user from JWT token:', user.id);
    // Get the request body
    const { courseId, successUrl, cancelUrl, subscriptionTier, interval, mode, metadata, origin } = await req.json();
    // For backward compatibility, default to origin if provided
    const baseUrl = origin || 'https://askjds.com';
    // Log the request information for debugging
    console.log('Checkout request:', {
      courseId,
      successUrl,
      cancelUrl,
      subscriptionTier,
      interval,
      mode,
      baseUrl
    });
    // Important: we'll use user.id from JWT token, not any userId that might be in the request
    const userId = user.id;
    console.log('Using user ID from JWT token:', userId);
    let session;
    // Creating a checkout session for a course purchase
    if (mode === 'payment' && courseId) {
      console.log('Creating course checkout session for course:', courseId);
      try {
        // Fetch the course details from Supabase
        const { data: course, error: courseError } = await supabase.from('courses').select('id, title, price, stripe_price_id, stripe_price_id_dev, days_of_access').eq('id', courseId).single();
        if (courseError) {
          console.error('Failed to fetch course:', courseError);
          return errorResponse('Course not found', 404);
        }
        if (!course) {
          console.error('No course found with ID:', courseId);
          return errorResponse('Course not found', 404);
        }
        console.log('Course found:', course);
        // Check if the user already owns the course
        const { data: userCourse, error: userCourseError } = await supabase.from('course_enrollments').select('*').eq('user_id', userId).eq('course_id', courseId).eq('status', 'active').maybeSingle();
        if (userCourse) {
          console.log('User already owns this course');
          return errorResponse('User already owns this course', 400);
        }
        if (userCourseError && userCourseError.code !== 'PGRST116') {
          console.error('Error checking user course:', userCourseError);
        }
        // Handle free courses (price = 0)
        if (course.price === 0) {
          // For free courses, directly create the user_course record
          const { error: createError } = await supabase.from('course_enrollments').insert({
            user_id: userId,
            course_id: courseId,
            status: 'active',
            enrolled_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + course.days_of_access * 24 * 60 * 60 * 1000).toISOString()
          });
          if (createError) {
            console.error('Error creating user course record:', createError);
            return errorResponse('Failed to grant course access', 500);
          }
          // Return success URL directly for free courses
          return new Response(JSON.stringify({
            url: successUrl || `${baseUrl}/purchase/success?free=true`
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
        // Use Stripe price ID if available, otherwise create line item with price data
        let lineItems;
        // Determine appropriate Stripe price ID based on environment
        // Force dev mode for now
        const isProd = false; // Forcing test mode
        const stripePriceId = course.stripe_price_id_dev; // Always use dev price ID
        if (stripePriceId) {
          console.log(`Using Stripe price ID: ${stripePriceId}`);
          lineItems = [
            {
              price: stripePriceId,
              quantity: 1
            }
          ];
        } else {
          console.log(`No Stripe price ID found, creating line item with price data`);
          lineItems = [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: course.title
                },
                unit_amount: Math.round(course.price * 100)
              },
              quantity: 1
            }
          ];
        }
        // Create a checkout session for the course
        session = await stripe.checkout.sessions.create({
          payment_method_types: [
            'card'
          ],
          line_items: lineItems,
          mode: 'payment',
          success_url: successUrl || `${baseUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl || `${baseUrl}/courses/${courseId}`,
          metadata: {
            courseId: courseId,
            userId: userId,
            purchaseType: 'course',
            daysOfAccess: course.days_of_access,
            ...metadata
          }
        });
        console.log('Course checkout session created:', session.id);
      } catch (error) {
        console.error('Error creating course checkout session:', error);
        return errorResponse(error.message || 'Error creating checkout session', 500);
      }
    } else if (mode === 'subscription' && subscriptionTier && interval) {
      console.log('Creating subscription checkout session for tier:', subscriptionTier, 'interval:', interval);
      // Validate subscription tier and interval
      if (!validTiers.includes(subscriptionTier) || !validIntervals.includes(interval)) {
        return errorResponse('Invalid subscription configuration', 400);
      }
      // Map interval to month/year format
      const mappedInterval = interval === 'month' ? 'month' : 'year';
      // Get the price ID for the subscription
      const priceId = SUBSCRIPTION_PRICE_IDS[subscriptionTier]?.[mappedInterval];
      if (!priceId) {
        console.error('Invalid subscription tier or interval');
        return errorResponse('Invalid subscription tier or interval', 400);
      }
      console.log('Using price ID:', priceId);
      try {
        // Create a checkout session for the subscription
        session = await stripe.checkout.sessions.create({
          payment_method_types: [
            'card'
          ],
          line_items: [
            {
              price: priceId,
              quantity: 1
            }
          ],
          mode: 'subscription',
          success_url: successUrl || `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl || `${baseUrl}/subscribe`,
          metadata: {
            subscriptionTier,
            interval: mappedInterval,
            userId: userId,
            purchaseType: 'subscription',
            ...metadata
          },
          customer_email: user.email
        });
        console.log('Subscription checkout session created:', session.id);
      } catch (error) {
        console.error('Error creating subscription checkout session:', error);
        return errorResponse(error.message || 'Error creating checkout session', 500);
      }
    } else {
      console.error('Invalid checkout request');
      return errorResponse('Invalid checkout request', 400);
    }
    // Return the session URL
    return new Response(JSON.stringify({
      url: session.url
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return errorResponse(error.message || 'Server error', 500);
  }
};
// Start the server
Deno.serve(handleRequest);
