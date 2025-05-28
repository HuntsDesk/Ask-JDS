import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Environment detection
function getEnvironment(): 'development' | 'production' {
  // For local development, always use development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'development';
  }
  
  // Check for explicit environment variable
  const envMode = import.meta.env.VITE_ENVIRONMENT;
  if (envMode === 'production') {
    return 'production';
  }
  
  // Default to development for safety
  return 'development';
}

// Environment-aware Supabase configuration
function getSupabaseConfig() {
  // Detect environment based on hostname and Vite mode
  const isProduction = import.meta.env.PROD && (
    window.location.hostname === 'askjds.com' ||
    window.location.hostname === 'jdsimplified.com' ||
    window.location.hostname === 'admin.jdsimplified.com'
  );

  if (isProduction) {
    // Production configuration
    return {
      url: import.meta.env.VITE_SUPABASE_URL_PROD || 'https://prbbuxgirnecbkpdpgcb.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_PROD,
      environment: 'production'
    };
  } else {
    // Development configuration (fallback to legacy env vars for backward compatibility)
    return {
      url: import.meta.env.VITE_SUPABASE_URL_DEV || import.meta.env.VITE_SUPABASE_URL || 'https://prbbuxgirnecbkpdpgcb.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_DEV || import.meta.env.VITE_SUPABASE_ANON_KEY,
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
  console.log('Checking for existing Supabase client in global scope');
  if (!(GLOBAL_SUPABASE_KEY in window)) {
    console.log('No existing Supabase client found in global scope');
  } else {
    console.log('Found existing Supabase client in global scope');
    clientInitialized = true;
  }
}

// Debug log
console.log(`Initializing Supabase client for ${supabaseConfig.environment} environment:`, {
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
    console.log('Using existing Supabase client from global scope');
    return window[GLOBAL_SUPABASE_KEY];
  }

  // Prevent concurrent initialization
  if (isInitializing) {
    console.warn('Supabase client initialization already in progress, creating temporary client');
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
  console.log(`Creating new Supabase client instance for ${supabaseConfig.environment}`);
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
  
  console.log(`[${requestId}] Starting Supabase request: ${url}`);
  
  // Check network status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn(`[${requestId}] Network appears to be offline. This will likely cause the request to fail.`);
    // Return a rejected promise immediately if we know we're offline
    if (url.includes('/subjects') || url.includes('/collections') || url.includes('/flashcards')) {
      console.error(`[${requestId}] Critical flashcard request attempted while offline - rejecting early to prevent hanging UI`);
      return Promise.reject(new Error('Network connection unavailable. Please check your internet connection.'));
    }
  }
  
  // Use a longer timeout for auth-related requests
  const isAuthRequest = url.includes('/auth/') || url.includes('/user_subscriptions');
  const timeoutDuration = isAuthRequest ? 30000 : 10000; // 30 seconds for auth, 10 for others
  
  const timeoutId = setTimeout(() => {
    controller.abort();
    const duration = Date.now() - startTime;
    
    console.warn(`[${requestId}] Supabase fetch request timed out after ${timeoutDuration/1000} seconds: ${url} (${duration}ms)`);
    
    // Log additional information about the request
    if (typeof input === 'string') {
      const urlObj = new URL(input, window.location.origin);
      console.warn(`[${requestId}] Timed out request details: Path: ${urlObj.pathname}, Search: ${urlObj.search}`);
    }
    
    // Check network status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn(`[${requestId}] Network appears to be offline. This may be causing the timeout.`);
    }
  }, timeoutDuration); // Variable timeout based on request type
  
  // Add auth headers if available and not already included
  let finalInit = { ...init };
  if (isAuthRequest && typeof window !== 'undefined') {
    const authStorage = localStorage.getItem('ask-jds-auth-storage');
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        if (authData?.access_token && (!finalInit.headers || !('Authorization' in finalInit.headers))) {
          finalInit.headers = {
            ...finalInit.headers,
            Authorization: `Bearer ${authData.access_token}`
          };
        }
      } catch (e) {
        console.error('Error parsing auth storage:', e);
      }
    }
  }
  
  const fetchPromise = fetch(input, {
    ...finalInit,
    signal: controller.signal
  });
  
  return fetchPromise
    .then(response => {
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] Completed Supabase request: ${url} (${duration}ms) - Status: ${response.status}`);
      return response;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] Supabase request failed: ${url} (${duration}ms)`, error);
      
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
    console.log('Pre-fetching auth session to warm up connection...');
    supabase.auth.getSession().catch(err => {
      console.warn('Pre-fetch session failed:', err);
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
      console.error('User not authenticated, skipping error logging');
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
      console.error('Failed to log error:', insertError);
    }
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}