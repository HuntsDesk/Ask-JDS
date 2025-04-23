/**
 * Shared constants for Stripe checkout and webhook handling
 */

// Standardized redirect URL paths with placeholders
export const REDIRECT_PATHS = {
  COURSE_SUCCESS: '/thank-you?session_id={CHECKOUT_SESSION_ID}',
  COURSE_CANCEL: '/courses/{courseId}',
  SUBSCRIPTION_SUCCESS: '/thank-you?session_id={CHECKOUT_SESSION_ID}',
  SUBSCRIPTION_CANCEL: '/subscribe'
};

// Standardized metadata keys to ensure consistency between checkout and webhooks
export const METADATA_KEYS = {
  USER_ID: 'userId',
  COURSE_ID: 'courseId',
  IS_RENEWAL: 'isRenewal',
  DAYS_OF_ACCESS: 'daysOfAccess',
  SUBSCRIPTION_TIER: 'subscriptionTier',
  INTERVAL: 'interval',
  PURCHASE_TYPE: 'purchaseType',
  SOURCE: 'source'
};

// Standard error codes for improved debugging
export const ERROR_CODES = {
  MISSING_AUTH: 'ERR_MISSING_AUTH',
  UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  COURSE_NOT_FOUND: 'ERR_COURSE_NOT_FOUND',
  INVALID_METADATA: 'ERR_INVALID_METADATA',
  INVALID_PARAMETERS: 'ERR_INVALID_PARAMETERS',
  CHECKOUT_FAILED: 'ERR_CHECKOUT_FAILED',
  WEBHOOK_INVALID: 'ERR_WEBHOOK_INVALID',
  WEBHOOK_PROCESSING: 'ERR_WEBHOOK_PROCESSING',
  DUPLICATE_EVENT: 'ERR_DUPLICATE_EVENT'
};

// Helper for environment detection
export const isProd = () => {
  const env = Deno.env.get('ENVIRONMENT');
  return env === 'production';
};

// Standard response type for checkout endpoints
export interface CheckoutResponse {
  status: 'success' | 'error';
  url?: string;
  sessionId?: string;
  error?: string;
  errorCode?: string;
}

// Type for completed checkout metadata
export interface CheckoutMetadata {
  userId: string;
  courseId?: string;
  isRenewal?: string;
  daysOfAccess?: string;
  subscriptionTier?: string;
  interval?: string;
  purchaseType: 'course' | 'subscription';
  source?: string;
} 