import { logger } from '@/lib/logger';
/**
 * Environment utilities for consistent environment variable access
 * Provides a single abstraction layer for all environment variable access
 * with runtime configuration fallback support
 */

export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  stripePublishableKey: string;
  isDevelopment: boolean;
  isProduction: boolean;
  buildDomain: string;
}

// Extend window interface for runtime config
declare global {
  interface Window {
    RUNTIME_CONFIG?: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      STRIPE_PUBLISHABLE_KEY: string;
      STRIPE_PUBLISHABLE_KEY_DEV: string;
      STRIPE_PUBLISHABLE_KEY_PROD: string;
      BUILD_DOMAIN: string;
      ENVIRONMENT: string;
      [key: string]: any;
    };
    debugRuntimeConfig?: () => void;
  }
}

// Environment variable validation schema
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
  // Stripe key is checked separately with getStripePublishableKey()
] as const;

/**
 * Get a value from either build-time or runtime configuration
 */
function getRuntimeValue(buildTimeKey: string, runtimeKey?: string): string | undefined {
  // Try build-time first (import.meta.env)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[buildTimeKey]) {
    return import.meta.env[buildTimeKey];
  }
  
  // Try runtime config second
  if (typeof window !== 'undefined' && window.RUNTIME_CONFIG) {
    const actualRuntimeKey = runtimeKey || buildTimeKey.replace('VITE_', '');
    return window.RUNTIME_CONFIG[actualRuntimeKey];
  }
  
  return undefined;
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  // Check build-time environment first
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const isProdBuild = import.meta.env.PROD;
    if (isProdBuild && typeof window !== 'undefined') {
      return window.location.hostname === 'askjds.com' ||
             window.location.hostname === 'jdsimplified.com' ||
             window.location.hostname === 'admin.jdsimplified.com';
    }
  }
  
  // Check runtime config
  if (typeof window !== 'undefined' && window.RUNTIME_CONFIG) {
    return window.RUNTIME_CONFIG.ENVIRONMENT === 'production';
  }
  
  return false;
}

/**
 * Safely access environment variables with validation and runtime fallback
 */
export function getEnvVar(key: string, defaultValue?: string, runtimeKey?: string): string {
  // Try to get from runtime-aware function first
  const runtimeValue = getRuntimeValue(key, runtimeKey);
  if (runtimeValue) {
    return runtimeValue;
  }
  
  // Legacy approach for backward compatibility
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = import.meta.env[key];
    if (value) {
      return value;
    }
  }
  
  if (defaultValue) {
    logger.warn(`Using default value for ${key}`);
    return defaultValue;
  }
  
  // Only throw in production if no fallback available
  if (isProduction()) {
    logger.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  } else {
    logger.warn(`Missing environment variable: ${key} (continuing in development)`);
    return '';
  }
}

/**
 * Get the appropriate Stripe publishable key with environment-aware fallbacks
 */
export function getStripePublishableKey(): string {
  const isProd = isProduction();
  
  logger.debug('getStripePublishableKey called:', {
    isProd,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    hasRuntimeConfig: typeof window !== 'undefined' && !!window.RUNTIME_CONFIG
  });
  
  if (isProd) {
    // Try production-specific key first
    const prodKey = getRuntimeValue('VITE_STRIPE_PUBLISHABLE_KEY_PROD', 'STRIPE_PUBLISHABLE_KEY_PROD');
    if (prodKey) {
      logger.debug('Using production Stripe publishable key');
      return prodKey;
    }
    
    // Fallback to legacy key
    const legacyKey = getRuntimeValue('VITE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY');
    if (legacyKey) {
      logger.warn('Using legacy Stripe publishable key for production');
      return legacyKey;
    }
    
    // Return a placeholder for non-critical pages (like utilities)
    logger.warn('Stripe publishable key not found in build - returning placeholder');
    return 'stripe_key_not_available_in_build';
  } else {
    // Try development-specific key first
    const devKey = getRuntimeValue('VITE_STRIPE_PUBLISHABLE_KEY_DEV', 'STRIPE_PUBLISHABLE_KEY_DEV');
    if (devKey) {
      logger.debug('Using development Stripe publishable key');
      return devKey;
    }
    
    // Fallback to legacy key
    const legacyKey = getRuntimeValue('VITE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY');
    if (legacyKey) {
      logger.warn('Using legacy Stripe publishable key for development');
      return legacyKey;
    }
    
    // Return a placeholder for non-critical pages (like utilities)
    logger.warn('Stripe publishable key not found in build - returning placeholder');
    return 'stripe_key_not_available_in_build';
  }
}

/**
 * Get boolean environment variable with safe parsing
 */
export function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  try {
    const value = getEnvVar(key, defaultValue.toString());
    return value.toLowerCase() === 'true';
  } catch {
    return defaultValue;
  }
}

