import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import type { AuthContextType, User } from '@/types';
import { withTimeout } from './auth-utils';
import { useDomain } from './domain-context';

// Create a global key for the auth instance
const GLOBAL_AUTH_KEY = '__AUTH_INSTANCE__';

export const AuthContext = createContext<AuthContextType | null>(null);

// Get the global auth instance if it exists
function getGlobalAuthInstance() {
  if (typeof window !== 'undefined' && GLOBAL_AUTH_KEY in window) {
    return (window as any)[GLOBAL_AUTH_KEY];
  }
  return null;
}

// Set the global auth instance
function setGlobalAuthInstance(instance: any) {
  if (typeof window !== 'undefined') {
    (window as any)[GLOBAL_AUTH_KEY] = instance;
  }
}

// Create a singleton instance of the auth provider state
let authInstance = getGlobalAuthInstance() || {
  user: null,
  loading: true,
  authInitialized: false,
  isAuthResolved: false,
  status: 'loading'
};

// Static state to track initialization
let isAuthInitializing = false;
let authInitPromise: Promise<void> | null = null;
let authInitialized = false;
// Add cancellation reference for session fetch
let currentSessionFetch: any = null;

// Initialize auth
export async function initializeAuth() {
  console.log('Auth initialization requested');
  
  // If already initialized, return immediately
  if (authInitialized) {
    console.log('Auth already initialized, returning');
    return;
  }

  // If initialization is in progress, return the existing promise
  if (isAuthInitializing && authInitPromise) {
    console.log('Auth initialization already in progress, returning existing promise');
    return authInitPromise;
  }

  // If user is already authenticated, don't re-initialize
  if (authInstance.user && authInstance.status === 'authenticated') {
    console.log('User already authenticated, skipping initialization');
    authInitialized = true;
    return;
  }

  isAuthInitializing = true;
  
  authInitPromise = new Promise<void>(async (resolve) => {
    try {
      console.log('Starting auth initialization');
      
      // Wait for Supabase client to be ready
      await ensureSupabaseClientReady();
      
      console.log('Got Supabase client for auth initialization');
      
      // Check localStorage for existing session first
      let existingSession = null;
      
      try {
        if (typeof window !== 'undefined') {
          const authStorage = localStorage.getItem('ask-jds-auth-storage');
          if (authStorage) {
            const authData = JSON.parse(authStorage);
            if (authData?.access_token && authData?.expires_at) {
              // Check if token is still valid (not expired)
              const expiresAt = new Date(authData.expires_at);
              if (expiresAt > new Date()) {
                console.log('Found valid session in localStorage');
                existingSession = authData;
              } else {
                console.log('Found expired session in localStorage');
              }
            }
          }
        }
      } catch (e) {
        console.error('Error checking localStorage for session:', e);
      }
      
      // Set up the auth state change listener before fetching initial session
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`Auth state change: ${event}`);
        const prevAuthStatus = authInstance.status;
        
        if (event === 'SIGNED_IN') {
          console.log('User signed in, updating auth instance');
          const user = session?.user;
          
          if (user) {
            // Create user object with base properties
            const userData = {
              id: user.id,
              email: user.email!,
              isAdmin: false, // Default to false, will be updated by refreshUser if needed
              last_sign_in_at: user.last_sign_in_at,
              user_metadata: user.user_metadata
            };
            
            // Update singleton instance
            authInstance.user = userData;
            authInstance.status = 'authenticated';
            authInstance.initialized = true;
            authInstance.loading = false;
            authInstance.isAuthResolved = true;
            setGlobalAuthInstance(authInstance);
            
            // Cancel any in-progress session fetch to prevent race conditions
            if (currentSessionFetch && typeof currentSessionFetch.cancel === 'function') {
              console.log('Cancelling in-progress session fetch due to sign-in');
              currentSessionFetch.cancel();
              currentSessionFetch = null;
            }
            
            // Mark auth as initialized to prevent redundant checks
            authInitialized = true;
            
            // Refresh user data if needed
            refreshUserData(userData);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing auth instance');
          
          // Update singleton instance
          authInstance.user = null;
          authInstance.status = 'unauthenticated';
          authInstance.initialized = true;
          authInstance.loading = false;
          authInstance.isAuthResolved = true;
          setGlobalAuthInstance(authInstance);
        } else if (event === 'USER_UPDATED') {
          console.log('User updated, refreshing user data');
          const user = session?.user;
          if (user) {
            // Refresh user data
            refreshUserData(user);
          }
        } else if (event === 'INITIAL_SESSION') {
          // Only update if we don't already have a user (prevent overriding a SIGNED_IN event)
          if (prevAuthStatus === 'loading') {
            console.log('Initial session received', session?.user ? 'with user' : 'without user');
            if (session?.user) {
              // Create user object with base properties
              const userData = {
                id: session.user.id,
                email: session.user.email!,
                isAdmin: false, // Default to false, will be updated by refreshUser if needed
                last_sign_in_at: session.user.last_sign_in_at,
                user_metadata: session.user.user_metadata
              };
              
              // Update singleton instance
              authInstance.user = userData;
              authInstance.status = 'authenticated';
              authInstance.initialized = true;
              authInstance.loading = false;
              authInstance.isAuthResolved = true;
              setGlobalAuthInstance(authInstance);
              
              // Refresh user data
              refreshUserData(userData);
            } else {
              // Update singleton instance
              authInstance.user = null;
              authInstance.status = 'unauthenticated';
              authInstance.initialized = true;
              authInstance.loading = false;
              authInstance.isAuthResolved = true;
              setGlobalAuthInstance(authInstance);
            }
          } else {
            console.log(`Ignoring INITIAL_SESSION event because auth status is already ${prevAuthStatus}`);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Auth token refreshed');
          // No need to update state as the user remains the same
        }
      });
      
      // If we already have a user (from storage or a previous auth change), skip session fetch
      if (authInstance.user && authInstance.status === 'authenticated') {
        console.log('User already authenticated, skipping session fetch');
        authInitialized = true;
        resolve();
        return;
      }
      
      try {
        // Use our improved withTimeout utility to fetch the session
        currentSessionFetch = withTimeout(
          () => supabase.auth.getSession(),
          15000, // Use a reasonable timeout
          'Auth session fetch timed out',
          2 // Use a reasonable retry count
        );
        
        const response = await currentSessionFetch;
        const session = response?.data?.session || null;
        currentSessionFetch = null;
        
        // Check if auth state was already set by another process
        if (authInitialized) {
          console.log('Auth already initialized by another process, skipping duplicate initialization');
          resolve();
          return;
        }
        
        console.log('Initial session fetch successful', session ? 'with session' : 'without session');
        
        if (session?.user) {
          console.log('User found in session, updating auth instance');
          
          // Create user object with base properties
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            isAdmin: false, // Default to false, will be updated by refreshUser if needed
            last_sign_in_at: session.user.last_sign_in_at,
            user_metadata: session.user.user_metadata
          };
          
          // Update singleton instance
          authInstance.user = userData;
          authInstance.status = 'authenticated';
          authInstance.initialized = true;
          authInstance.loading = false;
          authInstance.isAuthResolved = true;
          setGlobalAuthInstance(authInstance);
          
          // Store session information in a more reliable way
          try {
            if (typeof window !== 'undefined') {
              // Don't replace existing storage, just ensure tokens are there
              localStorage.setItem('auth-user-id', session.user.id);
            }
          } catch (e) {
            console.warn('Error updating localStorage with session info:', e);
          }
          
          // Refresh user data
          refreshUserData(userData);
        } else {
          console.log('No user in session, setting unauthenticated');
          
          // Update singleton instance
          authInstance.user = null;
          authInstance.status = 'unauthenticated';
          authInstance.initialized = true;
          authInstance.loading = false;
          authInstance.isAuthResolved = true;
          setGlobalAuthInstance(authInstance);
        }
      } catch (error) {
        // If error is "Operation cancelled", this is expected behavior due to sign-in
        if (error.message === 'Operation cancelled') {
          console.log('Session fetch cancelled due to auth state change');
          // Auth state should already be set by the process that cancelled this operation
          resolve();
          return;
        }
        
        console.error('Error fetching initial session:', error);
        
        // Try to recover from localStorage if session fetch failed
        let recoveredFromStorage = false;
        try {
          if (typeof window !== 'undefined') {
            const userId = localStorage.getItem('auth-user-id');
            const authStorage = localStorage.getItem('ask-jds-auth-storage');
            
            if (userId && authStorage) {
              const authData = JSON.parse(authStorage);
              if (authData?.user?.id === userId) {
                console.log('Recovered user from localStorage after session fetch error');
                
                // Create user object from storage
                const userData = {
                  id: authData.user.id,
                  email: authData.user.email,
                  isAdmin: false, // Default to false, will be updated by refreshUser if needed
                  last_sign_in_at: authData.user.last_sign_in_at || new Date().toISOString(),
                  user_metadata: authData.user.user_metadata || {}
                };
                
                // Update singleton instance with recovered data
                authInstance.user = userData;
                authInstance.status = 'authenticated';
                authInstance.initialized = true;
                authInstance.loading = false;
                authInstance.isAuthResolved = true;
                setGlobalAuthInstance(authInstance);
                
                recoveredFromStorage = true;
              }
            }
          }
        } catch (e) {
          console.error('Error recovering from localStorage:', e);
        }
        
        // If we couldn't recover from storage, set to unauthenticated
        if (!recoveredFromStorage) {
          // Update singleton instance
          authInstance.user = null;
          authInstance.status = 'unauthenticated';
          authInstance.initialized = true;
          authInstance.loading = false;
          authInstance.isAuthResolved = true;
          setGlobalAuthInstance(authInstance);
        }
      }
      
      authInitialized = true;
      resolve();
    } catch (error) {
      console.error('Error during auth initialization:', error);
      // Even on error, mark as initialized so the app can proceed
      
      // Update singleton instance
      authInstance.user = null;
      authInstance.status = 'unauthenticated';
      authInstance.initialized = true;
      authInstance.loading = false;
      authInstance.isAuthResolved = true;
      setGlobalAuthInstance(authInstance);
      
      authInitialized = true;
      resolve();
    } finally {
      isAuthInitializing = false;
    }
  });
  
  return authInitPromise;
}

