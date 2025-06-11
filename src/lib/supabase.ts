import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { getEnvironmentConfig, envLog } from './env-utils';

// Get environment configuration using our new utilities
const envConfig = getEnvironmentConfig();

// Environment detection
function getEnvironment(): 'development' | 'production' {
  // For local development, always use development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'development';
  }
  
  // Use the environment config
  return envConfig.isProduction ? 'production' : 'development';
}

// Environment-aware Supabase configuration
function getSupabaseConfig() {
  // Detect environment based on hostname and Vite mode
  const isProduction = envConfig.isProduction && (
    window.location.hostname === 'askjds.com' ||
    window.location.hostname === 'jdsimplified.com' ||
    window.location.hostname === 'admin.jdsimplified.com'
  );

  if (isProduction) {
    // Production configuration
    return {
      url: envConfig.supabaseUrl,
      anonKey: envConfig.supabaseAnonKey,
      environment: 'production'
    };
  } else {
    // Development configuration
    return {
      url: envConfig.supabaseUrl,
      anonKey: envConfig.supabaseAnonKey,
      environment: 'development'
    };
  }
}

// Get the configuration
const supabaseConfig = getSupabaseConfig();

// Create a global key for the Supabase client
const GLOBAL_SUPABASE_KEY = '__SUPABASE_CLIENT__';

// Define a global type for the window object
declare global {
  interface Window {
    [GLOBAL_SUPABASE_KEY]?: ReturnType<typeof createClient<Database>>;
    supabaseClient?: ReturnType<typeof createClient<Database>>;
  }
}

// Track initialization state
let isInitializing = false;
let clientInitialized = false;

// Check if we already have a client in the global scope
if (typeof window !== 'undefined') {
  envLog.debug('Checking for existing Supabase client in global scope');
  if (!(GLOBAL_SUPABASE_KEY in window)) {
    envLog.debug('No existing Supabase client found in global scope');
  } else {
    envLog.debug('Found existing Supabase client in global scope');
    clientInitialized = true;
  }
}

// Debug log
envLog.info(`Initializing Supabase client for ${supabaseConfig.environment} environment`, {
  url: supabaseConfig.url,
  hasAnonKey: !!supabaseConfig.anonKey,
  storage: typeof window !== 'undefined' ? 'localStorage available' : 'no localStorage'
});

if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  throw new Error(`Missing Supabase environment variables for ${supabaseConfig.environment} environment`);
}

// Function to get or create the Supabase client
function getSupabaseClient() {
  // Check if we already have a client in the global scope
  if (typeof window !== 'undefined' && GLOBAL_SUPABASE_KEY in window && window[GLOBAL_SUPABASE_KEY]) {
    envLog.debug('Using existing Supabase client from global scope');
    return window[GLOBAL_SUPABASE_KEY];
  }

  // Prevent concurrent initialization
  if (isInitializing) {
    envLog.warn('Supabase client initialization already in progress, creating temporary client');
    // Return a temporary instance that will be replaced once initialization completes
    return createClient<Database>(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        auth: {
          persistSession: true,
          storageKey: 'ask-jds-auth-storage', // Keep consistent key to avoid session loss
          storage: typeof window !== 'undefined' && window.localStorage ? window.localStorage : undefined,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      }
    );
  }

  isInitializing = true;

  // Create a new client
  envLog.info(`Creating new Supabase client instance for ${supabaseConfig.environment}`);
  const instance = createClient<Database>(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      auth: {
        persistSession: true,
        storageKey: 'ask-jds-auth-storage', // Keep consistent key to avoid session loss
        storage: typeof window !== 'undefined' && window.localStorage ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: false
      },
      global: {
        fetch: customFetch
      },
      db: {
        schema: 'public'
      }
    }
  );

  // Store the client in the global scope
  if (typeof window !== 'undefined') {
    window[GLOBAL_SUPABASE_KEY] = instance;
    
    // Also keep the old reference for backward compatibility
    window.supabaseClient = instance;
  }

  clientInitialized = true;
  isInitializing = false;
  return instance;
}

