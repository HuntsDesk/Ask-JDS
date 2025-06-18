import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { hasCourseAccessMultiple } from '@/lib/permissions';

interface CourseAccessResult {
  hasAccess: boolean;
  reason?: 'enrollment' | 'subscription' | 'none';
  enrollment?: any;
  subscription?: any;
  error?: any;
}

export interface BatchCourseAccessResponse {
  [courseId: string]: CourseAccessResult;
}

export interface UseCourseAccessBatchResult {
  data: BatchCourseAccessResponse;
  isLoading: boolean;
  error: any;
}

/**
 * Custom hook to batch check if a user has access to multiple courses
 * Uses React Query for caching and efficient data fetching
 * 
 * @param courseIds - Array of course IDs to check access for
 * @returns UseCourseAccessBatchResult - Map of courseId to access info with loading state
 */
export function useCourseAccessBatch(courseIds: string[]): UseCourseAccessBatchResult {
  const { user } = useAuth();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['courseAccessBatch', user?.id, courseIds.sort().join(',')],
    queryFn: async () => {
      if (!user || courseIds.length === 0) {
        return {};
      }
      return hasCourseAccessMultiple(user.id, courseIds);
    },
    enabled: !!user && courseIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    data: data || {},
    isLoading,
    error
  };
}

export default useCourseAccessBatch; 