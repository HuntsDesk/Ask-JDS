import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics/track';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Initialize Stripe outside of component to avoid recreating on re-renders
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  productName: string;
  onCancel: () => void;
  returnUrl: string;
}

// Inner payment form component
function PaymentForm({ clientSecret, amount, productName, onCancel, returnUrl }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'An unknown error occurred');
        toast({
          title: 'Payment failed',
          description: error.message || 'Please try again',
          variant: 'destructive',
        });
      }
      // No need to handle success case as user will be redirected
    } catch (err: any) {
      setErrorMessage(err.message || 'An unknown error occurred');
      toast({
        title: 'Payment error',
        description: err.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border p-4 rounded-md bg-card">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">{productName}</h3>
          <span className="font-bold">${(amount / 100).toFixed(2)}</span>
        </div>
        
        <PaymentElement className="mb-6" />
        
        {errorMessage && (
          <div className="text-red-500 text-sm mt-2 mb-4">{errorMessage}</div>
        )}
        
        <div className="flex space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isLoading || !stripe || !elements} 
            className="flex-1"
          >
            {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Pay now
          </Button>
        </div>
      </div>
    </form>
  );
}

interface StripePaymentElementProps {
  courseId?: string;
  isRenewal?: boolean;
  subscriptionTier?: 'premium' | 'unlimited';
  interval?: 'month' | 'year';
  onSuccess?: () => void;
  onCancel: () => void;
}

export function StripePaymentElement({
  courseId,
  isRenewal = false,
  subscriptionTier,
  interval,
  onCancel
}: StripePaymentElementProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const returnUrl = window.location.origin + '/thank-you';

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error(`Authentication error: ${sessionError.message}`);
        if (!session) throw new Error('Authentication required');

        // Determine mode and payload
        const mode = courseId ? 'payment' : 'subscription';
        const payload = courseId 
          ? { courseId, isRenewal, mode }
          : { subscriptionTier, interval, mode };

        // Call Edge Function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to create payment (${response.status})`);
        }

        const data = await response.json();
        
        if (data.status === 'error') {
          throw new Error(data.error || 'Failed to create payment intent');
        }

        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setProductName(data.productName);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Failed to initialize payment');
        toast({
          title: 'Checkout Error',
          description: err.message || 'Failed to initialize payment',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [courseId, isRenewal, subscriptionTier, interval]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-center text-muted-foreground">Preparing payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={onCancel}>Back</Button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Unable to initialize payment</p>
        <Button onClick={onCancel}>Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Elements 
        stripe={stripePromise} 
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#6366f1', // Match your site's primary color
              borderRadius: '8px',
            },
          },
        }}
      >
        <PaymentForm 
          clientSecret={clientSecret}
          amount={amount}
          productName={productName}
          onCancel={onCancel}
          returnUrl={returnUrl}
        />
      </Elements>
    </div>
  );
} 