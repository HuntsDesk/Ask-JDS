import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { BookOpen, ArrowRight } from 'lucide-react';
import { JDSCourseCard } from '../JDSCourseCard';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { isPast } from 'date-fns';
import useCourseAccessBatch from '@/hooks/useCourseAccessBatch';

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
  _count?: {
    modules: number;
    lessons: number;
  };
}

interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  expires_at: string;
  course: Course;
}

export default function AllCoursesPage() {
  const { user } = useAuth();
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [myActiveCourses, setMyActiveCourses] = useState<CourseEnrollment[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available courses
  useEffect(() => {
    async function fetchAvailableCourses() {
      try {
        setLoadingCourses(true);
        
        // This query will return all courses the user has permission to view
        const { data, error } = await supabase
          .from('courses')
          .select('*');

        if (error) {
          console.error('Error fetching courses:', error);
          setError('Failed to load courses. Please try again later.');
          return;
        }
        
        // Filter out any archived or draft courses
        const filteredCourses = data?.filter(course => 
          course.status?.toLowerCase() !== 'archived' && 
          course.status?.toLowerCase() !== 'draft') || [];
        
        // Sort courses: featured first, then alphabetically
        const sortedCourses = [...filteredCourses].sort((a, b) => {
          // First level: Featured non-coming-soon courses
          const aFeaturedNotComingSoon = a.is_featured && a.status !== 'Coming Soon';
          const bFeaturedNotComingSoon = b.is_featured && b.status !== 'Coming Soon';
          
          if (aFeaturedNotComingSoon && !bFeaturedNotComingSoon) return -1;
          if (!aFeaturedNotComingSoon && bFeaturedNotComingSoon) return 1;
          
          // Second level: Featured AND coming soon courses
          const aFeaturedAndComingSoon = a.is_featured && a.status === 'Coming Soon';
          const bFeaturedAndComingSoon = b.is_featured && a.status === 'Coming Soon';
          
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
        
        // Get course modules and lessons counts from the API
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select(`
            id,
            course_id,
            lessons(id)
          `);
        
        if (modulesError) {
          console.error('Error fetching modules:', modulesError);
        }
        
        // Prepare courses with module and lesson counts
        const processedCourses = sortedCourses.map(course => {
          // Calculate module and lesson counts
          const courseModules = modulesData?.filter(module => module.course_id === course.id) || [];
          const moduleCount = courseModules.length;
          const lessonCount = courseModules.reduce((total, module) => {
            return total + (module.lessons ? module.lessons.length : 0);
          }, 0);
          
          return {
            ...course,
            description: course.description || course.overview || course.tile_description || '',
            _count: {
              modules: moduleCount,
              lessons: lessonCount
            }
          };
        });
        
        // Show all available courses
        setAvailableCourses(processedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoadingCourses(false);
      }
    }

    fetchAvailableCourses();
  }, []);

  // Fetch enrollments for current user
  useEffect(() => {
    async function fetchUserEnrollments() {
      if (!user) {
        setLoadingEnrollments(false);
        return;
      }

      try {
        setLoadingEnrollments(true);
        
        // Get enrollments with course details
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select(`
            id,
            user_id,
            course_id,
            enrolled_at,
            expires_at,
            course:courses!inner(
              id,
              title,
              overview,
              status,
              is_featured
            )
          `)
          .eq('user_id', user.id);
        
        if (enrollmentsError) {
          console.error('Error fetching enrollments:', enrollmentsError);
          setError('Error fetching your enrolled courses.');
          return;
        }
        
        // Filter for active (non-expired) enrollments
        const activeEnrollments = (enrollmentsData || []).filter(enrollment => {
          return !enrollment.expires_at || !isPast(new Date(enrollment.expires_at));
        });

        // Get module and lesson counts
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select(`
            id,
            course_id,
            lessons(id)
          `);
        
        if (modulesError) {
          console.error('Error fetching modules:', modulesError);
        }
        
        // Process the enrollments to include course details
        const processedEnrollments = activeEnrollments.map(enrollment => {
          const courseModules = modulesData?.filter(
            module => module.course_id === enrollment.course_id
          ) || [];
          
          const moduleCount = courseModules.length;
          const lessonCount = courseModules.reduce((total, module) => {
            return total + (module.lessons ? module.lessons.length : 0);
          }, 0);
          
          // Handle course as an array from Supabase but convert to a single object
          const courseData = Array.isArray(enrollment.course) ? enrollment.course[0] : enrollment.course;
          
          return {
            ...enrollment,
            course: {
              ...courseData,
              description: courseData.overview || '',
              _count: {
                modules: moduleCount,
                lessons: lessonCount
              }
            }
          };
        });
        
        // Sort by newest first
        const sortedEnrollments = processedEnrollments.sort((a, b) => {
          return new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime();
        });
        
        // Show all active enrollments
        setMyActiveCourses(sortedEnrollments as CourseEnrollment[]);
      } catch (error) {
        console.error('Error fetching user enrollments:', error);
      } finally {
        setLoadingEnrollments(false);
      }
    }

    fetchUserEnrollments();
  }, [user]);

  // Get course IDs for batch access checking
  const availableCourseIds = availableCourses.map(course => course.id);
  
  // Batch check access for all available courses
  const { data: accessMap, isLoading: accessLoading } = useCourseAccessBatch(availableCourseIds);

  // Combined loading state
  const isLoading = loadingCourses || loadingEnrollments || accessLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 dark:text-red-400 p-4 rounded-lg bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-red-900">
        {error}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-12">
      
      {/* All Courses Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">All Courses</h2>
        </div>
        
        {availableCourses.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No courses available</h3>
            <p className="text-gray-500 dark:text-gray-400">Check back later for new courses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableCourses.map((course) => {
              // Check if the user is enrolled in this course
              const isEnrolled = myActiveCourses.some(
                enrollment => enrollment.course_id === course.id
              );
              
              return (
                <JDSCourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  image_url={course.image_url}
                  is_featured={course.is_featured}
                  status={course.status}
                  _count={course._count}
                  enrolled={isEnrolled}
                  access={accessMap[course.id] ? {
                    hasAccess: accessMap[course.id].hasAccess,
                    isLoading: false, // Batch loading is handled at page level
                    reason: accessMap[course.id].reason,
                    enrollment: accessMap[course.id].enrollment,
                    subscription: accessMap[course.id].subscription,
                    error: accessMap[course.id].error
                  } : undefined}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
} 