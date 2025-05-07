import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.0.0?dts';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
// Initialize Stripe
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});
// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);
serve(async (req)=>{
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      status: 204
    });
  }
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405
    });
  }
  try {
    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Missing Authorization header', {
        status: 401
      });
    }
    const token = authHeader.replace('Bearer ', '');
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response('Unauthorized', {
        status: 401
      });
    }
    // Parse the request body
    const { returnUrl } = await req.json();
    if (!returnUrl) {
      return new Response('Missing returnUrl parameter', {
        status: 400
      });
    }
    // Get the user's Stripe customer ID
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).limit(1);
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response('Error fetching user profile', {
        status: 500
      });
    }
    const customerId = profiles?.[0]?.stripe_customer_id;
    if (!customerId) {
      return new Response('User does not have a Stripe customer ID', {
        status: 400
      });
    }
    // Create the customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
    // Return the portal session URL
    return new Response(JSON.stringify({
      portal_url: session.url
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return new Response(`Error creating portal session: ${error.message}`, {
      status: 500
    });
  }
});
