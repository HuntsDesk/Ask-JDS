/**
 * Component for handling course enrollment and purchase
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/format';
import { createClient } from '@supabase/supabase-js';
import { trackEvent } from '../../lib/analytics/track';

// Create a supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CourseEnrollmentCardProps {
  courseId: number;
  courseTitle: string;
  price: number;
  accessDays: number;
}

export function CourseEnrollmentCard({ 
  courseId, 
  courseTitle, 
  price, 
  accessDays 
}: CourseEnrollmentCardProps) {
  const { user } = useAuth();
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [enrollmentExpiry, setEnrollmentExpiry] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<boolean>(false);
  
  // Check enrollment status
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    async function checkEnrollment() {
      try {
        // Call the has_course_access function to check enrollment
        const { data, error } = await supabase.rpc('has_course_access', {
          p_user_id: user.id,
          p_course_id: courseId
        });
        
        if (error) throw error;
        
        if (data && data.has_access) {
          setIsEnrolled(true);
          // Get enrollment details
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('course_enrollments')
            .select('expires_at')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();
            
          if (enrollmentError) throw enrollmentError;
          
          if (enrollmentData && enrollmentData.expires_at) {
            setEnrollmentExpiry(new Date(enrollmentData.expires_at));
          }
        } else {
          setIsEnrolled(false);
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('Error checking enrollment:', error);
        setError('Failed to check enrollment status');
        setLoading(false);
      }
    }
    
    checkEnrollment();
  }, [user, courseId]);
  
  // Handle course purchase
  const handlePurchase = async () => {
    if (!user) {
      // Redirect to login
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    
    try {
      setPurchaseLoading(true);
      setError(null);
      
      // Track purchase attempt
      trackEvent('course', 'enroll_start', {
        course_id: courseId,
        course_title: courseTitle,
        price
      });
      
      // Redirect to checkout
      window.location.href = `/checkout?course=${courseId}`;
      
    } catch (error: any) {
      console.error('Error initiating purchase:', error);
      setError(error.message || 'Failed to initiate purchase');
      setPurchaseLoading(false);
    }
  };
  
  // Handle redirection to course content
  const handleStartCourse = () => {
    window.location.href = `/course/${courseId}/lesson/1`;
  };
  
  // Calculate days remaining
  const getDaysRemaining = (): number => {
    if (!enrollmentExpiry) return 0;
    
    const now = new Date();
    const diffTime = enrollmentExpiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="course-enrollment-card border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="course-enrollment-card border rounded-lg p-6 bg-red-50">
        <h3 className="text-xl font-semibold mb-2 text-red-700">Error</h3>
        <p className="mb-4 text-red-700">{error}</p>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    );
  }
  
  // Not logged in
  if (!user) {
    return (
      <div className="course-enrollment-card border rounded-lg p-6 bg-gray-50">
        <h3 className="text-xl font-semibold mb-2">Enroll in this Course</h3>
        <p className="mb-4 text-gray-700">{formatPrice(price)} - {accessDays} days access</p>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          onClick={() => window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`}
        >
          Log in to Enroll
        </button>
      </div>
    );
  }
  
  // Already enrolled
  if (isEnrolled) {
    const daysRemaining = getDaysRemaining();
    
    return (
      <div className="course-enrollment-card border rounded-lg p-6 bg-green-50">
        <h3 className="text-xl font-semibold mb-2 text-green-700">You're Enrolled!</h3>
        
        {enrollmentExpiry && (
          <p className="mb-4 text-green-700">
            {daysRemaining > 0 
              ? `You have ${daysRemaining} days of access remaining.` 
              : "Your access expires today."
            }
          </p>
        )}
        
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
          onClick={handleStartCourse}
        >
          Start Learning
        </button>
      </div>
    );
  }
  
  // Not enrolled - purchase option
  return (
    <div className="course-enrollment-card border rounded-lg p-6 bg-white">
      <h3 className="text-xl font-semibold mb-2">Enroll in this Course</h3>
      
      <div className="mb-4">
        <p className="text-2xl font-bold text-blue-700">{formatPrice(price)}</p>
        <p className="text-gray-600">{accessDays} days of full access</p>
      </div>
      
      <ul className="mb-4 space-y-2">
        <li className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Complete course content
        </li>
        <li className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Access to all course materials
        </li>
        <li className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Certificate of completion
        </li>
      </ul>
      
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        onClick={handlePurchase}
        disabled={purchaseLoading}
      >
        {purchaseLoading ? 'Processing...' : 'Purchase Course'}
      </button>
    </div>
  );
} 