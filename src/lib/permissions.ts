import { supabase } from '@/lib/supabase';

/**
 * Interface for the course access response
 */
interface CourseAccessResponse {
  hasAccess: boolean;
  reason?: 'enrollment' | 'subscription' | 'none';
  enrollment?: any;
  subscription?: any;
}

/**
 * Checks if a user has access to a specific course
 * @param userId - The user ID to check access for
 * @param courseId - The course ID to check access for
 * @returns Promise<CourseAccessResponse> - Object with access info
 */
export async function hasCourseAccess(
  userId: string,
  courseId: string
): Promise<CourseAccessResponse> {
  if (!userId || !courseId) {
    return { hasAccess: false, reason: 'none' };
  }

  try {
    // First check for direct course enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .lte('enrolled_at', new Date().toISOString())
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (enrollmentError && enrollmentError.code !== 'PGRST116') {
      console.error('Error checking course access:', enrollmentError);
      return { hasAccess: false, reason: 'none' };
    }

    // If enrolled, user has access
    if (enrollment) {
      return { hasAccess: true, reason: 'enrollment', enrollment };
    }

    // No direct enrollment, check for unlimited subscription
    const { data: subscriptionData } = await supabase.functions.invoke(
      'get-user-subscription',
      { body: { user_id: userId } }
    );

    // If user has unlimited subscription, they have access to all courses
    const hasUnlimitedAccess = 
      subscriptionData?.tier === 'unlimited' || 
      // Also check for unlimited price_id formats
      subscriptionData?.price_id?.includes('unlimited');

    return { 
      hasAccess: hasUnlimitedAccess, 
      reason: hasUnlimitedAccess ? 'subscription' : 'none',
      subscription: hasUnlimitedAccess ? subscriptionData : null
    };
  } catch (error) {
    console.error('Error checking course access:', error);
    return { hasAccess: false, reason: 'none', error };
  }
}

/**
 * Checks if a user has access to multiple courses
 * @param userId - The user ID to check access for
 * @param courseIds - Array of course IDs to check access for
 * @returns Promise<Record<string, CourseAccessResponse>> - Map of courseId to access info
 */
export async function hasCourseAccessMultiple(
  userId: string,
  courseIds: string[]
): Promise<Record<string, CourseAccessResponse>> {
  if (!userId || !courseIds.length) {
    return {};
  }

  const result: Record<string, CourseAccessResponse> = {};

  try {
    // First check for unlimited subscription - if user has unlimited, they have access to all courses
    const { data: subscriptionData } = await supabase.functions.invoke(
      'get-user-subscription',
      { body: { user_id: userId } }
    );

    const hasUnlimitedAccess = 
      subscriptionData?.tier === 'unlimited' || 
      subscriptionData?.price_id?.includes('unlimited');

    // If user has unlimited access, we can return true for all courses immediately
    if (hasUnlimitedAccess) {
      for (const courseId of courseIds) {
        result[courseId] = {
          hasAccess: true,
          reason: 'subscription',
          subscription: subscriptionData
        };
      }
      return result;
    }

    // Otherwise, check enrollments for each course
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', userId)
      .in('course_id', courseIds)
      .eq('status', 'active')
      .lte('enrolled_at', new Date().toISOString())
      .gte('expires_at', new Date().toISOString());

    if (enrollmentError) {
      console.error('Error checking course enrollments:', enrollmentError);
      // Set all courses to no access
      for (const courseId of courseIds) {
        result[courseId] = { hasAccess: false, reason: 'none' };
      }
      return result;
    }

    // Create a map of courseId to enrollment
    const enrollmentMap: Record<string, any> = {};
    for (const enrollment of enrollments || []) {
      enrollmentMap[enrollment.course_id] = enrollment;
    }

    // Build the final result
    for (const courseId of courseIds) {
      if (enrollmentMap[courseId]) {
        result[courseId] = {
          hasAccess: true,
          reason: 'enrollment',
          enrollment: enrollmentMap[courseId]
        };
      } else {
        result[courseId] = { hasAccess: false, reason: 'none' };
      }
    }

    return result;
  } catch (error) {
    console.error('Error checking multiple course access:', error);
    
    // Set all courses to no access on error
    for (const courseId of courseIds) {
      result[courseId] = { hasAccess: false, reason: 'none', error };
    }
    
    return result;
  }
} 