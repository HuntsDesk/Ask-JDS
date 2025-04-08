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
  authInitialized: false
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
              setGlobalAuthInstance(authInstance);
              
              // Refresh user data
              refreshUserData(userData);
            } else {
              // Update singleton instance
              authInstance.user = null;
              authInstance.status = 'unauthenticated';
              authInstance.initialized = true;
              authInstance.loading = false;
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
    
    // Redirect to the auth page
    window.location.href = '/auth';
  }
}

function AuthProviderComponent({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(authInstance.user);
  const [loading, setLoading] = useState(authInstance.loading);
  const [authInitialized, setAuthInitialized] = useState(authInstance.authInitialized);
  
  // Reference to track component mount status
  const isMountedRef = useRef(true);
  
  // Update local state when auth state changes
  const updateStateFromAuthInstance = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (authInstance.user !== user) {
      setUser(authInstance.user);
    }
    if (authInstance.loading !== loading) {
      setLoading(authInstance.loading);
    }
    if (authInstance.authInitialized !== authInitialized) {
      setAuthInitialized(authInstance.authInitialized);
    }
  }, [user, loading, authInitialized]);
  
  // Trigger auth initialization when the component mounts
  useEffect(() => {
    console.log('AuthProvider mounted, initializing auth');
    isMountedRef.current = true;
    
    // Check if auth is already initialized
    if (authInitialized || authInstance.authInitialized) {
      console.log('Auth already initialized, updating state');
      updateStateFromAuthInstance();
      setIsInitialized(true);
      return;
    }
    
    // Start initialization immediately to reduce race condition window
    const initialize = async () => {
      if (!isMountedRef.current) return;
      
      try {
        await initializeAuth();
        
        if (!isMountedRef.current) return;
        
        setIsInitialized(true);
        
        // Update component state from singleton
        updateStateFromAuthInstance();
      } catch (error) {
        if (!isMountedRef.current) return;
        
        console.error('Error during auth initialization:', error);
        setIsInitialized(true);
        setLoading(false);
        setAuthInitialized(true);
      }
    };
    
    void initialize();
    
    // Subscribe to auth changes - use a more efficient approach
    const authSubscription = supabase.auth.onAuthStateChange(() => {
      // Only update when auth instance changes
      updateStateFromAuthInstance();
    });
    
    return () => {
      console.log('AuthProvider unmounted');
      isMountedRef.current = false;
      authSubscription.data.subscription.unsubscribe();
    };
  }, [updateStateFromAuthInstance]);
  
  // Add visibilitychange event listener to check token when user returns to tab
  useEffect(() => {
    if (!user) return; // Skip if no user
    
    const checkSessionOnVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isMountedRef.current) {
        console.log('Tab became visible, checking session validity');
        validateSessionToken().then(isValid => {
          if (!isValid && isMountedRef.current) {
            console.log('Session invalid after visibility change, handling expiration');
            handleSessionExpiration();
          }
        });
      }
    };
    
    // Set up periodic validation (every 30 mins)
    const periodicValidationInterval = setInterval(() => {
      if (user && isMountedRef.current) {
        console.log('Performing periodic session validation');
        validateSessionToken().then(isValid => {
          if (!isValid && isMountedRef.current) {
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
  }, [user]);
  
  // Create the auth context value
  const authContextValue: AuthContextType = {
    user,
    loading,
    authInitialized,
    signIn: async (email: string, password: string) => {
      try {
        console.log('Auth provider: signIn called for', email);
        setLoading(true);
        
        // Update singleton
        authInstance.loading = true;
        setGlobalAuthInstance(authInstance);
        
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          console.error('Sign in error from Supabase:', error);
          console.error('Error details:', error.message, error.status);
          setLoading(false);
          
          // Update singleton
          authInstance.loading = false;
          setGlobalAuthInstance(authInstance);
          
          return { error };
        }
        
        console.log('Sign in successful for:', data.user?.email);
        console.log('User data from login:', {
          id: data.user?.id,
          email: data.user?.email,
          app_metadata: data.user?.app_metadata,
          user_metadata: data.user?.user_metadata,
        });
        
        // Create a user object if sign-in successful
        if (data.user) {
          console.log('Setting user immediately after sign in');
          
          // Check if user is admin from metadata first
          const isAdminFromMetadata = 
            data.user.user_metadata?.is_admin === true || 
            data.user.user_metadata?.admin === true;
          
          // Create user object with correct isAdmin
          const userData: User = {
            id: data.user.id,
            email: data.user.email!,
            isAdmin: isAdminFromMetadata, // Set based on metadata
            last_sign_in_at: data.user.last_sign_in_at,
            user_metadata: data.user.user_metadata
          };
          
          // Set the user right away
          setUser(userData);
          setAuthInitialized(true);
          setLoading(false);
          
          // Update singleton
          authInstance.user = userData;
          authInstance.loading = false;
          authInstance.authInitialized = true;
          setGlobalAuthInstance(authInstance);
          
          console.log('User state updated immediately after sign in:', userData);
          
          // After setting initial user state, check for admin status
          setTimeout(() => {
            if (isMountedRef.current) {
              refreshUserData(userData).then(() => {
                if (authInstance.user && authInstance.user.isAdmin !== userData.isAdmin) {
                  // Update user state if admin status has changed
                  setUser({...authInstance.user});
                }
              });
            }
          }, 0);
        } else {
          setLoading(false);
          
          // Update singleton
          authInstance.loading = false;
          setGlobalAuthInstance(authInstance);
        }
        
        return { error: null };
      } catch (err) {
        console.error('Sign in error:', err);
        setLoading(false);
        setAuthInitialized(true);
        
        // Update singleton
        authInstance.loading = false;
        authInstance.authInitialized = true;
        setGlobalAuthInstance(authInstance);
        
        return { error: err as Error };
      }
    },
    signUp: async (email: string, password: string) => {
      try {
        setLoading(true);
        
        // Update singleton
        authInstance.loading = true;
        setGlobalAuthInstance(authInstance);
        
        const { error } = await supabase.auth.signUp({ email, password });
        
        setLoading(false);
        
        // Update singleton
        authInstance.loading = false;
        setGlobalAuthInstance(authInstance);
        
        return { error };
      } catch (err) {
        console.error('Sign up error:', err);
        setLoading(false);
        
        // Update singleton
        authInstance.loading = false;
        setGlobalAuthInstance(authInstance);
        
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    signOut: async () => {
      try {
        console.log('Auth provider: signOut called');
        setLoading(true);
        
        // Update singleton
        authInstance.loading = true;
        setGlobalAuthInstance(authInstance);
        
        // Clear user state first to prevent flashing of protected content
        setUser(null);
        setAuthInitialized(true);
        
        // Update singleton before sign out
        authInstance.user = null;
        authInstance.loading = true;
        authInstance.authInitialized = true;
        setGlobalAuthInstance(authInstance);
        
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Sign out error:', error);
          setLoading(false);
          
          // Update singleton
          authInstance.loading = false;
          setGlobalAuthInstance(authInstance);
          
          return { error };
        }
        
        console.log('Sign out successful');
        
        // Update loading state
        setLoading(false);
        
        // Update singleton after sign out
        authInstance.loading = false;
        setGlobalAuthInstance(authInstance);
        
        // Redirect to auth page instead of root
        console.log('Redirecting to auth page after sign out');
        window.location.href = '/auth';
        
        return { error: null };
      } catch (err) {
        console.error('Sign out error:', err);
        setLoading(false);
        
        // Update singleton
        authInstance.loading = false;
        setGlobalAuthInstance(authInstance);
        
        // Even on error, try to redirect to auth page
        console.log('Attempting to redirect to auth page after sign out error');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 500);
        
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    refreshUser: async () => {
      if (!user) return;
      
      try {
        console.log('Refreshing user data');
        // Get updated user data from Supabase
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        
        if (error || !authUser) {
          console.error('Error refreshing user:', error);
          return;
        }
        
        // Check for admin status in metadata
        const isAdminFromMetadata = 
          authUser.user_metadata?.is_admin === true || 
          authUser.user_metadata?.admin === true;
        
        // Create user object with initial props
        const updatedUser = {
          id: authUser.id,
          email: authUser.email!,
          isAdmin: isAdminFromMetadata, // Set based on metadata first
          last_sign_in_at: authUser.last_sign_in_at,
          user_metadata: authUser.user_metadata
        };
        
        console.log('User refreshed with data:', updatedUser);
        
        // Update state
        setUser(updatedUser);
        
        // Update singleton instance
        authInstance.user = updatedUser;
        setGlobalAuthInstance(authInstance);
        
        // Refresh additional user data and check admin status
        await refreshUserData(updatedUser);
        
        // Update user with latest admin status if it changed
        if (authInstance.user && authInstance.user.isAdmin !== updatedUser.isAdmin) {
          console.log('Admin status changed, updating user state');
          setUser({...authInstance.user});
        }
      } catch (err) {
        console.error('Error refreshing user:', err);
      }
    }
  };
  
  if (!isInitialized && loading) {
    // Always render children without showing a loading spinner
    // This avoids showing a black spinner during authentication
    return (
      <AuthContext.Provider value={authContextValue}>
        {children}
      </AuthContext.Provider>
    );
  }
  
  // Auth is initialized or timed out, render children with the context
  return (
    <AuthContext.Provider value={authContextValue}>
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