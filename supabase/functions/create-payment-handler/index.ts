/// <reference lib="deno.ns" />

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@^2.39.0';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';
import { z } from 'npm:zod@^3.22.4';
import { getCoursePriceId, getConfig, validateConfig, STRIPE_API_VERSION } from '../_shared/config.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Zod schema for request validation
const PaymentHandlerRequestSchema = z.object({
  targetStripePriceId: z.string().optional(),
  purchaseType: z.enum(['subscription', 'course_purchase']),
  courseId: z.string().uuid().optional(),
  isRenewal: z.boolean().optional().default(false),
  // stripeCustomerId is optional; if provided, attempts to use existing customer
  stripeCustomerId: z.string().optional(),
  // days_of_access is required for course_purchase if not centrally defined
  // For simplicity, we'll expect it for now.
  days_of_access: z.number().int().positive().optional(),
  // Added parameters for determining fallback price IDs
  coursePurchaseType: z.enum(['standard']).optional(),
  subscriptionType: z.enum(['premium', 'unlimited']).optional(),
  // Accept user_id from legacy clients that use snake_case
  user_id: z.string().uuid().optional(),
  // Alternative for cases where planInterval is specified
  planInterval: z.enum(['month', 'year']).optional(),
  // Debug mode for enhanced logging
  debug: z.boolean().optional().default(false),
});

type PaymentHandlerRequest = z.infer<typeof PaymentHandlerRequestSchema>;

// Shared error logging (simplified)
async function logError(supabase: SupabaseClient, message: string, errorDetails: unknown, userId?: string) {
  console.error(message, errorDetails);
  try {
    await supabase.from('error_logs').insert({
      message: 'create-payment-handler: ' + message,
      error_details: JSON.stringify(errorDetails),
      user_id: userId,
      source: 'create-payment-handler',
    });
  } catch (e) {
    console.error('Failed to log error to Supabase:', e);
  }
}

