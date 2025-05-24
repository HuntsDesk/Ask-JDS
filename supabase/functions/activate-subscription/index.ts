/// <reference lib="deno.ns" />
/// <reference types="npm:@types/stripe" />
import { createClient } from "npm:@supabase/supabase-js@2.38.0";
import Stripe from "npm:stripe@17.7.0";
import { getConfig, validateConfig, STRIPE_API_VERSION } from "../_shared/config.ts";
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
// Handler to manually activate a subscription
async function activateSubscription(userId, priceId, supabase, stripeInstance) {
  console.log(`Manually activating subscription for user ${userId} with price ${priceId}`);
  try {
    // Get customer ID
    const { data: profile, error: profileError } = await supabase.from('profiles').select('stripe_customer_id').eq('id', userId).single();
    if (profileError) {
      throw new Error(`Failed to get profile: ${profileError.message}`);
    }
    let customerId = profile?.stripe_customer_id;
    // Create a customer if they don't have one
    if (!customerId) {
      // Get user email
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError || !userData?.user?.email) {
        throw new Error(`Failed to get user email: ${userError?.message || 'No user found'}`);
      }
      const customer = await stripeInstance.customers.create({
        email: userData.user.email,
        metadata: {
          supabase_user_id: userId
        }
      });
      customerId = customer.id;
      // Update profile with customer ID
      await supabase.from('profiles').update({
        stripe_customer_id: customerId
      }).eq('id', userId);
    }
    // Set end date to 1 month from now
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    // Check if subscription already exists
    const { data: existingSub, error: subError } = await supabase.from('user_subscriptions').select('id').eq('user_id', userId).maybeSingle();
    if (subError) {
      console.error('Error checking for existing subscription:', subError);
    }
    // Create or update subscription record using correct column names
    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase.from('user_subscriptions').update({
        stripe_subscription_id: `manual_activation_${Date.now()}`,
        stripe_customer_id: customerId,
        stripe_price_id: priceId,
        status: 'active',
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      }).eq('id', existingSub.id);
      if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`);
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase.from('user_subscriptions').insert({
        user_id: userId,
        stripe_subscription_id: `manual_activation_${Date.now()}`,
        stripe_customer_id: customerId,
        stripe_price_id: priceId,
        status: 'active',
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (insertError) {
        throw new Error(`Failed to create subscription: ${insertError.message}`);
      }
    }
    return {
      success: true,
      message: 'Subscription activated successfully'
    };
  } catch (error) {
    console.error('Error activating subscription:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
Deno.serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Load configuration based on environment
    const config = getConfig();
    console.log(`Running in ${config.isProduction ? 'production' : 'development'} mode`);
    // Validate configuration
    const { isValid, missingKeys } = validateConfig(config);
    if (!isValid) {
      console.error(`Missing configuration: ${missingKeys.join(', ')}`);
      return new Response(JSON.stringify({
        error: 'Server configuration error',
        details: `Missing required environment variables: ${missingKeys.join(', ')}`
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Initialize Stripe with config
    const stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: STRIPE_API_VERSION
    });
    // Get request body early to support both auth flows
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (jsonError) {
      console.error('Invalid JSON in request body:', jsonError);
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { priceId, userId: specificUserId } = body;
    if (!priceId) {
      return new Response(JSON.stringify({
        error: 'Price ID is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get Supabase client setup
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    console.log('Supabase URL:', supabaseUrl ? 'Available' : 'Missing');
    console.log('Supabase service key:', supabaseServiceKey ? 'Available' : 'Missing');
    console.log('Supabase anon key:', supabaseAnonKey ? 'Available' : 'Missing');
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        error: 'Supabase configuration missing'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Enhanced authorization handling
    // Extract authorization header and try multiple approaches
    const authorization = req.headers.get('Authorization') || req.headers.get('authorization');
    let supabaseAuthToken = null;
    let user = null;
    let userId = null;
    console.log(`Authorization header ${authorization ? 'found' : 'not found'}`);
    // Approach 1: Check if we have a Bearer token in the Authorization header
    if (authorization && authorization.startsWith('Bearer ')) {
      console.log('Auth token received (first 10 chars):', authorization.substring(0, 17) + '...');
      supabaseAuthToken = authorization.replace('Bearer ', '');
      // Create Supabase client with the ANON key and user's token for user verification
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${supabaseAuthToken}`
          }
        }
      });
      console.log('Attempting to get user from auth token...');
      // Try to get the user from the token
      try {
        const { data, error } = await userSupabase.auth.getUser(supabaseAuthToken);
        if (!error && data.user) {
          console.log(`Successfully authenticated user: ${data.user.id}`);
          user = data.user;
          userId = data.user.id;
        } else {
          console.error('Error verifying user token:', error);
        }
      } catch (authErr) {
        console.error('Error verifying user token:', authErr);
      }
    }
    // Approach 2: If we couldn't get a user from the token, and a specific userId was provided,
    // use the service role to activate the subscription for that user
    if (!userId && specificUserId) {
      console.log(`Using provided userId: ${specificUserId}`);
      userId = specificUserId;
    }
    // Approach 3: Check for other token formats (JWT, etc.)
    if (!userId && authorization) {
      console.log('Trying to parse JWT directly');
      try {
        // Simple JWT parsing (header.payload.signature)
        const parts = authorization.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.sub) {
            console.log(`Extracted user ID from JWT: ${payload.sub}`);
            userId = payload.sub;
          }
        }
      } catch (jwtErr) {
        console.error('Error parsing JWT:', jwtErr);
      }
    }
    // Verify we have a user ID to work with
    if (!userId) {
      console.error('Could not determine user ID from authorization or request body');
      return new Response(JSON.stringify({
        error: 'Authentication error',
        details: 'Could not determine user ID from authorization or request body'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Use the service role client for database operations
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    // Verify the user exists
    const { data: userData, error: userError } = await serviceSupabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      console.error('Error verifying user existence:', userError || 'User not found');
      return new Response(JSON.stringify({
        error: 'User not found',
        details: userError?.message || 'No user found with the provided ID'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`User verified: ${userData.user.email}`);
    // Activate subscription
    const result = await activateSubscription(userId, priceId, serviceSupabase, stripe);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Unhandled error in activate-subscription:', error);
    return new Response(JSON.stringify({
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
