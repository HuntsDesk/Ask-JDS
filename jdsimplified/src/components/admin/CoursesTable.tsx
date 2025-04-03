
import { Course } from '@/types/course';
import CourseRow from './CourseRow';
import CourseTableHeader from './CourseTableHeader';
import EmptyCoursesState from './EmptyCoursesState';

interface CoursesTableProps {
  isLoading: boolean;
  filteredCourses: Course[];
  searchTerm: string;
  sortField: keyof Course;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Course) => void;
  selectedCourses: string[];
  onSelectCourse: (courseId: string) => void;
  onSelectAll: () => void;
  onDelete: (courseId: string) => void;
}

const CoursesTable = ({
  isLoading,
  filteredCourses,
  searchTerm,
  sortField,
  sortDirection,
  onSort,
  selectedCourses,
  onSelectCourse,
  onSelectAll,
  onDelete
}: CoursesTableProps) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jdblue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-gray-500">Loading courses...</p>
      </div>
    );
  }

  if (filteredCourses.length === 0) {
    return <EmptyCoursesState searchTerm={searchTerm} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <CourseTableHeader
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          selectedCourses={selectedCourses}
          filteredCourses={filteredCourses}
          onSelectAll={onSelectAll}
        />
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredCourses.map((course) => (
            <CourseRow
              key={course.id}
              course={course}
              isSelected={selectedCourses.includes(course.id)}
              onSelect={onSelectCourse}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CoursesTable;
