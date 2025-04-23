import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase';

/**
 * Component that handles post-checkout redirects
 * Determines where to send the user based on checkout session type
 */
export function ThankYou() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [redirectPath, setRedirectPath] = useState<string>('/');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function determineRedirect() {
      if (!sessionId) {
        console.error('No session ID provided in URL parameters');
        setRedirectPath('/courses');
        setLoading(false);
        return;
      }

      try {
        console.log('Looking up checkout session:', sessionId);

        // First check for a recorded checkout session
        const { data: checkoutSession, error: sessionError } = await supabase
          .from('checkout_sessions')
          .select('checkout_type, course_id, subscription_tier, interval')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (checkoutSession) {
          console.log('Found checkout session record:', checkoutSession);
          
          if (checkoutSession.checkout_type.includes('course')) {
            // Course purchase or renewal - redirect to the course page
            const courseId = checkoutSession.course_id;
            if (courseId) {
              setRedirectPath(`/courses/${courseId}?purchase_success=true`);
              return;
            }
          } else if (checkoutSession.checkout_type === 'subscription') {
            // Subscription purchase - redirect to subscription success page
            setRedirectPath('/subscription/success?session_id=' + sessionId);
            return;
          }
        }

        // Fallback: check analytics_events
        const { data: event, error: eventError } = await supabase
          .from('analytics_events')
          .select('event_type, properties')
          .like('properties->session_id', sessionId)
          .order('created_at', { ascending: false })
          .maybeSingle();

        console.log('Looking up event with session ID:', sessionId);

        if (event) {
          console.log('Found event with session ID:', event);
          
          if (event.event_type === 'course_purchase' || event.event_type === 'course_renewal') {
            // Get the course ID from the properties
            const courseId = event.properties?.courseId;
            if (courseId) {
              setRedirectPath(`/courses/${courseId}?purchase_success=true`);
              return;
            } else {
              setRedirectPath('/purchase/success?session_id=' + sessionId);
            }
          } else if (event.event_type.includes('subscription')) {
            setRedirectPath('/subscription/success?session_id=' + sessionId);
            return;
          } else {
            // Default to purchase success if we're not sure
            setRedirectPath('/purchase/success?session_id=' + sessionId);
          }
        } else {
          // If no event found, try checking user_subscriptions and course_enrollments
          console.log('No event found, checking recent database activity');
          
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1);

          if (subscription && subscription.length > 0) {
            // Recent subscription activity
            console.log('Found recent subscription activity');
            setRedirectPath('/subscription/success?session_id=' + sessionId);
            return;
          }
          
          const { data: enrollment } = await supabase
            .from('course_enrollments')
            .select('id, course_id')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (enrollment && enrollment.length > 0 && enrollment[0].course_id) {
            // Recent enrollment activity
            console.log('Found recent course enrollment:', enrollment[0]);
            setRedirectPath(`/courses/${enrollment[0].course_id}?purchase_success=true`);
            return;
          }

          // No specific information found, default to generic success page
          console.log('No specific checkout information found, using default success page');
          setRedirectPath('/purchase/success?session_id=' + sessionId);
        }
      } catch (error) {
        console.error('Error determining redirect:', error);
        // Default to courses page
        setRedirectPath('/courses');
      } finally {
        setLoading(false);
      }
    }

    determineRedirect();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Processing your payment...</p>
          <p className="text-sm text-muted-foreground mt-2">You'll be redirected momentarily</p>
        </div>
      </div>
    );
  }

  return <Navigate to={redirectPath} replace />;
} 