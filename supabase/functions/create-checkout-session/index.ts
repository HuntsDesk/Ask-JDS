/// <reference lib="deno.ns" />
/// <reference types="https://deno.land/x/stripe@v3.14.0/types/mod.d.ts" />
// @deno-types="npm:@types/node"
// deno-lint-ignore-file no-explicit-any
// Edge Function for creating Stripe checkout sessions
// Uses Supabase auth to verify user tokens
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import Stripe from 'npm:stripe@17.7.0'
import { corsHeaders } from '../_shared/cors.ts'
import { 
  REDIRECT_PATHS, 
  METADATA_KEYS, 
  ERROR_CODES, 
  isProd,
  CheckoutResponse,
} from '../_shared/constants.ts'
import { z } from 'npm:zod@3.22.4'

// Define database types directly
interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string;
          title: string;
          price: number;
          stripe_price_id?: string;
          stripe_price_id_dev?: string;
          days_of_access: number;
        };
      };
      course_enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          status: string;
          enrolled_at: string;
          expires_at: string | null;
          payment_id?: string;
        };
      };
      checkout_sessions: {
        Row: {
          id: string;
          stripe_session_id: string;
          user_id: string;
          checkout_type: string;
          course_id?: string;
          subscription_tier?: string;
          interval?: string;
          success_url: string;
          cancel_url: string;
          metadata: Record<string, any>;
          is_completed: boolean;
          created_at: string;
          completed_at?: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          stripe_session_id?: string;
          user_id: string;
          checkout_type: string;
          course_id?: string;
          subscription_tier?: string;
          interval?: string;
          success_url: string;
          cancel_url: string;
          metadata: Record<string, any>;
          is_completed?: boolean;
          created_at?: string;
          completed_at?: string;
          expires_at?: string;
        };
      };
    };
  };
}

// Add explicit type declaration for Deno
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (request: Request) => Promise<Response>): void;
}

// Define types
type SubscriptionTier = 'premium' | 'unlimited';
type BillingInterval = 'month' | 'year';

// Validate checkout request with Zod
const checkoutRequestSchema = z.object({
  courseId: z.string().uuid().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  subscriptionTier: z.enum(['premium', 'unlimited']).optional(),
  interval: z.enum(['month', 'year']).optional(),
  mode: z.enum(['payment', 'subscription']),
  isRenewal: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  origin: z.string().url().optional()
});

// Define interfaces
interface CheckoutRequest {
  courseId?: string;
  successUrl?: string;
  cancelUrl?: string;
  subscriptionTier?: SubscriptionTier;
  interval?: BillingInterval;
  mode: 'payment' | 'subscription';
  isRenewal?: boolean;
  metadata?: Record<string, any>;
  origin?: string;
}

