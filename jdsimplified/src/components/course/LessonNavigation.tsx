
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Lesson, Module } from '@/types/course';
import { useNavigate } from 'react-router-dom';

interface LessonNavigationProps {
  prevLesson: {
    lesson: Lesson;
    module: Module;
  } | null;
  nextLesson: {
    lesson: Lesson;
    module: Module;
  } | null;
  courseId: string;
}

export const LessonNavigation = ({ 
  prevLesson, 
  nextLesson, 
  courseId 
}: LessonNavigationProps) => {
  const navigate = useNavigate();

  const goToLesson = (moduleId: string, lessonId: string) => {
    navigate(`/course/${courseId}/module/${moduleId}/lesson/${lessonId}`);
  };

  return (
    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
      {prevLesson ? (
        <button 
          onClick={() => goToLesson(prevLesson.module.id, prevLesson.lesson.id)} 
          className="flex items-center text-gray-700 hover:text-jdblue"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="hidden sm:inline">Previous Lesson</span>
          <span className="sm:hidden">Previous</span>
        </button>
      ) : (
        <div></div>
      )}
      
      {nextLesson ? (
        <button 
          onClick={() => goToLesson(nextLesson.module.id, nextLesson.lesson.id)} 
          className="flex items-center text-gray-700 hover:text-jdblue"
        >
          <span className="hidden sm:inline">Next Lesson</span>
          <span className="sm:hidden">Next</span>
          <ArrowRight className="h-5 w-5 ml-2" />
        </button>
      ) : (
        <div></div>
      )}
    </div>
  );
};
