
import { Clock } from 'lucide-react';
import { Lesson } from '@/types/course';
import { Checkbox } from '@/components/ui/checkbox';

interface LessonHeaderProps {
  lesson: Lesson;
  isCompleted: boolean;
  onMarkComplete: () => void;
}

export const LessonHeader = ({ 
  lesson, 
  isCompleted, 
  onMarkComplete 
}: LessonHeaderProps) => {
  return (
    <div className="mb-6 flex justify-between items-start">
      <div>
        <h2 className="text-2xl font-bold">{lesson.title}</h2>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          <span>{lesson.duration}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">
          {isCompleted ? "Completed" : "Mark complete"}
        </span>
        <Checkbox 
          id="lesson-complete" 
          checked={isCompleted} 
          onCheckedChange={onMarkComplete}
          className={isCompleted ? "bg-green-500 text-white" : ""}
        />
      </div>
    </div>
  );
};
