
import { Module, Lesson } from '@/types/course';

export const useAdjacentLessons = (
  currentModule: Module | null,
  currentLesson: Lesson | null,
  modules: Module[],
  lessons: { [moduleId: string]: Lesson[] }
) => {
  const getAdjacentLessons = () => {
    if (!currentModule || !currentLesson) return {
      nextLesson: null,
      prevLesson: null
    };
    
    const moduleLessons = lessons[currentModule.id] || [];
    const currentIndex = moduleLessons.findIndex(lesson => lesson.id === currentLesson.id);

    if (currentIndex === -1) return {
      nextLesson: null,
      prevLesson: null
    };
    
    const prevLesson = currentIndex > 0 ? moduleLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < moduleLessons.length - 1 ? moduleLessons[currentIndex + 1] : null;

    let nextModuleFirstLesson = null;
    if (!nextLesson) {
      const currentModuleIndex = modules.findIndex(module => module.id === currentModule.id);
      if (currentModuleIndex < modules.length - 1) {
        const nextModule = modules[currentModuleIndex + 1];
        const nextModuleLessons = lessons[nextModule.id] || [];
        if (nextModuleLessons.length > 0) {
          nextModuleFirstLesson = {
            lesson: nextModuleLessons[0],
            module: nextModule
          };
        }
      }
    }

    let prevModuleLastLesson = null;
    if (!prevLesson) {
      const currentModuleIndex = modules.findIndex(module => module.id === currentModule.id);
      if (currentModuleIndex > 0) {
        const prevModule = modules[currentModuleIndex - 1];
        const prevModuleLessons = lessons[prevModule.id] || [];
        if (prevModuleLessons.length > 0) {
          prevModuleLastLesson = {
            lesson: prevModuleLessons[prevModuleLessons.length - 1],
            module: prevModule
          };
        }
      }
    }
    
    return {
      nextLesson: nextLesson ? {
        lesson: nextLesson,
        module: currentModule
      } : nextModuleFirstLesson,
      prevLesson: prevLesson ? {
        lesson: prevLesson,
        module: currentModule
      } : prevModuleLastLesson
    };
  };

  return { getAdjacentLessons };
};
