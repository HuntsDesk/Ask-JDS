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

    let customerIdToUse = null;
    
    // Check if we got a customer ID from the subscription
    if (subscription?.stripe_customer_id) {
      customerIdToUse = subscription.stripe_customer_id;
      console.log(`Found stripe_customer_id in subscription: ${customerIdToUse}`);
    } else {
      // If no customer ID found in subscriptions, check the profiles table
      console.log('No customer ID found in subscriptions, checking profiles table');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();
        
      if (!profileError && profileData?.stripe_customer_id) {
        customerIdToUse = profileData.stripe_customer_id;
        console.log(`Found stripe_customer_id in profile: ${customerIdToUse}`);
      }
    }
    
    // If still no customer ID, create one
    if (!customerIdToUse) {
      console.log('No stripe_customer_id found in database, creating new customer');
      try {
        // Create a new customer in Stripe
        const customer = await stripe.customers.create({
          email: authUser.user.email,
          metadata: {
            user_id: userId
          }
        });
        
        customerIdToUse = customer.id;
        console.log(`Created new Stripe customer: ${customerIdToUse}`);
        
        // Update the profiles table with the new customer ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerIdToUse })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating profile with new customer ID:', updateError);
          // Continue anyway since we have the customer ID
        } else {
          console.log('Updated profile with new customer ID');
        }
        
        // Create a placeholder subscription record if needed
        if (!subscription) {
          const now = new Date();
          const futureDate = new Date();
          futureDate.setDate(now.getDate() + 30); // 30 days from now
          
          const { error: insertError } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              stripe_customer_id: customerIdToUse,
              status: 'inactive', // Mark as inactive since they haven't paid yet
              current_period_end: futureDate.toISOString(),
              cancel_at_period_end: false,
              created_at: now.toISOString(),
              updated_at: now.toISOString()
            });
            
          if (insertError) {
            console.error('Error creating placeholder subscription record:', insertError);
            // Continue anyway since we have the customer ID
          } else {
            console.log('Created placeholder subscription record');
          }
        }
      } catch (stripeError) {
        console.error('Error creating Stripe customer:', stripeError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create Stripe customer', 
            details: stripeError.message 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // At this point, we should have a customer ID to use
    if (!customerIdToUse) {
      console.error('Could not find or create a Stripe customer ID');
      return new Response(
        JSON.stringify({ 
          error: 'No subscription found for this user',
          details: 'Could not find or create a Stripe customer ID'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating portal session for customer: ${customerIdToUse}`);
    
    // Create a customer portal session
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerIdToUse,
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