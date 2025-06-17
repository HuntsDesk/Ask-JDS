import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface PricingResponse {
  tier_name: string;
  interval_type: string;
  display_price_cents: number;
  display_currency: string;
  formatted_price: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine environment (default to 'live' for public pricing display)
    const environment = 'live';

    console.log(`Fetching pricing data for environment: ${environment}`);

    // Query active price mappings for the live environment
    const { data: priceMappings, error } = await supabase
      .from('stripe_price_mappings')
      .select('tier_name, interval_type, display_price_cents, display_currency')
      .eq('environment', environment)
      .eq('is_active', true)
      .not('display_price_cents', 'is', null)
      .order('tier_name', { ascending: true })
      .order('interval_type', { ascending: true });

    if (error) {
      console.error('Database error fetching pricing data:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!priceMappings || priceMappings.length === 0) {
      console.warn('No active pricing data found');
      
      // Return fallback pricing data
      const fallbackPricing: PricingResponse[] = [
        {
          tier_name: 'Premium',
          interval_type: 'month',
          display_price_cents: 1000,
          display_currency: 'USD',
          formatted_price: '$10'
        },
        {
          tier_name: 'Unlimited',
          interval_type: 'month',
          display_price_cents: 3000,
          display_currency: 'USD',
          formatted_price: '$30'
        }
      ];

      return new Response(
        JSON.stringify({
          success: true,
          data: fallbackPricing,
          source: 'fallback',
          message: 'Using fallback pricing data'
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            // Shorter cache for fallback data
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
          },
        }
      );
    }

    // Format the pricing data
    const formattedPricing: PricingResponse[] = priceMappings.map((mapping) => {
      const cents = mapping.display_price_cents || 0;
      const currency = mapping.display_currency || 'USD';
      
      // Format price based on currency
      let formattedPrice: string;
      if (currency === 'USD') {
        formattedPrice = `$${(cents / 100).toFixed(0)}`;
      } else if (currency === 'EUR') {
        formattedPrice = `€${(cents / 100).toFixed(0)}`;
      } else if (currency === 'GBP') {
        formattedPrice = `£${(cents / 100).toFixed(0)}`;
      } else {
        formattedPrice = `${currency} ${(cents / 100).toFixed(2)}`;
      }

      return {
        tier_name: mapping.tier_name,
        interval_type: mapping.interval_type,
        display_price_cents: cents,
        display_currency: currency,
        formatted_price: formattedPrice
      };
    });

    console.log(`Successfully retrieved ${formattedPricing.length} pricing entries`);

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedPricing,
        source: 'database',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          // Cache for 5 minutes, allow stale content for 10 minutes while revalidating
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'ETag': `"pricing-${Date.now()}"`,
        },
      }
    );

  } catch (error) {
    console.error('Error in get-pricing function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 