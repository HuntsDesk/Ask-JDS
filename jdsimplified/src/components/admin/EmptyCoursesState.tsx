
import { Link } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';

interface EmptyCoursesStateProps {
  searchTerm: string;
}

const EmptyCoursesState = ({ searchTerm }: EmptyCoursesStateProps) => {
  return (
    <div className="p-8 text-center">
      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
      <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
      <p className="mt-1 text-gray-500">
        {searchTerm ? `No courses matching "${searchTerm}"` : "You haven't created any courses yet."}
      </p>
      <Link
        to="/admin/courses/new"
        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-jdblue hover:bg-jdblue-light"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add New Course
      </Link>
    </div>
  );
};

export default EmptyCoursesState;
