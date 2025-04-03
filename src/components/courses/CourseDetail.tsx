import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { CheckCircle2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  overview: string;
  what_youll_learn: string[];
  days_of_access: number;
  is_featured: boolean;
  status: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  position: number;
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourseData() {
      try {
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Fetch course modules
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', id)
          .order('position', { ascending: true });

        if (moduleError) throw moduleError;
        setModules(moduleData || []);
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchCourseData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 mb-4">{error || 'Course not found'}</p>
        <Link to="/courses">
          <Button>Back to Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Course Header */}
        <div className="mb-8">
          <Link to="/courses" className="text-jdblue hover:underline mb-4 inline-block">
            ← Back to Courses
          </Link>
          <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
          <p className="text-gray-600 text-lg">{course.overview}</p>
        </div>

        {/* What You'll Learn */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What You'll Learn</CardTitle>
            <CardDescription>Key outcomes of this course</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.what_youll_learn?.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Course Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
            <CardDescription>{modules.length} modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="p-4 rounded-lg border hover:border-jdblue transition-colors"
                >
                  <h3 className="font-medium mb-2">{module.title}</h3>
                  <p className="text-sm text-gray-600">{module.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enrollment CTA */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-gray-600 mb-6">
            Get {course.days_of_access} days of access to all course materials.
          </p>
          <Button size="lg" className="bg-jdorange hover:bg-jdorange/90">
            Enroll Now
          </Button>
        </div>
      </div>
    </div>
  );
} 