
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Lesson, Module } from '@/types/course';

export const useLessonCompletion = () => {
  const [completedLessons, setCompletedLessons] = useState<string[]>(['l1', 'l2']);
  const navigate = useNavigate();

  const isLessonCompleted = (lessonId: string) => {
    return completedLessons.includes(lessonId);
  };

  const handleMarkComplete = (
    currentLesson: Lesson | null, 
    nextLesson: { lesson: Lesson; module: Module } | null,
    courseId: string
  ) => {
    if (!currentLesson) return;

    if (isLessonCompleted(currentLesson.id)) {
      setCompletedLessons(prev => prev.filter(id => id !== currentLesson.id));
      toast({
        title: "Lesson marked as incomplete",
        description: "Your progress has been updated.",
        variant: "default"
      });
    } else {
      setCompletedLessons(prev => [...prev, currentLesson.id]);
      toast({
        title: "Lesson completed",
        description: "Your progress has been saved.",
        variant: "default"
      });

      if (nextLesson) {
        navigate(`/course/${courseId}/module/${nextLesson.module.id}/lesson/${nextLesson.lesson.id}`);
      }
    }
  };

  return {
    completedLessons,
    isLessonCompleted,
    handleMarkComplete
  };
};
