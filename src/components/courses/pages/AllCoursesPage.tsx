import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { BookOpen } from 'lucide-react';
import JDSCourseCard from '../JDSCourseCard';

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

export default function AllCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        console.log('Starting to fetch courses...');
        
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
        
        setCourses(processedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  if (loading) {
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

  if (courses.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No courses available</h3>
        <p className="text-gray-500 dark:text-gray-400">Check back later for new courses.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 hidden md:block">All Courses</h1>
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
            _count={course._count}
          />
        ))}
      </div>
    </div>
  );
} 