import { logger } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PricingData {
  tier_name: string;
  interval_type: string;
  display_price_cents: number;
  display_currency: string;
  formatted_price: string;
}

interface PricingResponse {
  success: boolean;
  data: PricingData[];
  source: 'database' | 'fallback';
  message?: string;
  timestamp?: string;
}

// Static fallback pricing - Premium tier temporarily hidden, Unlimited at $10
const FALLBACK_PRICING: PricingData[] = [
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
    display_price_cents: 1000, // Updated to $10 (was 3000)
    display_currency: 'USD',
    formatted_price: '$10'     // Updated to $10 (was $30)
  }
];

// Fetch pricing data from Edge Function
const fetchPricing = async (): Promise<PricingData[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-pricing', {
      method: 'GET'
    });
    
    if (error) {
      logger.warn('Edge function error, using fallback pricing:', error);
      return FALLBACK_PRICING;
    }

    const response = data as PricingResponse;
    
    if (!response.success || !response.data || response.data.length === 0) {
      logger.warn('Invalid response from pricing function, using fallback');
      return FALLBACK_PRICING;
    }

    logger.debug(`Loaded pricing from ${response.source}:`, response.data.length, 'entries');
    return response.data;
    
  } catch (error) {
    logger.error('Failed to fetch pricing, using fallback:', error);
    return FALLBACK_PRICING;
  }
};

/**
 * Hook to fetch pricing data with caching and fallbacks
 * Returns pricing data formatted for display components
 */
export function usePricing() {
  return useQuery({
    queryKey: ['pricing'],
    queryFn: fetchPricing,
    staleTime: 5 * 60 * 1000, // 5 minutes - matches Edge Function cache
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    retry: 1, // Only retry once to avoid delays
    refetchOnWindowFocus: false, // Don't refetch on tab focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    placeholderData: FALLBACK_PRICING, // Show fallback immediately while loading
  });
}

/**
 * Helper function to get pricing for a specific tier
 */
export function useTierPricing(tierName: string, interval: string = 'month') {
  const { data: allPricing, isLoading, error } = usePricing();
  
  const tierPricing = allPricing?.find(
    p => p.tier_name.toLowerCase() === tierName.toLowerCase() && 
         p.interval_type === interval
  );

  return {
    pricing: tierPricing,
    isLoading,
    error,
    formattedPrice: tierPricing?.formatted_price || 'Price unavailable'
  };
}

/**
 * Helper function to format pricing data for the pricing components
 * Transforms database format to match existing component expectations
 */
export function usePricingForComponents() {
  const { data: pricingData, isLoading, error } = usePricing();

  // Transform to match existing component structure
  const transformedPricing = pricingData?.map(pricing => ({
    name: pricing.tier_name,
    price: pricing.formatted_price,
    period: pricing.interval_type,
    // Add any other fields that existing components expect
    tier_name: pricing.tier_name,
    interval_type: pricing.interval_type,
    display_price_cents: pricing.display_price_cents,
    display_currency: pricing.display_currency,
  }));

  return {
    pricing: transformedPricing || [],
    isLoading,
    error,
    isEmpty: !transformedPricing || transformedPricing.length === 0
  };
} 