import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/LoadingSpinner';
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

export default function CourseSearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      performSearch();
    } else {
      navigate('/courses');
    }
  }, [query]);

  const performSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // Search courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .or(`title.ilike.%${query}%,overview.ilike.%${query}%,tile_description.ilike.%${query}%`)
        .eq('status', 'Published')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Get modules and lessons count for each course
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

      // Process courses to add module and lesson counts
      const processedCourses = (coursesData || []).map(course => {
        const courseModules = modulesData?.filter(
          module => module.course_id === course.id
        ) || [];
        
        const moduleCount = courseModules.length;
        const lessonCount = courseModules.reduce((total, module) => {
          return total + (module.lessons ? module.lessons.length : 0);
        }, 0);
        
        return {
          ...course,
          description: course.tile_description || course.overview || '',
          _count: {
            modules: moduleCount,
            lessons: lessonCount
          }
        };
      });

      setCourses(processedCourses);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-center text-red-500 dark:text-red-400 p-4 rounded-lg bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-red-900">
          Error: {error}
        </div>
      </div>
    );
  }

  const hasResults = courses.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/courses" className="flex items-center text-[#F37022] hover:text-[#E36012]">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Courses
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
          Search Results for "{query}"
        </h1>
      </div>
      
      {!hasResults ? (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Search className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No results found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            We couldn't find any courses matching "{query}". Try a different search term.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Courses */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-[#F37022]" />
              Courses ({courses.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map(course => (
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
        </div>
      )}
    </div>
  );
} 