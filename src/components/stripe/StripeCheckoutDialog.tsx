import React, { useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StripePaymentForm } from './StripePaymentForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';

// Load Stripe outside component to avoid recreating on render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripeCheckoutDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  
  /**
   * Function to call when the dialog is closed
   */
  onClose: () => void;
  
  /**
   * The client secret from the PaymentIntent or SetupIntent
   */
  clientSecret: string;
  
  /**
   * Optional title for the dialog
   * @default "Complete your payment"
   */
  title?: string;
  
  /**
   * Optional description for the dialog
   */
  description?: string;
  
  /**
   * Optional callback for successful payment
   */
  onSuccess?: (paymentIntentId: string) => void;
  
  /**
   * Optional callback for payment errors
   */
  onError?: (error: any) => void;
}

/**
 * A shared component for displaying a Stripe checkout dialog
 * with Payment Elements UI for collecting payment information.
 */
export function StripeCheckoutDialog({
  open,
  onClose,
  clientSecret,
  title = "Complete your payment",
  description,
  onSuccess,
  onError
}: StripeCheckoutDialogProps) {
  // Log key information when props change
  useEffect(() => {
    console.log('StripeCheckoutDialog:', {
      open,
      hasClientSecret: !!clientSecret,
      stripeLoaded: !!stripePromise
    });
    
    if (!stripePromise) {
      console.warn('Stripe has not loaded yet. Check VITE_STRIPE_PUBLISHABLE_KEY environment variable.');
    }
    
    if (!clientSecret) {
      console.warn('No client secret provided to StripeCheckoutDialog.');
    }
  }, [open, clientSecret]);
  
  // Options for the Elements provider
  const stripeElementsOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#F37022', // Orange from theme
      }
    }
  } : undefined;
  
  const handleError = (error: any) => {
    console.error('Payment error:', error);
    toast.error(error.message || 'Payment failed');
    if (onError) onError(error);
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        {!stripePromise ? (
          <div className="flex flex-col items-center py-6 space-y-4">
            <LoadingSpinner className="h-8 w-8" />
            <p className="text-sm text-gray-500">Loading payment form...</p>
            <p className="text-xs text-red-500">If this persists, check that Stripe API keys are configured correctly.</p>
          </div>
        ) : !clientSecret ? (
          <div className="text-center text-red-500 py-4">
            <p>Missing payment information. Please try again.</p>
            <p className="text-xs mt-2">Error: No client secret provided</p>
          </div>
        ) : (
          <Elements options={stripeElementsOptions} stripe={stripePromise}>
            <StripePaymentForm 
              clientSecret={clientSecret}
              onSuccess={onSuccess}
              onError={handleError}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
} 