/**
 * Stripe client configuration
 * 
 * This file provides both client and server-side Stripe configurations
 */

import Stripe from 'stripe';
import { getStripePublishableKey } from '@/lib/environment';

// Get the appropriate environment variables based on environment

// Export constants needed for stripe integration
export const UNLIMITED_SUBSCRIPTION_PRICE_ID = {
  monthly: import.meta.env.VITE_STRIPE_UNLIMITED_MONTHLY_PRICE_ID,
  yearly: import.meta.env.VITE_STRIPE_UNLIMITED_YEARLY_PRICE_ID,
};

export const PREMIUM_SUBSCRIPTION_PRICE_ID = {
  monthly: import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID,
  yearly: import.meta.env.VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID,
};

// WEBHOOK_SECRET is a server-side concern.

// The default export of a Stripe instance initialized with a secret key is removed.

// For client-side usage
export const loadStripeClient = async () => {
  const stripe = await import('@stripe/stripe-js');
  return stripe.loadStripe(getStripePublishableKey());
};

// Helper for generating idempotency keys
export const generateIdempotencyKey = (prefix: string, userId: string, itemId?: string): string => {
  return `${prefix}_${userId}_${itemId || ''}_${Date.now()}`;
}; 