import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StripePaymentElement } from '@/components/StripePaymentElement';

interface SubscribeButtonProps {
  tier: 'premium' | 'unlimited';
  interval: 'month' | 'year';
  buttonText?: string;
}

export function SubscribeButton({ 
  tier, 
  interval, 
  buttonText = 'Subscribe Now' 
}: SubscribeButtonProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  
  const handleSuccess = () => {
    // This will not execute directly due to redirect,
    // but included for completeness
    window.location.href = '/subscription/success';
  };
  
  if (showCheckout) {
    return (
      <StripePaymentElement 
        subscriptionTier={tier}
        interval={interval}
        onSuccess={handleSuccess}
        onCancel={() => setShowCheckout(false)}
      />
    );
  }
  
  return (
    <Button 
      onClick={() => setShowCheckout(true)}
      className="w-full"
    >
      {buttonText}
    </Button>
  );
} 