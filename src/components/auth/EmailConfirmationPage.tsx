import React from 'react';
import { Mail, ArrowRight, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface EmailConfirmationPageProps {
  email: string;
  onResendEmail?: () => void;
  isResending?: boolean;
}

export function EmailConfirmationPage({ email, onResendEmail, isResending }: EmailConfirmationPageProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center animated-gradient p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
            <Mail className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            We've sent a confirmation email to:
          </p>
          <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded">
            {email}
          </p>
          
          <div className="space-y-3 pt-4">
            <p className="text-sm text-gray-600">
              Click the link in the email to verify your account and claim access to your free account.
            </p>
            
            {onResendEmail && (
              <Button
                variant="outline"
                onClick={onResendEmail}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Confirmation Email'
                )}
              </Button>
            )}
            
            <div className="pt-4 border-t">
              <Link to="/auth?tab=signin">
                <Button variant="link" className="text-sm text-[#F37022] hover:text-[#E36012]">
                  Already confirmed? Sign in
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 