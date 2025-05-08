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

interface StripePaymentFormProps {
  clientSecret: string; // Passed after creating PaymentIntent/Subscription
  onSuccess?: (paymentIntentId: string) => void; // Optional callback on success
  onError?: (error: any) => void; // Optional callback on error
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ clientSecret, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [email, setEmail] = useState(''); // For LinkAuthenticationElement
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    if (!clientSecret) {
      return;
    }

    // Optionally retrieve PaymentIntent status immediately if needed, though confirmPayment handles final status
    // stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
    //   switch (paymentIntent?.status) {
    //     case "succeeded":
    //       setMessage("Payment succeeded!");
    //       break;
    //     // Handle other statuses if necessary
    //   }
    // });
  }, [stripe, clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      console.error('Stripe.js has not loaded yet.');
      setMessage('Stripe is not ready. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    setMessage(null); // Clear previous messages

    const returnUrl = window.location.origin + '/checkout-confirmation'; // Use the route set up previously

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
        let userMessage = 'An unexpected error occurred.';
        if (error.type === "card_error" || error.type === "validation_error") {
            userMessage = error.message || userMessage;
        } else {
            console.error('Stripe confirmPayment error:', error);
            userMessage = "Payment failed. Please try again or contact support.";
        }
        setMessage(userMessage);
        if (onError) onError(error);
    }
    // If redirect: 'if_required' was used and payment succeeded directly:
    // else if (paymentIntent && paymentIntent.status === 'succeeded') {
    //    console.log('Payment succeeded directly!', paymentIntent);
    //    setMessage('Payment successful!');
    //    if(onSuccess) onSuccess(paymentIntent.id);
    // }

    setIsLoading(false);
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
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button disabled={isLoading || !stripe || !elements} id="submit" className="w-full">
        <span id="button-text">
          {isLoading ? <LoadingSpinner className="h-5 w-5 inline mr-2" /> : "Pay now"}
        </span>
      </Button>
    </form>
  );
} 