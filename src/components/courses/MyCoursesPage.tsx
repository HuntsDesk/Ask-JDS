import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DelayedLoadingSpinner } from '@/components/ui/delayed-loading-spinner';
import { supabase } from '@/lib/supabase';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useNavbar } from '@/contexts/NavbarContext';
import PageContainer from '@/components/layout/PageContainer';
import { useLayoutState } from '@/hooks/useLayoutState';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  overview: string;
  tile_description: string;
  days_of_access: number;
  is_featured: boolean;
  status: string;
  image_url?: string;
  description: string;
  expiresIn?: number;
}

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateCount } = useNavbar();
  const { contentPadding } = useLayoutState();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setCourses([]);
      updateCount(0);
      return;
    }

    async function fetchUserCourses() {
      try {
        console.log('Fetching user courses...');
        
        // Get all active enrollments for this user
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('course_enrollments')
          .select('course_id, expires_at')
          .eq('user_id', user.id);

        if (enrollmentError) {
          console.error('Error fetching enrollments:', enrollmentError);
          setError('Failed to load your courses. Please try again later.');
          return;
        }

        if (!enrollments || enrollments.length === 0) {
          console.log('No active enrollments found');
          setCourses([]);
          setLoading(false);
          updateCount(0);
          return;
        }

        console.log(`Found ${enrollments.length} enrollments`);
        
        // Get course details for all enrolled courses
        const courseIds = enrollments.map(enrollment => enrollment.course_id);
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds);

        if (courseError) {
          console.error('Error fetching courses:', courseError);
          setError('Failed to load course details. Please try again later.');
          return;
        }

        // Add enrollment data (expires_at) to each course
        const coursesWithExpiryData = courseData.map(course => {
          const enrollment = enrollments.find(e => e.course_id === course.id);
          const expiresAt = enrollment?.expires_at ? new Date(enrollment.expires_at) : null;
          const now = new Date();
          const expiresIn = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
          
          return {
            ...course,
            description: course.tile_description || course.overview || 'No description available',
            expiresIn
          };
        });

        // Sort by expiration date (soonest first)
        const sortedCourses = coursesWithExpiryData.sort((a, b) => (a.expiresIn || 0) - (b.expiresIn || 0));
        
        setCourses(sortedCourses);
        updateCount(sortedCourses.length);
      } catch (error) {
        console.error('Error fetching user courses:', error);
        setError('Failed to load your courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchUserCourses();
  }, [user, updateCount]);

  if (loading) {
    return (
      <PageContainer className={cn("pt-4", contentPadding)} disablePadding>
        <div className="flex justify-center items-center min-h-[60vh]">
          <DelayedLoadingSpinner className="w-8 h-8" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className={cn("pt-4", contentPadding)} disablePadding>
        <div className="text-center text-red-500 dark:text-red-400 p-4 rounded-lg bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-red-900">
          {error}
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer className={cn("pt-4", contentPadding)} disablePadding>
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Sign in to view your courses</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">You need to be signed in to view your enrolled courses.</p>
          <Link to="/login">
            <Button className="bg-[#F37022] hover:bg-[#E36012] text-white">Sign In</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (courses.length === 0) {
    return (
      <PageContainer className={cn("pt-4", contentPadding)} disablePadding>
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No enrolled courses</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't enrolled in any courses yet.</p>
          <Link to="/courses/available-courses">
            <Button className="bg-[#F37022] hover:bg-[#E36012] text-white">Browse Available Courses</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className={cn("pt-4", contentPadding)} disablePadding>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/course/${course.id}`}
            className="group"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700 h-full flex flex-col relative">
              {/* Badge display for days remaining */}
              {course.expiresIn !== undefined && (
                <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {course.expiresIn > 1 ? `${course.expiresIn} days left` : "1 day left"}
                </span>
              )}

              <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                {course.image_url ? (
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30">
                    <BookOpen className="h-16 w-16 text-[#F37022] dark:text-orange-400" />
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-[#F37022] dark:group-hover:text-orange-400 transition-colors">
                  {course.title}
                </h3>
                
                {/* Description with fixed height */}
                <div className="min-h-[90px] mb-4">
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-3 text-sm">
                    {course.description.length > 100
                      ? `${course.description.substring(0, 100)}...`
                      : course.description}
                  </p>
                </div>
                
                <div className="mt-auto">
                  <Button className="w-full bg-[#F37022] hover:bg-[#E36012] text-white">
                    Continue Learning
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
} 