// Custom fetch function with timeout
function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 9);
  
  // Extract URL for logging
  const url = typeof input === 'string' 
    ? new URL(input, window.location.origin).pathname
    : input instanceof URL 
      ? input.pathname
      : 'Request';
  
  envLog.info(`[${requestId}] Starting Supabase request: ${url}`);
  
  // Check network status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    envLog.warn(`[${requestId}] Network appears to be offline. This will likely cause the request to fail.`);
    // Return a rejected promise immediately if we know we're offline
    if (url.includes('/subjects') || url.includes('/collections') || url.includes('/flashcards')) {
      envLog.error(`[${requestId}] Critical flashcard request attempted while offline - rejecting early to prevent hanging UI`);
      return Promise.reject(new Error('Network connection unavailable. Please check your internet connection.'));
    }
  }
  
  // Use a longer timeout for auth-related requests
  const isAuthRequest = url.includes('/auth/') || url.includes('/user_subscriptions');
  const timeoutDuration = isAuthRequest ? 30000 : 10000; // 30 seconds for auth, 10 for others
  
  const timeoutId = setTimeout(() => {
    controller.abort();
    const duration = Date.now() - startTime;
    
    envLog.warn(`[${requestId}] Supabase fetch request timed out after ${timeoutDuration/1000} seconds: ${url} (${duration}ms)`);
    
    // Log additional information about the request
    if (typeof input === 'string') {
      const urlObj = new URL(input, window.location.origin);
      envLog.warn(`[${requestId}] Timed out request details: Path: ${urlObj.pathname}, Search: ${urlObj.search}`);
    }
    
    // Check network status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      envLog.warn(`[${requestId}] Network appears to be offline. This may be causing the timeout.`);
    }
  }, timeoutDuration); // Variable timeout based on request type
  
  // Let Supabase handle auth headers automatically - don't interfere
  const finalInit = { ...init };
  
  const fetchPromise = fetch(input, {
    ...finalInit,
    signal: controller.signal
  });
  
  return fetchPromise
    .then(response => {
      const duration = Date.now() - startTime;
      envLog.info(`[${requestId}] Completed Supabase request: ${url} (${duration}ms) - Status: ${response.status}`);
      return response;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      envLog.error(`[${requestId}] Supabase request failed: ${url} (${duration}ms)`, error);
      
      // If this is an abort error from our timeout, provide a clearer message
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${url} timed out after ${timeoutDuration/1000} seconds. Please check your network connection.`);
      }
      
      // Provide a more user-friendly error for network issues
      if (error.message && error.message.includes('NetworkError') || 
          error.message && error.message.includes('Failed to fetch')) {
        throw new Error(`Network error when requesting ${url}. Please check your internet connection.`);
      }
      
      throw error;
    })
    .finally(() => {
      clearTimeout(timeoutId);
    });
}

// Export the singleton client
export const supabase = getSupabaseClient();

// Check if session is available and pre-fetch to warm up auth
if (typeof window !== 'undefined') {
  setTimeout(() => {
    envLog.info('Pre-fetching auth session to warm up connection...');
    supabase.auth.getSession().catch(err => {
      envLog.warn('Pre-fetch session failed:', err);
    });
  }, 100);
}

// Enhanced error logging with context
export async function logError(
  error: Error | unknown,
  context: string
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stackTrace = error instanceof Error ? error.stack : undefined;
  
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      envLog.error('User not authenticated, skipping error logging');
      return;
    }

    const { error: insertError } = await supabase
      .from('error_logs')
      .insert([{
        message: context ? `${context}: ${errorMessage}` : errorMessage,
        stack_trace: stackTrace,
        investigated: false,
        user_id: user.id
      }]);

    if (insertError) {
      envLog.error('Failed to log error:', insertError);
    }
  } catch (logError) {
    envLog.error('Failed to log error:', logError);
  }
}