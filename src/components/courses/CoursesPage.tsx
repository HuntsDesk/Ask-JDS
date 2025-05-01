import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { BookOpen } from 'lucide-react';
import MobileTopBar from './MobileTopBar';
import MobileBottomNav from './MobileBottomNav';
import PageContainer from '@/components/layout/PageContainer';

// Log outside of the component to verify this file is being parsed
// console.log('ROOT LEVEL - CoursesPage.tsx is being loaded');

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

export default function CoursesPage() {
  // console.log('COMPONENT LEVEL - CoursesPage component is rendering');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // console.log('EFFECT LEVEL - useEffect hook is running');
    
    async function fetchCourses() {
      // console.log('DEBUG: fetchCourses function called');
      try {
        console.log('Starting to fetch courses...');
        
        // The RLS policy has been updated to allow both 'Published' and 'Coming Soon' courses
        // This query will return all courses the user has permission to view
        const { data, error } = await supabase
          .from('courses')
          .select('*');

        if (error) {
          console.error('Error fetching courses:', error);
          setError('Failed to load courses. Please try again later.');
          return;
        }

        console.log('Fetched courses:', data);
        
        // Filter out any archived courses
        const filteredCourses = data?.filter(course => 
          course.status?.toLowerCase() !== 'archived') || [];
        
        // Sort courses with a more direct approach to guarantee the right order
        // Getting the raw course data first
        console.log('Before sorting, courses:', filteredCourses.map(c => 
          `${c.title} (featured: ${c.is_featured}, status: ${c.status})`));
        
        // Manual hardcoded sorting for now to get the exact order we want
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
        
        // Log the final sorted order
        console.log('After sorting, courses:',
          sortedCourses.map((c, i) => 
            `${i+1}. ${c.title} (featured: ${c.is_featured}, status: ${c.status})`
          )
        );
        
        setCourses(sortedCourses);
        setLoading(false);
      } catch (error) {
        console.error('Detailed error in fetchCourses:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  // Direct logging of courses data in the render phase
  // console.log('DIRECT LOG - COURSES:', courses);
  // console.log('DIRECT LOG - Featured courses:', courses.filter(c => c.is_featured));
  // console.log('DIRECT LOG - Non-featured courses:', courses.filter(c => !c.is_featured));

  return (
    <PageContainer className="pt-4">
      <div className="flex md:hidden items-center justify-between h-16 px-4 shadow-sm mb-4">
        <MobileTopBar title="Courses" count={courses.length} />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 hidden md:block">Courses</h1>
      
      {/* Debug information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
          <h2 className="font-bold mb-2">Debug Info:</h2>
          <p>Total courses: {courses.length}</p>
          <p>Featured courses: {courses.filter(c => c.is_featured).length}</p>
          <p>Non-featured courses: {courses.filter(c => !c.is_featured).length}</p>
          <p>Featured course IDs: {courses.filter(c => c.is_featured).map(c => c.id).join(', ')}</p>
          <div className="mt-3 border-t border-yellow-200 dark:border-yellow-800 pt-2">
            <h3 className="font-semibold">Course Order Debug:</h3>
            <div className="mt-2 text-xs overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left">Position</th>
                    <th className="px-2 py-1 text-left">Title</th>
                    <th className="px-2 py-1 text-left">Featured</th>
                    <th className="px-2 py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.slice(0, 10).map((course, idx) => (
                    <tr key={course.id} className="border-t border-yellow-200 dark:border-yellow-800">
                      <td className="px-2 py-1">{idx + 1}</td>
                      <td className="px-2 py-1">{course.title}</td>
                      <td className="px-2 py-1">{String(course.is_featured)}</td>
                      <td className="px-2 py-1">{course.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner className="w-12 h-12 text-[#F37022]" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 dark:text-red-400 p-4 rounded-lg bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-red-900">
          {error}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No courses available</h3>
          <p className="text-gray-500 dark:text-gray-400">Check back later for new courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={course.status !== 'Coming Soon' ? `/course/${course.id}` : '#'}
              className={`group ${course.status === 'Coming Soon' ? 'pointer-events-none' : ''}`}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700 h-full flex flex-col relative">
                {/* Badge display - Give "Coming Soon" priority over "Featured" */}
                {course.status === 'Coming Soon' ? (
                  <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                ) : course.is_featured && (
                  <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Featured
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
                  
                  {/* Spacer to push content to bottom */}
                  <div className="flex-grow"></div>
                  
                  <div className="mt-auto">
                    {course.status !== 'Coming Soon' ? (
                      <Button className="w-full bg-[#F37022] hover:bg-[#E36012] text-white">
                        Start Learning
                      </Button>
                    ) : (
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400 italic py-2">
                        This course will be available soon
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <MobileBottomNav />
    </PageContainer>
  );
} 