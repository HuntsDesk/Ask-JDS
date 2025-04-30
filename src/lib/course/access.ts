import { supabase } from '@/lib/supabase';

// Initialize Supabase client
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CourseAccessResult {
  hasAccess: boolean;
  enrollment?: {
    id: string;
    status: string;
    source: string;
    created_at: string;
  };
  subscription?: {
    id: string;
    tier: string;
    status: string;
  };
  isPreview: boolean;
}

/**
 * Check if a user has access to a specific course
 * 
 * @param userId The user ID to check access for
 * @param courseId The course ID to check access to
 * @param isPreview Whether the content is preview content
 * @returns Access result with status and details
 */
export async function checkCourseAccess(
  userId: string | undefined,
  courseId: string,
  isPreview: boolean = false
): Promise<CourseAccessResult> {
  // If preview content, always grant access
  if (isPreview) {
    return { hasAccess: true, isPreview: true };
  }
  
  // If no user, no access
  if (!userId) {
    return { hasAccess: false, isPreview: false };
  }
  
  try {
    // Call the has_course_access function, which will also update last_accessed
    const { data: accessResult, error: accessError } = await supabase.rpc(
      'has_course_access',
      { p_user_id: userId, p_course_id: courseId }
    );
    
    if (accessError) {
      console.error('Error checking course access:', accessError);
      return { hasAccess: false, isPreview: false };
    }
    
    // If the function returns false, check why (for detailed error reporting)
    if (!accessResult) {
      // Get enrollment details if any (could be expired)
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('id, status, source, created_at')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
        
      if (enrollmentError && enrollmentError.code !== 'PGRST116') {
        console.error('Error fetching enrollment details:', enrollmentError);
      }
      
      return {
        hasAccess: false,
        enrollment: enrollment || undefined,
        isPreview: false
      };
    }
    
    // Get details for access that was granted
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('id, status, source, created_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle();
      
    if (enrollmentError && enrollmentError.code !== 'PGRST116') {
      console.error('Error fetching enrollment details:', enrollmentError);
    }
    
    // Check if access is via unlimited subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('id, tier, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('tier', 'unlimited')
      .maybeSingle();
      
    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription details:', subscriptionError);
    }
    
    return {
      hasAccess: true,
      enrollment: enrollment || undefined,
      subscription: subscription || undefined,
      isPreview: false
    };
  } catch (error) {
    console.error('Error in checkCourseAccess:', error);
    return { hasAccess: false, isPreview: false };
  }
}

/**
 * Check if a lesson is accessible to a user
 * 
 * @param userId The user ID to check access for
 * @param courseId The course ID the lesson belongs to
 * @param lessonId The lesson ID to check access to
 * @param isPreview Whether the lesson is preview content
 * @returns Boolean indicating if the user can access the lesson
 */
export async function checkLessonAccess(
  userId: string | undefined,
  courseId: string,
  lessonId: string,
  isPreview: boolean = false
): Promise<boolean> {
  // Preview lessons are always accessible
  if (isPreview) {
    return true;
  }
  
  // Check course access first
  const courseAccess = await checkCourseAccess(userId, courseId);
  
  // If user has access to the course, they have access to all lessons
  return courseAccess.hasAccess;
} 