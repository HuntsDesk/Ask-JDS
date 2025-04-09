import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, ChevronDown, ChevronRight, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  overview: string;
  what_youll_learn: string[];
  days_of_access: number;
  is_featured: boolean;
  status: string;
}

interface Lesson {
  id: string;
  title: string;
  position: number;
  video_id?: string;
  module_id: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  position: number;
  lessons: Lesson[];
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

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

        // Fetch all lessons for this course's modules
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .in('module_id', moduleData?.map(m => m.id) || [])
          .order('position', { ascending: true });

        if (lessonError) throw lessonError;

        // Group lessons by module
        const modulesWithLessons = moduleData?.map(module => ({
          ...module,
          lessons: lessonData?.filter(lesson => lesson.module_id === module.id) || []
        })) || [];

        setModules(modulesWithLessons);
        
        // Initially expand the first module
        if (modulesWithLessons.length > 0) {
          setExpandedModules({ [modulesWithLessons[0].id]: true });
        }
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
          <CardDescription>
            {modules.length} modules • {modules.reduce((sum, module) => sum + module.lessons.length, 0)} lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modules.map((module) => (
              <div
                key={module.id}
                className="rounded-lg border hover:border-jdblue transition-colors"
              >
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div>
                    <h3 className="font-medium mb-1">{module.title}</h3>
                    <p className="text-sm text-gray-600">
                      {module.description} • {module.lessons.length} lessons
                    </p>
                  </div>
                  {expandedModules[module.id] ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                
                {expandedModules[module.id] && (
                  <div className="border-t">
                    <ul className="divide-y">
                      {module.lessons.map((lesson) => (
                        <li key={lesson.id} className="p-3 pl-6 flex items-center gap-3">
                          {lesson.video_id && (
                            <Video className="h-4 w-4 text-jdblue shrink-0" />
                          )}
                          <span className="text-sm">{lesson.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
  );
} 