/**
 * Ensure Supabase client is ready before proceeding with auth
 */
async function ensureSupabaseClientReady(): Promise<void> {
  try {
    await withTimeout(
      () => Promise.resolve(supabase),
      5000,
      'Supabase client initialization timeout'
    );
    console.log('Supabase client ready for auth');
  } catch (error) {
    console.error('Error ensuring Supabase client is ready:', error);
  }
}

/**
 * Function to refresh user metadata or perform other data fetching after auth
 */
async function refreshUserData(user: User): Promise<void> {
  console.log('Refreshing user data for:', user.email);
  
  try {
    // Check if we're in admin domain
    const isAdminDomain = window.location.hostname.includes('admin') || 
                         window.location.port === '5175' ||
                         window.location.pathname.startsWith('/admin');
    
    if (isAdminDomain) {
      console.log('In admin domain, checking admin status');
      
      // Check if user is admin from metadata
      const isAdminFromMetadata = user.user_metadata?.is_admin === true || 
                                 user.user_metadata?.admin === true;
      
      if (isAdminFromMetadata) {
        console.log('User is admin based on metadata');
        
        // Update user object and auth instance
        if (authInstance.user) {
          authInstance.user.isAdmin = true;
          setGlobalAuthInstance(authInstance);
        }
        
        return;
      }
      
      // Check from database via profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (!error && data && data.is_admin) {
        console.log('User is admin based on profiles table');
        
        // Update user object and auth instance
        if (authInstance.user) {
          authInstance.user.isAdmin = true;
          setGlobalAuthInstance(authInstance);
        }
        
        return;
      }
      
      // Try RPC function as a last resort
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('is_user_admin', { user_id: user.id });
        
        if (!rpcError && rpcData === true) {
          console.log('User is admin based on RPC function');
          
          // Update user object and auth instance
          if (authInstance.user) {
            authInstance.user.isAdmin = true;
            setGlobalAuthInstance(authInstance);
          }
        } else {
          console.log('User is not an admin based on all checks');
        }
      } catch (e) {
        console.error('Error checking admin status via RPC:', e);
      }
    }
  } catch (e) {
    console.error('Error in refreshUserData:', e);
  }
}

