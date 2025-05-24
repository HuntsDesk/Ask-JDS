import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase'; // Adjust path if needed
import { LoadingSpinner } from '@/components/LoadingSpinner'; // Adjust path if needed
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Adjust path if needed
import { Button } from '@/components/ui/button'; // Adjust path if needed
import { useSubscriptionContext } from '@/contexts/SubscriptionContext'; // Adjust path if needed
import { useAuth } from '@/lib/auth'; // Add this import
import { manuallyActivateSubscription, getPriceIdForTier } from '@/lib/subscription'; // Import functions

// Type for the response from the get-payment-status function
interface PaymentStatusResponse {
  id?: string;
  status?: string;
  client_secret?: string;
  error?: { message: string };
  metadata?: Record<string, string>;
}

// Global guards to prevent multiple simultaneous activation attempts and payment reprocessing
let activationInProgress = false;
const processedPaymentIntents = new Set<string>();

// Helper function to add retry logic for subscription activation
async function attemptSubscriptionActivation(priceId: string, maxRetries = 1): Promise<boolean> {
  // Prevent multiple simultaneous activation attempts
  if (activationInProgress) {
    console.log('Activation already in progress, skipping...');
    return false;
  }
  
  console.log(`Attempting to activate subscription with price ID: ${priceId}, max retries: ${maxRetries}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      activationInProgress = true;
      console.log(`Activation attempt #${attempt} for price ID: ${priceId}`);
      
      const success = await manuallyActivateSubscription(priceId);
      if (success) {
        console.log(`Subscription successfully activated on attempt #${attempt}`);
        return true;
      } else {
        console.log(`Activation attempt #${attempt} failed`);
      }
    } catch (error) {
      console.error(`Error during activation attempt #${attempt}:`, error);
    } finally {
      activationInProgress = false;
    }
  }
  
  console.log(`All ${maxRetries} activation attempts failed for price ID: ${priceId}`);
  return false;
}

export function CheckoutConfirmationPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'processing' | 'requires_action' | 'waiting_auth'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [priceId, setPriceId] = useState<string | null>(null);
  const { refreshSubscription } = useSubscriptionContext(); // Get refresh function from context
  const navigate = useNavigate(); // Add this for programmatic navigation
  const { user } = useAuth(); // Add this to access user information
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      // Wait for authentication if needed
      if (!user) {
        console.log('User not yet authenticated, waiting...');
        setStatus('waiting_auth');
        
        const authTimeout = setTimeout(() => {
          setStatus('error');
          setErrorMessage('Authentication timeout. Please log in and try again.');
          setTimeout(() => {
            navigate('/login?redirectTo=' + encodeURIComponent(window.location.pathname + window.location.search));
          }, 2000);
        }, 10000); // 10 second timeout
        
        return () => clearTimeout(authTimeout);
      }

      console.log('User authenticated, proceeding with payment verification');
      
      const paymentIntentId = searchParams.get('payment_intent');
      const redirectStatus = searchParams.get('redirect_status');
      
      // Check if this payment intent has already been processed
      if (paymentIntentId && processedPaymentIntents.has(paymentIntentId)) {
        console.log(`Payment intent ${paymentIntentId} already processed, skipping...`);
        setStatus('success');
        return;
      }
      
      // Extract tier and set price ID if available
      const tier = searchParams.get('tier');
      if (tier) {
        const mappedPriceId = getPriceIdForTier(tier as any);
        console.log(`Setting price ID for tier ${tier}: ${mappedPriceId}`);
        setPriceId(mappedPriceId);
      }
      
      // Check for course ID as well
      const courseIdParam = searchParams.get('course_id');
      if (courseIdParam) {
        setCourseId(courseIdParam);
      }
      
      // For manual activation or payment verification
      if (!paymentIntentId) {
        console.log('No payment intent ID found');
        setStatus('error');
        setErrorMessage('No payment information found');
        return;
      }
      
      try {
        console.log(`Checking payment status with: {payment_intent_id: '${paymentIntentId}'}`);
        
        const response = await supabase.functions.invoke('get-payment-status', {
          body: { payment_intent_id: paymentIntentId }
        });
        
        console.log('Payment status response:', response.data);
        
        if (response.error) {
          console.error('Error checking payment status:', response.error);
          setStatus('error');
          setErrorMessage(response.error.message || 'Failed to verify payment');
          return;
        }
        
        const { status: paymentStatus, error } = response.data;
        
        if (error) {
          console.error('Payment status error:', error);
          setStatus('error');
          setErrorMessage(error.message || 'Payment verification failed');
          return;
        }
        
        if (paymentStatus === 'succeeded') {
          console.log('Payment succeeded, activating subscription with price ID:', priceId);
          
          if (!priceId) {
            console.error('No price ID found for subscription activation');
            setStatus('error');
            setErrorMessage('Unable to activate subscription: missing price information');
            return;
          }
          
          // Mark this payment intent as being processed
          processedPaymentIntents.add(paymentIntentId);
          
          const activationSuccess = await attemptSubscriptionActivation(priceId, 1);
          
          if (activationSuccess) {
            console.log('Subscription activated successfully');
            setStatus('success');
            // Refresh the subscription status
            await refreshSubscription();
          } else {
            console.log('Subscription activation failed, but payment succeeded');
            setStatus('manual'); // Show manual activation option
          }
        } else {
          console.log(`Payment status: ${paymentStatus}`);
          setStatus('error');
          setErrorMessage(`Payment ${paymentStatus}`);
        }
      } catch (error) {
        console.error('Error during payment verification:', error);
        setStatus('error');
        setErrorMessage('Failed to verify payment');
      }
    };
    
    // Only run once per payment intent
    checkStatus();
  }, [searchParams, refreshSubscription, priceId, user]);

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
      case 'waiting_auth':
        return (
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4 h-12 w-12" />
            <CardTitle className="mb-2">Verifying Authentication</CardTitle>
            <CardDescription className="mb-6">Please wait while we verify your login status...</CardDescription>
            <p className="text-xs text-muted-foreground">If this takes more than a few seconds, you may need to log in again.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-150px)] items-center justify-center py-12 bg-white dark:bg-gray-900">
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