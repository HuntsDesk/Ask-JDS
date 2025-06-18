import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MessageSquare, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useSubscriptionWithTier } from '@/hooks/useSubscription';

// Simplified pricing tiers for homepage (Free and Unlimited only - Premium temporarily hidden)
const homepageTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'month',
    description: 'Perfect for trying out Ask JDS and basic flashcard use. Additional sample flashcards included.',
    icon: MessageSquare,
    buttonText: 'Sign-up For Free',
    buttonVariant: 'outline',
    highlight: false,
    tagline: 'FREE FOREVER',
    features: [
      '10 Ask JDS chat messages per month',
      'Create unlimited personal flashcards',
      'Flashcard study mode',
      'Access from any device',
    ],
  },
  {
    name: 'Unlimited',
    price: '$10',
    period: 'month',
    description: 'For serious students needing unlimited chat, all premium flashcards, and complete course access.',
    icon: Zap,
    buttonText: 'Get Unlimited Access',
    buttonVariant: 'default',
    highlight: true,
    tagline: 'MOST POPULAR',
    features: [
      'Unlimited Ask JDS messages',
      'Create unlimited personal flashcards',
      '400+ Expert curated flashcards',
      'Unlimited access to ALL video courses',
      'Flashcard study mode',
      'Access from any device',
      'Priority Support',
    ],
  },
];

interface PricingCardsProps {
  variant?: 'homepage' | 'full';
  className?: string;
}

export function PricingCards({ variant = 'homepage', className = '' }: PricingCardsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tierName, isActive: hasActiveSubscription } = useSubscriptionWithTier();

  const handleSubscribe = (tierName: string) => {
    if (!user) {
      navigate('/auth?tab=signup');
      return;
    }
    
    if (tierName === 'Free') {
      // For Free tier, redirect to chat since they already have free access
      navigate('/chat');
      return;
    }
    
    // For Unlimited, redirect to settings for upgrade
    navigate('/settings');
  };

  const isCurrentTier = (planName: string) => {
    return tierName === planName;
  };

  return (
    <div className={`flex flex-col md:flex-row justify-center gap-8 max-w-5xl mx-auto ${className}`}>
      {homepageTiers.map((tier, index) => {
        const TierIcon = tier.icon;
        const isUserCurrentTier = isCurrentTier(tier.name);
        
        return (
          <div
            key={index}
            className={`relative flex flex-col p-6 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.03] w-full md:w-1/2
              ${tier.highlight 
                ? 'bg-orange-500 text-white ring-2 ring-orange-600 dark:ring-orange-400' 
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
              }
            `}
          >
            {tier.highlight && (
              <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-600 dark:bg-orange-400 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-md">
                  {tier.tagline}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-3">
              <TierIcon className={`w-7 h-7 ${tier.highlight ? 'text-white' : 'text-orange-500 dark:text-orange-400'}`} />
              <h3 className={`text-2xl font-bold ${tier.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{tier.name}</h3>
            </div>
            
            <div className="mb-4">
              <span className={`text-3xl font-extrabold ${tier.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{tier.price}</span>
              <span className={`text-sm ${tier.highlight ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}>/month</span>
            </div>
            
            <p className={`text-sm mb-5 min-h-[60px] ${tier.highlight ? 'text-orange-50' : 'text-gray-600 dark:text-gray-300'}`}>
              {tier.description}
            </p>
            
            <ul className="space-y-3 mb-6 flex-grow">
              {tier.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-white' : 'text-green-500'}`} />
                  <span className={`${tier.highlight ? 'text-white/95' : 'text-gray-700 dark:text-gray-200'}`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            
            <Button
              onClick={() => handleSubscribe(tier.name)}
              size="lg"
              className={`w-full mt-auto ${
                tier.highlight 
                  ? 'bg-white text-orange-600 hover:bg-gray-100 dark:bg-gray-100 dark:hover:bg-gray-200' 
                  : tier.name === 'Free'
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                    : 'bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700'
              }`}
              disabled={isUserCurrentTier && tier.name === 'Free'}
            >
              {user ? (
                isUserCurrentTier ? 'Current Plan' : 
                tier.name === 'Free' ? 'Start Chatting' :
                hasActiveSubscription ? 'Start Chatting' : 'Upgrade Now'
              ) : (
                tier.buttonText
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
} 