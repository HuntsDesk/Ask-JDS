import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthForm } from './AuthForm';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Constants for the default redirect
const DEFAULT_REDIRECT = '/chat';
const LAST_PAGE_KEY = 'ask-jds-last-visited-page';

export function AuthPage() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [initialTab, setInitialTab] = useState<'signin' | 'signup'>('signin');
  const { user, loading, authInitialized } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Check if user is already authenticated, but don't block rendering
  useEffect(() => {
    const checkAuth = async () => {
      // Create a mechanism to detect navigation loops
      const prevRedirectAttempts = parseInt(sessionStorage.getItem('auth_redirect_attempts') || '0');
      
      // Don't set isAuthenticating to true to avoid showing the banner
      console.log('AuthPage: Auth state check', { user, loading, authInitialized, redirectAttempts: prevRedirectAttempts });
      
      if (user) {
        // If we've already tried to redirect too many times, don't continue the cycle
        if (prevRedirectAttempts > 3) {
          console.warn('AuthPage: Too many redirect attempts detected (', prevRedirectAttempts, ') - breaking potential infinite loop');
          sessionStorage.removeItem('auth_redirect_attempts');
          // Force a complete page reload to reset all state
          window.location.reload();
          return;
        }
        
        // Get the last visited page, or default to /chat
        const lastVisitedPage = localStorage.getItem(LAST_PAGE_KEY) || DEFAULT_REDIRECT;
        console.log('AuthPage: User already authenticated, navigating to', lastVisitedPage);
        
        // Increment redirect counter
        sessionStorage.setItem('auth_redirect_attempts', (prevRedirectAttempts + 1).toString());
        
        navigate(lastVisitedPage, { replace: true });
        return;
      }
      
      // If no user, reset the counter
      if (prevRedirectAttempts > 0) {
        sessionStorage.removeItem('auth_redirect_attempts');
      }
      
      // If auth is initialized and we're not loading, but still don't have a user,
      // check the session manually to be sure
      if (!user) {
        console.log('AuthPage: No user, checking session manually');
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('AuthPage: Error checking session manually', error);
            return;
          }
          
          if (data?.session?.user) {
            console.log('AuthPage: Session found manually, navigating to last page');
            // Get the last visited page or default to /chat
            const lastVisitedPage = localStorage.getItem(LAST_PAGE_KEY) || DEFAULT_REDIRECT;
            // Increment redirect counter before reload
            sessionStorage.setItem('auth_redirect_attempts', '1');
            // Force a page reload to ensure all authentication states are properly initialized
            window.location.href = lastVisitedPage;
          } else {
            console.log('AuthPage: No session found manually');
          }
        } catch (err) {
          console.error('AuthPage: Exception checking session', err);
        }
      }
    };
    
    // Check auth in the background without blocking rendering
    checkAuth();
  }, [user, loading, authInitialized, navigate]);
  
  useEffect(() => {
    // Check for tab parameter in URL
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    
    if (tab === 'signup') {
      setInitialTab('signup');
    } else {
      setInitialTab('signin');
    }
    
    // Trigger fade-in animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location]);
  
  // Always render the auth form immediately
  return (
    <div 
      className={`min-h-screen w-full transition-opacity duration-700 ease-in-out force-light-mode ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <AuthForm initialTab={initialTab} />
    </div>
  );
} 