/**
 * Function to check if the current session token is still valid
 */
export async function validateSessionToken(): Promise<boolean> {
  console.log('Validating session token');
  try {
    // Quick check: if we have a session timestamp in localStorage, check it first
    if (typeof window !== 'undefined') {
      try {
        const sessionTimestamp = localStorage.getItem('last_active_timestamp');
        if (sessionTimestamp) {
          const lastActive = parseInt(sessionTimestamp, 10);
          const now = Date.now();
          // If last activity was more than 3 hours ago, consider session potentially expired
          // This is a conservative check that avoids unnecessary API calls
          if (now - lastActive > 3 * 60 * 60 * 1000) { // 3 hours
            console.log('Session potentially expired: inactive for 3+ hours');
            // Continue to full validation instead of returning immediately
            // This way the server check will still happen but we've logged the inactivity
          } else {
            // Update the timestamp since the user is active
            localStorage.setItem('last_active_timestamp', now.toString());
          }
        } else {
          // No timestamp found, set one now
          localStorage.setItem('last_active_timestamp', Date.now().toString());
        }
      } catch (e) {
        // Ignore localStorage errors, proceed with normal validation
        console.warn('Error checking session timestamp in localStorage:', e);
      }
    }

    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error validating session token:', error);
      return false;
    }
    
    if (!session) {
      console.log('No active session found during validation');
      return false;
    }
    
    // Check if the token is expired
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      
      if (expiresAt <= now) {
        console.log('Session token has expired');
        return false;
      }
    }
    
    // Update the last active timestamp since we have a valid session
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_active_timestamp', Date.now().toString());
    }
    
    // Make a lightweight API call to verify the token is accepted by the server
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error('Token validation failed:', userError);
        return false;
      }
      
      console.log('Session token is valid');
      return true;
    } catch (apiError) {
      console.error('API error during token validation:', apiError);
      return false;
    }
  } catch (e) {
    console.error('Unexpected error during token validation:', e);
    return false;
  }
}

