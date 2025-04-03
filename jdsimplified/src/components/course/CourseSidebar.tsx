
import { Module, Lesson } from '@/types/course';
import { cn } from '@/lib/utils';
import { CheckCircle, PlayCircle, Lock, X } from 'lucide-react';

interface CourseSidebarProps {
  modules: Module[];
  lessons: {
    [moduleId: string]: Lesson[];
  };
  currentModule: Module | null;
  currentLesson: Lesson | null;
  completedLessons: string[];
  sidebarOpen: boolean;
  onLessonClick: (module: Module, lesson: Lesson) => void;
  onCloseSidebar: () => void;
}

export const CourseSidebar = ({
  modules,
  lessons,
  currentModule,
  currentLesson,
  completedLessons,
  sidebarOpen,
  onLessonClick,
  onCloseSidebar
}: CourseSidebarProps) => {
  const isLessonCompleted = (lessonId: string) => {
    return completedLessons.includes(lessonId);
  };

  return (
    <aside className={cn(
      "bg-white w-80 border-r border-gray-200 flex-shrink-0 overflow-y-auto",
      "fixed inset-y-0 pt-16 pb-0 left-0 z-20 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out h-full",
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-4 flex justify-between items-center">
        <h2 className="font-bold text-lg">Course Content</h2>
        <button onClick={onCloseSidebar} className="md:hidden p-2 rounded-md hover:bg-gray-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="divide-y divide-gray-200">
        {modules.map(module => (
          <div key={module.id} className="py-2">
            <div className="px-4 py-2 font-medium text-gray-800">
              {module.title}
            </div>
            
            <ul className="space-y-1 px-2">
              {(lessons[module.id] || []).map(lesson => (
                <li key={lesson.id}>
                  <button 
                    onClick={() => onLessonClick(module, lesson)} 
                    className={cn(
                      "flex items-center w-full px-4 py-2 rounded-lg text-left text-sm",
                      "hover:bg-gray-100",
                      currentLesson?.id === lesson.id 
                        ? "bg-jdorange/10 text-jdorange font-medium" 
                        : "text-gray-700"
                    )}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {isLessonCompleted(lesson.id) 
                        ? <CheckCircle className="h-5 w-5 text-green-500" /> 
                        : currentLesson?.id === lesson.id 
                          ? <PlayCircle className="h-5 w-5 text-jdorange" /> 
                          : <Lock className="h-5 w-5 text-gray-400" />
                      }
                    </div>
                    <div className="flex-1">
                      <span className="block break-words">{lesson.title}</span>
                    </div>
                    <div className="flex-shrink-0 text-gray-400 text-xs ml-2">{lesson.duration}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
};