// Helper function for error responses
function errorResponse(message: string, errorCode: string, status = 400): Response {
  console.error(`Error in checkout process: ${message} (${errorCode})`);
  const response: CheckoutResponse = {
    status: 'error',
    error: message,
    errorCode
  };
  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

// Helper function for success responses
function successResponse(url: string, sessionId: string): Response {
  const response: CheckoutResponse = {
    status: 'success',
    url,
    sessionId
  };
  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

// Start the server
console.info('Checkout session server started');

// Define valid subscription tiers and intervals for validation
const validTiers = ['premium', 'unlimited'];
const validIntervals = ['month', 'year'];

// Initialize the Stripe client with the appropriate API key
const stripeSecretKey = isProd()
  ? Deno.env.get('STRIPE_LIVE_SECRET_KEY')
  : Deno.env.get('STRIPE_SECRET_KEY');

if (!stripeSecretKey) {
  console.error('Missing Stripe API key');
  throw new Error('Missing Stripe API key');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-03-31.basil',
});

// Log which mode we're running in (without exposing keys)
console.log(`Stripe mode: ${isProd() ? 'PRODUCTION' : 'TEST'}`);

// Define subscription price IDs using environment variables
const SUBSCRIPTION_PRICE_IDS = {
  premium: {
    month: isProd()
      ? Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID')
      : Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID_TEST'),
    year: isProd()
      ? Deno.env.get('STRIPE_PREMIUM_ANNUAL_PRICE_ID')
      : Deno.env.get('STRIPE_PREMIUM_ANNUAL_PRICE_ID_TEST'),
  },
  unlimited: {
    month: isProd()
      ? Deno.env.get('STRIPE_UNLIMITED_MONTHLY_PRICE_ID')
      : Deno.env.get('STRIPE_UNLIMITED_MONTHLY_PRICE_ID_TEST'),
    year: isProd()
      ? Deno.env.get('STRIPE_UNLIMITED_ANNUAL_PRICE_ID')
      : Deno.env.get('STRIPE_UNLIMITED_ANNUAL_PRICE_ID_TEST'),
  },
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
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// CORS middleware handler
const handleRequest = async (req: Request): Promise<Response> => {
  console.log(`Received ${req.method} request to ${req.url}`);
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request and extract the token
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      console.error('No auth header found');
      return errorResponse('Authentication required', ERROR_CODES.MISSING_AUTH, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the token from the authorization header
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return errorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED, 401);
    }

    // Log the authorized user from JWT token
    console.log('Authorized user from JWT token:', user.id);

    // Get and validate the request body
    const requestBody = await req.json();
    const validationResult = checkoutRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      console.error('Invalid request body:', validationResult.error);
      return errorResponse('Invalid request parameters', ERROR_CODES.INVALID_PARAMETERS, 400);
    }
    
    const { 
      courseId, 
      successUrl, 
      cancelUrl, 
      subscriptionTier, 
      interval, 
      mode,
      isRenewal = false,
      metadata = {},
      origin 
    } = validationResult.data;

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
      isRenewal,
      baseUrl 
    });

    // Important: we'll use user.id from JWT token, not any userId that might be in the request
    const userId = user.id;
    console.log('Using user ID from JWT token:', userId);

    let session;
    let standardizedMetadata: Record<string, any> = {
      [METADATA_KEYS.USER_ID]: userId,
      [METADATA_KEYS.SOURCE]: 'api',
      ...metadata
    };

    // Creating a checkout session for a course purchase
    if (mode === 'payment' && courseId) {
      console.log('Creating course checkout session for course:', courseId);

      try {
        // Fetch the course details from Supabase
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('id, title, price, stripe_price_id, stripe_price_id_dev, days_of_access')
          .eq('id', courseId)
          .single();

        if (courseError) {
          console.error('Failed to fetch course:', courseError);
          return errorResponse('Course not found', ERROR_CODES.COURSE_NOT_FOUND, 404);
        }

        if (!course) {
          console.error('No course found with ID:', courseId);
          return errorResponse('Course not found', ERROR_CODES.COURSE_NOT_FOUND, 404);
        }

        console.log('Course found:', course);

        // Check if the user already owns the course
        const { data: userCourse, error: userCourseError } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .eq('status', 'active')
          .maybeSingle();

        if (userCourse && !isRenewal) {
          console.log('User already owns this course');
          return errorResponse('User already owns this course', ERROR_CODES.INVALID_PARAMETERS, 400);
        }

        if (userCourseError && userCourseError.code !== 'PGRST116') {
          console.error('Error checking user course:', userCourseError);
        }

        // Handle free courses (price = 0)
        if (course.price === 0) {
          // For free courses, directly create the user_course record
          const { error: createError } = await supabase
            .from('course_enrollments')
            .insert({
              user_id: userId,
              course_id: courseId,
              status: 'active',
              enrolled_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + (course.days_of_access * 24 * 60 * 60 * 1000)).toISOString(),
            });

          if (createError) {
            console.error('Error creating user course record:', createError);
            return errorResponse('Failed to grant course access', ERROR_CODES.CHECKOUT_FAILED, 500);
          }

          // Calculate the success URL
          const finalSuccessUrl = successUrl || `${baseUrl}/purchase/success?free=true`;

          // Track the free enrollment
          await supabase.from('checkout_sessions').insert({
            user_id: userId,
            checkout_type: 'free_course',
            course_id: courseId,
            success_url: finalSuccessUrl,
            cancel_url: `${baseUrl}/courses/${courseId}`,
            metadata: standardizedMetadata,
            is_completed: true,
            completed_at: new Date().toISOString()
          });

          // Return success URL directly for free courses
          return successResponse(finalSuccessUrl, 'free');
        }

        // Use Stripe price ID if available, otherwise create line item with price data
        let lineItems;
        
        // Determine appropriate Stripe price ID based on environment
        const stripePriceId = isProd()
          ? course.stripe_price_id
          : course.stripe_price_id_dev;
        
        if (stripePriceId) {
          console.log(`Using Stripe price ID: ${stripePriceId}`);
          lineItems = [{ price: stripePriceId, quantity: 1 }];
        } else {
          console.log(`No Stripe price ID found, creating line item with price data`);
          lineItems = [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: isRenewal
                    ? `Renew Access: ${course.title}`
                    : course.title,
                  description: `${course.days_of_access} days of access`,
                },
                unit_amount: Math.round(course.price * 100), // Convert to cents
              },
              quantity: 1,
            },
          ];
        }

        // Build standardized metadata
        standardizedMetadata = {
          ...standardizedMetadata,
          [METADATA_KEYS.COURSE_ID]: courseId,
          [METADATA_KEYS.IS_RENEWAL]: isRenewal ? 'true' : 'false',
          [METADATA_KEYS.DAYS_OF_ACCESS]: course.days_of_access.toString(),
          [METADATA_KEYS.PURCHASE_TYPE]: 'course'
        };

        // Generate the appropriate success/cancel URLs
        const finalSuccessUrl = successUrl || 
          REDIRECT_PATHS.COURSE_SUCCESS.replace('{courseId}', courseId);
        
        const finalCancelUrl = cancelUrl || 
          REDIRECT_PATHS.COURSE_CANCEL.replace('{courseId}', courseId);

        // Create a checkout session for the course
        session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: finalSuccessUrl,
          cancel_url: finalCancelUrl,
          metadata: standardizedMetadata,
          customer_email: user.email
        });

        console.log('Course checkout session created:', session.id);

        // Track the checkout session in the database
        await supabase.from('checkout_sessions').insert({
          stripe_session_id: session.id,
          user_id: userId,
          checkout_type: isRenewal ? 'course_renewal' : 'course_purchase',
          course_id: courseId,
          success_url: finalSuccessUrl,
          cancel_url: finalCancelUrl,
          metadata: standardizedMetadata
        });
      } catch (error) {
        console.error('Error creating course checkout session:', error);
        return errorResponse(
          error.message || 'Error creating checkout session', 
          ERROR_CODES.CHECKOUT_FAILED, 
          500
        );
      }
    }
    // Creating a checkout session for a subscription
    else if (mode === 'subscription' && subscriptionTier && interval) {
      console.log('Creating subscription checkout session for tier:', subscriptionTier, 'interval:', interval);

      // Validate subscription tier and interval
      if (!validTiers.includes(subscriptionTier) || !validIntervals.includes(interval)) {
        return errorResponse(
          'Invalid subscription configuration', 
          ERROR_CODES.INVALID_PARAMETERS, 
          400
        );
      }

      // Map interval to month/year format
      const mappedInterval = interval === 'month' ? 'month' : 'year';

      // Get the price ID for the subscription
      const priceId = SUBSCRIPTION_PRICE_IDS[subscriptionTier]?.[mappedInterval];

      if (!priceId) {
        console.error('Invalid subscription tier or interval');
        return errorResponse(
          'Invalid subscription tier or interval', 
          ERROR_CODES.INVALID_PARAMETERS, 
          400
        );
      }

      console.log('Using price ID:', priceId);

      try {
        // Build standardized metadata
        standardizedMetadata = {
          ...standardizedMetadata,
          [METADATA_KEYS.SUBSCRIPTION_TIER]: subscriptionTier,
          [METADATA_KEYS.INTERVAL]: mappedInterval,
          [METADATA_KEYS.PURCHASE_TYPE]: 'subscription'
        };

        // Generate the appropriate success/cancel URLs
        const finalSuccessUrl = successUrl || REDIRECT_PATHS.SUBSCRIPTION_SUCCESS;
        const finalCancelUrl = cancelUrl || REDIRECT_PATHS.SUBSCRIPTION_CANCEL;

        // Create a checkout session for the subscription
        session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: finalSuccessUrl,
          cancel_url: finalCancelUrl,
          metadata: standardizedMetadata,
          customer_email: user.email,
        });

        console.log('Subscription checkout session created:', session.id);

        // Track the checkout session in the database
        await supabase.from('checkout_sessions').insert({
          stripe_session_id: session.id,
          user_id: userId,
          checkout_type: 'subscription',
          subscription_tier: subscriptionTier,
          interval: mappedInterval,
          success_url: finalSuccessUrl,
          cancel_url: finalCancelUrl,
          metadata: standardizedMetadata
        });
      } catch (error) {
        console.error('Error creating subscription checkout session:', error);
        return errorResponse(
          error.message || 'Error creating checkout session', 
          ERROR_CODES.CHECKOUT_FAILED, 
          500
        );
      }
    } else {
      console.error('Invalid checkout request');
      return errorResponse(
        'Invalid checkout request', 
        ERROR_CODES.INVALID_PARAMETERS, 
        400
      );
    }

    // Verify the session was created successfully
    if (!session || !session.url) {
      console.error('Session was not created properly:', session);
      return errorResponse(
        'Failed to create checkout session', 
        ERROR_CODES.CHECKOUT_FAILED, 
        500
      );
    }

    // Return the session URL and ID
    return successResponse(session.url, session.id);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return errorResponse(
      error.message || 'Server error', 
      ERROR_CODES.CHECKOUT_FAILED, 
      500
    );
  }
};

// Start the server
Deno.serve(handleRequest);