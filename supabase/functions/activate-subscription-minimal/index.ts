// Development-only edge function for activating subscriptions
// WITHOUT requiring Stripe payment processing
// ⚠️ WARNING: Do not deploy to production environments

import { createClient } from "npm:@supabase/supabase-js@2.38.0";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper function for activating a subscription
async function activateSubscription(userId: string, priceId: string, supabase) {
  console.log(`Activating subscription for user ${userId} with price ${priceId}`);
  
  try {
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
      return { success: false, error: `Database error: ${subError.message}` };
    }
    
    // Create or update subscription record
    if (existingSub) {
      // Update existing subscription
      const { data: updated, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          stripe_price_id: priceId,
          current_period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id)
        .select();
        
      if (updateError) {
        return { success: false, error: `Failed to update subscription: ${updateError.message}` };
      }
      
      return { 
        success: true, 
        data: updated, 
        message: 'Subscription activated successfully',
        operation: 'update' 
      };
    } else {
      // Create new subscription
      const { data: created, error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          status: 'active',
          stripe_price_id: priceId,
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (insertError) {
        return { success: false, error: `Failed to create subscription: ${insertError.message}` };
      }
      
      return { 
        success: true, 
        data: created, 
        message: 'Subscription created successfully',
        operation: 'insert'
      };
    }
  } catch (error) {
    console.error('Error activating subscription:', error);
    return { success: false, error: error.message };
  }
}

// Serve the function
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get Supabase client with service role (secure, only runs on server)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration missing',
          details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables not set'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request body
    const body = await req.json();
    const { userId, priceId, apiKey } = body;
    
    // Basic API key check for security
    const expectedApiKey = Deno.env.get('ACTIVATION_API_KEY') || 'dev-only-key';
    if (apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid API key',
          message: 'The provided API key is not valid'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Validate required parameters
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
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
    const result = await activateSubscription(userId, priceId, supabase);
    
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
        stack: Deno.env.get('SUPABASE_ENV') === 'development' ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 