import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { trackEvent, AnalyticsEventType } from '@/lib/flotiq/analytics';
import { supabase } from '@/lib/supabase';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { StripePaymentForm } from '@/components/stripe/StripePaymentForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { getStripePublishableKey } from '@/lib/environment';

const UnlimitedPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isActive: hasActiveSubscription, tierName, isLoading: subscriptionLoading } = useSubscriptionContext();
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [courseCount, setCourseCount] = useState<number>(0);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  
  // Simple state for displaying messages within the component
  const [message, setMessage] = useState<string | null>(null);
  
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
  
  // Check if there was a cancelled checkout
  const checkoutCancelled = new URLSearchParams(location.search).get('checkout_cancelled') === 'true';
  
  useEffect(() => {
    const getCourseCount = async () => {
      try {
        const { count, error } = await supabase
          .from('courses')
          .select('id', { count: 'exact', head: true });

        if (error) {
          console.error('Error getting course count:', error);
        } else {
          setCourseCount(count ?? 0);
        }
      } catch (error) {
        console.error('Error fetching course count:', error);
      }
    };
    getCourseCount();
  }, []);
  
  useEffect(() => {
    if (user?.id) {
      trackEvent(
        AnalyticsEventType.PAGE_VIEW,
        user.id,
        {
          page: 'unlimited',
          checkout_cancelled: checkoutCancelled,
          current_tier: tierName,
        }
      );
    }
  }, [user?.id, checkoutCancelled, tierName]);
  
  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      navigate('/login?redirectTo=' + encodeURIComponent('/unlimited'));
      return;
    }
    
    setCheckoutLoading(true);
    setClientSecret(null);
    setMessage(null);

    try {
      // Track checkout initiation
      trackEvent(
        AnalyticsEventType.CHECKOUT_INITIATED,
        user.id,
        {
          checkout_type: 'subscription',
          subscription_type: 'unlimited',
          target_stripe_price_id: priceId,
        }
      );
      
      // Call the new Edge Function
      const { data, error } = await supabase.functions.invoke(
        'create-payment-handler',
        {
          body: {
            purchaseType: 'subscription',
            subscriptionTier: 'unlimited',
            planInterval: priceId.includes('month') ? 'month' : 'year',
          },
        }
      );

      if (error) {
        throw new Error(error.message || 'Failed to initialize payment.');
      }
      if (!data?.client_secret) {
        throw new Error('Failed to retrieve client secret from server.');
      }

      setClientSecret(data.client_secret);
      setShowPaymentModal(true);

    } catch (error: any) {
      console.error('Error initiating checkout:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "Could not start the subscription process. Please try again.",
        variant: "destructive",
      });
      
      // Track checkout error
      if (user) {
        trackEvent(
          AnalyticsEventType.CHECKOUT_FAILED,
          user.id,
          {
            checkout_type: 'subscription',
            subscription_type: 'unlimited',
            target_stripe_price_id: priceId,
            error_message: error instanceof Error ? error.message : 'Unknown error',
          }
        );
      }
    } finally {
      setCheckoutLoading(false);
    }
  };
  
  // Get the correct Stripe Price ID from env vars (ensure these exist)
  // Using VITE_ prefix for client-side access
  const unlimitedMonthlyPriceId = import.meta.env.VITE_UNLIMITED_MONTHLY_PRICE_ID;
  const unlimitedAnnualPriceId = import.meta.env.VITE_UNLIMITED_ANNUAL_PRICE_ID; // If you have an annual plan

  // Options for the Elements provider
  const stripeElementsOptions = clientSecret ? { clientSecret } : undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Unlimited Course Access</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Get access to all our courses for one simple monthly subscription
          </p>
          
          {checkoutCancelled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200">
              Your previous checkout was cancelled. You can try again whenever you're ready.
            </div>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-4">What You Get</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span><strong>Unlimited Access</strong> to all {courseCount} courses</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  <strong>New Courses</strong> added regularly at no extra cost
                </span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  <strong>No Long-Term Commitment</strong> - cancel anytime
                </span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  <strong>Premium Support</strong> for all courses
                </span>
              </li>
            </ul>
          </div>
          
          <Card className="border-2 border-primary shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full font-semibold mb-4">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold mb-2">Unlimited Subscription</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$30</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Access everything for less than the price of a single course
                </p>
                
                {subscriptionLoading ? (
                  <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : hasActiveSubscription && tierName === 'Unlimited' ? (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-4">
                    <p className="text-green-800 dark:text-green-300">
                      You already have an active unlimited subscription!
                    </p>
                  </div>
                ) : (
                  <>
                    {unlimitedMonthlyPriceId && (
                      <Button
                        onClick={() => handleSubscribe(unlimitedMonthlyPriceId)}
                        disabled={checkoutLoading}
                        size="lg"
                        className="w-full"
                      >
                        {checkoutLoading ? 'Processing...' : 'Subscribe Now (Monthly)'}
                      </Button>
                    )}
                  </>
                )}
                
                {!subscriptionLoading && !(hasActiveSubscription && tierName === 'Unlimited') && (
                  <p className="text-sm text-gray-500 mt-2">
                    Secure payment via Stripe
                  </p>
                )}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium mb-3">Included Features:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    All current courses ({courseCount})
                  </li>
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    All future courses
                  </li>
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Access to premium community
                  </li>
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cancel anytime
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-bold mb-2">Can I cancel my subscription?</h3>
              <p>Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.</p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-bold mb-2">What happens when new courses are added?</h3>
              <p>As an unlimited subscriber, you'll automatically get access to all new courses that we add to the platform, at no additional cost.</p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-bold mb-2">How does billing work?</h3>
              <p>Your subscription will be charged monthly. You can cancel at any time, and your card will not be charged for the next period.</p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-bold mb-2">Can I upgrade from a single course purchase?</h3>
              <p>Absolutely! If you've already purchased individual courses, you can still subscribe to the unlimited plan to get access to everything else.</p>
            </div>
          </div>
        </div>
        
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Complete Your Subscription</DialogTitle>
              <DialogDescription>
                Enter your payment details below to start your Unlimited subscription.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {clientSecret && stripePromise && stripeElementsOptions && (
                <Elements options={stripeElementsOptions} stripe={stripePromise}>
                  <StripePaymentForm clientSecret={clientSecret} />
                </Elements>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UnlimitedPage; 