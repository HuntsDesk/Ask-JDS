import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

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
  console.log('[DEBUG] AuthProvider initializing');
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  // Initialize and set up auth state listener
  useEffect(() => {
    const handleAuthUpdate = (currentSession: Session | null) => {
      console.log('[DEBUG] Auth state changed:', currentSession ? 'Active session' : 'No session');
      setSession(currentSession);
      setLoading(false);
      
      // If there's a session, update the user state
      if (currentSession?.user) {
        console.log('[DEBUG] User authenticated:', currentSession.user.id);
        setUser(currentSession.user);
      } else {
        console.log('[DEBUG] No authenticated user');
        setUser(null);
      }
    };

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthUpdate(session);
      setIsAuthResolved(true);
    });

    // Set up a listener for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthUpdate(session);
      setIsAuthResolved(true);
    });

    // Clean up the subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    console.log('[DEBUG] Sign in attempt for:', email);
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

  // Sign out
  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
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