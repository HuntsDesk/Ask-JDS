// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import Stripe from "npm:stripe@17.7.0";
import { corsHeaders } from "../_shared/cors.ts";
console.info('Customer portal session server started');
const handler = async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Get request body
    const { userId } = await req.json();
    // Validate required parameters
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'User ID is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-03-31.basil'
    });
    // Get the user's Stripe customer ID
    const { data: subscription, error: subscriptionError } = await supabase.from('user_subscriptions').select('stripe_customer_id').eq('user_id', userId).order('created_at', {
      ascending: false
    }).limit(1).single();
    if (subscriptionError || !subscription?.stripe_customer_id) {
      return new Response(JSON.stringify({
        error: 'No subscription found for this user'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Create a customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${req.headers.get('origin') || Deno.env.get('PUBLIC_APP_URL')}/chat`
    });
    // Return the portal URL
    return new Response(JSON.stringify({
      url: session.url
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
};
Deno.serve(handler);
