
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Module, Lesson } from '@/types/course';
import { getLessonsByModuleId } from '@/services/courseService';

export const useCurrentLesson = (
  courseId: string | undefined,
  moduleId: string | undefined,
  lessonId: string | undefined,
  modules: Module[],
  lessons: { [moduleId: string]: Lesson[] }
) => {
  const navigate = useNavigate();
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    const setCurrentContent = async () => {
      if (!courseId || modules.length === 0) return;

      if (moduleId) {
        const foundModule = modules.find(m => m.id === moduleId);
        if (foundModule) {
          setCurrentModule(foundModule);
          if (lessonId) {
            // If lessons for this module are already loaded
            if (lessons[foundModule.id]) {
              const foundLesson = lessons[foundModule.id].find(l => l.id === lessonId);
              if (foundLesson) {
                setCurrentLesson(foundLesson);
              } else if (lessons[foundModule.id].length > 0) {
                setCurrentLesson(lessons[foundModule.id][0]);
                navigate(`/course/${courseId}/module/${moduleId}/lesson/${lessons[foundModule.id][0].id}`);
              }
            } else {
              // If lessons for this module need to be fetched
              const moduleLessons = await getLessonsByModuleId(foundModule.id);
              const foundLesson = moduleLessons.find(l => l.id === lessonId);
              if (foundLesson) {
                setCurrentLesson(foundLesson);
              } else if (moduleLessons.length > 0) {
                setCurrentLesson(moduleLessons[0]);
                navigate(`/course/${courseId}/module/${moduleId}/lesson/${moduleLessons[0].id}`);
              }
            }
          } else if (foundModule && lessons[foundModule.id]?.length > 0) {
            setCurrentLesson(lessons[foundModule.id][0]);
            navigate(`/course/${courseId}/module/${moduleId}/lesson/${lessons[foundModule.id][0].id}`);
          }
        } else if (modules.length > 0) {
          navigate(`/course/${courseId}/module/${modules[0].id}`);
        }
      } else if (modules.length > 0) {
        navigate(`/course/${courseId}/module/${modules[0].id}`);
      }
    };

    setCurrentContent();
  }, [courseId, moduleId, lessonId, modules, lessons, navigate]);

  return {
    currentModule,
    currentLesson
  };
};
