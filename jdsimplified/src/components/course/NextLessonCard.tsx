
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Lesson, Module } from '@/types/course';
import { useNavigate } from 'react-router-dom';

interface NextLessonCardProps {
  nextLesson: {
    lesson: Lesson;
    module: Module;
  };
  courseId: string;
}

export const NextLessonCard = ({ nextLesson, courseId }: NextLessonCardProps) => {
  const navigate = useNavigate();
  
  const handleNavigate = () => {
    navigate(`/course/${courseId}/module/${nextLesson.module.id}/lesson/${nextLesson.lesson.id}`);
  };

  return (
    <div className="mb-8 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow">
      <div className="p-4">
        <h3 className="font-medium text-base text-foreground mb-2">Continue to Next Lesson</h3>
        <div className="flex items-center">
          <PlayCircle className="h-5 w-5 text-jdorange mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-base">{nextLesson.lesson.title}</h4>
            <p className="text-sm text-muted-foreground">{nextLesson.lesson.duration}</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <button 
          onClick={handleNavigate}
          className="w-full py-2 bg-jdorange text-white rounded-md hover:bg-jdorange/90 transition-colors flex items-center justify-center"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
