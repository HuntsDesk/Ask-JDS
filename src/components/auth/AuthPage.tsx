import { logger } from '@/lib/logger';
import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthForm } from './AuthForm';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Constants for the default redirect
const DEFAULT_REDIRECT = '/chat';
const LAST_PAGE_KEY = 'ask-jds-last-visited-page';
const SESSION_FOUND_KEY = 'auth-session-detected';
const SESSION_USER_ID_KEY = 'auth-session-user-id';
const SESSION_TIMESTAMP_KEY = 'auth-session-timestamp';
const REDIRECT_ATTEMPTS_KEY = 'auth_redirect_attempts';

export function AuthPage() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [initialTab, setInitialTab] = useState<'signin' | 'signup'>('signin');
  const { user, loading, authInitialized } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const didCheckSessionRef = useRef<boolean>(false);
  
  // Check if user is already authenticated, but don't block rendering
  useEffect(() => {
    // Prevent repeated checking of session in the same component instance
    if (didCheckSessionRef.current && !user) {
      return; // Already checked session once and still no user, don't check again
    }
    
    const checkAuth = async () => {
      // Create a mechanism to detect navigation loops
      const prevRedirectAttempts = parseInt(sessionStorage.getItem(REDIRECT_ATTEMPTS_KEY) || '0');
      
      // Don't set isAuthenticating to true to avoid showing the banner
      logger.debug('AuthPage: Auth state check', { 
        user: user ? `${user.email} (${user.id})` : null, 
        loading, 
        authInitialized, 
        redirectAttempts: prevRedirectAttempts,
        isCheckingSession,
        didCheckSession: didCheckSessionRef.current
      });
      
      if (user) {
        // If we've already tried to redirect too many times, don't continue the cycle
        if (prevRedirectAttempts > 3) {
          logger.warn('AuthPage: Too many redirect attempts detected (', prevRedirectAttempts, ') - breaking potential infinite loop');
          sessionStorage.removeItem(REDIRECT_ATTEMPTS_KEY);
          // Force a complete page reload to reset all state
          window.location.reload();
          return;
        }
        
        // Get the last visited page, or default to /chat
        const lastVisitedPage = localStorage.getItem(LAST_PAGE_KEY) || DEFAULT_REDIRECT;
        logger.debug('AuthPage: User already authenticated, navigating to', lastVisitedPage);
        
        // Clear any redirect-related state
        sessionStorage.removeItem('protected_redirect_attempts');
        
        // Increment redirect counter
        sessionStorage.setItem(REDIRECT_ATTEMPTS_KEY, (prevRedirectAttempts + 1).toString());
        
        navigate(lastVisitedPage, { replace: true });
        return;
      }
      
      // If no user, reset the counter
      if (prevRedirectAttempts > 0) {
        sessionStorage.removeItem(REDIRECT_ATTEMPTS_KEY);
      }
      
      // If not already checking and no user in context, check session directly
      // Only do this once per component instance
      if (!user && !isCheckingSession && !didCheckSessionRef.current) {
        try {
          setIsCheckingSession(true);
          didCheckSessionRef.current = true; // Mark that we've done a session check
          logger.debug('AuthPage: No user in context, checking session manually');
          
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            logger.error('AuthPage: Error checking session manually', error);
            setIsCheckingSession(false);
            return;
          }
          
          if (data?.session?.user) {
            logger.debug('AuthPage: Valid session found manually', data.session.user.email);
            
            // Store session information in session storage to assist ProtectedRoute
            sessionStorage.setItem(SESSION_FOUND_KEY, 'true');
            sessionStorage.setItem(SESSION_USER_ID_KEY, data.session.user.id);
            sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
            
            // Get the last visited page or default to /chat
            const lastVisitedPage = localStorage.getItem(LAST_PAGE_KEY) || DEFAULT_REDIRECT;
            
            // Reset redirect attempt counters to avoid triggering loop protection
            sessionStorage.removeItem('protected_redirect_attempts');
            sessionStorage.removeItem(REDIRECT_ATTEMPTS_KEY);
            
            logger.debug('AuthPage: Redirecting to', lastVisitedPage);
            
            // Use regular navigation first (this is gentler than page reload)
            navigate(lastVisitedPage, { replace: true });
            
            // Set a short timeout and if we're still here, force a reload
            setTimeout(() => {
              if (window.location.pathname.includes('/auth')) {
                logger.debug('AuthPage: Still on auth page after navigation, forcing reload');
                window.location.href = lastVisitedPage;
              }
            }, 500);
          } else {
            logger.debug('AuthPage: No session found manually');
            // Clear any previous session markers
            sessionStorage.removeItem(SESSION_FOUND_KEY);
            sessionStorage.removeItem(SESSION_USER_ID_KEY);
            sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
          }
          
          setIsCheckingSession(false);
        } catch (err) {
          logger.error('AuthPage: Exception checking session', err);
          setIsCheckingSession(false);
        }
      }
    };
    
    // Check auth in the background without blocking rendering
    checkAuth();
  }, [user, loading, authInitialized, navigate, isCheckingSession]);
  
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