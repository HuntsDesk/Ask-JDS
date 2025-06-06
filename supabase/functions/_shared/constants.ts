// Shared constants for Supabase Edge Functions
// Metadata keys for tracking payment and enrollment data
export const METADATA_KEYS = {
  USER_ID: 'user_id',
  COURSE_ID: 'course_id',
  SUBSCRIPTION_TIER: 'subscription_tier',
  INTERVAL: 'interval',
  SOURCE: 'source',
  IS_RENEWAL: 'is_renewal',
  DAYS_OF_ACCESS: 'days_of_access',
  PURCHASE_TYPE: 'purchase_type'
};

// Error codes for consistent error handling
export const ERROR_CODES = {
  MISSING_AUTH: 'MISSING_AUTH',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  CHECKOUT_FAILED: 'CHECKOUT_FAILED',
  SERVER_ERROR: 'SERVER_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND'
};

// Environment helper function
export const isProd = (): boolean => {
  return Deno.env.get('ENVIRONMENT') === 'production';
}; 