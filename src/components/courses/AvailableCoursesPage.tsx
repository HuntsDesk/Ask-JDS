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
}

// Function to ensure is_featured is always treated as boolean
function normalizeCourseData(course: any): Course {
  return {
    ...course,
    // Ensure is_featured is always a boolean
    is_featured: Boolean(course.is_featured),
    // Make sure description field exists
    description: course.description || course.overview || course.tile_description || ""
  };
}

export default function AvailableCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateCount } = useNavbar();
  const [userEnrolledCourseIds, setUserEnrolledCourseIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchEnrolledCourses() {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('course_enrollments')
            .select('course_id')
            .eq('user_id', user.id);
          
          if (error) {
            console.error('Error fetching enrollments:', error);
            return;
          }
          
          setUserEnrolledCourseIds(data ? data.map(enrollment => enrollment.course_id) : []);
        } catch (err) {
          console.error('Error in fetchEnrolledCourses:', err);
        }
      }
    }
    
    async function fetchCourses() {
      try {
        console.log('Starting to fetch available courses...');
        
        // Get all published courses
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .or('status.eq.Published,status.eq.Coming Soon');

        if (error) {
          console.error('Error fetching courses:', error);
          setError('Failed to load courses. Please try again later.');
          return;
        }

        // Filter out any archived courses and normalize the data
        const filteredCourses = (data || [])
          .filter(course => course.status?.toLowerCase() !== 'archived')
          .map(normalizeCourseData);
        
        // Sort courses: Featured non-coming-soon first, then featured coming soon, 
        // then non-featured coming soon, then alphabetical
        const sortedCourses = [...filteredCourses].sort((a, b) => {
          // First level: Featured non-coming-soon courses
          const aFeaturedNotComingSoon = a.is_featured && a.status !== 'Coming Soon';
          const bFeaturedNotComingSoon = b.is_featured && b.status !== 'Coming Soon';
          
          if (aFeaturedNotComingSoon && !bFeaturedNotComingSoon) return -1;
          if (!aFeaturedNotComingSoon && bFeaturedNotComingSoon) return 1;
          
          // Second level: Featured AND coming soon courses
          const aFeaturedAndComingSoon = a.is_featured && a.status === 'Coming Soon';
          const bFeaturedAndComingSoon = b.is_featured && b.status === 'Coming Soon';
          
          if (aFeaturedAndComingSoon && !bFeaturedAndComingSoon) return -1;
          if (!aFeaturedAndComingSoon && bFeaturedAndComingSoon) return 1;
          
          // Third level: Non-featured coming soon courses
          const aComingSoonNotFeatured = !a.is_featured && a.status === 'Coming Soon';
          const bComingSoonNotFeatured = !b.is_featured && b.status === 'Coming Soon';
          
          if (aComingSoonNotFeatured && !bComingSoonNotFeatured) return -1;
          if (!aComingSoonNotFeatured && bComingSoonNotFeatured) return 1;
          
          // If we get here, both courses are in the same category, sort by title
          return a.title.localeCompare(b.title);
        });
        
        setCourses(sortedCourses);
        updateCount(sortedCourses.length);
      } catch (error) {
        console.error('Error fetching available courses:', error);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    // First fetch enrolled courses, then fetch all courses
    fetchEnrolledCourses().then(fetchCourses);
  }, [user, updateCount]);

  // Filter out courses the user is already enrolled in
  const availableCourses = courses.filter(course => 
    !userEnrolledCourseIds.includes(course.id)
  );

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

  if (availableCourses.length === 0) {
    return (
      <PageContainer className="pt-4" flexColumn>
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No available courses</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {userEnrolledCourseIds.length > 0 
              ? "You're already enrolled in all available courses!"
              : "There are no courses available at this time. Please check back later."}
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pt-4" flexColumn>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 hidden md:block">Available Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {availableCourses.map((course) => (
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