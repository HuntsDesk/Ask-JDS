import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StripePaymentElement } from '@/components/StripePaymentElement';

interface CoursePurchaseButtonProps {
  courseId: string;
  buttonText?: string;
  isRenewal?: boolean;
}

export function CoursePurchaseButton({ 
  courseId, 
  buttonText = 'Purchase Course', 
  isRenewal = false 
}: CoursePurchaseButtonProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  
  const handleSuccess = () => {
    // This will not execute directly due to redirect,
    // but included for completeness
    window.location.href = `/courses/${courseId}?purchase_success=true`;
  };
  
  if (showCheckout) {
    return (
      <StripePaymentElement 
        courseId={courseId}
        isRenewal={isRenewal}
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