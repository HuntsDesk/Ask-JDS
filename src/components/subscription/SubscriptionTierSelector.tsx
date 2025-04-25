import { useState } from 'react';
import { Check, Zap } from 'lucide-react';

export type SubscriptionTier = 'premium' | 'unlimited';
export type BillingInterval = 'monthly' | 'yearly';

interface TierOption {
  id: SubscriptionTier;
  name: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const tiers: TierOption[] = [
  {
    id: 'premium',
    name: 'Premium',
    description: 'Access to premium flashcards and AI chat',
    features: [
      'Unlimited AI chat messages',
      'Full access to premium flashcards',
      'Create and manage custom flashcards',
      'Study progress tracking'
    ]
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    description: 'Full access to all courses and premium features',
    features: [
      'Everything in Premium',
      'Unlimited access to all courses',
      'Early access to new courses',
      'Exclusive community access',
      'Priority support'
    ],
    highlighted: true
  }
];

interface SubscriptionTierSelectorProps {
  selectedTier: SubscriptionTier;
  billingInterval: BillingInterval;
  onTierChange: (tier: SubscriptionTier) => void;
  onIntervalChange: (interval: BillingInterval) => void;
  prices: {
    premium: { monthly: number; yearly: number };
    unlimited: { monthly: number; yearly: number };
  };
  onSubscribe: () => void;
  isLoading?: boolean;
}

export default function SubscriptionTierSelector({
  selectedTier,
  billingInterval,
  onTierChange,
  onIntervalChange,
  prices,
  onSubscribe,
  isLoading = false
}: SubscriptionTierSelectorProps) {
  // Calculate savings percentage for yearly plans
  const premiumSavings = Math.round(100 - (prices.premium.yearly / (prices.premium.monthly * 12)) * 100);
  const unlimitedSavings = Math.round(100 - (prices.unlimited.yearly / (prices.unlimited.monthly * 12)) * 100);

  return (
    <div className="space-y-6">
      {/* Billing interval selector */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            type="button"
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              billingInterval === 'monthly' 
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                : 'text-gray-600 dark:text-gray-300'
            }`}
            onClick={() => onIntervalChange('monthly')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              billingInterval === 'yearly' 
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                : 'text-gray-600 dark:text-gray-300'
            }`}
            onClick={() => onIntervalChange('yearly')}
          >
            Yearly
            {billingInterval === 'yearly' && (
              <span className="ml-2 rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 px-2 py-0.5 text-xs font-medium">
                Save {unlimitedSavings}%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Subscription tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tiers.map((tier) => {
          const price = tier.id === 'premium'
            ? billingInterval === 'monthly' ? prices.premium.monthly : prices.premium.yearly
            : billingInterval === 'monthly' ? prices.unlimited.monthly : prices.unlimited.yearly;
          
          const savings = tier.id === 'premium' ? premiumSavings : unlimitedSavings;
          
          return (
            <div 
              key={tier.id} 
              className={`
                relative border rounded-xl overflow-hidden hover:shadow-md transition-all
                ${selectedTier === tier.id ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-gray-700'}
                ${tier.highlighted ? 'md:transform md:scale-105 shadow-md' : ''}
              `}
            >
              <div 
                className="cursor-pointer h-full"
                onClick={() => onTierChange(tier.id as SubscriptionTier)}
              >
                {tier.highlighted && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-1 px-3 text-xs font-medium rounded-bl-lg">
                    Popular
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{tier.name}</h3>
                    {selectedTier === tier.id && (
                      <Check className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tier.description}</p>
                  
                  <div className="mt-4 mb-6">
                    <span className="text-3xl font-bold">${price}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      /{billingInterval === 'monthly' ? 'month' : 'year'}
                    </span>
                    {billingInterval === 'yearly' && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Save {savings}% with annual billing
                      </div>
                    )}
                  </div>
                  
                  <ul className="space-y-3 mt-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  {selectedTier === tier.id && (
                    <button
                      type="button"
                      className="w-full py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                      onClick={onSubscribe}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          Subscribe Now
                          {tier.id === 'unlimited' && <Zap className="ml-2 h-4 w-4" />}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 