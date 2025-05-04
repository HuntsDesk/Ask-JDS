import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { trackEvent, AnalyticsEventType } from '@/lib/flotiq/analytics';
import { supabase } from '@/lib/supabase';

const UnlimitedPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [courseCount, setCourseCount] = useState<number>(0);
  
  // Check if there was a cancelled checkout
  const checkoutCancelled = new URLSearchParams(location.search).get('checkout_cancelled') === 'true';
  
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id) {
        setHasSubscription(false);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Check if user has an active unlimited subscription
        const { data: subscription, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .eq('tier', 'unlimited')
          .maybeSingle();
          
        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          console.error('Error checking subscription:', subscriptionError);
        }
        
        // Get course count
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('id', { count: 'exact' });
          
        if (coursesError) {
          console.error('Error getting course count:', coursesError);
        } else {
          setCourseCount(courses.length);
        }
        
        setHasSubscription(!!subscription);
      } catch (error) {
        console.error('Error checking subscription status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSubscription();
    
    // Track page view
    if (user?.id) {
      trackEvent(
        AnalyticsEventType.PAGE_VIEW,
        user.id,
        {
          page: 'unlimited',
          checkout_cancelled: checkoutCancelled,
        }
      );
    }
  }, [user?.id, checkoutCancelled]);
  
  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login?redirectTo=' + encodeURIComponent('/unlimited'));
      return;
    }
    
    setCheckoutLoading(true);
    
    try {
      // Track checkout initiation
      trackEvent(
        AnalyticsEventType.CHECKOUT_INITIATED,
        user.id,
        {
          checkout_type: 'subscription',
          subscription_type: 'unlimited',
        }
      );
      
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'subscription',
          subscription: {
            tier: 'unlimited',
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      // Redirect to checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error initiating checkout:', error);
      
      // Track checkout error
      if (user) {
        trackEvent(
          AnalyticsEventType.CHECKOUT_FAILED,
          user.id,
          {
            checkout_type: 'subscription',
            subscription_type: 'unlimited',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          }
        );
      }
    } finally {
      setCheckoutLoading(false);
    }
  };
  
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
                <svg className="h-6 w-6 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  <strong>Unlimited Access</strong> to all {courseCount} courses
                </span>
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
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Access everything for less than the price of a single course
                </p>
                
                {loading ? (
                  <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : hasSubscription ? (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-4">
                    <p className="text-green-800 dark:text-green-300">
                      You already have an active unlimited subscription!
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={handleSubscribe}
                    disabled={checkoutLoading}
                    size="lg"
                    className="w-full"
                  >
                    {checkoutLoading ? 'Processing...' : 'Subscribe Now'}
                  </Button>
                )}
                
                {!loading && !hasSubscription && (
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
        
        {!loading && !hasSubscription && (
          <div className="text-center">
            <Button 
              onClick={handleSubscribe}
              disabled={checkoutLoading}
              size="lg"
              className="px-8"
            >
              {checkoutLoading ? 'Processing...' : 'Get Unlimited Access Now'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnlimitedPage; 