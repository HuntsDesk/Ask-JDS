import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, BookOpen, Menu, User, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoPlayer } from '@/components/VideoPlayer';
import PageContainer from '@/components/layout/PageContainer';
import { useLayoutState } from '@/hooks/useLayoutState';
import { MobileNavLink } from '@/components/common/MobileNavLink';
import CourseNavbar from './CourseNavbar';
import ReactMarkdown from 'react-markdown';

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
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const { isDesktop, isPinned, isExpanded, contentPadding, contentMargin } = useLayoutState();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchCourseData() {
      try {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', courseId);

        if (courseError) throw courseError;
        if (!courseData || courseData.length === 0) {
          setError('Course not found');
          setLoading(false);
          return;
        }
        setCourse(courseData[0]);

        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('position', { ascending: true });

        if (moduleError) throw moduleError;
        setModules(moduleData || []);

        const newExpandedModules: Record<string, boolean> = {};
        moduleData?.forEach(module => {
          newExpandedModules[module.id] = true;
        });
        setExpandedModules(newExpandedModules);

        const allLessons: Record<string, Lesson[]> = {};
        const fetchPromises = moduleData?.map(async (module) => {
          const { data: lessonData, error: lessonError } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', module.id)
            .order('position', { ascending: true });

          if (lessonError) throw lessonError;
          allLessons[module.id] = lessonData || [];
        });

        if (fetchPromises) {
          await Promise.all(fetchPromises);
        }
        
        setLessons(allLessons);

        if (moduleId && lessonId) {
          const moduleLesson = allLessons[moduleId]?.find(l => l.id === lessonId) || null;
          setCurrentLesson(moduleLesson);
        } else if (moduleId && allLessons[moduleId]?.length > 0) {
          navigate(`/course/${courseId}/module/${moduleId}/lesson/${allLessons[moduleId][0].id}`);
        } else if (moduleData && moduleData.length > 0) {
          const firstModuleId = moduleData[0].id;
          if (allLessons[firstModuleId]?.length > 0) {
            navigate(`/course/${courseId}/module/${firstModuleId}/lesson/${allLessons[firstModuleId][0].id}`);
          } else {
            navigate(`/course/${courseId}/module/${firstModuleId}`);
          }
        }
      } catch (err) {
        logger.error('Error fetching course data:', err);
        setError('Failed to load course content. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, moduleId, lessonId, navigate]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

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
  const currentLessonIndex = lessons[moduleId!]?.findIndex(l => l.id === lessonId) ?? -1;
  
  // Check for previous lesson in current module
  let previousLesson = currentLessonIndex > 0 ? lessons[moduleId!][currentLessonIndex - 1] : null;
  
  // If no previous lesson in current module, check for last lesson in previous module
  if (!previousLesson && currentLessonIndex === 0) {
    // Find the current module's position
    const currentModuleIndex = modules.findIndex(m => m.id === moduleId);
    // Look for the previous module that has lessons, going backwards
    for (let i = currentModuleIndex - 1; i >= 0; i--) {
      const prevModuleLessons = lessons[modules[i].id];
      if (prevModuleLessons && prevModuleLessons.length > 0) {
        // Use the last lesson of the previous module with lessons
        previousLesson = prevModuleLessons[prevModuleLessons.length - 1];
        break;
      }
    }
  }
  
  // Check for next lesson in current module
  let nextLesson = currentLessonIndex < (lessons[moduleId!]?.length ?? 0) - 1 ? 
    lessons[moduleId!][currentLessonIndex + 1] : null;
  
  // If no next lesson in current module, check for first lesson in next module
  if (!nextLesson) {
    // Find the current module's position
    const currentModuleIndex = modules.findIndex(m => m.id === moduleId);
    // Look for the next module that has lessons
    for (let i = currentModuleIndex + 1; i < modules.length; i++) {
      const nextModuleLessons = lessons[modules[i].id];
      if (nextModuleLessons && nextModuleLessons.length > 0) {
        // Use the first lesson of the next module with lessons
        nextLesson = nextModuleLessons[0];
        break;
      }
    }
  }
  
  // Filter out modules with no lessons if they're not the current module
  const modulesToDisplay = modules.filter(module => {
    const hasLessons = lessons[module.id]?.length > 0;
    const isCurrentModule = module.id === moduleId;
    return hasLessons || isCurrentModule;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CourseNavbar />
      
      <div className={cn("flex-1 overflow-auto", isDesktop && contentMargin)}>
        <PageContainer 
          className={`pt-4 pb-20 md:pb-12 mx-auto`}
          maxWidth="default"
        >
          <div className="mx-auto pr-0 md:pr-64 lg:pr-64">
            {currentLesson ? (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                  {currentLesson.title}
                </h2>
                
                {currentLesson.video_id && (
                  <div className="relative w-full mb-6 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <VideoPlayer videoId={currentLesson.video_id} />
                  </div>
                )}
                
                <div className="flex justify-between mb-6">
                  {previousLesson ? (
                    <Link
                      to={`/course/${courseId}/module/${previousLesson.module_id}/lesson/${previousLesson.id}`}
                      className="flex items-center gap-2 text-[#F37022] hover:underline dark:text-orange-400"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous Lesson
                    </Link>
                  ) : (
                    <div />
                  )}
                  {nextLesson && (
                    <Link
                      to={`/course/${courseId}/module/${nextLesson.module_id}/lesson/${nextLesson.id}`}
                      className="flex items-center gap-2 text-[#F37022] hover:underline dark:text-orange-400"
                    >
                      Next Lesson
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
                
                <Card className="p-6 mb-8">
                  <div className="prose dark:prose-invert max-w-none">
                    {/* Render content based on what format it appears to be */}
                    {currentLesson.content.includes('<') && currentLesson.content.includes('>') ? (
                      // If it contains HTML tags, render as HTML
                      <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                    ) : currentLesson.content.includes('#') || 
                         currentLesson.content.includes('**') || 
                         currentLesson.content.includes('*') || 
                         currentLesson.content.includes('[') ? (
                      // If it contains markdown syntax, render as markdown
                      <ReactMarkdown>{currentLesson.content}</ReactMarkdown>
                    ) : (
                      // Otherwise, render as plain text with line breaks preserved
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {currentLesson.content}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">Select a lesson to begin learning.</p>
              </div>
            )}
          </div>
        </PageContainer>
      </div>

      {/* Right sidebar - fixed position */}
      <div className="hidden md:block fixed top-16 right-0 w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-[calc(100vh-64px)] overflow-y-auto z-10">
        <div className="sticky top-0 pt-6 pb-4 px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 z-10">
          <h2 className="text-base font-medium text-gray-800 dark:text-gray-200">{course.title}</h2>
        </div>
        
        <nav className="py-2">
          {modulesToDisplay.map((module) => {
            const hasLessons = lessons[module.id]?.length > 0;
            
            return (
              <div key={module.id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <button
                  onClick={() => toggleModule(module.id)}
                  className={cn(
                    "w-full flex items-center justify-between text-left px-4 py-3",
                    "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900",
                    module.id === moduleId ? 
                      "bg-gray-100 dark:bg-gray-900 font-medium text-[#F37022] dark:text-orange-300" : 
                      "bg-white dark:bg-gray-800"
                  )}
                >
                  <span className="text-sm font-medium">{module.title}</span>
                  {hasLessons && (
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 text-gray-500 transition-transform duration-200",
                        expandedModules[module.id] && "transform rotate-180"
                      )} 
                    />
                  )}
                </button>
                
                {expandedModules[module.id] && hasLessons && (
                  <ul className="py-1 bg-gray-50 dark:bg-gray-900">
                    {lessons[module.id]?.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          to={`/course/${courseId}/module/${module.id}/lesson/${lesson.id}`}
                          className={cn(
                            "block py-2 px-6 text-sm border-l-2 my-1 mx-1 rounded",
                            lesson.id === lessonId
                              ? "border-[#F37022] bg-orange-50 dark:bg-orange-900/20 text-[#F37022] dark:text-orange-300 font-medium"
                              : "border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          )}
                        >
                          {lesson.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                
                {expandedModules[module.id] && !hasLessons && (
                  <div className="py-2 px-6 text-sm text-gray-500 italic bg-gray-50 dark:bg-gray-900">
                    No lessons available
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-3 h-16">
            <MobileNavLink 
              to="/courses" 
              icon={<BookOpen className="h-5 w-5" />} 
              text="Courses" 
            />
            {previousLesson && (
              <MobileNavLink 
                to={`/course/${courseId}/module/${previousLesson.module_id}/lesson/${previousLesson.id}`}
                icon={<ChevronLeft className="h-5 w-5" />} 
                text="Previous" 
              />
            )}
            {nextLesson && (
              <MobileNavLink 
                to={`/course/${courseId}/module/${nextLesson.module_id}/lesson/${nextLesson.id}`}
                icon={<ChevronRight className="h-5 w-5" />} 
                text="Next" 
              />
            )}
            {!previousLesson && !nextLesson && (
              <div className="flex flex-col items-center justify-center opacity-50">
                <User className="h-5 w-5 mb-1 text-gray-500" />
                <span className="text-xs text-gray-500">No Lessons</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 