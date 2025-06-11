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
  'VITE_SUPABASE_ANON_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY'
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
    console.warn(`Using default value for ${key}`);
    return defaultValue;
  }
  
  // Only throw in production if no fallback available
  if (isProduction()) {
    console.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  } else {
    console.warn(`Missing environment variable: ${key} (continuing in development)`);
    return '';
  }
}

/**
 * Get the appropriate Stripe publishable key with environment-aware fallbacks
 */
export function getStripePublishableKey(): string {
  const isProd = isProduction();
  
  console.log('getStripePublishableKey called:', {
    isProd,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    hasRuntimeConfig: typeof window !== 'undefined' && !!window.RUNTIME_CONFIG
  });
  
  if (isProd) {
    // Try production-specific key first
    const prodKey = getRuntimeValue('VITE_STRIPE_PUBLISHABLE_KEY_PROD', 'STRIPE_PUBLISHABLE_KEY_PROD');
    if (prodKey) {
      console.log('Using production Stripe publishable key');
      return prodKey;
    }
    
    // Fallback to legacy key
    const legacyKey = getRuntimeValue('VITE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY');
    if (legacyKey) {
      console.warn('Using legacy Stripe publishable key for production');
      return legacyKey;
    }
    
    throw new Error('Missing production Stripe publishable key');
  } else {
    // Try development-specific key first
    const devKey = getRuntimeValue('VITE_STRIPE_PUBLISHABLE_KEY_DEV', 'STRIPE_PUBLISHABLE_KEY_DEV');
    if (devKey) {
      console.log('Using development Stripe publishable key');
      return devKey;
    }
    
    // Fallback to legacy key
    const legacyKey = getRuntimeValue('VITE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY');
    if (legacyKey) {
      console.warn('Using legacy Stripe publishable key for development');
      return legacyKey;
    }
    
    throw new Error('Missing development Stripe publishable key');
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
    errors.push(`Stripe configuration error: ${error.message}`);
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
    console.error('Environment validation failed:', validation.errors);
    if (validation.warnings.length > 0) {
      console.warn('Environment validation warnings:', validation.warnings);
    }
    
    // In production, we might want to throw, but in development we can continue with warnings
    if (isProduction() && validation.errors.length > 0) {
      throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
    }
  } else if (validation.warnings.length > 0) {
    console.warn('Environment validation warnings:', validation.warnings);
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
      console.debug(`[ENV-DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (!isProduction()) {
      console.info(`[ENV-INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[ENV-WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ENV-ERROR] ${message}`, ...args);
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
  
  console.log('Production Mode:', isProduction());
  console.log('Has Runtime Config:', typeof window !== 'undefined' && !!window.RUNTIME_CONFIG);
  console.log('Has Build-time Config:', typeof import.meta !== 'undefined' && !!import.meta.env);
  
  if (typeof window !== 'undefined' && window.RUNTIME_CONFIG) {
    console.log('Runtime Config Keys:', Object.keys(window.RUNTIME_CONFIG));
  }
  
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    console.log('Build-time Env Keys:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
  }
  
  const validation = validateEnvironment();
  console.log('Validation Result:', validation);
  
  try {
    const config = getEnvironmentConfig();
    console.log('Environment Config:', {
      ...config,
      stripePublishableKey: config.stripePublishableKey ? `${config.stripePublishableKey.substring(0, 12)}...` : 'missing'
    });
  } catch (error) {
    console.error('Failed to get environment config:', error);
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