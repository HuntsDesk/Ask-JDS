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
  // AI model configuration
  aiPrimaryChatModel: string;
  aiSecondaryTitleModel: string;
  aiModelsLoggingEnabled: boolean;
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
  
  // Model configuration with obfuscated names
  const aiPrimaryChatModel = isProduction
    ? Deno.env.get('AI_MODEL_PRIMARY_PROD') || 'jds-titan'
    : Deno.env.get('AI_MODEL_PRIMARY_DEV') || 'jds-titan';
    
  const aiSecondaryTitleModel = isProduction
    ? Deno.env.get('AI_MODEL_SECONDARY_PROD') || 'jds-flash'
    : Deno.env.get('AI_MODEL_SECONDARY_DEV') || 'jds-flash';
    
  const aiModelsLoggingEnabled = Deno.env.get('AI_MODELS_LOGGING') === 'true';
  
  // Log which environment we're using (helpful for debugging)
  console.log(`Config loaded for ${isProduction ? 'production' : 'development'} environment`);
  
  return {
    isProduction,
    stripeSecretKey,
    stripeWebhookSecret,
    publicAppUrl,
    aiPrimaryChatModel,
    aiSecondaryTitleModel,
    aiModelsLoggingEnabled
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

/**
 * Private mapping of code names to actual model names
 * This prevents exposing the actual model names in the code
 */
const _getActualModelName = (codeName: string): string => {
  const modelMap: Record<string, string> = {
    'jds-titan': 'gemini-2.5-pro-preview-05-06',
    'jds-flash': 'gemini-1.5-flash-8b',
    // Add more mappings as needed for future models
  };
  
  return modelMap[codeName] || codeName; // Fallback to code name if not found
};

/**
 * Get the full API endpoint URL for a given model code name
 * @param modelCodeName The obfuscated code name for the model
 * @returns The complete endpoint URL for the actual model
 */
export const getModelEndpoint = (modelCodeName: string): string => {
  const actualModelName = _getActualModelName(modelCodeName);
  return `https://generativelanguage.googleapis.com/v1beta/models/${actualModelName}:generateContent`;
}; 