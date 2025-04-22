import { createClient } from '@supabase/supabase-js';

/**
 * Creates a new Supabase client instance.
 * This is a utility function used to create a new client when needed,
 * particularly in server-side or isolated contexts.
 */
export function createSupabaseClient() {
  // Get the environment variables for Supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing Supabase environment variables');
  }
  
  // Create a new client
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    }
  );
} 