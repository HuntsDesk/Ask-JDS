import { useNavigate } from 'react-router-dom';
import { ResendConfirmation } from '@/components/auth/ResendConfirmation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ResendConfirmationPage() {
  const navigate = useNavigate();
  
  // Check for email in URL params or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email');
  const storedError = localStorage.getItem('auth_error');
  let initialEmail = emailFromUrl || '';
  
  if (!initialEmail && storedError) {
    try {
      const error = JSON.parse(storedError);
      initialEmail = error.email || '';
    } catch (e) {
      console.error('Failed to parse stored error:', e);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center animated-gradient p-4">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign In
        </Button>
        
        <ResendConfirmation
          initialEmail={initialEmail}
          onSuccess={() => {
            // Navigate back to auth page after success
            setTimeout(() => {
              navigate('/auth');
            }, 3000);
          }}
          onCancel={() => navigate('/auth')}
        />
      </div>
    </div>
  );
} 