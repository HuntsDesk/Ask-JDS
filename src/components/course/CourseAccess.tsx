import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Badge } from '@/components/ui';
import { useUserContext } from '@/context/UserContext';
import { trackEvent, AnalyticsEventType } from '@/lib/flotiq/analytics';
import { supabase } from '@/lib/supabase';
import { createCourseCheckout } from '@/lib/stripe/checkout';

// Initialize Supabase client
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CourseAccessProps {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  isPreview?: boolean;
}

interface AccessStatus {
  hasAccess: boolean;
  isEnrolled: boolean;
  enrollment?: {
    id: string;
    status: string;
    source: string;
    created_at: string;
  };
  hasUnlimitedSubscription: boolean;
  subscription?: {
    id: string;
    tier: string;
    status: string;
  };
}

const CourseAccess: React.FC<CourseAccessProps> = ({ 
  courseId, 
  courseTitle, 
  coursePrice,
  isPreview = false
}) => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.id) {
        setAccessStatus(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Check if user has an active enrollment
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('course_enrollments')
          .select('id, status, source, created_at')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .eq('status', 'active')
          .maybeSingle();
          
        if (enrollmentError && enrollmentError.code !== 'PGRST116') {
          console.error('Error checking enrollment:', enrollmentError);
        }
        
        // Check if user has an unlimited subscription
        const { data: subscription, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('id, tier, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .eq('tier', 'unlimited')
          .maybeSingle();
          
        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          console.error('Error checking subscription:', subscriptionError);
        }
        
        // Determine overall access status
        const hasEnrollment = !!enrollment;
        const hasUnlimitedSubscription = !!subscription;
        const hasAccess = hasEnrollment || hasUnlimitedSubscription || isPreview;
        
        setAccessStatus({
          hasAccess,
          isEnrolled: hasEnrollment,
          enrollment: enrollment || undefined,
          hasUnlimitedSubscription,
          subscription: subscription || undefined,
        });
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [user?.id, courseId, isPreview]);
  
  const handlePurchase = async () => {
    if (!user) {
      navigate('/login?redirectTo=' + encodeURIComponent(`/courses/${courseId}`));
      return;
    }
    
    setCheckoutLoading(true);
    
    try {
      // Track checkout initiation
      trackEvent(
        AnalyticsEventType.CHECKOUT_INITIATED,
        user.id,
        {
          checkout_type: 'course',
          course_id: courseId,
          course_title: courseTitle,
          price: coursePrice,
        }
      );
      
      // Create checkout session using our utility function
      const checkoutResponse = await createCourseCheckout(user.id, courseId);
      
      // Redirect to checkout
      window.location.href = checkoutResponse.url;
    } catch (error) {
      console.error('Error initiating checkout:', error);
      
      // Track checkout error
      if (user) {
        trackEvent(
          AnalyticsEventType.CHECKOUT_FAILED,
          user.id,
          {
            checkout_type: 'course',
            course_id: courseId,
            course_title: courseTitle,
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
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (isPreview) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Course Preview</CardTitle>
          <CardDescription>
            This content is available for preview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            You're viewing preview content. Purchase this course or get an unlimited subscription to access all lessons.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handlePurchase}
            disabled={checkoutLoading}
            variant="default"
          >
            {checkoutLoading ? 'Processing...' : `Purchase for $${coursePrice}`}
          </Button>
          <Button 
            onClick={handleUpgradeClick}
            variant="outline"
          >
            Get Unlimited Access
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Course Access</CardTitle>
          <CardDescription>
            Sign in to access this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in or create an account to purchase this course or get unlimited access to all courses.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate('/login?redirectTo=' + encodeURIComponent(`/courses/${courseId}`))}
            variant="default"
          >
            Sign In
          </Button>
          <Button 
            onClick={() => navigate('/signup?redirectTo=' + encodeURIComponent(`/courses/${courseId}`))}
            variant="outline"
          >
            Create Account
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Course Access</CardTitle>
          <CardDescription>
            Checking your access...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!accessStatus?.hasAccess) {
    return (
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
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Single Course</h3>
                  <p className="text-sm text-gray-500">${coursePrice} for 30 days of access</p>
                </div>
                <Button 
                  onClick={handlePurchase}
                  disabled={checkoutLoading}
                  size="sm"
                >
                  {checkoutLoading ? 'Processing...' : 'Purchase'}
                </Button>
              </div>
              
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
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          Course Access 
          <Badge variant="success" className="ml-2">
            {accessStatus.hasUnlimitedSubscription ? 'Unlimited Access' : 'Enrolled'}
          </Badge>
        </CardTitle>
        <CardDescription>
          You have access to this course
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {accessStatus.isEnrolled && accessStatus.enrollment && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Enrollment Details
              </p>
              <p className="text-base">
                Enrolled on {formatDate(accessStatus.enrollment.created_at)}
              </p>
              <p className="text-sm text-gray-500">
                Source: {accessStatus.enrollment.source.replace('_', ' ')}
              </p>
            </div>
          )}
          
          {accessStatus.hasUnlimitedSubscription && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Unlimited Subscription
              </p>
              <p className="text-base">
                Active subscription - access to all courses
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
            // Track course view
            if (user?.id) {
              trackEvent(
                AnalyticsEventType.COURSE_VIEW,
                user.id,
                {
                  course_id: courseId,
                  course_title: courseTitle,
                  has_unlimited: accessStatus.hasUnlimitedSubscription,
                }
              );
            }
            
            // Navigate to the first lesson
            navigate(`/courses/${courseId}/lessons`);
          }}
          className="w-full"
        >
          Start Learning
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseAccess; 