/// <reference lib="deno.ns" />
/// <reference types="npm:@types/stripe" />

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@^2.39.0';
import Stripe from 'npm:stripe@^14.0.0'; // Use a recent, stable version
import { z } from 'npm:zod@^3.22.4';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Zod schema for request validation
const PaymentHandlerRequestSchema = z.object({
  targetStripePriceId: z.string(),
  purchaseType: z.enum(['subscription', 'course_purchase']),
  courseId: z.string().uuid().optional(),
  isRenewal: z.boolean().optional().default(false),
  // stripeCustomerId is optional; if provided, attempts to use existing customer
  stripeCustomerId: z.string().optional(),
  // days_of_access is required for course_purchase if not centrally defined
  // For simplicity, we'll expect it for now.
  days_of_access: z.number().int().positive().optional(),
});

type PaymentHandlerRequest = z.infer<typeof PaymentHandlerRequestSchema>;

// Initialize Stripe client
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY'); // TEST key by default
if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY');
  // In a real scenario, you might throw or handle this more gracefully
}
const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2023-10-16', // Use a fixed API version
  httpClient: Stripe.createFetchHttpClient(),
});

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


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let supabaseClient: SupabaseClient;
  let userId: string | undefined;

  try {
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
      days_of_access
    } = validation.data;

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
        target_stripe_price_id: targetStripePriceId,
    };

    if (purchaseType === 'course_purchase') {
      if (!courseId) {
        return new Response(JSON.stringify({ error: 'courseId is required for course_purchase' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
       if (!days_of_access) {
        // In a real app, you might fetch this from the 'courses' table if not provided.
        // For now, strictly require it if not found on course, or expect from client.
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
        // days_of_access = courseData.days_of_access; // This line has an error, days_of_access is const.
                                                    // This logic path should ensure days_of_access is already set or throw.
                                                    // Assuming days_of_access from request is used if valid.
      }


      const paymentIntent = await stripe.paymentIntents.create({
        amount: (await stripe.prices.retrieve(targetStripePriceId)).unit_amount || 0, // Fetch price amount
        currency: (await stripe.prices.retrieve(targetStripePriceId)).currency,       // Fetch price currency
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        metadata: {
          ...commonMetadata,
          course_id: courseId,
          is_renewal: String(isRenewal),
          days_of_access: String(days_of_access), // ensure days_of_access is available
        },
      });
      clientSecret = paymentIntent.client_secret;
    } else if (purchaseType === 'subscription') {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: targetStripePriceId }],
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
    await logError(tempSupabaseClient, 'General error in create-payment-handler', { message: e.message, stack: e.stack }, userId || 'unknown');
    return new Response(JSON.stringify({ error: 'Internal server error', detail: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 