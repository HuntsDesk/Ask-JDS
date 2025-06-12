import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { authLog } from '@/lib/debug-logger';

// Define the shape of our auth context
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAuthResolved: boolean;
}

// Define the result type for auth operations
export interface AuthResult {
  success: boolean;
  error?: string;
  data?: any;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signIn: async () => ({ success: false, error: 'Auth context not initialized' }),
  signUp: async () => ({ success: false, error: 'Auth context not initialized' }),
  signOut: async () => {},
  loading: true,
  isAuthResolved: false
});

// Create the provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hasLoggedInit = useRef(false);
  const authListenerSetup = useRef(false);
  
  // Only log initialization once per provider instance
  if (!hasLoggedInit.current) {
    authLog.info('AuthProvider initializing');
    hasLoggedInit.current = true;
  }
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  // Auth state persistence to prevent unnecessary re-authentication
  const persistAuthState = useRef<{
    lastUserId: string | null;
    lastSessionId: string | null;
  }>({
    lastUserId: null,
    lastSessionId: null
  });

  // Initialize and set up auth state listener with optimization
  useEffect(() => {
    // Prevent multiple listener setups
    if (authListenerSetup.current) {
      return;
    }
    authListenerSetup.current = true;

    // Check for auth errors IMMEDIATELY before Supabase processes the URL
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      
      const error = params.get('error');
      const errorCode = params.get('error_code');
      const errorDescription = params.get('error_description');
      
      if (error || errorCode) {
        console.log('Auth error detected IMMEDIATELY:', { error, errorCode, errorDescription });
        
        // Map to user-friendly message
        let friendlyMessage = errorDescription || 'An authentication error occurred';
        if (errorCode === 'otp_expired') {
          friendlyMessage = 'Your confirmation link has expired. Please request a new one.';
        } else if (errorCode === 'invalid_token') {
          friendlyMessage = 'The confirmation link is invalid. Please request a new one.';
        }
        
        // Extract email if present
        let extractedEmail = '';
        if (errorDescription) {
          // Try to extract email from description
          const emailMatch = errorDescription.match(/email=([^&\s]+)/);
          if (!emailMatch) {
            // Try another pattern if Supabase includes email differently
            const decodedDesc = decodeURIComponent(errorDescription);
            const emailInDesc = decodedDesc.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (emailInDesc) {
              extractedEmail = emailInDesc[1];
            }
          } else {
            extractedEmail = decodeURIComponent(emailMatch[1]);
          }
        }
        
        // Store error for AuthForm
        const authError = {
          code: errorCode || error || 'unknown',
          description: friendlyMessage,
          email: extractedEmail
        };
        
        console.log('Storing auth error with email:', authError);
        localStorage.setItem('auth_error', JSON.stringify(authError));
        
        // Clean up URL and redirect to auth page
        window.history.replaceState(null, '', window.location.pathname);
        window.location.href = '/auth?error=' + (errorCode || error);
        return;
      }
    }

    const handleAuthUpdate = (currentSession: Session | null) => {
      const currentUserId = currentSession?.user?.id || null;
      const currentSessionId = currentSession?.access_token || null;

      // Only update state if there's an actual change to prevent unnecessary re-renders
      if (
        persistAuthState.current.lastUserId !== currentUserId ||
        persistAuthState.current.lastSessionId !== currentSessionId
      ) {
        authLog.info('Auth state changed', {
          status: currentSession ? 'Active session' : 'No session',
          userId: currentUserId,
          hasSession: !!currentSession
        });
        
        setSession(currentSession);
        setLoading(false);
        
                 // Update user state only if changed
         if (currentSession?.user && currentSession.user.id !== persistAuthState.current.lastUserId) {
           authLog.info('User authenticated', { userId: currentSession.user.id });
           setUser(currentSession.user);
         } else if (!currentSession?.user && persistAuthState.current.lastUserId) {
           authLog.info('No authenticated user');
           setUser(null);
         }

        // Update persistence tracking
        persistAuthState.current = {
          lastUserId: currentUserId,
          lastSessionId: currentSessionId
        };
      }
    };

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthUpdate(session);
      setIsAuthResolved(true);
      
      // Clean up URL hash after processing tokens
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    // Set up a listener for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthUpdate(session);
      setIsAuthResolved(true);
      
      // Clean up URL hash after processing tokens
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    // Clean up the subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
      authListenerSetup.current = false;
    };
  }, []);

  // Sign in with email and password - optimized with error handling
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    authLog.info('Sign in attempt', { email });
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign out with cleanup
  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      // Clear persistence tracking
      persistAuthState.current = {
        lastUserId: null,
        lastSessionId: null
      };
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  // Provide the context value
  const contextValue: AuthContextType = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    loading,
    isAuthResolved
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Utility function to clear all auth-related storage
export function clearAuthStorage() {
  try {
    // Clear all auth-related items from localStorage
    const keysToRemove = [
      'ask-jds-auth-storage',
      'sb-prbbuxgirnecbkpdpgcb-auth-token',
      'sb-prbbuxgirnecbkpdpgcb-auth-token-code-verifier',
      'supabase.auth.token',
      'last_token_validation',
      'last_validation_result'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear any IndexedDB data
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name?.includes('supabase')) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }
    
    console.log('Auth storage cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing auth storage:', error);
    return false;
  }
}

// Function to validate session token
export async function validateSessionToken(): Promise<boolean> {
  try {
    // Check for recent validations to prevent excessive calls
    const now = Date.now();
    const lastValidation = parseInt(localStorage.getItem('last_token_validation') || '0');
    const THREE_SECONDS = 3 * 1000;
    
    if (lastValidation && now - lastValidation < THREE_SECONDS) {
      // If we validated very recently, use the cached result
      const cachedResult = localStorage.getItem('last_validation_result');
      if (cachedResult) {
        return cachedResult === 'true';
      }
    }
    
    // Store this validation time
    localStorage.setItem('last_token_validation', now.toString());
    
    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise<{data: {user: null}, error: Error}>((resolve) => {
      setTimeout(() => {
        resolve({
          data: {user: null},
          error: new Error('Session validation timed out')
        });
      }, 5000); // 5 seconds timeout
    });
    
    const { data, error } = await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise
    ]);
    
    if (error) {
      console.error('Session token validation failed:', error);
      localStorage.setItem('last_validation_result', 'false');
      return false;
    }
    
    const result = !!data.user;
    localStorage.setItem('last_validation_result', result.toString());
    return result;
  } catch (err) {
    console.error('Error validating session token:', err);
    localStorage.setItem('last_validation_result', 'false');
    return false;
  }
}

// Function to handle session expiration and preserve user data
export const handleSessionExpiration = (messageContent?: string) => {
  console.log('[DEBUG] Session expired, preserving message and redirecting');
  if (messageContent && messageContent.trim()) {
    localStorage.setItem('preservedMessage', messageContent);
    // Optional: consider if preservedThreadId also needs to be saved from localStorage if available
    const threadId = localStorage.getItem('currentThreadId');
    if (threadId) localStorage.setItem('preservedThreadId', threadId);
  }
  // For now, this will just redirect. A more robust solution might involve the AuthContext's signOut.
  if (typeof window !== 'undefined') {
    window.location.href = '/auth'; // Or your designated login/auth page
  }
}; 