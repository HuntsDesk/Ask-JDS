/**
 * Stripe client configuration
 * 
 * This file provides both client and server-side Stripe configurations
 */

import Stripe from 'stripe';

// Get the appropriate environment variables based on environment
const STRIPE_SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET;

// Initialize Stripe with the appropriate API key
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use the latest stable API version
  appInfo: {
    name: 'Ask JDS',
    version: '1.0.0',
  },
});

// Export constants needed for stripe integration
export const UNLIMITED_SUBSCRIPTION_PRICE_ID = {
  monthly: import.meta.env.VITE_STRIPE_UNLIMITED_MONTHLY_PRICE_ID,
  yearly: import.meta.env.VITE_STRIPE_UNLIMITED_YEARLY_PRICE_ID,
};

export const WEBHOOK_SECRET = STRIPE_WEBHOOK_SECRET;

export default stripe;

// For client-side usage
export const loadStripeClient = async () => {
  const stripe = await import('@stripe/stripe-js');
  return stripe.loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
};

// For server-side usage in API routes (SSR environments only)
export const getServerStripe = async () => {
  const Stripe = await import('stripe').then(module => module.default);
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }
  
  return new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16', // Use the latest stable API version
    appInfo: {
      name: 'JD Simplified',
      version: '1.0.0',
    },
  });
};

// Helper for generating idempotency keys
export const generateIdempotencyKey = (prefix: string, userId: string, itemId?: string): string => {
  return `${prefix}_${userId}_${itemId || ''}_${Date.now()}`;
}; 