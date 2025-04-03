import { Link } from 'react-router-dom';
import { ChevronLeft, Book, MessageSquare, Menu, X } from 'lucide-react';

interface CourseHeaderProps {
  courseTitle: string;
  totalLessons: number;
  completedLessons: string[];
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const CourseHeader = ({
  courseTitle,
  totalLessons,
  completedLessons,
  onToggleSidebar,
  sidebarOpen
}: CourseHeaderProps) => {
  const progressPercentage = totalLessons > 0 
    ? (completedLessons.length / totalLessons) * 100 
    : 0;

  return (
    <header className="bg-white border-b border-gray-200 z-30">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onToggleSidebar} 
            className="md:hidden p-2 rounded-md hover:bg-gray-100" 
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <Link to="/courses" className="flex items-center space-x-2">
            <ChevronLeft className="h-5 w-5" />
            <span className="font-medium hidden sm:inline">Back to Dashboard</span>
            <span className="font-medium sm:hidden">Go back</span>
          </Link>
        </div>
        
        <div className="flex-1 mx-4 text-center">
          <h1 className="text-lg font-bold truncate">{courseTitle}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link to={`/courses/${courseTitle}`} className="text-gray-500 hover:text-gray-700" target="_blank" rel="noopener noreferrer">
            <Book className="h-5 w-5" />
          </Link>
          <button className="text-gray-500 hover:text-gray-700">
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="h-1 bg-gray-200">
        <div 
          style={{ width: `${progressPercentage}%` }} 
          className="h-full bg-[#f57f07]"
        ></div>
      </div>
    </header>
  );
};
