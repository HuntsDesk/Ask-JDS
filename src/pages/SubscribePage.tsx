import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSubscriptionCheckout } from '../lib/stripe/checkout';
import SubscriptionTierSelector from '../components/subscription/SubscriptionTierSelector';
import { useAuth } from '../lib/auth';
import { useToast } from '../hooks/use-toast';

// Subscription types
type SubscriptionTier = 'premium' | 'unlimited';
type BillingInterval = 'monthly' | 'yearly';

// Placeholder prices - these should come from your environment variables or API
const SUBSCRIPTION_PRICES = {
  premium: {
    monthly: 9.99,
    yearly: 99.99
  },
  unlimited: {
    monthly: 19.99,
    yearly: 199.99
  }
};

export default function SubscribePage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('unlimited');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to subscribe.',
        variant: 'destructive'
      });
      
      // Redirect to sign in
      navigate('/login?redirect=/subscribe');
      return;
    }

    setIsLoading(true);
    
    try {
      // Log the subscription intent
      console.log(`Creating ${billingInterval} subscription checkout for ${selectedTier} tier`);
      
      const { error, url } = await createSubscriptionCheckout({
        tier: selectedTier,
        interval: billingInterval
      });
      
      if (error || !url) {
        console.error('Subscription checkout error:', error);
        toast({
          title: 'Subscription error',
          description: 'There was a problem setting up your subscription. Please try again.',
          variant: 'destructive'
        });
        return;
      }
      
      // Redirect to Stripe checkout
      console.log('Redirecting to checkout:', url);
      window.location.href = url;
      
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Something went wrong',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Subscribe to JD Simplified</h1>
        <p className="text-gray-600 mt-2">Choose the subscription plan that works best for you</p>
      </div>
      
      <div className="mt-10">
        <SubscriptionTierSelector
          selectedTier={selectedTier}
          billingInterval={billingInterval}
          onTierChange={setSelectedTier}
          onIntervalChange={setBillingInterval}
          prices={SUBSCRIPTION_PRICES}
          onSubscribe={handleSubscribe}
          isLoading={isLoading || authLoading}
        />
      </div>
      
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>All plans include a 7-day free trial. Cancel anytime.</p>
        <p className="mt-2">Questions about our subscription plans? <a href="/contact" className="underline hover:text-blue-600">Contact us</a></p>
      </div>
    </div>
  );
} 