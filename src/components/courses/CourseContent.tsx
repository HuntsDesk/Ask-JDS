import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoPlayer } from '@/components/VideoPlayer';

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  position: number;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  video_id?: string;
  position: number;
  module_id: string;
}

export default function CourseContent() {
  const { courseId, moduleId, lessonId } = useParams<{
    courseId: string;
    moduleId?: string;
    lessonId?: string;
  }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    async function fetchCourseData() {
      try {
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Fetch course modules
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('position', { ascending: true });

        if (moduleError) throw moduleError;
        setModules(moduleData || []);

        // If we have a moduleId, fetch its lessons
        if (moduleId) {
          const { data: lessonData, error: lessonError } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', moduleId)
            .order('position', { ascending: true });

          if (lessonError) throw lessonError;
          setLessons(lessonData || []);

          // If we have a lessonId, set the current lesson
          if (lessonId) {
            const lesson = lessonData?.find(l => l.id === lessonId) || null;
            setCurrentLesson(lesson);
          } else if (lessonData && lessonData.length > 0) {
            // If no lesson specified, navigate to the first lesson
            navigate(`/course/${courseId}/module/${moduleId}/lesson/${lessonData[0].id}`);
          }
        } else if (moduleData && moduleData.length > 0) {
          // If no module specified, navigate to the first module
          navigate(`/course/${courseId}/module/${moduleData[0].id}`);
        }
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course content. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, moduleId, lessonId, navigate]);

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

  const currentModule = modules.find(m => m.id === moduleId);
  const currentLessonIndex = lessons.findIndex(l => l.id === lessonId);
  const previousLesson = currentLessonIndex > 0 ? lessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < lessons.length - 1 ? lessons[currentLessonIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">{course.title}</h1>
          </div>
          <Link to={`/courses/${courseId}`}>
            <Button variant="ghost">Exit Course</Button>
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Course Navigation Sidebar */}
        <aside
          className={cn(
            "w-80 bg-white border-r h-[calc(100vh-64px)] sticky top-16 transition-all duration-300 overflow-y-auto",
            showSidebar ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="p-4">
            {modules.map((module) => (
              <div key={module.id} className="mb-4">
                <h3 className="font-medium mb-2">{module.title}</h3>
                {module.id === moduleId && (
                  <ul className="space-y-1 pl-4">
                    {lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          to={`/course/${courseId}/module/${moduleId}/lesson/${lesson.id}`}
                          className={cn(
                            "block py-2 px-3 rounded-lg text-sm",
                            lesson.id === lessonId
                              ? "bg-jdblue text-white"
                              : "hover:bg-gray-100"
                          )}
                        >
                          {lesson.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 p-6",
          !showSidebar && "container mx-auto"
        )}>
          {currentLesson ? (
            <div className="max-w-4xl mx-auto">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>
                {currentLesson.video_id && (
                  <div className="aspect-video mb-6">
                    <VideoPlayer videoId={currentLesson.video_id} />
                  </div>
                )}
                <div className="prose max-w-none">
                  {currentLesson.content}
                </div>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                {previousLesson ? (
                  <Link
                    to={`/course/${courseId}/module/${moduleId}/lesson/${previousLesson.id}`}
                    className="flex items-center gap-2 text-jdblue hover:underline"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous Lesson
                  </Link>
                ) : (
                  <div />
                )}
                {nextLesson && (
                  <Link
                    to={`/course/${courseId}/module/${moduleId}/lesson/${nextLesson.id}`}
                    className="flex items-center gap-2 text-jdblue hover:underline"
                  >
                    Next Lesson
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Select a lesson to begin learning.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 