import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase'; // Adjust path if needed
import { LoadingSpinner } from '@/components/LoadingSpinner'; // Adjust path if needed
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Adjust path if needed
import { Button } from '@/components/ui/button'; // Adjust path if needed
import { useSubscriptionContext } from '@/contexts/SubscriptionContext'; // Adjust path if needed

// Type for the response from the get-payment-status function
interface PaymentStatusResponse {
  id?: string;
  status?: string;
  client_secret?: string;
  error?: { message: string };
}

export function CheckoutConfirmationPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'processing' | 'requires_action'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { refreshSubscription } = useSubscriptionContext(); // Get refresh function from context

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret') || searchParams.get('setup_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');

    if (!clientSecret) {
      setStatus('error');
      setErrorMessage('Missing payment confirmation details.');
      return;
    }

    const checkStatus = async () => {
      try {
        // Determine the type of intent based on the prefix
        let intentIdPayload: { payment_intent_id?: string; setup_intent_id?: string } = {};
        if (clientSecret.startsWith('pi_')) {
            // Extract the ID part before the _secret_
            const paymentIntentId = clientSecret.split('_secret_')[0];
            if (paymentIntentId) {
                 intentIdPayload = { payment_intent_id: paymentIntentId };
            } else {
                 throw new Error('Invalid payment_intent_client_secret format');
            }
        } else if (clientSecret.startsWith('seti_')) {
             const setupIntentId = clientSecret.split('_secret_')[0];
             if (setupIntentId) {
                intentIdPayload = { setup_intent_id: setupIntentId };
             } else {
                throw new Error('Invalid setup_intent_client_secret format');
             }
        } else {
          throw new Error('Invalid client secret format.');
        }

        const { data, error } = await supabase.functions.invoke<PaymentStatusResponse>(
          'get-payment-status',
          {
            method: 'POST', // Ensure this matches the Edge Function
            body: intentIdPayload,
          }
        );

        if (error) {
            throw new Error(error.message || 'Failed to fetch payment status.');
        }

        if (!data || !data.status) {
            throw new Error('Invalid response from payment status check.');
        }

        switch (data.status) {
          case 'succeeded':
            setStatus('success');
            refreshSubscription(); // Refresh subscription state after successful payment
            break;
          case 'processing':
            setStatus('processing');
            break;
          case 'requires_payment_method':
          case 'canceled': // Treat canceled like an error
          case 'requires_capture': // Might need specific handling
          case 'requires_confirmation': // Should ideally not happen here
          case 'requires_action':
            setStatus('error');
            setErrorMessage(data.error?.message || 'Payment failed or requires action. Please try again.');
            break;
          default:
            setStatus('error');
            setErrorMessage('An unexpected payment status occurred.');
            break;
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'An error occurred while verifying your payment.');
        console.error('Checkout confirmation error:', err);
      }
    };

    checkStatus();

    // No dependencies array needed if it should only run once on mount based on searchParams
  }, [searchParams, refreshSubscription]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">Verifying payment status...</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <CardTitle className="mb-2">Payment Successful!</CardTitle>
            <CardDescription className="mb-6">Your payment has been confirmed. Your access has been granted or updated.</CardDescription>
            <Button asChild>
              <Link to="/dashboard">Go to Dashboard</Link> { /* Adjust link as needed */ }
            </Button>
          </div>
        );
      case 'processing':
        return (
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4 h-12 w-12" />
            <CardTitle className="mb-2">Payment Processing</CardTitle>
            <CardDescription className="mb-6">Your payment is still processing. We will update your access once it's confirmed. You can close this page.</CardDescription>
            {/* Optionally add a link back */}
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <XCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />
            <CardTitle className="mb-2">Payment Failed</CardTitle>
            <CardDescription className="mb-6">{errorMessage || 'An error occurred with your payment.'}</CardDescription>
            <div className="flex justify-center gap-4">
               <Button variant="outline" asChild>
                  <Link to="/pricing">Try Again</Link> { /* Adjust link */ }
               </Button>
               {/* Add link to support? */}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-150px)] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          {/* Header can be dynamic based on status if needed */}
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        <CardFooter>
          {/* Footer content if needed */}
        </CardFooter>
      </Card>
    </div>
  );
} 