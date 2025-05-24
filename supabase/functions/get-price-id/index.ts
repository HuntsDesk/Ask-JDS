import { corsHeaders } from '../_shared/cors.ts';

interface GetPriceIdRequest {
  tier: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // Parse request body
    const { tier }: GetPriceIdRequest = await req.json();

    if (!tier) {
      return new Response(
        JSON.stringify({ error: 'Missing tier parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Getting price ID for tier: ${tier}`);

    // Determine price ID based on tier
    let priceId: string | null = null;

    switch (tier.toLowerCase()) {
      case 'unlimited':
        // Use monthly unlimited price ID from environment
        priceId = Deno.env.get('STRIPE_ASKJDS_UNLIMITED_MONTHLY_PRICE_ID') || 
                  Deno.env.get('STRIPE_UNLIMITED_MONTHLY_PRICE_ID');
        break;
      case 'premium':
        // Use monthly premium price ID from environment  
        priceId = Deno.env.get('STRIPE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID') ||
                  Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID');
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown tier: ${tier}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    if (!priceId) {
      console.error(`No price ID found for tier: ${tier}`);
      return new Response(
        JSON.stringify({ error: `No price ID configured for tier: ${tier}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Returning price ID: ${priceId} for tier: ${tier}`);

    return new Response(
      JSON.stringify({ priceId, tier }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-price-id function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 