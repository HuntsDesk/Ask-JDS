import { MessageSquare, BookOpen, Zap } from 'lucide-react';

// TypeScript interfaces for pricing data
export interface Feature {
  id: string;
  displayName: string;
  category: string;
  note?: boolean;
  noteOnly?: boolean;
}

export interface TierFeatures {
  [key: string]: {
    included: boolean;
    value?: string;
    noteOnly?: boolean;
  };
}

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: any;
  buttonText: string;
  buttonVariant: string;
  highlight: boolean;
  features: TierFeatures;
}

// Master list of all features
export const masterFeatures: Feature[] = [
  { id: 'chat_messages', displayName: 'Ask JDS chat messages', category: 'Core Features' },
  { id: 'personal_flashcards', displayName: 'Create & manage unlimited personal flashcards', category: 'Core Features' },
  { id: 'premium_flashcards', displayName: '400+ Expert Curated Flashcards', category: 'Flashcards' },
  { id: 'sample_flashcards_note', displayName: 'Sample premium cards included in Free tier', category: 'Flashcards', note: true, noteOnly: true },
  { id: 'video_courses', displayName: 'Unlimited access to ALL video courses', category: 'Courses' },
  { id: 'priority_support', displayName: 'Priority Support', category: 'Support' },
];

// Pricing tiers configuration
export const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
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
  {
    name: 'Premium',
    price: '$10',
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
  {
    name: 'Unlimited',
    price: '$30',
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
];

// Helper functions
export const getTierFeatureInfo = (tier: PricingTier, featureId: string) => {
  return tier.features[featureId];
};

export const isFeatureIncluded = (tier: PricingTier, featureId: string): boolean => {
  return tier.features[featureId]?.included || false;
}; 