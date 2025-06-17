import { useMemo } from 'react';
import { MessageSquare, BookOpen, Zap } from 'lucide-react';
import { usePricing, PricingData } from './usePricing';
import { 
  masterFeatures, 
  PricingTier, 
  TierFeatures,
  getTierFeatureInfo, 
  isFeatureIncluded 
} from '@/lib/pricingData';

// Static tier configurations (everything except price)
const staticTierConfigs: Record<string, Omit<PricingTier, 'price'>> = {
  Free: {
    name: 'Free',
    period: 'month',
    description: 'Perfect for trying out Ask JDS and basic flashcard use. Additional sample flashcards included.',
    icon: MessageSquare,
    buttonText: 'Current Plan',
    buttonVariant: 'outline',
    highlight: false,
    features: {
      chat_messages: { included: true, value: '10 per month' },
      personal_flashcards: { included: true },
      premium_flashcards: { included: false },
      video_courses: { included: false },
      priority_support: { included: false },
    },
  },
  Premium: {
    name: 'Premium',
    period: 'month',
    description: 'For serious students needing unlimited chat and all premium flashcards.',
    icon: Zap,
    buttonText: 'Upgrade to Premium',
    buttonVariant: 'default',
    highlight: true,
    features: {
      chat_messages: { included: true, value: 'Unlimited' },
      personal_flashcards: { included: true },
      premium_flashcards: { included: true },
      video_courses: { included: false },
      priority_support: { included: false },
    },
  },
  Unlimited: {
    name: 'Unlimited',
    period: 'month',
    description: 'Complete access to all features, including every video course and resource.',
    icon: BookOpen,
    buttonText: 'Get Unlimited Access',
    buttonVariant: 'default',
    highlight: false,
    features: {
      chat_messages: { included: true, value: 'Unlimited' },
      personal_flashcards: { included: true },
      premium_flashcards: { included: true },
      video_courses: { included: true },
      priority_support: { included: true },
    },
  },
};

/**
 * Hook that combines static tier configuration with dynamic pricing from database
 * Returns fully formed PricingTier objects with live pricing data
 */
export function useDynamicPricing() {
  const { data: pricingData, isLoading, error } = usePricing();

  const pricingTiers = useMemo(() => {
    if (!pricingData) return [];

    // Create pricing lookup map for quick access
    const pricingMap = new Map<string, PricingData>();
    pricingData.forEach(pricing => {
      const key = `${pricing.tier_name}-${pricing.interval_type}`;
      pricingMap.set(key, pricing);
    });

    // Build complete tier objects
    const tiers: PricingTier[] = [];

    // Add Free tier (always static pricing)
    if (staticTierConfigs.Free) {
      tiers.push({
        ...staticTierConfigs.Free,
        price: '$0'
      });
    }

    // Add dynamic tiers (Premium, Unlimited)
    ['Premium', 'Unlimited'].forEach(tierName => {
      const staticConfig = staticTierConfigs[tierName];
      const dynamicPricing = pricingMap.get(`${tierName}-month`);

      if (staticConfig) {
        const finalPrice = dynamicPricing?.formatted_price || (staticConfig.name === 'Premium' ? '$10' : '$30');
        
        tiers.push({
          ...staticConfig,
          price: finalPrice
        });
      }
    });

    return tiers;
  }, [pricingData]);

  return {
    pricingTiers,
    masterFeatures,
    isLoading,
    error,
    // Helper functions (re-exported for convenience)
    getTierFeatureInfo: (tier: PricingTier, featureId: string) => getTierFeatureInfo(tier, featureId),
    isFeatureIncluded: (tier: PricingTier, featureId: string) => isFeatureIncluded(tier, featureId),
    // Raw pricing data for advanced use cases
    rawPricingData: pricingData
  };
}

/**
 * Hook to get pricing for a specific tier by name
 */
export function useTierByName(tierName: string) {
  const { pricingTiers, isLoading, error } = useDynamicPricing();
  
  const tier = useMemo(() => {
    return pricingTiers.find(t => t.name.toLowerCase() === tierName.toLowerCase());
  }, [pricingTiers, tierName]);

  return {
    tier,
    isLoading,
    error,
    exists: !!tier
  };
} 