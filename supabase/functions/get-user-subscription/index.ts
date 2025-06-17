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

// Cache for price ID mappings (TTL-based)
let priceIdCache: Map<string, string> = new Map();
let cacheLastUpdated = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Database-driven tier name resolution
async function getTierName(supabase: SupabaseClient, stripePriceId: string | null): Promise<string> {
  if (!stripePriceId) return 'Free';

  // Check cache first
  const now = Date.now();
  if (now - cacheLastUpdated < CACHE_TTL_MS && priceIdCache.has(stripePriceId)) {
    return priceIdCache.get(stripePriceId) || 'Free';
  }

  try {
    // Query database for price ID mapping
    const { data: mapping, error } = await supabase
      .from('stripe_price_mappings')
      .select('tier_name')
      .eq('price_id', stripePriceId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Database error fetching price mapping:', error);
      return getFallbackTierName(stripePriceId);
    }

    if (mapping) {
      // Update cache
      priceIdCache.set(stripePriceId, mapping.tier_name);
      if (now - cacheLastUpdated >= CACHE_TTL_MS) {
        cacheLastUpdated = now;
      }
      return mapping.tier_name;
    }

    // No mapping found - use fallback
    console.warn(`No database mapping found for price ID: ${stripePriceId}`);
    return getFallbackTierName(stripePriceId);

  } catch (error) {
    console.error('Error querying price mappings:', error);
    return getFallbackTierName(stripePriceId);
  }
}

// Fallback tier determination (for safety during transition)
function getFallbackTierName(stripePriceId: string): string {
  // Legacy hardcoded mappings as fallback
  const premiumPriceIds = [
    'price_1R8lN7BdYlmFidIZPfXpSHxN', // Live premium monthly
    'price_1RGNMkBdYlmFidIZxZCkTCV9', // Live premium annual
    'price_1QzlzrBAYVpTe3LycwwkNhWV', // Test premium monthly
    'price_1RGNx1BAYVpTe3LyKCxzi9qB', // Test premium annual
  ];

  const unlimitedPriceIds = [
    'price_1RGYLYBdYlmFidIZ4cCnr4ES', // Live unlimited monthly
    'price_1RGYMHBdYlmFidIZHeR6iejB', // Live unlimited annual
    'price_1RGYI5BAYVpTe3LyMK63jgl2', // Test unlimited monthly
    'price_1RGYI5BAYVpTe3LyxrZuofBR', // Test unlimited annual
  ];

  if (unlimitedPriceIds.includes(stripePriceId)) {
    return 'Unlimited';
  }
  
  if (premiumPriceIds.includes(stripePriceId)) {
    return 'Premium';
  }

  console.warn(`Unknown price ID, defaulting to Premium: ${stripePriceId}`);
  return 'Premium'; // Safe fallback for active subscriptions
}

async function logError(supabase: SupabaseClient, message: string, errorDetails: unknown, userId?: string) {
  console.error(message, errorDetails);
  try {
    await supabase.from('error_logs').insert({
      message: 'get-user-subscription: ' + message,
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
      { global: { headers: { Authorization: 'Bearer ' + supabaseToken } } }
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
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (dbError) {
      await logError(supabaseClient, 'Database error fetching subscription', dbError, authUserId);
      throw dbError;
    }

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
    
    // Use database-driven tier determination
    const tierName = isActive ? await getTierName(supabaseClient, subscription.stripe_price_id) : 'Free';

    const responseDetails: SubscriptionDetails = {
      isActive,
      tierName,
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