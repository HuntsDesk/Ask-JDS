'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    description: 'Access to premium courses and content',
    features: [
      'Individual course purchases',
      'Course discussion forums',
      'Exercise files and resources',
      'Course completion certificates'
    ]
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    description: 'Full access to all courses and premium features',
    features: [
      'Unlimited access to all courses',
      'Early access to new courses',
      'Exclusive community access',
      'Live Q&A sessions',
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
        <div className="inline-flex items-center p-1 bg-muted rounded-lg">
          <Button
            variant={billingInterval === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onIntervalChange('monthly')}
            className="rounded-md"
          >
            Monthly
          </Button>
          <Button
            variant={billingInterval === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onIntervalChange('yearly')}
            className="rounded-md"
          >
            Yearly
            {billingInterval === 'yearly' && (
              <span className="ml-2 rounded-full bg-primary-foreground text-primary px-2 py-0.5 text-xs font-medium">
                Save {unlimitedSavings}%
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Subscription tiers */}
      <RadioGroup
        value={selectedTier}
        onValueChange={(value) => onTierChange(value as SubscriptionTier)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {tiers.map((tier) => {
          const price = tier.id === 'premium'
            ? billingInterval === 'monthly' ? prices.premium.monthly : prices.premium.yearly
            : billingInterval === 'monthly' ? prices.unlimited.monthly : prices.unlimited.yearly;
          
          const savings = tier.id === 'premium' ? premiumSavings : unlimitedSavings;
          
          return (
            <div 
              key={tier.id} 
              className={cn(
                "relative",
                tier.highlighted && "md:scale-105 md:shadow-lg"
              )}
            >
              <RadioGroupItem
                value={tier.id}
                id={tier.id}
                className="sr-only"
              />
              <Label
                htmlFor={tier.id}
                className="cursor-pointer"
              >
                <Card className={cn(
                  "h-full overflow-hidden transition-all",
                  selectedTier === tier.id 
                    ? "ring-2 ring-primary" 
                    : "hover:border-primary/50",
                  tier.highlighted && "border-primary/50"
                )}>
                  {tier.highlighted && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground py-1 px-3 text-xs font-medium rounded-bl-lg">
                      Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{tier.name}</span>
                      {selectedTier === tier.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">${price}</span>
                      <span className="text-muted-foreground ml-1">
                        /{billingInterval === 'monthly' ? 'month' : 'year'}
                      </span>
                      {billingInterval === 'yearly' && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Save {savings}% with annual billing
                        </div>
                      )}
                    </div>
                    <ul className="space-y-2 mt-4">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {selectedTier === tier.id && (
                      <Button
                        className="w-full"
                        onClick={onSubscribe}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Subscribe Now'}
                        {tier.id === 'unlimited' && <Zap className="ml-2 h-4 w-4" />}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
} 