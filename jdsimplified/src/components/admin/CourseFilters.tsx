
import { Search, Trash2 } from 'lucide-react';
import { Course } from '@/types/course';

interface CourseFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: Course['status'] | 'all';
  onFilterStatusChange: (status: Course['status'] | 'all') => void;
  selectedCourses: string[];
  onBulkDelete: () => void;
}

const CourseFilters = ({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  selectedCourses,
  onBulkDelete
}: CourseFiltersProps) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search courses..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-jdblue focus:border-transparent"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value as Course['status'] | 'all')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jdblue focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
            <option value="Coming Soon">Coming Soon</option>
          </select>
        </div>
        
        {selectedCourses.length > 0 && (
          <button
            onClick={onBulkDelete}
            className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-red-600 transition-colors"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Delete Selected ({selectedCourses.length})
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseFilters;
