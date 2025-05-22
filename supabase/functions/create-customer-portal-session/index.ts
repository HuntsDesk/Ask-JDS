import { createClient } from "npm:@supabase/supabase-js@2.7.1";
import Stripe from "npm:stripe@12.6.0";
import { getConfig, validateConfig, STRIPE_API_VERSION } from "../_shared/config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.info('Customer portal session server started');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Load configuration based on environment
    const config = getConfig();
    console.log(`Running in ${config.isProduction ? 'production' : 'development'} mode`);
    
    // Validate configuration
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
    
    console.log('Processing request');
    
    // Log request headers for debugging
    const authHeader = req.headers.get('authorization');
    console.log(`Authorization header present: ${!!authHeader}`);
    
    // Get request body
    let body;
    try {
      body = await req.json();
      console.log('Request body parsed successfully:', body);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { userId } = body;

    // Validate required parameters
    if (!userId) {
      console.error('Missing userId in request body');
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating portal session for user: ${userId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Stripe with environment-specific key
    const stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: STRIPE_API_VERSION,
    });

    // Check if the user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !authUser?.user) {
      console.error('Error checking user existence:', authError || 'User not found');
      return new Response(
        JSON.stringify({ error: 'User not found', details: authError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`User exists in auth.users: ${authUser.user.email}`);

    // Get the user's Stripe customer ID
    console.log(`Querying for user subscription with ID: ${userId}`);
    
    // First check if the table exists
    const { count, error: tableError } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true });
      
    if (tableError) {
      console.error('Error accessing user_subscriptions table:', tableError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: tableError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${count} total records in user_subscriptions table`);
    
    // Get any subscriptions for this user
    const { data: allUserSubs, error: allSubsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId);
      
    if (allSubsError) {
      console.error('Error querying all user subscriptions:', allSubsError);
    } else {
      console.log(`Found ${allUserSubs?.length || 0} total subscriptions for user ${userId}`);
      if (allUserSubs && allUserSubs.length > 0) {
        console.log('Subscription records:', allUserSubs);
      }
    }

    // First check if the user has any active subscriptions
    const { data: activeSubscriptions, error: activeSubError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false });
      
    if (activeSubError) {
      console.error('Error checking for active subscriptions:', activeSubError);
    } else {
      console.log(`Found ${activeSubscriptions?.length || 0} active subscriptions`);
    }
    
    // If user doesn't have a subscription, check if they're a legacy user with privileges
    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      console.log('No active subscription found, checking for legacy privileged status');
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_privileged, admin_granted_subscription')
          .eq('id', userId)
          .single();
          
        if (!profileError && profileData) {
          console.log('Profile data:', profileData);
          
          if (profileData.is_privileged || profileData.admin_granted_subscription) {
            console.log('User has admin-granted subscription or privileged status');
            
            return new Response(
              JSON.stringify({ 
                error: 'No Stripe subscription found',
                details: 'This user has special access granted by an admin, which cannot be managed through the Stripe portal.'
              }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (profileErr) {
        console.error('Error checking for privileged status:', profileErr);
      }
    }

    // Now get the most recent subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError) {
      console.error('Subscription query error:', subscriptionError);
      return new Response(
        JSON.stringify({ 
          error: 'Error fetching subscription data', 
          details: subscriptionError.message,
          code: subscriptionError.code
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Subscription query result:', subscription);

    if (!subscription?.stripe_customer_id) {
      console.error('No stripe_customer_id found for user');
      return new Response(
        JSON.stringify({ 
          error: 'No subscription found for this user',
          details: 'The user does not have a stripe_customer_id in the database'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating portal session for customer: ${subscription.stripe_customer_id}`);
    
    // Create a customer portal session
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${req.headers.get('origin') || config.publicAppUrl}/chat`,
      });

      console.log('Portal session created successfully');
      
      // Return the portal URL
      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return new Response(
        JSON.stringify({ error: 'Error creating Stripe portal session', details: stripeError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 