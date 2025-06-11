/**
 * Stripe client configuration
 * 
 * This file provides both client and server-side Stripe configurations
 */

import Stripe from 'stripe';
import { getStripePublishableKey, getEnvVar, isProduction } from '@/lib/env-utils';

// Get the appropriate environment variables based on environment

// Helper function to get environment-appropriate price IDs
function getStripePriceId(baseKey: string): string {
  const isProd = isProduction();
  
  if (isProd) {
    // Try production-specific key first
    const prodKey = getEnvVar(`VITE_STRIPE_LIVE_ASKJDS_${baseKey}_PRICE_ID`, '', `STRIPE_LIVE_ASKJDS_${baseKey}_PRICE_ID`);
    if (prodKey) return prodKey;
    
    // Fallback to generic production key
    const genericProdKey = getEnvVar(`VITE_STRIPE_LIVE_${baseKey}_PRICE_ID`, '', `STRIPE_LIVE_${baseKey}_PRICE_ID`);
    if (genericProdKey) return genericProdKey;
  } else {
    // Try development-specific key first
    const devKey = getEnvVar(`VITE_STRIPE_ASKJDS_${baseKey}_PRICE_ID`, '', `STRIPE_ASKJDS_${baseKey}_PRICE_ID`);
    if (devKey) return devKey;
    
    // Fallback to generic development key
    const genericDevKey = getEnvVar(`VITE_STRIPE_${baseKey}_PRICE_ID`, '', `STRIPE_${baseKey}_PRICE_ID`);
    if (genericDevKey) return genericDevKey;
  }
  
  // Legacy fallback
  const legacyKey = getEnvVar(`VITE_STRIPE_${baseKey}_PRICE_ID`, '');
  if (legacyKey) return legacyKey;
  
  throw new Error(`Missing Stripe price ID for ${baseKey} in ${isProd ? 'production' : 'development'} environment`);
}

// Export constants needed for stripe integration
export const UNLIMITED_SUBSCRIPTION_PRICE_ID = {
  get monthly() { return getStripePriceId('UNLIMITED_MONTHLY'); },
  get yearly() { return getStripePriceId('UNLIMITED_YEARLY'); },
};

export const PREMIUM_SUBSCRIPTION_PRICE_ID = {
  get monthly() { return getStripePriceId('PREMIUM_MONTHLY'); },
  get yearly() { return getStripePriceId('PREMIUM_YEARLY'); },
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