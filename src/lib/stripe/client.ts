/**
 * Stripe client configuration
 * 
 * This file provides both client and server-side Stripe configurations
 */

import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

// Only keep publishable key - remove other sensitive keys
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing Stripe publishable key');
}

/**
 * Initialize Stripe client
 * @returns Stripe client instance
 */
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Export constants needed for stripe integration
export const UNLIMITED_SUBSCRIPTION_PRICE_ID = {
  monthly: import.meta.env.VITE_STRIPE_UNLIMITED_MONTHLY_PRICE_ID,
  yearly: import.meta.env.VITE_STRIPE_UNLIMITED_YEARLY_PRICE_ID,
};

export const WEBHOOK_SECRET = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET;

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