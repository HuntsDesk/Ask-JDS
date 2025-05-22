/**
 * Shared configuration module for Supabase Edge Functions
 * Centralizes environment detection and configuration
 */

// Define the shape of our configuration
export interface AppConfig {
  isProduction: boolean;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  publicAppUrl: string;
  // Add more environment-specific configuration as needed
}

// Standard Stripe API Version for backend functions
export const STRIPE_API_VERSION = '2025-04-30.basil';

/**
 * Get the application configuration based on the current environment
 */
export const getConfig = (): AppConfig => {
  // Detect environment
  const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
  
  // Get environment-specific values
  const stripeSecretKey = isProduction
    ? Deno.env.get('STRIPE_LIVE_SECRET_KEY') || ''
    : Deno.env.get('STRIPE_SECRET_KEY') || '';
    
  const stripeWebhookSecret = isProduction
    ? Deno.env.get('STRIPE_LIVE_WEBHOOK_SECRET') || ''
    : Deno.env.get('STRIPE_TEST_WEBHOOK_SECRET') || '';
    
  const publicAppUrl = Deno.env.get('PUBLIC_APP_URL') || '';
  
  // Log which environment we're using (helpful for debugging)
  console.log(`Config loaded for ${isProduction ? 'production' : 'development'} environment`);
  
  return {
    isProduction,
    stripeSecretKey,
    stripeWebhookSecret,
    publicAppUrl,
  };
};

/**
 * Validate that all required configuration is present
 * @param config The configuration to validate
 * @returns An object with validation result and any missing keys
 */
export const validateConfig = (config: AppConfig): { isValid: boolean; missingKeys: string[] } => {
  const missingKeys: string[] = [];
  
  if (!config.stripeSecretKey) missingKeys.push(config.isProduction ? 'STRIPE_LIVE_SECRET_KEY' : 'STRIPE_SECRET_KEY');
  if (!config.stripeWebhookSecret) missingKeys.push(config.isProduction ? 'STRIPE_LIVE_WEBHOOK_SECRET' : 'STRIPE_TEST_WEBHOOK_SECRET');
  if (!config.publicAppUrl) missingKeys.push('PUBLIC_APP_URL');
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys
  };
}; 