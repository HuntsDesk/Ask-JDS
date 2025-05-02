import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import JDSCourseCard from './JDSCourseCard';
import { format, isPast } from 'date-fns';

interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  expires_at: string;
  course: {
    id: string;
    title: string;
    overview: string;
    image_url?: string;
    description: string;
    _count?: {
      modules: number;
      lessons: number;
    };
  };
}

export default function ExpiredCoursesPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function fetchEnrollments() {
    try {
      setLoading(true);
      
      // First, get enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          user_id,
          course_id,
          enrolled_at,
          expires_at,
          course:courses(
            id,
            title,
            overview,
            image_url
          )
        `)
        .eq('user_id', user?.id);
      
      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        setError('Failed to load enrollments. Please try again later.');
        return;
      }
      
      // Check for expired enrollments
      const expiredEnrollments = (enrollmentsData || []).filter(enrollment => {
        return enrollment.expires_at && isPast(new Date(enrollment.expires_at));
      });
      
      // Get modules and lessons count
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
      
      // Process enrollments to add module and lesson counts
      const processedEnrollments = expiredEnrollments.map(enrollment => {
        const courseModules = modulesData?.filter(
          module => module.course_id === enrollment.course_id
        ) || [];
        
        const moduleCount = courseModules.length;
        const lessonCount = courseModules.reduce((total, module) => {
          return total + (module.lessons ? module.lessons.length : 0);
        }, 0);
        
        return {
          ...enrollment,
          course: {
            ...enrollment.course,
            description: enrollment.course.overview || '',
            _count: {
              modules: moduleCount,
              lessons: lessonCount
            }
          }
        };
      });
      
      setEnrollments(processedEnrollments);
    } catch (error) {
      console.error('Error in fetchEnrollments:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

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

  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Please sign in to view your expired courses.
        </p>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Clock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No expired courses</h3>
        <p className="text-gray-500 dark:text-gray-400">You don't have any expired courses.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white hidden md:block">Expired Courses</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchEnrollments}
          className="ml-auto flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {enrollments.map((enrollment) => (
          <div key={enrollment.id} className="relative">
            <div className="absolute right-3 top-3 z-10 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium px-2.5 py-0.5 rounded">
              Expired: {format(new Date(enrollment.expires_at), 'MMM d, yyyy')}
            </div>
            <JDSCourseCard
              id={enrollment.course.id}
              title={enrollment.course.title}
              description={enrollment.course.description}
              image_url={enrollment.course.image_url}
              _count={enrollment.course._count}
              status="Active"
              expired={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 