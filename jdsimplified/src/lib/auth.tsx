import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Types
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  authInitialized: boolean;
};

// Create auth context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: new Error('AuthContext not initialized') }),
  signUp: async () => ({ error: new Error('AuthContext not initialized') }),
  signOut: async () => ({ error: new Error('AuthContext not initialized') }),
  authInitialized: false,
});

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Get session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          setUser(session.user);
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setUser(session?.user || null);
          }
        );
        
        setAuthInitialized(true);
        setLoading(false);
        
        // Cleanup subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthInitialized(true);
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ email, password });
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      setLoading(false);
    }
  };

  // Create auth context value
  const contextValue: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    authInitialized,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
