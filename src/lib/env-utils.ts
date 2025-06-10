/**
 * Environment utilities for consistent environment variable access
 * Provides a single abstraction layer for all environment variable access
 */

export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  stripePublishableKey: string;
  isDevelopment: boolean;
  isProduction: boolean;
  buildDomain: string;
}

// Environment variable validation schema
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY'
] as const;

/**
 * Safely access environment variables with validation
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  if (typeof import.meta.env === 'undefined') {
    console.warn(`Environment variables not available, using default for ${key}`);
    return defaultValue || '';
  }

  const value = import.meta.env[key];
  
  if (!value && !defaultValue) {
    console.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || defaultValue || '';
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
 * Validate all required environment variables are present
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  requiredEnvVars.forEach(varName => {
    try {
      getEnvVar(varName);
    } catch (error) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
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
    // In production, we might want to throw, but in development we can continue with warnings
    if (import.meta.env.PROD) {
      throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
    }
  }

  return {
    supabaseUrl: getEnvVar('VITE_SUPABASE_URL'),
    supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
    stripePublishableKey: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY'),
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    buildDomain: getEnvVar('VITE_BUILD_DOMAIN', 'askjds')
  };
}

/**
 * Environment-aware console logging
 */
export const envLog = {
  debug: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.debug(`[ENV-DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
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
    enableDebugLogging: import.meta.env.DEV,
    enablePerformanceMonitoring: import.meta.env.DEV,
    enableRealtimeRetries: true,
    enableAuthCaching: true,
    maxRetryAttempts: import.meta.env.DEV ? 5 : 3,
    retryBackoffMultiplier: import.meta.env.DEV ? 1.5 : 2.0
  };
}

// Initialize environment validation on module load
if (import.meta.env.DEV) {
  const validation = validateEnvironment();
  if (!validation.valid) {
    envLog.warn('Environment validation warnings:', validation.errors);
  } else {
    envLog.debug('Environment validation passed');
  }
} 