/**
 * Handle session expiration by clearing the local auth state and redirecting
 */
export function handleSessionExpiration(preservedMessage?: string) {
  console.log('Handling session expiration');
  
  // Clear the local auth state
  authInstance.user = null;
  authInstance.status = 'unauthenticated';
  setGlobalAuthInstance(authInstance);
  
  // Clear any persisted auth data
  supabase.auth.signOut().catch(error => {
    console.error('Error signing out after session expiration:', error);
  });
  
  // Show a user-friendly message
  if (typeof window !== 'undefined') {
    // Store a message to display after redirect
    sessionStorage.setItem('auth_redirect_reason', 'session_expired');
    
    // If there's a message to preserve, store it in sessionStorage
    if (preservedMessage) {
      console.log('Preserving draft message for after login');
      sessionStorage.setItem('preserved_message', preservedMessage);
    }
    
    // Store the current path before redirecting (we'll save the full URL for simplicity)
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath && currentPath !== '/' && !currentPath.startsWith('/auth') && !currentPath.startsWith('/login')) {
      localStorage.setItem('ask-jds-last-visited-page', currentPath);
    }
    
    // Redirect to the auth page
    window.location.href = '/auth';
  }
}

function AuthProviderComponent({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider mounted, initializing auth');
  
  const [auth, setAuth] = useState<AuthContextType>({
    user: authInstance.user,
    loading: authInstance.loading !== false,
    authInitialized: false,
    isAuthResolved: false,
    signIn: async (email: string, password: string) => {
      try {
        console.log('Signing in with email:', email);
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        console.log('Sign in response:', data ? 'has data' : 'no data', error ? 'has error' : 'no error');
        
        if (error) {
          console.error('Sign in error:', error);
        }
        
        return { error };
      } catch (err) {
        console.error('Exception during sign in:', err);
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    signUp: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        return { error };
      } catch (err) {
        console.error('Sign up error:', err);
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        return { error };
      } catch (err) {
        console.error('Sign out error:', err);
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    resetPassword: async (email: string) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        return { error };
      } catch (err) {
        console.error('Reset password error:', err);
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    updatePassword: async (password: string) => {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        return { error };
      } catch (err) {
        console.error('Update password error:', err);
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    resendOtp: async (email: string) => {
      try {
        const { error } = await supabase.auth.resend({ email, type: 'signup' });
        return { error };
      } catch (err) {
        console.error('Resend OTP error:', err);
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    verifyOtp: async (email: string, token: string) => {
      try {
        const { data, error } = await supabase.auth.verifyOtp({ 
          email, 
          token, 
          type: 'signup' 
        });
        
        return !error && !!data.user;
      } catch (err) {
        console.error('Verify OTP error:', err);
        return false;
      }
    },
    refreshUser: async () => null,
  });

  const cancelRef = useRef<() => void>(() => {});
  const isProviderMounted = useRef(true);

  useEffect(() => {
    isProviderMounted.current = true;
    
    // On cleanup, set our flag to false to prevent state updates after unmount
    return () => {
      isProviderMounted.current = false;
      console.log('AuthProvider unmounted');
      
      // Cancel any in-progress operations
      if (typeof cancelRef.current === 'function') {
        cancelRef.current();
      }
    };
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeAuth();
        
        // Only update state if the provider is still mounted
        if (isProviderMounted.current) {
          setAuth(prevAuth => ({
            ...prevAuth,
            user: authInstance.user,
            loading: false,
            authInitialized: true,
            isAuthResolved: true,
          }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        
        // Even on error, we've resolved the auth state
        if (isProviderMounted.current) {
          setAuth(prevAuth => ({
            ...prevAuth,
            loading: false,
            isAuthResolved: true,
          }));
        }
      }
    };

    initialize();
  }, []);

  // Add visibilitychange event listener to check token when user returns to tab
  useEffect(() => {
    if (!auth.user) return; // Skip if no user
    
    const checkSessionOnVisibilityChange = () => {
      if (document.visibilityState === 'visible' && auth.user && isProviderMounted.current) {
        console.log('Tab became visible, checking session validity');
        validateSessionToken().then(isValid => {
          if (!isValid && isProviderMounted.current) {
            console.log('Session invalid after visibility change, handling expiration');
            handleSessionExpiration();
          }
        });
      }
    };
    
    // Set up periodic validation (every 30 mins)
    const periodicValidationInterval = setInterval(() => {
      if (auth.user && isProviderMounted.current) {
        console.log('Performing periodic session validation');
        validateSessionToken().then(isValid => {
          if (!isValid && isProviderMounted.current) {
            console.log('Session invalid during periodic check, handling expiration');
            handleSessionExpiration();
          }
        });
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    document.addEventListener('visibilitychange', checkSessionOnVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', checkSessionOnVisibilityChange);
      clearInterval(periodicValidationInterval);
    };
  }, [auth.user]);
  
  // Create the auth context value
  const value = {
    ...auth,
    isAuthResolved: auth.isAuthResolved,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProviderComponent>{children}</AuthProviderComponent>;
}