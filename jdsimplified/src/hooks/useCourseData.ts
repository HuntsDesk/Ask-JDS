import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { getCourseById, getModulesByCourseId, getLessonsByModuleId } from '@/services/courseService';
import { Course, Module, Lesson } from '@/types/course';

export const useCourseData = (courseId: string | undefined) => {
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<{
    [moduleId: string]: Lesson[];
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      setIsLoading(true);
      try {
        const courseData = await getCourseById(courseId);
        if (!courseData) {
          toast({
            title: 'Course not found',
            description: 'The course you are looking for does not exist.',
            variant: 'destructive'
          });
          navigate('/courses');
          return;
        }
        setCourse(courseData);

        const modulesData = await getModulesByCourseId(courseId);
        setModules(modulesData);

        const lessonsData: {
          [moduleId: string]: Lesson[];
        } = {};
        await Promise.all(modulesData.map(async module => {
          const moduleLessons = await getLessonsByModuleId(module.id);
          lessonsData[module.id] = moduleLessons;
        }));
        setLessons(lessonsData);
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError('An error occurred while loading the course content.');
        toast({
          title: 'Error loading course',
          description: 'An error occurred while loading the course content.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId, navigate]);

  return {
    course,
    modules,
    lessons,
    isLoading,
    error
  };
};
