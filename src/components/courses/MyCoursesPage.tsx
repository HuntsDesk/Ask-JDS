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
import JDSCourseCard from './JDSCourseCard';

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
      <PageContainer className="pt-4" flexColumn>
        <div className="flex justify-center items-center min-h-[60vh]">
          <DelayedLoadingSpinner className="w-8 h-8" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className="pt-4" flexColumn>
        <div className="text-center text-red-500 dark:text-red-400 p-4 rounded-lg bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-red-900">
          {error}
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer className="pt-4" flexColumn>
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
      <PageContainer className="pt-4" flexColumn>
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No enrolled courses</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't enrolled in any courses yet.</p>
          <Link to="../available-courses">
            <Button className="bg-[#F37022] hover:bg-[#E36012] text-white">Browse Available Courses</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pt-4" flexColumn>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <JDSCourseCard
            key={course.id}
            id={course.id}
            title={course.title}
            description={course.description}
            image_url={course.image_url}
            is_featured={course.is_featured}
            status={course.status}
            _count={{ modules: 0, lessons: 0 }} // You may want to fetch actual module/lesson counts
          />
        ))}
      </div>
    </PageContainer>
  );
} 