/**
 * Validate all required environment variables are present with runtime fallback
 */
export function validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if runtime config is available
  const hasRuntimeConfig = typeof window !== 'undefined' && !!window.RUNTIME_CONFIG;
  
  if (!hasRuntimeConfig && typeof import.meta === 'undefined') {
    errors.push('No environment configuration available (neither build-time nor runtime)');
    return { valid: false, errors, warnings };
  }
  
  // Check each required variable
  requiredEnvVars.forEach(varName => {
    try {
      const runtimeKey = varName.replace('VITE_', '');
      const value = getRuntimeValue(varName, runtimeKey);
      
      if (!value) {
        if (isProduction()) {
          errors.push(`Missing required environment variable: ${varName}`);
        } else {
          warnings.push(`Missing environment variable: ${varName} (continuing in development)`);
        }
      }
    } catch (error) {
      errors.push(`Environment variable validation failed for ${varName}: ${error.message}`);
    }
  });
  
  // Special check for Stripe key using the smart function
  try {
    getStripePublishableKey();
  } catch (error) {
    // In production, make Stripe key warnings instead of errors for utilities page
    if (isProduction() && error.message.includes('Stripe publishable key')) {
      warnings.push(`Stripe configuration warning: ${error.message}`);
    } else {
      errors.push(`Stripe configuration error: ${error.message}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get the complete environment configuration with validation
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Validate environment first
  const validation = validateEnvironment();
  
  if (!validation.valid) {
    logger.error('Environment validation failed:', validation.errors);
    if (validation.warnings.length > 0) {
      logger.warn('Environment validation warnings:', validation.warnings);
    }
    
    // In production, we might want to throw, but in development we can continue with warnings
    if (isProduction() && validation.errors.length > 0) {
      throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
    }
  } else if (validation.warnings.length > 0) {
    logger.warn('Environment validation warnings:', validation.warnings);
  }

  return {
    supabaseUrl: getEnvVar('VITE_SUPABASE_URL', '', 'SUPABASE_URL'),
    supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY', '', 'SUPABASE_ANON_KEY'),
    stripePublishableKey: getStripePublishableKey(),
    isDevelopment: !isProduction(),
    isProduction: isProduction(),
    buildDomain: getEnvVar('VITE_BUILD_DOMAIN', 'askjds', 'BUILD_DOMAIN')
  };
}

/**
 * Environment-aware console logging
 */
export const envLog = {
  debug: (message: string, ...args: any[]) => {
    if (!isProduction()) {
      logger.debug(`[ENV-DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (!isProduction()) {
      logger.info(`[ENV-INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    logger.warn(`[ENV-WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    logger.error(`[ENV-ERROR] ${message}`, ...args);
  }
};

/**
 * Get feature flags based on environment
 */
export function getFeatureFlags() {
  return {
    enableDebugLogging: !isProduction(),
    enablePerformanceMonitoring: !isProduction(),
    enableRealtimeRetries: true,
    enableAuthCaching: true,
    maxRetryAttempts: isProduction() ? 3 : 5,
    retryBackoffMultiplier: isProduction() ? 2.0 : 1.5
  };
}

/**
 * Debug function to log all environment information
 */
export function debugEnvironment(): void {
  console.group('🔧 Environment Debug Information');
  
  logger.debug('Production Mode:', isProduction());
  logger.debug('Has Runtime Config:', typeof window !== 'undefined' && !!window.RUNTIME_CONFIG);
  logger.debug('Has Build-time Config:', typeof import.meta !== 'undefined' && !!import.meta.env);
  
  if (typeof window !== 'undefined' && window.RUNTIME_CONFIG) {
    logger.debug('Runtime Config Keys:', Object.keys(window.RUNTIME_CONFIG));
  }
  
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    logger.debug('Build-time Env Keys:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
  }
  
  const validation = validateEnvironment();
  logger.debug('Validation Result:', validation);
  
  try {
    const config = getEnvironmentConfig();
    logger.debug('Environment Config:', {
      ...config,
      stripePublishableKey: config.stripePublishableKey ? `${config.stripePublishableKey.substring(0, 12)}...` : 'missing'
    });
  } catch (error) {
    logger.error('Failed to get environment config:', error);
  }
  
  console.groupEnd();
}

// Initialize environment validation on module load in development
if (typeof window !== 'undefined' && !isProduction()) {
  // Small delay to ensure runtime config is loaded
  setTimeout(() => {
    const validation = validateEnvironment();
    if (!validation.valid && validation.errors.length > 0) {
      envLog.error('Environment validation failed on module load', validation.errors);
    } else if (validation.warnings.length > 0) {
      envLog.warn('Environment validation warnings on module load', validation.warnings);
    } else {
      envLog.debug('Environment validation passed on module load');
    }
  }, 100);
} 