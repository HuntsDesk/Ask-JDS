
import { Lesson } from '@/types/course';
import DOMPurify from 'dompurify';

interface LessonContentProps {
  lesson: Lesson;
}

export const LessonContent = ({ lesson }: LessonContentProps) => {
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = lesson.content ? DOMPurify.sanitize(lesson.content) : '';

  return (
    <div className="prose max-w-none mb-10">
      <h3 className="text-xl font-bold mb-4">{lesson.title}</h3>
      {lesson.content ? (
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
      ) : (
        <>
          <h4 className="text-lg font-medium mb-3">Lesson Overview</h4>
          <p className="mb-6">{lesson.description || "In this lesson, we'll explore the key concepts and applications of this topic through clear, strategic frameworks that simplify complex legal principles."}</p>
          
          <h4 className="text-lg font-medium mb-3">Learning Objectives</h4>
          <ul className="list-disc pl-6 mb-6">
            <li className="mb-2">Understand the core principles and their applications</li>
            <li className="mb-2">Apply analytical frameworks to solve related problems</li>
            <li className="mb-2">Recognize common patterns and exceptions</li>
            <li className="mb-2">Develop strategies for answering exam questions on this topic</li>
          </ul>
          
          <h4 className="text-lg font-medium mb-3">Key Concepts</h4>
          <p className="mb-4">This section would contain detailed explanation of the lesson content with examples and illustrations.</p>
        </>
      )}
    </div>
  );
};
