import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { BookOpen } from 'lucide-react';
import MobileTopBar from './MobileTopBar';
import MobileBottomNav from './MobileBottomNav';

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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCourses(data || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full bg-white dark:bg-gray-900">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white dark:bg-gray-900">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-white dark:bg-gray-900 min-h-screen">
        <div className="flex md:hidden items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 shadow-sm mb-4">
          <MobileTopBar title="Courses" count={courses.length} />
        </div>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 hidden md:block">Courses</h1>
          
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
                  to={`/course/${course.id}`}
                  className="group"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
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
                      <p className="text-gray-600 dark:text-gray-300 mb-4 flex-1">
                        {course.description.length > 100
                          ? `${course.description.substring(0, 100)}...`
                          : course.description}
                      </p>
                      <div className="mt-auto">
                        <Button className="w-full bg-[#F37022] hover:bg-[#E36012] text-white">
                          Start Learning
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
} 