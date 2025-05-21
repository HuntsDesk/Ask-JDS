/// <reference lib="deno.ns" />
/// <reference types="npm:@types/stripe" />

import { createClient } from "npm:@supabase/supabase-js@2.38.0";
import Stripe from "npm:stripe@17.7.0";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize Stripe
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',
});

// Handler to manually activate a subscription
async function activateSubscription(userId: string, priceId: string, supabase) {
  console.log(`Manually activating subscription for user ${userId} with price ${priceId}`);
  
  try {
    // Get customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      throw new Error(`Failed to get profile: ${profileError.message}`);
    }
    
    let customerId = profile?.stripe_customer_id;
    
    // Create a customer if they don't have one
    if (!customerId) {
      // Get user email
      const { data: userData, error: userError } = await supabase
        .auth.admin.getUserById(userId);
        
      if (userError || !userData?.user?.email) {
        throw new Error(`Failed to get user email: ${userError?.message || 'No user found'}`);
      }
      
      const customer = await stripe.customers.create({
        email: userData.user.email,
        metadata: { supabase_user_id: userId }
      });
      
      customerId = customer.id;
      
      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }
    
    // Set end date to 1 month from now
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    
    // Check if subscription already exists
    const { data: existingSub, error: subError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (subError) {
      console.error('Error checking for existing subscription:', subError);
    }
    
    // Create or update subscription record
    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          user_id: userId,
          subscription_id: `manual_activation_${Date.now()}`, // Manual ID
          stripe_customer_id: customerId,
          price_id: priceId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id);
        
      if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`);
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          subscription_id: `manual_activation_${Date.now()}`, // Manual ID
          stripe_customer_id: customerId,
          price_id: priceId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          quantity: 1
        });
        
      if (insertError) {
        throw new Error(`Failed to create subscription: ${insertError.message}`);
      }
    }
    
    return { success: true, message: 'Subscription activated successfully' };
  } catch (error) {
    console.error('Error activating subscription:', error);
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Validate request
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAuthToken = authorization.replace('Bearer ', '');
    
    console.log(`Auth token received (first 10 chars): ${supabaseAuthToken.substring(0, 10)}...`);
    console.log(`Supabase URL: ${supabaseUrl ? 'Available' : 'Missing'}`);
    console.log(`Supabase service key: ${supabaseServiceKey ? 'Available' : 'Missing'}`);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        global: {
          headers: { Authorization: `Bearer ${supabaseAuthToken}` }
        }
      }
    );
    
    // Verify user
    console.log('Attempting to get user from auth token...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error verifying user token:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication error', 
          details: userError.message,
          code: userError.code || 'unknown'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!user) {
      console.error('No user found from token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No user found' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`User authenticated: ${user.id}`);
    
    // Get request body
    const body = await req.json();
    const { priceId } = body;
    
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Price ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Activate subscription
    const result = await activateSubscription(user.id, priceId, supabase);
    
    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 