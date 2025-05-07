/// <reference lib="deno.ns" />
/// <reference types="npm:@types/stripe" />
import { createClient } from 'npm:@supabase/supabase-js@2.38.0';
import Stripe from 'npm:stripe@17.7.0';
import { z } from 'npm:zod@3.22.4';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { METADATA_KEYS, ERROR_CODES, isProd } from '../_shared/constants.ts';
// Validate request with Zod
const paymentIntentRequestSchema = z.object({
  courseId: z.string().uuid().optional(),
  subscriptionTier: z.enum([
    'premium',
    'unlimited'
  ]).optional(),
  interval: z.enum([
    'month',
    'year'
  ]).optional(),
  mode: z.enum([
    'payment',
    'subscription'
  ]),
  isRenewal: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});
// Initialize Stripe with appropriate key
const stripeSecretKey = isProd() ? Deno.env.get('STRIPE_LIVE_SECRET_KEY') : Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  console.error('Missing Stripe API key');
  throw new Error('Missing Stripe API key');
}
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-03-31.basil'
});
// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Define subscription price IDs
const SUBSCRIPTION_PRICE_IDS = {
  premium: {
    month: isProd() ? Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID') : Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID_TEST'),
    year: isProd() ? Deno.env.get('STRIPE_PREMIUM_ANNUAL_PRICE_ID') : Deno.env.get('STRIPE_PREMIUM_ANNUAL_PRICE_ID_TEST')
  },
  unlimited: {
    month: isProd() ? Deno.env.get('STRIPE_UNLIMITED_MONTHLY_PRICE_ID') : Deno.env.get('STRIPE_UNLIMITED_MONTHLY_PRICE_ID_TEST'),
    year: isProd() ? Deno.env.get('STRIPE_UNLIMITED_ANNUAL_PRICE_ID') : Deno.env.get('STRIPE_UNLIMITED_ANNUAL_PRICE_ID_TEST')
  }
};
// Helper function for error responses
function errorResponse(message, errorCode, status = 400) {
  console.error(`Error in payment intent process: ${message} (${errorCode})`);
  return new Response(JSON.stringify({
    status: 'error',
    error: message,
    errorCode
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    status
  });
}
// Handle requests
const handler = async (req)=>{
  // Handle CORS preflight request
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }
  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Authentication required', ERROR_CODES.MISSING_AUTH, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    // Verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return errorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED, 401);
    }
    // Get and validate the request body
    const requestBody = await req.json();
    const validationResult = paymentIntentRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return errorResponse('Invalid request parameters', ERROR_CODES.INVALID_PARAMETERS, 400);
    }
    const { courseId, subscriptionTier, interval, mode, isRenewal = false, metadata = {} } = validationResult.data;
    // Build standardized metadata
    const standardizedMetadata = {
      [METADATA_KEYS.USER_ID]: user.id,
      [METADATA_KEYS.SOURCE]: 'client',
      ...metadata
    };
    // Create a payment intent for course purchase
    if (mode === 'payment' && courseId) {
      try {
        // Fetch the course details
        const { data: course, error: courseError } = await supabase.from('courses').select('id, title, price, days_of_access').eq('id', courseId).single();
        if (courseError) {
          return errorResponse('Course not found', ERROR_CODES.COURSE_NOT_FOUND, 404);
        }
        if (!course) {
          return errorResponse('Course not found', ERROR_CODES.COURSE_NOT_FOUND, 404);
        }
        // Check if user already owns the course
        if (!isRenewal) {
          const { data: userCourse, error: userCourseError } = await supabase.from('course_enrollments').select('*').eq('user_id', user.id).eq('course_id', courseId).eq('status', 'active').maybeSingle();
          if (userCourse) {
            return errorResponse('User already owns this course', ERROR_CODES.INVALID_PARAMETERS, 400);
          }
        }
        // For free courses, directly create enrollment
        if (course.price === 0) {
          // Create or update enrollment record
          if (isRenewal) {
            // Update existing enrollment
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + course.days_of_access);
            const { error: updateError } = await supabase.from('course_enrollments').update({
              status: 'active',
              expires_at: expiresAt.toISOString(),
              renewed_at: new Date().toISOString(),
              notification_sent: false,
              renewal_count: supabase.rpc('increment', {
                x: 1
              })
            }).match({
              user_id: user.id,
              course_id: courseId
            });
            if (updateError) {
              return errorResponse('Failed to update enrollment', ERROR_CODES.CHECKOUT_FAILED, 500);
            }
          } else {
            // Create new enrollment
            const { error: createError } = await supabase.from('course_enrollments').insert({
              user_id: user.id,
              course_id: courseId,
              status: 'active',
              enrolled_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + course.days_of_access * 24 * 60 * 60 * 1000).toISOString()
            });
            if (createError) {
              return errorResponse('Failed to grant course access', ERROR_CODES.CHECKOUT_FAILED, 500);
            }
          }
          // Return success response for free courses
          return new Response(JSON.stringify({
            status: 'success',
            clientSecret: 'free_course',
            amount: 0,
            productName: isRenewal ? `Renew: ${course.title}` : course.title
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
        // Update metadata with course info
        standardizedMetadata[METADATA_KEYS.COURSE_ID] = courseId;
        standardizedMetadata[METADATA_KEYS.IS_RENEWAL] = isRenewal ? 'true' : 'false';
        standardizedMetadata[METADATA_KEYS.DAYS_OF_ACCESS] = course.days_of_access.toString();
        standardizedMetadata[METADATA_KEYS.PURCHASE_TYPE] = 'course';
        // Create a payment intent
        const amount = Math.round(course.price * 100); // Convert to cents
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true
          },
          metadata: standardizedMetadata,
          receipt_email: user.email
        });
        // Track the payment intent
        await supabase.from('checkout_sessions').insert({
          user_id: user.id,
          checkout_type: isRenewal ? 'course_renewal' : 'course_purchase',
          course_id: courseId,
          success_url: `${req.headers.get('origin') || 'https://askjds.com'}/thank-you`,
          cancel_url: `${req.headers.get('origin') || 'https://askjds.com'}/courses/${courseId}`,
          metadata: standardizedMetadata,
          stripe_session_id: paymentIntent.id
        });
        // Return the client secret
        return new Response(JSON.stringify({
          status: 'success',
          clientSecret: paymentIntent.client_secret,
          amount,
          productName: isRenewal ? `Renew: ${course.title}` : course.title
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        });
      } catch (error) {
        console.error('Error creating payment intent for course:', error);
        return errorResponse(error.message || 'Error creating payment intent', ERROR_CODES.CHECKOUT_FAILED, 500);
      }
    } else if (mode === 'subscription' && subscriptionTier && interval) {
      try {
        // Validate subscription tier and interval
        const validTiers = [
          'premium',
          'unlimited'
        ];
        const validIntervals = [
          'month',
          'year'
        ];
        if (!validTiers.includes(subscriptionTier) || !validIntervals.includes(interval)) {
          return errorResponse('Invalid subscription configuration', ERROR_CODES.INVALID_PARAMETERS, 400);
        }
        // Get or create a customer
        let customerId;
        const { data: existingSubscription } = await supabase.from('user_subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
        if (existingSubscription?.stripe_customer_id) {
          customerId = existingSubscription.stripe_customer_id;
        } else {
          // Create a new customer
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
              user_id: user.id
            }
          });
          customerId = customer.id;
        }
        // Update metadata with subscription info
        standardizedMetadata[METADATA_KEYS.SUBSCRIPTION_TIER] = subscriptionTier;
        standardizedMetadata[METADATA_KEYS.INTERVAL] = interval;
        standardizedMetadata[METADATA_KEYS.PURCHASE_TYPE] = 'subscription';
        // Get price ID
        const priceId = SUBSCRIPTION_PRICE_IDS[subscriptionTier]?.[interval];
        if (!priceId) {
          return errorResponse('Invalid subscription tier or interval', ERROR_CODES.INVALID_PARAMETERS, 400);
        }
        // Look up the price to get the amount
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        // Create subscription intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          customer: customerId,
          automatic_payment_methods: {
            enabled: true
          },
          metadata: {
            ...standardizedMetadata,
            setup_future_usage: 'off_session',
            price_id: priceId
          },
          receipt_email: user.email
        });
        // Track the payment intent
        await supabase.from('checkout_sessions').insert({
          user_id: user.id,
          checkout_type: 'subscription',
          subscription_tier: subscriptionTier,
          interval: interval,
          success_url: `${req.headers.get('origin') || 'https://askjds.com'}/thank-you`,
          cancel_url: `${req.headers.get('origin') || 'https://askjds.com'}/subscribe`,
          metadata: standardizedMetadata,
          stripe_session_id: paymentIntent.id
        });
        // Get a display name for the subscription
        const displayName = `${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} (${interval === 'month' ? 'Monthly' : 'Annual'})`;
        // Return the client secret
        return new Response(JSON.stringify({
          status: 'success',
          clientSecret: paymentIntent.client_secret,
          amount,
          productName: displayName
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        });
      } catch (error) {
        console.error('Error creating subscription setup:', error);
        return errorResponse(error.message || 'Error creating subscription', ERROR_CODES.CHECKOUT_FAILED, 500);
      }
    } else {
      return errorResponse('Invalid request configuration', ERROR_CODES.INVALID_PARAMETERS, 400);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return errorResponse(error.message || 'Server error', ERROR_CODES.CHECKOUT_FAILED, 500);
  }
};
// Start the server
Deno.serve(handler);
