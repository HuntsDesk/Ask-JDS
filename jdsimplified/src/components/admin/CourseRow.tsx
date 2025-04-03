
import { Course } from '@/types/course';
import StatusBadge from './StatusBadge';
import CourseActions from './CourseActions';

interface CourseRowProps {
  course: Course;
  isSelected: boolean;
  onSelect: (courseId: string) => void;
  onDelete: (courseId: string) => void;
}

const CourseRow = ({ course, isSelected, onSelect, onDelete }: CourseRowProps) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-jdblue focus:ring-jdblue"
          checked={isSelected}
          onChange={() => onSelect(course.id)}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img 
            src={course.image} 
            alt={course.title}
            className="h-10 w-10 rounded-md object-cover mr-3"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {course.title}
            </div>
            <div className="text-sm text-gray-500">
              {course.lessons} lessons • {course.duration}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{course.category}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">${course.price}</div>
        {course.originalPrice && (
          <div className="text-sm text-gray-500 line-through">${course.originalPrice}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={course.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {course.lastUpdated}
      </td>
      <td className="px-6 py-4">
        <CourseActions course={course} onDelete={onDelete} />
      </td>
    </tr>
  );
};

export default CourseRow;
