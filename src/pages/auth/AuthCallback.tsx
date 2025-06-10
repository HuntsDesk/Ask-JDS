import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processAuthTokens = async () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace(/^#/, ''));

        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const error = params.get('error');
        const error_description = params.get('error_description');

        // Handle errors first
        if (error) {
          console.error('Auth callback error:', error, error_description);
          setErrorMessage(error_description || error);
          setStatus('error');
          setTimeout(() => navigate('/auth?tab=signin'), 3000);
          return;
        }

        // Process tokens
        if (access_token && refresh_token) {
          console.log('Processing auth tokens from email confirmation');
          
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setErrorMessage('Failed to establish session');
            setStatus('error');
            setTimeout(() => navigate('/auth?tab=signin'), 3000);
            return;
          }

          console.log('Auth session established successfully');
          setStatus('success');
          
          // Brief success message then redirect to chat
          setTimeout(() => navigate('/chat'), 1500);
        } else {
          console.warn('No auth tokens found in URL');
          setErrorMessage('No authentication tokens found');
          setStatus('error');
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (err) {
        console.error('Auth callback processing error:', err);
        setErrorMessage('Failed to process authentication');
        setStatus('error');
        setTimeout(() => navigate('/auth?tab=signin'), 3000);
      }
    };

    processAuthTokens();
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center animated-gradient p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {status === 'processing' && (
              <>
                <LoadingSpinner size="lg" className="mx-auto" />
                <h2 className="text-xl font-semibold">Confirming your account...</h2>
                <p className="text-gray-600">Please wait while we verify your email.</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-xl font-semibold text-green-700">Welcome to Ask JDS!</h2>
                <p className="text-gray-600">Your account has been confirmed. Redirecting you to the chat...</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <h2 className="text-xl font-semibold text-red-700">Confirmation Failed</h2>
                <p className="text-gray-600">{errorMessage}</p>
                <p className="text-sm text-gray-500">Redirecting you back to sign in...</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 