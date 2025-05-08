/// <reference lib="deno.ns" />
/// <reference types="npm:@types/stripe" />

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@^2.39.0';
import Stripe from 'npm:stripe@^14.0.0';
import { z } from 'npm:zod@^3.22.4';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Changed to POST as it expects a body
};

// Zod schema for request validation
const GetPaymentStatusRequestSchema = z.object({
  payment_intent_id: z.string().optional(),
  setup_intent_id: z.string().optional(),
}).refine(data => !!data.payment_intent_id || !!data.setup_intent_id, {
  message: "Either payment_intent_id or setup_intent_id must be provided",
});

// Initialize Stripe client
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY'); // TEST key by default
if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY');
}
const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Shared error logging (simplified)
async function logError(supabase: SupabaseClient, message: string, errorDetails: unknown, userId?: string) {
  console.error(message, errorDetails);
  try {
    await supabase.from('error_logs').insert({
      message: \`get-payment-status: ${message}\`,
      error_details: JSON.stringify(errorDetails),
      user_id: userId,
      source: 'get-payment-status',
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
      { global: { headers: { Authorization: \`Bearer ${supabaseToken}\` } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed', detail: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    userId = user.id;

    // This function should be called via POST with a JSON body
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed, please use POST.' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const body = await req.json();
    const validation = GetPaymentStatusRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body', details: validation.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { payment_intent_id, setup_intent_id } = validation.data;
    let status: string | undefined;
    let intentId: string | undefined;
    let clientSecret: string | undefined;
    let errorData: Stripe.StripeRawError | null = null;

    if (payment_intent_id) {
      intentId = payment_intent_id;
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
      status = paymentIntent.status;
      clientSecret = paymentIntent.client_secret ?? undefined;
      // You might want to check if user ID in metadata matches authenticated user for added security.
      // const metadataUserId = paymentIntent.metadata?.supabase_user_id;
      // if (metadataUserId && metadataUserId !== userId) { ... }
    } else if (setup_intent_id) {
      intentId = setup_intent_id;
      const setupIntent = await stripe.setupIntents.retrieve(setup_intent_id);
      status = setupIntent.status;
      clientSecret = setupIntent.client_secret ?? undefined;
      // Similar security check for SetupIntent metadata if applicable.
    }

    if (!status) {
      await logError(supabaseClient, 'Intent not found or status could not be determined', { intentId }, userId);
      return new Response(JSON.stringify({ error: 'Intent not found or status could not be determined' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ id: intentId, status: status, client_secret: clientSecret, error: errorData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    if (e instanceof Stripe.errors.StripeError) {
        errorMessage = e.message;
        if (e.type === 'StripeInvalidRequestError') statusCode = 400;
        // Handle other specific Stripe errors as needed
    }
    const tempSupabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    await logError(tempSupabaseClient, 'General error in get-payment-status', { message: e.message, stack: e.stack }, userId || 'unknown');
    return new Response(JSON.stringify({ error: errorMessage, detail: e.message }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 