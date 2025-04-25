import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { LoadingSpinner } from './LoadingSpinner';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics/track';

export function PurchaseSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<{id: string, title: string} | null>(null);
  const [enrollmentActive, setEnrollmentActive] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    async function checkEnrollment() {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        // Wait a moment to allow the webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Find the most recent enrollment
        const { data: enrollment, error } = await supabase
          .from('course_enrollments')
          .select('id, course_id, status, courses(id, title)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('enrolled_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          console.error('Error checking enrollment:', error);
          return;
        }
        
        if (enrollment && enrollment.courses) {
          setEnrollmentActive(enrollment.status === 'active');
          setCourseData({
            id: enrollment.course_id,
            title: enrollment.courses.title
          });
          
          // Track analytics
          trackEvent('purchase', 'course_purchase_success', {
            course_id: enrollment.course_id,
            session_id: sessionId
          });
        }
      } catch (error) {
        console.error('Error checking enrollment status:', error);
      } finally {
        setLoading(false);
      }
    }

    checkEnrollment();
  }, [sessionId, user?.id]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            Purchase Successful!
          </CardTitle>
          <CardDescription>
            Thank you for your purchase!
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center py-6">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-center text-muted-foreground">
                Finalizing your purchase...
              </p>
            </div>
          ) : enrollmentActive && courseData ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-800">
                  Your purchase is complete! You now have access to <strong>{courseData.title}</strong>.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">What's next:</h3>
                <ul className="space-y-1 text-sm list-disc pl-5">
                  <li>Start learning by going to your course</li>
                  <li>Your progress will be automatically saved</li>
                  <li>Access your course anytime from your dashboard</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-yellow-800">
                Your payment was successful. We're processing your enrollment now. Click below to return to your courses dashboard.
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          {courseData ? (
            <Button asChild className="w-full">
              <Link to={`/course/${courseData.id}/lesson/1`}>Go to Course</Link>
            </Button>
          ) : (
            <Button asChild className="w-full bg-jdorange hover:bg-jdorange-dark">
              <Link to="/courses">Go to My Courses</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link to="/courses">Browse All Courses</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 