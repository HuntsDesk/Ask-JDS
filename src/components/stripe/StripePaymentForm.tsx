import { logger } from '@/lib/logger';
import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner'; // Adjust path as needed
import { useLocation } from 'react-router-dom';

interface StripePaymentFormProps {
  clientSecret: string; // Passed after creating PaymentIntent/Subscription
  onSuccess?: (paymentIntentId: string) => void; // Optional callback on success
  onError?: (error: any) => void; // Optional callback on error
  tier?: string; // Optional tier name for tracking subscription type
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ clientSecret, onSuccess, onError, tier }) => {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();

  const [email, setEmail] = useState(''); // For LinkAuthenticationElement
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    logger.debug('StripePaymentForm mounted with clientSecret:', clientSecret ? `${clientSecret.substring(0, 8)}...` : 'none');
    
    if (!stripe) {
      logger.warn('Stripe.js has not yet loaded');
      return;
    }

    if (!clientSecret) {
      logger.error('No client secret provided to StripePaymentForm');
      return;
    }

    // Retrieve PaymentIntent status on mount to verify it's valid
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent, error }) => {
      logger.debug('Initial PaymentIntent status:', paymentIntent?.status);
      if (error) {
        logger.error('Error retrieving payment intent:', error);
        setMessage(`Error: ${error.message}`);
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          setMessage('Payment succeeded! You will be redirected shortly.');
          if (onSuccess) onSuccess(paymentIntent.id);
        } else if (paymentIntent.status === 'requires_payment_method') {
          logger.debug('Payment requires payment method, ready for user input');
        } else {
          logger.debug(`Payment is in state: ${paymentIntent.status}`);
        }
      }
    }).catch(err => {
      logger.error('Exception retrieving payment intent:', err);
      setMessage(`Could not verify payment: ${err.message}`);
    });
  }, [stripe, clientSecret, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      logger.error('Stripe.js has not loaded yet.');
      setMessage('Stripe is not ready. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    setMessage(null); // Clear previous messages

    // Extract course ID from path if present (handles multiple URL patterns)
    let courseId = '';
    // Check for /courses/[id] pattern
    let pathMatch = location.pathname.match(/\/courses\/([^\/]+)/);
    if (!pathMatch) {
      // Check for /course-detail/[id] pattern
      pathMatch = location.pathname.match(/\/course-detail\/([^\/]+)/);
    }
    
    if (pathMatch && pathMatch[1]) {
      courseId = pathMatch[1];
    }

    // Build the return URL with courseId parameter if available
    let returnUrl = courseId 
      ? `${window.location.origin}/checkout-confirmation?course_id=${courseId}`
      : `${window.location.origin}/checkout-confirmation`;
    
    // Add tier parameter if available
    if (tier) {
      returnUrl += (returnUrl.includes('?') ? '&' : '?') + `tier=${encodeURIComponent(tier)}`;
    }

    logger.debug(`Confirming payment with return URL: ${returnUrl}`);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Make sure to change this to your payment completion page
          return_url: returnUrl,
          receipt_email: email || undefined, // Pass email if collected
        },
        // Uncomment below if you want to handle success/failure directly without redirecting
        // redirect: 'if_required' 
      });

      // This point will only be reached if there is an immediate error when
      // confirming the payment. Otherwise, your customer will be redirected to
      // your `return_url`. For some payment methods like iDEAL, your customer will
      // be redirected to an intermediate site first to authorize the payment, then
      // redirected to the `return_url`.
      if (error) {
        logger.error('Stripe confirmPayment error:', error);
        let userMessage = 'An unexpected error occurred.';
        if (error.type === "card_error" || error.type === "validation_error") {
            userMessage = error.message || userMessage;
        } else {
            logger.error('Stripe confirmPayment error details:', JSON.stringify(error));
            userMessage = "Payment failed. Please try again or contact support.";
        }
        setMessage(userMessage);
        if (onError) onError(error);
      }
      // If redirect: 'if_required' was used and payment succeeded directly:
      // else if (paymentIntent && paymentIntent.status === 'succeeded') {
      //    logger.debug('Payment succeeded directly!', paymentIntent);
      //    setMessage('Payment successful!');
      //    if(onSuccess) onSuccess(paymentIntent.id);
      // }
    } catch (err) {
      logger.error('Exception in Stripe confirmPayment:', err);
      setMessage(`Payment error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const paymentElementOptions = {
    layout: "tabs" as const // or "accordion"
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Consider using LinkAuthenticationElement for returning customers */}
      {/* <LinkAuthenticationElement
        id="link-authentication-element"
        onChange={(e) => setEmail(e.value.email)}
      /> */}
      
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      
      {message && (
        <Alert variant="destructive" className="dark:border-red-800 dark:bg-red-950/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="dark:text-red-300">Error</AlertTitle>
          <AlertDescription className="dark:text-red-300">{message}</AlertDescription>
        </Alert>
      )}

      <Button 
        disabled={isLoading || !stripe || !elements} 
        id="submit" 
        className="w-full bg-jdorange hover:bg-jdorange/90 dark:bg-jdorange dark:hover:bg-jdorange/90 dark:text-white"
      >
        <span id="button-text">
          {isLoading ? <LoadingSpinner className="h-5 w-5 inline mr-2" /> : "Pay now"}
        </span>
      </Button>
    </form>
  );
} 