// Helper to determine price ID based on course ID, purchase type, and environment
async function determinePriceId(
  supabase: SupabaseClient,
  config: ReturnType<typeof getConfig>,
  targetStripePriceId: string | undefined,
  purchaseType: string,
  courseId?: string,
  coursePurchaseType?: string,
  subscriptionType?: string,
  userId?: string,
  planInterval?: string
): Promise<string | null> {
  // If targetStripePriceId is provided and not empty, use it directly
  if (targetStripePriceId && targetStripePriceId !== '') {
    console.log(`Using provided targetStripePriceId: ${targetStripePriceId}`);
    return targetStripePriceId;
  }

  const environment = config.isProduction ? 'production' : 'test';
  console.log(`Environment mode: ${environment}`);
  
  // For subscriptions, use the clean naming pattern
  if (purchaseType === 'subscription' && subscriptionType) {
    try {
      const tier = subscriptionType.toLowerCase();
      
      // Log all relevant parameters
      console.log(`Determining price ID for subscription: ${JSON.stringify({
        tier,
        environment,
        userId
      })}`);
      
      // Function to resolve price ID from environment variables using a consistent pattern
      const resolvePriceId = (domain: string, tierName: string): string | null => {
        // Try multiple naming patterns to handle potential mismatches
        
        // Pattern 1: Domain_Tier_Monthly (primary pattern)
        // Example: STRIPE_LIVE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID
        const domainPattern = `STRIPE_${environment === 'production' ? 'LIVE_' : ''}${domain.toUpperCase()}_${tierName.toUpperCase()}_MONTHLY_PRICE_ID`;
        
        // Pattern 2: Just Tier_Monthly (no domain prefix)
        // Example: STRIPE_PREMIUM_MONTHLY_PRICE_ID
        const noDomainPattern = `STRIPE_${environment === 'production' ? 'LIVE_' : ''}${tierName.toUpperCase()}_MONTHLY_PRICE_ID`;
        
        // Pattern 3: Legacy/fallback pattern
        // Example: STRIPE_PREMIUM_FALLBACK_PRICE_ID
        const fallbackPattern = `STRIPE_${tierName.toUpperCase()}_FALLBACK_PRICE_ID`;
        
        // Pattern 4: Very basic pattern (last resort)
        // Example: STRIPE_PRICE_ID
        const basicFallbackPattern = `STRIPE_${tierName.toUpperCase()}_PRICE_ID`;
        
        // Check all patterns in order of preference
        const domainValue = Deno.env.get(domainPattern);
        const noDomainValue = Deno.env.get(noDomainPattern);
        const fallbackValue = Deno.env.get(fallbackPattern);
        const basicValue = Deno.env.get(basicFallbackPattern);
        
        // Detailed logging of all pattern checks
        console.log(`[DEBUG] Price ID resolution for tier "${tierName}" in "${environment}" mode:`, {
          patterns: {
            domainPattern,
            noDomainPattern,
            fallbackPattern,
            basicFallbackPattern
          },
          results: {
            domainValue: domainValue ? 'FOUND' : 'NOT FOUND',
            noDomainValue: noDomainValue ? 'FOUND' : 'NOT FOUND',
            fallbackValue: fallbackValue ? 'FOUND' : 'NOT FOUND',
            basicValue: basicValue ? 'FOUND' : 'NOT FOUND'
          }
        });
        
        // Return the first value that exists, in order of preference
        return domainValue || noDomainValue || fallbackValue || basicValue || null;
      };
      
      // First try with the domain-specific pricing (ASKJDS)
      let priceId = resolvePriceId('ASKJDS', tier);
      
      // If not found, try generic pricing without domain prefix
      if (!priceId) {
        priceId = resolvePriceId('', tier);
      }
      
      // If we found a price ID, return it
      if (priceId) {
        console.log(`Using price ID: ${priceId}`);
        return priceId;
      }
      
      // List all available environment variables that might be relevant for debugging
      const allEnvVars = Object.keys(Deno.env.toObject())
        .filter(key => key.includes('STRIPE') && !key.includes('SECRET'))
        .join(', ');
      
      console.log(`Available env vars: ${allEnvVars}`);
      
      throw new Error(`Could not find a valid price ID for subscription type: ${tier}`);
    } catch (e) {
      await logError(supabase, `Error determining subscription price ID`, e, userId);
      throw e; // Re-throw to be caught by the main handler
    }
  }
  
  // For course purchases, use a similar pattern but with course-specific information
  if (purchaseType === 'course_purchase' && courseId) {
    try {
      console.log(`Looking up price ID for course: ${courseId}`);
      
      // Try to get the course record with both price IDs
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, stripe_price_id, stripe_price_id_dev')
        .eq('id', courseId)
        .single();
        
      if (courseError) {
        await logError(supabase, `Error fetching course data for price ID`, courseError, userId);
        throw courseError;
      } 
      
      if (!course) {
        throw new Error(`Course not found: ${courseId}`);
      }
      
      // Use the shared config function to get environment-appropriate price ID
      try {
        const priceId = getCoursePriceId(course);
        console.log(`Found course price ID using shared config: ${priceId}`);
          return priceId;
      } catch (error) {
        console.log(`Course price ID not found in database: ${error instanceof Error ? error.message : String(error)}`);
        
        // If the database doesn't have the required price ID, try environment variables as fallback
      const courseType = coursePurchaseType || 'standard';
      
      // Function to resolve course price ID from environment variables
      const resolveCoursePrice = (): string | null => {
        // Try finding the course by ID in a mapping
        const courseMapping: Record<string, string> = {
          '78b1d8b7-3cb6-4cc5-8dcc-8cf4ac498b66': 'CIVIL_PROCEDURE',
          'c24190af-bd00-4d6f-b1af-3170f93e61fe': 'EVIDENCE',
          '913deaf2-aad3-40c3-b487-004e414ca827': 'INTESTACY',
        };
        
        if (courseId && courseId in courseMapping) {
          const courseName = courseMapping[courseId];
          const courseKey = `STRIPE_${environment === 'production' ? 'LIVE_' : ''}COURSE_${courseName}_${courseType.toUpperCase()}_PRICE_ID`;
          const fallbackKey = `STRIPE_COURSE_${courseType.toUpperCase()}_FALLBACK_PRICE_ID`;
          
          const primaryValue = Deno.env.get(courseKey);
          const fallbackValue = Deno.env.get(fallbackKey);
          
          console.log(`Checking for course price ID with:
            - Primary key: ${courseKey} (${primaryValue ? 'FOUND' : 'NOT FOUND'})
            - Fallback key: ${fallbackKey} (${fallbackValue ? 'FOUND' : 'NOT FOUND'})`);
          
          return primaryValue || fallbackValue || null;
        }
        
        return null;
      };
      
      const coursePrice = resolveCoursePrice();
      if (coursePrice) {
        console.log(`Using course price ID from environment: ${coursePrice}`);
        return coursePrice;
        }
        
        // If we still can't find a price ID, re-throw the original error
        throw error;
      }
    } catch (e) {
      await logError(supabase, `Error determining course price ID`, e, userId);
      throw e;
    }
  }
  
  // If we reach here, we couldn't determine a price ID
  await logError(
    supabase, 
    `Failed to determine price ID`, 
    { 
      targetStripePriceId, 
      purchaseType, 
      courseId, 
      coursePurchaseType, 
      subscriptionType,
      planInterval,
      environment
    }, 
    userId
  );
  
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let supabaseClient: SupabaseClient;
  let userId: string | undefined;
  let debugMode = false;

  try {
    // Load and validate configuration
    const config = getConfig();
    console.log(`Running in ${config.isProduction ? 'production' : 'development'} mode`);
    
    const { isValid, missingKeys } = validateConfig(config);
    if (!isValid) {
      console.error(`Missing configuration: ${missingKeys.join(', ')}`);
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error', 
          details: `Missing required environment variables: ${missingKeys.join(', ')}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe with environment-appropriate key
    const stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: STRIPE_API_VERSION,
      httpClient: Stripe.createFetchHttpClient(),
    });

    const authorization = req.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseToken = authorization.split(' ')[1];

    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: 'Bearer ' + supabaseToken } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed', detail: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    userId = user.id;

    const body = await req.json();
    const validation = PaymentHandlerRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body', details: validation.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      targetStripePriceId,
      purchaseType,
      courseId,
      isRenewal,
      stripeCustomerId: initialStripeCustomerId,
      days_of_access,
      coursePurchaseType,
      subscriptionType,
      user_id: providedUserId,
      planInterval,
      debug,
    } = validation.data;
    
    // Enable debug mode based on the request parameter
    debugMode = debug === true;
    if (debugMode) {
      console.log('DEBUG MODE ENABLED');
      console.log('Request body:', JSON.stringify(body, null, 2));
      console.log('Environment variables:', Object.keys(Deno.env.toObject())
        .filter(key => key.includes('STRIPE') && !key.includes('SECRET'))
        .join(', '));
    }

    // Use provided user_id if available (for legacy compatibility)
    if (providedUserId) {
      userId = providedUserId;
    }

    // Validate and determine the price ID to use
    const resolvedPriceId = await determinePriceId(
      supabaseClient,
      config,
      targetStripePriceId,
      purchaseType,
      courseId,
      coursePurchaseType,
      subscriptionType,
      userId,
      planInterval
    );
    
    if (!resolvedPriceId) {
      // Gather information about the environment variables we checked
      let checkedVariables = [];
      
      if (purchaseType === 'subscription' && subscriptionType) {
        const tier = subscriptionType.toLowerCase();
        const environment = config.isProduction ? 'production' : 'test';
        
        // Add the primary key patterns we would have checked
        checkedVariables.push(`STRIPE_${environment === 'production' ? 'LIVE_' : ''}ASKJDS_${tier.toUpperCase()}_MONTHLY_PRICE_ID`);
        checkedVariables.push(`STRIPE_${tier.toUpperCase()}_FALLBACK_PRICE_ID`);
        
        // For generic pricing
        checkedVariables.push(`STRIPE_${environment === 'production' ? 'LIVE_' : ''}${tier.toUpperCase()}_MONTHLY_PRICE_ID`);
      }
      
      await logError(supabaseClient, 'Unable to determine price ID', {
        purchaseType,
        subscriptionType,
        courseId,
        planInterval,
        environment: config.isProduction ? 'production' : 'test',
        checkedVariables
      }, userId);
      
      // Get a list of available Stripe-related environment variables for debugging
      const availableEnvVars = Object.keys(Deno.env.toObject())
        .filter(key => key.includes('STRIPE') && !key.includes('SECRET'))
        .join(', ');
      
      return new Response(JSON.stringify({ 
        error: 'Unable to determine price ID', 
        detail: `A valid Stripe price ID could not be determined for ${purchaseType}${subscriptionType ? ' ('+subscriptionType+')' : ''}. Please check that environment variables are set correctly.`,
        debug_info: {
          checked_variables: checkedVariables,
          available_variables: availableEnvVars,
          environment: config.isProduction ? 'production' : 'test'
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let customerId = initialStripeCustomerId;
    let stripeCustomer: Stripe.Customer | undefined;

    // Retrieve or create Stripe Customer
    if (!customerId) {
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 'No rows found'
        await logError(supabaseClient, 'Error fetching profile', profileError, userId);
        throw new Error('Error fetching profile: ' + profileError.message);
      }
      if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id;
      } else {
        stripeCustomer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: userId },
        });
        customerId = stripeCustomer.id;
        const { error: updateProfileError } = await supabaseClient
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
        if (updateProfileError) {
          await logError(supabaseClient, 'Failed to update profile with Stripe customer ID', updateProfileError, userId);
          // Non-fatal, but log it.
        }
      }
    }
     if (!customerId) { // Should be set by now
        await logError(supabaseClient, 'Failed to retrieve or create Stripe customer ID', {}, userId);
        throw new Error('Failed to retrieve or create Stripe customer ID');
    }


    let clientSecret: string | null = null;
    const commonMetadata = {
        supabase_user_id: userId,
        purchase_type: purchaseType,
        target_stripe_price_id: resolvedPriceId,
    };

    if (purchaseType === 'course_purchase') {
      if (!courseId) {
        return new Response(JSON.stringify({ error: 'courseId is required for course_purchase' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Create a mutable variable for days_of_access
      let courseDaysOfAccess = days_of_access;
      
      if (!courseDaysOfAccess) {
        // Fetch from the 'courses' table if not provided
        const { data: courseData, error: courseError } = await supabaseClient
            .from('courses')
            .select('days_of_access')
            .eq('id', courseId)
            .single();

        if (courseError || !courseData?.days_of_access) {
             await logError(supabaseClient, 'days_of_access not provided and not found on course', { courseId, courseError }, userId);
            return new Response(JSON.stringify({ error: 'days_of_access is required for course_purchase and could not be determined.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        
        // Use the days_of_access from the course
        courseDaysOfAccess = courseData.days_of_access;
        console.log(`Using days_of_access from database: ${courseDaysOfAccess}`);
      }

      // Log details before creating payment intent
      console.log(`Creating PaymentIntent with price ID: ${resolvedPriceId} for course: ${courseId}`);

      try {
        // Verify price exists before attempting to retrieve it
        const price = await stripe.prices.retrieve(resolvedPriceId);
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: price.unit_amount || 0,
          currency: price.currency,
          customer: customerId,
          automatic_payment_methods: { enabled: true },
          metadata: {
            ...commonMetadata,
            course_id: courseId,
            is_renewal: String(isRenewal),
            days_of_access: courseDaysOfAccess ? String(courseDaysOfAccess) : '30', // Use course-specific value with 30-day fallback
          },
        });
        clientSecret = paymentIntent.client_secret;
      } catch (stripeError) {
        await logError(supabaseClient, 'Error creating Stripe PaymentIntent', stripeError, userId);
        return new Response(JSON.stringify({ 
          error: 'Failed to create payment intent', 
          detail: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (purchaseType === 'subscription') {
      // Log details before creating subscription
      console.log(`Creating Subscription with price ID: ${resolvedPriceId}`);
      
      try {
        // Verify price exists before attempting to use it
        await stripe.prices.retrieve(resolvedPriceId);
        
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: resolvedPriceId }],
          payment_settings: { save_default_payment_method: 'on_subscription' },
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
          metadata: commonMetadata,
        });

        if (
          subscription.latest_invoice &&
          typeof subscription.latest_invoice === 'object' &&
          subscription.latest_invoice.payment_intent &&
          typeof subscription.latest_invoice.payment_intent === 'object' &&
          subscription.latest_invoice.payment_intent.client_secret
        ) {
          clientSecret = subscription.latest_invoice.payment_intent.client_secret;
        } else {
           await logError(supabaseClient, 'Could not extract client_secret from subscription', { subscriptionId: subscription.id }, userId);
          throw new Error('Could not extract client_secret from subscription.');
        }
      } catch (stripeError) {
        await logError(supabaseClient, 'Error creating Stripe Subscription', stripeError, userId);
        return new Response(JSON.stringify({ 
          error: 'Failed to create subscription', 
          detail: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!clientSecret) {
      await logError(supabaseClient, 'Failed to create payment intent or subscription', { purchaseType }, userId);
      throw new Error('Failed to create Stripe payment intent or subscription.');
    }

    return new Response(JSON.stringify({ client_secret: clientSecret }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    // Ensure Supabase client is available for logging if error happened before its init.
    // This is a simplified error handling for brevity.
    const tempSupabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorStack = e instanceof Error ? e.stack : undefined;
    await logError(tempSupabaseClient, 'General error in create-payment-handler', { message: errorMessage, stack: errorStack }, userId || 'unknown');
    return new Response(JSON.stringify({ error: 'Internal server error', detail: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 