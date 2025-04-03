
import { ArrowUpDown } from 'lucide-react';
import { Course } from '@/types/course';

interface CourseTableHeaderProps {
  sortField: keyof Course;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Course) => void;
  selectedCourses: string[];
  filteredCourses: Course[];
  onSelectAll: () => void;
}

const CourseTableHeader = ({
  sortField,
  sortDirection,
  onSort,
  selectedCourses,
  filteredCourses,
  onSelectAll
}: CourseTableHeaderProps) => {
  return (
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-jdblue focus:ring-jdblue"
              checked={selectedCourses.length === filteredCourses.length && filteredCourses.length > 0}
              onChange={onSelectAll}
            />
          </div>
        </th>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
          onClick={() => onSort('title')}
        >
          <div className="flex items-center">
            Title
            <ArrowUpDown className="h-4 w-4 ml-1" />
          </div>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Category
        </th>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
          onClick={() => onSort('price')}
        >
          <div className="flex items-center">
            Price
            <ArrowUpDown className="h-4 w-4 ml-1" />
          </div>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </th>
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
          onClick={() => onSort('lastUpdated')}
        >
          <div className="flex items-center">
            Last Updated
            <ArrowUpDown className="h-4 w-4 ml-1" />
          </div>
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );
};

export default CourseTableHeader;
