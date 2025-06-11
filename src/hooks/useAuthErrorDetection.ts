import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface AuthError {
  code: string;
  description: string;
  email?: string;
}

export function useAuthErrorDetection() {
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for auth errors in URL hash
    if (typeof window === 'undefined' || !window.location.hash) {
      return;
    }

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    
    const error = params.get('error');
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');

    if (error || errorCode) {
      console.log('Auth error detected in URL:', { error, errorCode, errorDescription });
      
      // Map error codes to user-friendly messages
      let friendlyMessage = errorDescription || 'An authentication error occurred';
      
      if (errorCode === 'otp_expired') {
        friendlyMessage = 'Your confirmation link has expired. Please request a new one.';
      } else if (errorCode === 'invalid_token') {
        friendlyMessage = 'The confirmation link is invalid. Please request a new one.';
      } else if (error === 'access_denied') {
        friendlyMessage = 'Access was denied. Please try signing in again.';
      }

      const authError: AuthError = {
        code: errorCode || error || 'unknown',
        description: friendlyMessage,
        // Try to extract email from error description if present
        email: errorDescription?.match(/email=([^&\s]+)/)?.[1]
      };

      // Store error for AuthForm to read
      localStorage.setItem('auth_error', JSON.stringify(authError));
      
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
      
      // Navigate to auth page
      navigate('/auth?error=' + authError.code);
      
      setAuthError(authError);
    }
  }, [navigate]);

  const clearAuthError = () => {
    setAuthError(null);
    localStorage.removeItem('auth_error');
  };

  return { authError, clearAuthError };
} 