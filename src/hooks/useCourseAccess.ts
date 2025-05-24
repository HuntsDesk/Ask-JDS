import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { hasCourseAccess, hasCourseAccessMultiple } from '@/lib/permissions';

interface CourseAccessResponse {
  hasAccess: boolean;
  reason?: 'enrollment' | 'subscription' | 'none';
  enrollment?: any;
  subscription?: any;
  error?: any;
  isLoading: boolean;
}

type MultiCourseAccessResponse = Record<string, Omit<CourseAccessResponse, 'isLoading'>> & {
  isLoading: boolean;
};

/**
 * Custom hook to check if a user has access to a specific course
 * Uses React Query for caching and efficient data fetching
 * 
 * @param courseId - Single course ID to check access for
 * @returns CourseAccessResponse - Object with access info and loading state
 */
export function useCourseAccess(courseId?: string): CourseAccessResponse;
/**
 * Custom hook to check if a user has access to multiple courses
 * Uses React Query for caching and efficient data fetching
 * 
 * @param courseIds - Array of course IDs to check access for
 * @returns MultiCourseAccessResponse - Map of courseId to access info with loading state
 */
export function useCourseAccess(courseIds?: string[]): MultiCourseAccessResponse;

/**
 * Implementation of useCourseAccess that handles both single and multiple course IDs
 */
export function useCourseAccess(courseIdOrIds?: string | string[]): CourseAccessResponse | MultiCourseAccessResponse {
  const { user } = useAuth();
  
  // Handle multiple course IDs
  if (Array.isArray(courseIdOrIds)) {
    const { data, isLoading, error } = useQuery({
      queryKey: ['courseAccessMultiple', user?.id, courseIdOrIds.sort().join(',')],
      queryFn: async () => {
        if (!user || courseIdOrIds.length === 0) {
          return {};
        }
        return hasCourseAccessMultiple(user.id, courseIdOrIds);
      },
      enabled: !!user && courseIdOrIds.length > 0,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: false,
    });

    return {
      ...data,
      isLoading,
      error
    };
  }
  
  // Handle single course ID
  const { data, isLoading, error } = useQuery({
    queryKey: ['courseAccess', user?.id, courseIdOrIds],
    queryFn: async () => {
      if (!user || !courseIdOrIds) {
        return { hasAccess: false, reason: 'none' };
      }
      return hasCourseAccess(user.id, courseIdOrIds);
    },
    enabled: !!user && !!courseIdOrIds,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const result = {
    hasAccess: data?.hasAccess || false,
    reason: data?.reason,
    enrollment: data?.enrollment,
    subscription: data?.subscription,
    error: error || data?.error,
    isLoading
  };

  return result;
}

export default useCourseAccess; 