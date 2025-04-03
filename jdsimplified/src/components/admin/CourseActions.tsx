
import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Course } from '@/types/course';

interface CourseActionsProps {
  course: Course;
  onDelete: (courseId: string) => void;
}

const CourseActions = ({ course, onDelete }: CourseActionsProps) => {
  return (
    <div className="whitespace-nowrap text-right text-sm font-medium space-x-2">
      <Link 
        to={`/courses/${course.id}`}
        className="text-gray-600 hover:text-gray-900 bg-gray-100 p-2 rounded-md inline-flex items-center"
        target="_blank"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <Link 
        to={`/admin/courses/${course.id}`}
        className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-md inline-flex items-center"
      >
        <Edit className="h-4 w-4" />
      </Link>
      <button 
        onClick={() => onDelete(course.id)}
        className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-md inline-flex items-center"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

export default CourseActions;
