import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CourseHeader } from '@/components/course/CourseHeader';
import { CourseSidebar } from '@/components/course/CourseSidebar';
import { LessonHeader } from '@/components/course/LessonHeader';
import { LessonVideo } from '@/components/course/LessonVideo';
import { LessonContent } from '@/components/course/LessonContent';
import { LessonResources } from '@/components/course/LessonResources';
import { NextLessonCard } from '@/components/course/NextLessonCard';
import { LessonNavigation } from '@/components/course/LessonNavigation';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCourseData } from '@/hooks/useCourseData';
import { useCurrentLesson } from '@/hooks/useCurrentLesson';
import { useLessonCompletion } from '@/hooks/useLessonCompletion';
import { useAdjacentLessons } from '@/hooks/useAdjacentLessons';
import { LoadingSpinner } from '@/components/course/LoadingSpinner';

const CourseContent = () => {
  const {
    courseId,
    moduleId,
    lessonId
  } = useParams<{
    courseId: string;
    moduleId?: string;
    lessonId?: string;
  }>();
  const navigate = useNavigate();

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  // Fetch course data
  const { course, modules, lessons, isLoading, error } = useCourseData(courseId);
  
  // Get current module and lesson
  const { currentModule, currentLesson } = useCurrentLesson(
    courseId, 
    moduleId, 
    lessonId, 
    modules, 
    lessons
  );
  
  // Manage lesson completion
  const { completedLessons, isLessonCompleted, handleMarkComplete } = useLessonCompletion();
  
  // Get adjacent lessons
  const { getAdjacentLessons } = useAdjacentLessons(currentModule, currentLesson, modules, lessons);
  const { nextLesson, prevLesson } = getAdjacentLessons();
  
  // Handle lesson click in sidebar
  const handleLessonClick = (module, lesson) => {
    navigate(`/course/${courseId}/module/${module.id}/lesson/${lesson.id}`);
    setSidebarOpen(false);
  };
  
  // Get total number of lessons
  const totalLessons = Object.values(lessons).reduce((acc, arr) => acc + arr.length, 0);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!course || !currentModule || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Content not found</h2>
          <p className="text-gray-600 mb-6">The lesson you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/courses')}
            className="btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <CourseHeader 
        courseTitle={course.title}
        totalLessons={totalLessons}
        completedLessons={completedLessons}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <CourseSidebar 
          modules={modules}
          lessons={lessons}
          currentModule={currentModule}
          currentLesson={currentLesson}
          completedLessons={completedLessons}
          sidebarOpen={sidebarOpen}
          onLessonClick={handleLessonClick}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <LessonHeader 
              lesson={currentLesson}
              isCompleted={isLessonCompleted(currentLesson.id)}
              onMarkComplete={() => handleMarkComplete(currentLesson, nextLesson, courseId!)}
            />
            
            <LessonVideo 
              videoUrl={currentLesson.videoUrl}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(prev => !prev)}
            />
            
            {nextLesson && (
              <div className="flex items-center justify-end mb-6">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Next:</span>
                  <button 
                    onClick={() => navigate(`/course/${courseId}/module/${nextLesson.module.id}/lesson/${nextLesson.lesson.id}`)}
                    className="flex items-center text-jdorange hover:text-jdorange/80 font-medium text-sm"
                  >
                    {nextLesson.lesson.title}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
            
            <LessonContent lesson={currentLesson} />
            
            <LessonResources />
            
            {nextLesson && (
              <NextLessonCard nextLesson={nextLesson} courseId={courseId!} />
            )}
            
            <LessonNavigation 
              prevLesson={prevLesson}
              nextLesson={nextLesson}
              courseId={courseId!}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CourseContent;
