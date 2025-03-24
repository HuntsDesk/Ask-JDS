import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from './supabase';
import type { AuthContextType, User } from '@/types';
import { withTimeout, ensureUserRecord } from './auth-utils';

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

  isAuthInitializing = true;
  
  authInitPromise = new Promise<void>(async (resolve) => {
    try {
      console.log('Starting auth initialization');
      
      // Wait for Supabase client to be ready
      await ensureSupabaseClientReady();
      
      console.log('Got Supabase client for auth initialization');
      
      // Set up the auth state change listener before fetching initial session
      supabase.auth.onAuthStateChange((event, session) => {
        console.log(`Auth state change: ${event}`);
        const prevAuthStatus = authInstance.status;
        
        if (event === 'SIGNED_IN') {
          console.log('User signed in, updating auth instance');
          const user = session?.user;
          
          if (user) {
            // Create user object with isAdmin always set to false
            const userData = {
              id: user.id,
              email: user.email!,
              isAdmin: false, // Always false in user app
              last_sign_in_at: user.last_sign_in_at,
              user_metadata: user.user_metadata
            };
            
            // Update singleton instance
            authInstance.user = userData;
            authInstance.status = 'authenticated';
            authInstance.initialized = true;
            authInstance.loading = false;
            setGlobalAuthInstance(authInstance);
            
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
              // Create user object with isAdmin always set to false
              const userData = {
                id: session.user.id,
                email: session.user.email!,
                isAdmin: false, // Always false in user app
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
        }
      });
      
      try {
        // Use our improved withTimeout utility to fetch the session
        const { data: { session } } = await withTimeout(
          () => supabase.auth.getSession(),
          15000,
          'Auth session fetch timed out',
          2
        );
        
        console.log('Initial session fetch successful', session ? 'with session' : 'without session');
        
        if (session?.user) {
          console.log('User found in session, updating auth instance');
          
          // Create user object with isAdmin always set to false
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            isAdmin: false, // Always false in user app
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
          console.log('No user in session, setting unauthenticated');
          
          // Update singleton instance
          authInstance.user = null;
          authInstance.status = 'unauthenticated';
          authInstance.initialized = true;
          authInstance.loading = false;
          setGlobalAuthInstance(authInstance);
        }
      } catch (error) {
        console.error('Error fetching initial session:', error);
        
        // Update singleton instance
        authInstance.user = null;
        authInstance.status = 'unauthenticated';
        authInstance.initialized = true;
        authInstance.loading = false;
        setGlobalAuthInstance(authInstance);
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
  
  // Ensure the user has a record in the public.users table
  await ensureUserRecord(user.id, user.email);
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
    
    // Redirect to the login page
    window.location.href = '/login';
  }
}

function AuthProviderComponent({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(authInstance.user);
  const [loading, setLoading] = useState(authInstance.loading);
  const [authInitialized, setAuthInitialized] = useState(authInstance.authInitialized);
  
  // Trigger auth initialization when the component mounts
  useEffect(() => {
    console.log('AuthProvider mounted, initializing auth');
    
    // Start initialization after a small delay to ensure Supabase client has time to initialize
    setTimeout(() => {
      const initialize = async () => {
        try {
          await initializeAuth();
          setIsInitialized(true);
          
          // Update component state from singleton
          setUser(authInstance.user);
          setLoading(false);
          setAuthInitialized(true);
        } catch (error) {
          console.error('Error during auth initialization:', error);
          setIsInitialized(true);
          setLoading(false);
          setAuthInitialized(true);
        }
      };
      
      void initialize();
    }, 100);
    
    // Subscribe to auth changes
    const authCheckInterval = setInterval(() => {
      if (authInstance.user !== user) {
        setUser(authInstance.user);
      }
      if (authInstance.loading !== loading) {
        setLoading(authInstance.loading);
      }
      if (authInstance.authInitialized !== authInitialized) {
        setAuthInitialized(authInstance.authInitialized);
      }
    }, 100);
    
    return () => {
      console.log('AuthProvider unmounted');
      clearInterval(authCheckInterval);
    };
  }, []);
  
  // Add visibilitychange event listener to check token when user returns to tab
  useEffect(() => {
    const checkSessionOnVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('Tab became visible, checking session validity');
        validateSessionToken().then(isValid => {
          if (!isValid) {
            console.log('Session invalid after visibility change, handling expiration');
            handleSessionExpiration();
          }
        });
      }
    };
    
    // Set up periodic validation (every 30 mins)
    const periodicValidationInterval = setInterval(() => {
      if (user) {
        console.log('Performing periodic session validation');
        validateSessionToken().then(isValid => {
          if (!isValid) {
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
          setLoading(false);
          
          // Update singleton
          authInstance.loading = false;
          setGlobalAuthInstance(authInstance);
          
          return { error };
        }
        
        console.log('Sign in successful for:', data.user?.email);
        
        // Create a user object if sign-in successful
        if (data.user) {
          console.log('Setting user immediately after sign in');
          
          // Create user without admin status
          const userData: User = {
            id: data.user.id,
            email: data.user.email!,
            isAdmin: false, // Always false in user app
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
        
        // Use window.location.href for a full page reload to clear any stale state
        window.location.href = '/';
        
        return { error: null };
      } catch (err) {
        console.error('Sign out error:', err);
        setLoading(false);
        
        // Update singleton
        authInstance.loading = false;
        setGlobalAuthInstance(authInstance);
        
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    refreshUser: async () => {
      if (!user) return;
      
      try {
        // Get updated user data from Supabase
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        
        if (error || !authUser) {
          console.error('Error refreshing user:', error);
          return;
        }
        
        // Create user object with isAdmin always set to false in the user app
        const updatedUser = {
          id: authUser.id,
          email: authUser.email!,
          isAdmin: false,
          last_sign_in_at: authUser.last_sign_in_at,
          user_metadata: authUser.user_metadata
        };
        
        // Update state
        setUser(updatedUser);
        
        // Update singleton instance
        authInstance.user = updatedUser;
        setGlobalAuthInstance(authInstance);
        
        // Refresh additional user data
        refreshUserData(updatedUser);
      } catch (err) {
        console.error('Error refreshing user:', err);
      }
    }
  };
  
  if (!isInitialized && loading) {
    // Still initializing, show a loading state
    return (
      <div className="flex justify-center items-center h-screen w-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
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