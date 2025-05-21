import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase'; // Adjust path if needed
import { LoadingSpinner } from '@/components/LoadingSpinner'; // Adjust path if needed
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Adjust path if needed
import { Button } from '@/components/ui/button'; // Adjust path if needed
import { useSubscriptionContext } from '@/contexts/SubscriptionContext'; // Adjust path if needed
import { manuallyActivateSubscription, getPriceIdForTier } from '@/lib/subscription'; // Import functions

// Type for the response from the get-payment-status function
interface PaymentStatusResponse {
  id?: string;
  status?: string;
  client_secret?: string;
  error?: { message: string };
  metadata?: Record<string, string>;
}

export function CheckoutConfirmationPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'processing' | 'requires_action'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [priceId, setPriceId] = useState<string | null>(null);
  const { refreshSubscription } = useSubscriptionContext(); // Get refresh function from context
  const navigate = useNavigate(); // Add this for programmatic navigation

  useEffect(() => {
    // Extract course ID from search params if available
    const courseIdParam = searchParams.get('course_id');
    if (courseIdParam) {
      setCourseId(courseIdParam);
    }

    // Check for tier parameter that might indicate which subscription was purchased
    const tierParam = searchParams.get('tier');
    if (tierParam) {
      // Set the correct price ID for the tier
      setPriceId(getPriceIdForTier(tierParam));
      console.log(`Setting price ID for tier ${tierParam}: ${getPriceIdForTier(tierParam)}`);
    }

    const clientSecret = searchParams.get('payment_intent_client_secret') || searchParams.get('setup_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');

    if (!clientSecret) {
      setStatus('error');
      setErrorMessage('Missing payment confirmation details.');
      return;
    }

    const checkStatus = async () => {
      try {
        // Determine the type of intent based on what query param was provided
        let intentIdPayload: { payment_intent_id?: string; setup_intent_id?: string } = {};
        const paymentIntentSecret = searchParams.get('payment_intent_client_secret');
        const setupIntentSecret = searchParams.get('setup_intent_client_secret');
        
        if (paymentIntentSecret) {
          // Extract payment intent ID from client secret or use the full secret
          // Example format: pi_3NqVtVBdYlm3idIZ0M3XdjeK_secret_9HkZpQw32Bz00l8MJiPKNyU4s
          const matches = paymentIntentSecret.match(/^(pi_[a-zA-Z0-9]+)_secret/);
          const paymentIntentId = matches ? matches[1] : undefined;
          
          intentIdPayload = { payment_intent_id: paymentIntentId || paymentIntentSecret };
        } else if (setupIntentSecret) {
          // Extract setup intent ID from client secret
          const matches = setupIntentSecret.match(/^(seti_[a-zA-Z0-9]+)_secret/);
          const setupIntentId = matches ? matches[1] : undefined;
          
          intentIdPayload = { setup_intent_id: setupIntentId || setupIntentSecret };
        } else {
          throw new Error('Invalid client secret format.');
        }

        console.log('Checking payment status with:', intentIdPayload);

        const { data, error } = await supabase.functions.invoke<PaymentStatusResponse>(
          'get-payment-status',
          {
            method: 'POST',
            body: intentIdPayload,
          }
        );

        if (error) {
            console.error('Edge function error:', error);
            throw new Error(error.message || 'Failed to fetch payment status.');
        }

        console.log('Payment status response:', data);

        if (!data) {
            throw new Error('Empty response from payment status check.');
        }

        // Handle both formats of response
        const paymentStatus = data.status || (typeof data === 'object' && 'status' in data ? data.status : undefined);
        
        if (!paymentStatus) {
            throw new Error('Invalid response format: No status found');
        }

        // Extract metadata and price ID from the payment intent response if available
        if (data && typeof data === 'object') {
          // Try to extract course_id and price_id from metadata or other fields
          if ('metadata' in data && data.metadata && typeof data.metadata === 'object') {
            const metadata = data.metadata as Record<string, string>;
            if (metadata.course_id) {
              setCourseId(metadata.course_id);
            }
            // Get the price ID for subscription activation
            if (metadata.target_stripe_price_id) {
              setPriceId(metadata.target_stripe_price_id);
              console.log(`Found price ID in metadata: ${metadata.target_stripe_price_id}`);
            }
          }
        }

        switch (paymentStatus) {
          case 'succeeded':
            setStatus('success');
            
            // Handle subscription activation manually
            if (priceId) {
              console.log(`Attempting to manually activate subscription with price ID: ${priceId}`);
              const activated = await manuallyActivateSubscription(priceId);
              if (activated) {
                console.log('Subscription manually activated successfully');
              } else {
                console.warn('Manual subscription activation failed - trying with hardcoded price ID');
                // Try with hardcoded price ID for unlimited tier as fallback
                const fallbackPriceId = getPriceIdForTier('unlimited');
                const fallbackActivated = await manuallyActivateSubscription(fallbackPriceId);
                if (fallbackActivated) {
                  console.log('Subscription manually activated with fallback price ID');
                } else {
                  console.error('Both manual activation attempts failed');
                }
              }
            } else {
              console.warn('No price ID found for manual subscription activation - using hardcoded price ID');
              // Try with hardcoded price ID for unlimited tier as fallback
              const fallbackPriceId = getPriceIdForTier('unlimited');
              const fallbackActivated = await manuallyActivateSubscription(fallbackPriceId);
              if (fallbackActivated) {
                console.log('Subscription manually activated with hardcoded price ID');
              } else {
                console.error('Manual activation with hardcoded price ID failed');
              }
            }
            
            // Refresh subscription state after successful payment
            await refreshSubscription();
            break;
          case 'processing':
            setStatus('processing');
            break;
          case 'requires_payment_method':
            setStatus('error');
            setErrorMessage('Your payment method was declined. Please try again with a different payment method.');
            break;
          case 'requires_action':
            setStatus('requires_action');
            setErrorMessage('Your payment requires additional verification. Please check your email or banking app for instructions.');
            break;
          case 'canceled': 
            setStatus('error');
            setErrorMessage('The payment was canceled. Please try again.');
            break;
          case 'requires_capture': 
            setStatus('processing');
            setErrorMessage('Your payment is awaiting capture. This usually happens automatically.');
            break;
          case 'requires_confirmation': 
            setStatus('error');
            setErrorMessage('Your payment requires confirmation. Please try again.');
            break;
          default:
            setStatus('error');
            setErrorMessage(`An unexpected payment status occurred: ${paymentStatus}`);
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
  }, [searchParams, refreshSubscription, priceId]);

  // Handle retry payment
  const handleRetryPayment = () => {
    // First check if we have the course ID in state
    if (courseId) {
      // Use the same route format as the JDSCourseCard component
      navigate(`/course/${courseId}`);
    } else {
      // Fallback to courses page if no course ID
      navigate('/courses');
    }
  };

  // Handle manual activation if needed
  const handleManualActivation = async () => {
    if (!priceId) {
      setErrorMessage('No price ID available for activation');
      return;
    }
    
    setStatus('loading');
    try {
      const success = await manuallyActivateSubscription(priceId);
      if (success) {
        await refreshSubscription();
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage('Manual activation failed. Please contact support.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Error during manual activation');
    }
  };

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
            <div className="flex flex-col space-y-2">
              <Button className="bg-jdorange hover:bg-jdorange/90" asChild>
                <Link to="/courses/my-courses">Go to My Courses</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/settings">View My Subscription</Link>
              </Button>
            </div>
          </div>
        );
      case 'processing':
        return (
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4 h-12 w-12" />
            <CardTitle className="mb-2">Payment Processing</CardTitle>
            <CardDescription className="mb-6">Your payment is still processing. We will update your access once it's confirmed. You can close this page.</CardDescription>
            <Button variant="outline" asChild>
              <Link to="/">Go to Home</Link>
            </Button>
          </div>
        );
      case 'requires_action':
        return (
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
            <CardTitle className="mb-2">Action Required</CardTitle>
            <CardDescription className="mb-6">
              {errorMessage || 'Your payment requires additional verification. Please check your email or banking app for instructions.'}
            </CardDescription>
            <div className="flex justify-center gap-4">
              <Button variant="default" onClick={() => window.location.reload()}>
                Check Status Again
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Go to Home</Link>
              </Button>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <XCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />
            <CardTitle className="mb-2">Payment Failed</CardTitle>
            <CardDescription className="mb-6">{errorMessage || 'An error occurred with your payment.'}</CardDescription>
            <div className="flex flex-col space-y-2">
              <Button variant="default" className="bg-jdorange hover:bg-jdorange/90" onClick={handleRetryPayment}>
                Try Again
              </Button>
              {priceId && (
                <Button variant="outline" onClick={handleManualActivation}>
                  Manually Activate Subscription
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link to="/">Go to Home</Link>
              </Button>
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