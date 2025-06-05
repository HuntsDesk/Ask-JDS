import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trackEvent, AnalyticsEventType } from '@/lib/flotiq/analytics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { StripePaymentForm } from '@/components/stripe/StripePaymentForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { getStripePublishableKey } from '@/lib/environment';

interface CourseAccessProps {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  isPreview?: boolean;
  daysOfAccess: number;
  stripePriceId: string | null;
}

interface AccessStatus {
  hasDirectEnrollment: boolean;
  enrollmentExpiresAt?: string | null;
}

const CourseAccess: React.FC<CourseAccessProps> = ({ 
  courseId, 
  courseTitle, 
  coursePrice,
  isPreview = false,
  daysOfAccess,
  stripePriceId
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tierName, isActive: isSubscriptionActive, isLoading: isSubscriptionLoading } = useSubscriptionContext();

  const [enrollmentStatus, setEnrollmentStatus] = useState<AccessStatus>({ hasDirectEnrollment: false });
  const [isEnrollmentLoading, setIsEnrollmentLoading] = useState<boolean>(true);

  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

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
  
  useEffect(() => {
    const checkDirectEnrollment = async () => {
      if (!user?.id || !courseId) {
        setIsEnrollmentLoading(false);
        setEnrollmentStatus({ hasDirectEnrollment: false });
        return;
      }
      
      setIsEnrollmentLoading(true);
      try {
        const { data, error } = await supabase
          .from('course_enrollments')
          .select('id, expires_at')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking direct enrollment:', error);
          setEnrollmentStatus({ hasDirectEnrollment: false });
        } else {
          setEnrollmentStatus({
            hasDirectEnrollment: !!data,
            enrollmentExpiresAt: data?.expires_at,
          });
        }
      } catch (error) {
        console.error('Error checking direct enrollment:', error);
        setEnrollmentStatus({ hasDirectEnrollment: false });
      } finally {
        setIsEnrollmentLoading(false);
      }
    };
    
    checkDirectEnrollment();
  }, [user?.id, courseId]);

  const isLoading = isSubscriptionLoading || isEnrollmentLoading;
  const hasUnlimitedAccess = isSubscriptionActive && tierName === 'Unlimited';
  const hasDirectAccess = enrollmentStatus.hasDirectEnrollment;
  const hasAccess = isPreview || hasUnlimitedAccess || hasDirectAccess;
  
  const handlePurchase = async () => {
    if (!user || !stripePriceId) {
      if (!user) {
        navigate('/login?redirectTo=' + encodeURIComponent(`/course-detail/${courseId}`));
      } else {
        toast({ title: "Error", description: "Course price information is missing.", variant: "destructive" });
      }
      return;
    }
    
    setCheckoutLoading(true);
    setClientSecret(null);
    
    try {
      trackEvent(
        AnalyticsEventType.CHECKOUT_INITIATED,
        user.id,
        {
          checkout_type: 'course',
          course_id: courseId,
          course_title: courseTitle,
          price: coursePrice,
          target_stripe_price_id: stripePriceId,
        }
      );

      const { data, error } = await supabase.functions.invoke(
        'create-payment-handler',
        {
          body: {
            purchaseType: 'course_purchase',
            courseId: courseId,
            days_of_access: daysOfAccess,
          },
        }
      );
      
      if (error) {
        throw new Error(error.message || 'Failed to initialize payment.');
      }
      if (!data?.client_secret) {
        throw new Error('Failed to retrieve client secret.');
      }

      setClientSecret(data.client_secret);
      setShowPaymentModal(true);

    } catch (error: any) {
      console.error('Error initiating course purchase:', error);
      toast({ title: "Purchase Error", description: error.message || "Could not start purchase.", variant: "destructive" });
      if (user) {
        trackEvent(
          AnalyticsEventType.CHECKOUT_FAILED,
          user.id,
          {
            checkout_type: 'course',
            course_id: courseId,
            course_title: courseTitle,
            target_stripe_price_id: stripePriceId,
            error_message: error instanceof Error ? error.message : 'Unknown error',
          }
        );
      }
    } finally {
      setCheckoutLoading(false);
    }
  };
  
  const handleUpgradeClick = () => {
    if (!user) {
      navigate('/login?redirectTo=' + encodeURIComponent('/unlimited'));
      return;
    }
    if (user.id) {
      trackEvent(
        AnalyticsEventType.CHECKOUT_INITIATED,
        user.id,
        {
          checkout_type: 'subscription',
          subscription_type: 'unlimited',
          from_component: 'CourseAccess',
          course_id: courseId,
        }
      );
    }
    navigate('/unlimited');
  };
  
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch { 
      return 'Invalid Date';
    }
  };

  const stripeElementsOptions = clientSecret ? { clientSecret } : undefined;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Course Access</CardTitle>
          <CardDescription>Checking access...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Course Access</CardTitle>
          <CardDescription>Sign in to access this course</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in or create an account to purchase this course or get unlimited access to all courses.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate('/login?redirectTo=' + encodeURIComponent(location.pathname))}
            variant="default"
          >
            Sign In
          </Button>
          <Button 
            onClick={() => navigate('/signup?redirectTo=' + encodeURIComponent(location.pathname))}
            variant="outline"
          >
            Create Account
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (hasAccess) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            Course Access 
            <Badge variant="default" className="ml-2 bg-green-600">
              {hasUnlimitedAccess ? 'Unlimited Access' : 'Enrolled'}
            </Badge>
          </CardTitle>
          <CardDescription>
            You have access to this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hasDirectAccess && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Enrollment Details
                </p>
                <p className="text-base">
                  Access expires: {formatDate(enrollmentStatus.enrollmentExpiresAt)}
                </p>
              </div>
            )}
            {hasUnlimitedAccess && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Unlimited Subscription Active
                </p>
                <p className="text-base">
                  Access to all courses included.
                </p>
              </div>
            )}
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-green-800 dark:text-green-300 text-sm">
                You have full access to all content in this course. Happy learning!
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => {
              if (user?.id) {
                trackEvent(
                  AnalyticsEventType.COURSE_VIEW,
                  user.id,
                  {
                    course_id: courseId,
                    course_title: courseTitle,
                    has_unlimited: hasUnlimitedAccess,
                  }
                );
              }
              navigate(`/course/${courseId}/lessons`);
            }}
            className="w-full"
          >
            Start Learning
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Course Access</CardTitle>
          <CardDescription>
            Purchase required to access full content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              You don't currently have access to this course. Choose an option below to get access.
            </p>
            
            <div className="flex flex-col space-y-2">
              {stripePriceId && coursePrice > 0 && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Single Course</h3>
                    <p className="text-sm text-gray-500">${coursePrice} for {daysOfAccess} days of access</p>
                  </div>
                  <Button 
                    onClick={handlePurchase}
                    disabled={checkoutLoading}
                    size="sm"
                  >
                    {checkoutLoading ? 'Processing...' : 'Purchase'}
                  </Button>
                </div>
              )}
              
              {tierName !== 'Unlimited' && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <h3 className="font-medium">Unlimited Access</h3>
                    <p className="text-sm text-gray-500">Access all courses for one monthly fee</p>
                  </div>
                  <Button 
                    onClick={handleUpgradeClick}
                    variant="outline"
                    size="sm"
                  >
                    Learn More
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              Enter your payment details below to purchase access to this course.
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
    </>
  );
};

export default CourseAccess; 