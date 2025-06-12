import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

interface ResendConfirmationProps {
  initialEmail?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ResendConfirmation({ initialEmail = '', onSuccess, onCancel }: ResendConfirmationProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState(''); // Store email for success message
  const [error, setError] = useState<string | null>(null);
  const [lastResendTime, setLastResendTime] = useState<number>(0);
  const { toast } = useToast();

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting
    const now = Date.now();
    const timeSinceLastResend = now - lastResendTime;
    if (timeSinceLastResend < 60000) { // 1 minute cooldown
      const remainingTime = Math.ceil((60000 - timeSinceLastResend) / 1000);
      toast({
        title: 'Please wait',
        description: `Please wait ${remainingTime} seconds before requesting another email.`,
        variant: 'default',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const trimmedEmail = email.trim();
      console.log('Resending confirmation email to:', trimmedEmail);
      
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail
      });

      if (resendError) {
        console.error('Supabase resend error:', resendError);
        throw resendError;
      }

      console.log('Email resend successful for:', trimmedEmail);

      setSuccess(true);
      setSuccessEmail(trimmedEmail); // Store the email for success message
      setLastResendTime(now);
      
      toast({
        title: 'Email Sent!',
        description: `A new confirmation email has been sent to ${trimmedEmail}.`,
        variant: 'default',
      });

      // Call success callback after a short delay
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (err: any) {
      console.error('Resend confirmation error:', err);
      
      let errorMessage = 'Failed to send confirmation email. Please try again.';
      if (err.message?.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (err.message?.includes('not found')) {
        errorMessage = 'This email address is not registered. Please sign up first.';
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Email Sent Successfully!</h3>
            <p className="text-gray-600">
              We've sent a new confirmation link to <strong>{successEmail || 'your email address'}</strong>.
            </p>
            <p className="text-sm text-gray-500">
              Please check your inbox and spam folder.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Resend Confirmation Email</CardTitle>
        <CardDescription>
          Enter your email address to receive a new confirmation link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResend} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resend-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="resend-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading || !email}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Email
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 