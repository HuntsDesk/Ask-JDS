import React, { useEffect, useMemo } from 'react';
import { loadStripe, Appearance } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StripePaymentForm } from './StripePaymentForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/lib/theme-provider';
import { getStripePublishableKey } from '@/lib/env-utils';

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
  
  /**
   * Optional tier name for tracking subscription type
   */
  tier?: string;
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
  onError,
  tier
}: StripeCheckoutDialogProps) {
  const { theme } = useTheme();
  
  // Lazy-load Stripe to avoid module load time errors
  const stripePromise = useMemo(() => {
    try {
      const publishableKey = getStripePublishableKey();
      return loadStripe(publishableKey);
    } catch (error) {
      console.error('Failed to load Stripe:', error);
      return null;
    }
  }, []);
  
  // Log key information when props change
  useEffect(() => {
    console.log('StripeCheckoutDialog:', {
      open,
      hasClientSecret: !!clientSecret,
      stripeLoaded: !!stripePromise,
      currentTheme: theme
    });
    
    if (!stripePromise) {
      console.warn('Stripe has not loaded yet. Check VITE_STRIPE_PUBLISHABLE_KEY environment variable.');
    }
    
    if (!clientSecret) {
      console.warn('No client secret provided to StripeCheckoutDialog.');
    }
  }, [open, clientSecret, theme, stripePromise]);
  
  // Options for the Elements provider
  const stripeElementsOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: theme === 'dark' ? 'night' : 'stripe',
      variables: {
        colorPrimary: '#F37022', // Orange from theme
        colorBackground: theme === 'dark' ? '#1f2937' : '#ffffff',
        colorText: theme === 'dark' ? '#e5e7eb' : '#1f2937',
        colorDanger: theme === 'dark' ? '#ef4444' : '#dc2626',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Label': {
          color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
        },
        '.Input': {
          color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
          backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
          borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
        },
        '.Input:hover': {
          borderColor: theme === 'dark' ? '#6b7280' : '#d1d5db',
        },
        '.Input:focus': {
          borderColor: '#F37022',
        },
        '.Error': {
          color: theme === 'dark' ? '#f87171' : '#dc2626',
        },
        '.Tab': {
          backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
          color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
        },
        '.Tab:hover': {
          backgroundColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
        },
        '.Tab--selected': {
          backgroundColor: theme === 'dark' ? '#4b5563' : '#ffffff',
          color: theme === 'dark' ? '#ffffff' : '#000000',
          borderColor: '#F37022',
        }
      }
    } as Appearance
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading payment form...</p>
            <p className="text-xs text-red-500 dark:text-red-400">If this persists, check that Stripe API keys are configured correctly.</p>
          </div>
        ) : !clientSecret || clientSecret === 'loading' ? (
          <div className="flex flex-col items-center py-6 space-y-4">
            <LoadingSpinner className="h-8 w-8" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Preparing your payment form...</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">This should only take a moment.</p>
          </div>
        ) : (
          <Elements options={stripeElementsOptions} stripe={stripePromise}>
            <StripePaymentForm 
              clientSecret={clientSecret}
              onSuccess={onSuccess}
              onError={handleError}
              tier={tier}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
} 