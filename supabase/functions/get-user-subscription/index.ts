/// <reference lib="deno.ns" />

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@^2.39.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Define the structure of the subscription data we expect to return
// This should align with what the frontend needs (e.g., from SubscriptionProvider plan)
interface SubscriptionDetails {
  isActive: boolean;
  tierName: string | null; // e.g., 'Premium', 'Unlimited', 'Free'
  stripe_price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  // Add other relevant fields as needed by the frontend
}

// Helper to determine tier name from Stripe Price ID
// This is a simplified example. In a real app, this mapping might be more dynamic
// or fetched from environment variables/database.
function getTierName(stripePriceId: string | null, unlimitedTierPriceIds: string[]): string | null {
  if (!stripePriceId) return 'Free'; // Default to Free if no price ID

  // Example: Check against known Unlimited Tier Price IDs
  // These IDs should be stored in environment variables and passed to the function
  if (unlimitedTierPriceIds.includes(stripePriceId)) {
    return 'Unlimited';
  }
  // Add checks for Premium tier, etc.
  // For now, any other active subscription might be considered 'Premium' or a specific tier name
  // This part needs to be aligned with actual Stripe Price IDs for Premium, etc.
  // e.g. Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID'), Deno.env.get('STRIPE_PREMIUM_ANNUAL_PRICE_ID')
  const premiumMonthly = Deno.env.get('STRIPE_LIVE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID') || Deno.env.get('STRIPE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID');
  const premiumAnnual = Deno.env.get('STRIPE_LIVE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID') || Deno.env.get('STRIPE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID');

  if (stripePriceId === premiumMonthly || stripePriceId === premiumAnnual) {
    return 'Premium';
  }

  return 'Unknown'; // Fallback for unmapped price IDs
}

async function logError(supabase: SupabaseClient, message: string, errorDetails: unknown, userId?: string) {
  console.error(message, errorDetails);
  try {
    await supabase.from('error_logs').insert({
      message: \`get-user-subscription: ${message}\`,
      error_details: JSON.stringify(errorDetails),
      user_id: userId,
      source: 'get-user-subscription',
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
  let authUserId: string | undefined;

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
    authUserId = user.id;

    const { data: subscription, error: dbError } = await supabaseClient
      .from('user_subscriptions')
      .select('status, stripe_price_id, current_period_end, cancel_at_period_end')
      .eq('user_id', authUserId)
      // .in('status', ['active', 'trialing']) // Optionally filter for only active/trialing
      .order('created_at', { ascending: false })
      .maybeSingle(); // Use maybeSingle if a user can have at most one relevant subscription record

    if (dbError) {
      await logError(supabaseClient, 'Database error fetching subscription', dbError, authUserId);
      throw dbError;
    }

    const unlimitedMonthly = Deno.env.get('STRIPE_LIVE_UNLIMITED_MONTHLY_PRICE_ID') || Deno.env.get('STRIPE_UNLIMITED_MONTHLY_PRICE_ID');
    const unlimitedAnnual = Deno.env.get('STRIPE_LIVE_UNLIMITED_ANNUAL_PRICE_ID') || Deno.env.get('STRIPE_UNLIMITED_ANNUAL_PRICE_ID');
    const unlimitedTierPriceIds = [unlimitedMonthly, unlimitedAnnual].filter(id => !!id) as string[];

    if (!subscription) {
      const responseDetails: SubscriptionDetails = {
        isActive: false,
        tierName: 'Free',
        stripe_price_id: null,
        current_period_end: null,
        cancel_at_period_end: null,
      };
      return new Response(JSON.stringify(responseDetails), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isActive = (subscription.status === 'active' || subscription.status === 'trialing') &&
                     new Date(subscription.current_period_end || 0) > new Date();

    const responseDetails: SubscriptionDetails = {
      isActive,
      tierName: isActive ? getTierName(subscription.stripe_price_id, unlimitedTierPriceIds) : 'Free',
      stripe_price_id: subscription.stripe_price_id,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
    };

    return new Response(JSON.stringify(responseDetails), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    const tempSupabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    await logError(tempSupabaseClient, 'General error in get-user-subscription', { message: e.message, stack: e.stack }, authUserId || 'unknown');
    return new Response(JSON.stringify({ error: 'Internal server error', detail: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 