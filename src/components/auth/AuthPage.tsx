import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthForm } from './AuthForm';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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
      // Don't set isAuthenticating to true to avoid showing the banner
      console.log('AuthPage: Auth state check', { user, loading, authInitialized });
      
      if (user) {
        // Get return URL from state or localStorage
        const stateReturnUrl = location.state?.returnUrl;
        const storedReturnUrl = localStorage.getItem('auth-return-url');
        const returnUrl = stateReturnUrl || storedReturnUrl || '/chat';
        
        console.log('AuthPage: User authenticated, navigating to', returnUrl);
        
        // Clear the stored return URL
        localStorage.removeItem('auth-return-url');
        
        // Redirect to the return URL
        navigate(returnUrl, { replace: true });
        return;
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
            console.log('AuthPage: Session found manually');
            
            // Get return URL from state or localStorage
            const stateReturnUrl = location.state?.returnUrl;
            const storedReturnUrl = localStorage.getItem('auth-return-url');
            const returnUrl = stateReturnUrl || storedReturnUrl || '/chat';
            
            console.log('AuthPage: Navigating to', returnUrl);
            
            // Clear the stored return URL
            localStorage.removeItem('auth-return-url');
            
            // Force a page reload to ensure all authentication states are properly initialized
            window.location.href = returnUrl;
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
  }, [user, loading, authInitialized, navigate, location.state]);
  
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