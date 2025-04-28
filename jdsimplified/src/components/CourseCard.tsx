import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Layers, Ticket } from 'lucide-react';
import { cn } from '../lib/utils';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  duration?: string;
  lessons?: number;
  level?: string;
  featured?: boolean;
  isBlue?: boolean; // Option to switch between orange and blue styling
  _count?: {
    modules: number;
    lessons: number;
  };
  status?: string; // Add status to the props
}

const CourseCard = ({
  id,
  title,
  description,
  price,
  originalPrice,
  image,
  duration,
  lessons,
  level,
  featured = false,
  isBlue = false,
  _count,
  status
}: CourseCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Use _count if available, otherwise fall back to the direct lessons prop
  const modulesCount = _count?.modules || 0;
  const lessonsCount = _count?.lessons || lessons || 0;
  
  return (
    <div 
      className={cn(
        "premium-card h-full flex flex-col bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm transition-all duration-300 relative",
        featured && "border border-jdorange/30 dark:border-jdorange/20",
        isHovered && "shadow-lg transform translate-y-[-2px]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Course Icon and Title */}
      <div className="flex flex-col items-center justify-center">
        {/* JD Simplified Favicon */}
        <div className="w-24 h-24 mb-0.5 flex items-center justify-center">
          <img 
            src="/images/JD Simplified Favicon.svg" 
            alt="JD Simplified Logo" 
            className={cn(
              "w-full h-full object-contain transition-transform duration-300 dark:filter dark:brightness-0 dark:invert",
              isHovered && "transform scale-105"
            )}
          />
        </div>
        
        {/* Course Title */}
        <h3 
          className={cn(
            "text-[1.35rem] font-bold text-center mb-1",
            "text-jdblue dark:text-blue-300"
          )}
        >
          {title}
        </h3>
      </div>
      
      {/* Description - Fixed height with overflow */}
      <div className="min-h-[90px] mt-1 mb-3">
        <p className="text-gray-600 dark:text-gray-300 text-left line-clamp-3 text-sm leading-relaxed">
          {description}
        </p>
      </div>
      
      {/* Spacer to push content to bottom */}
      <div className="flex-grow"></div>
      
      {/* Course Info - Fixed position above buttons */}
      <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <Layers className="h-4 w-4 mr-1" />
            <span>{modulesCount} {modulesCount === 1 ? 'module' : 'modules'}</span>
          </div>
          
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-1" />
            <span>{lessonsCount} {lessonsCount === 1 ? 'lesson' : 'lessons'}</span>
          </div>
        </div>
      </div>
      
      {/* Bottom actions */}
      <div>
        {/* Status badges - Coming Soon takes priority over Featured */}
        <div className="absolute top-3 right-3">
          {status?.toLowerCase() === 'coming soon' && (
            <span className="bg-gradient-to-r from-blue-500 to-jdblue text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
              Coming Soon
            </span>
          )}
          
          {status?.toLowerCase() !== 'coming soon' && featured && (
            <span className="bg-gradient-to-r from-amber-500 to-jdorange text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
              Featured
            </span>
          )}
          
          {!featured && status?.toLowerCase() === 'draft' && (
            <span className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
              Draft
            </span>
          )}
        </div>
        
        {status?.toLowerCase() === 'coming soon' ? (
          <div className="text-center mt-2 text-gray-500 dark:text-gray-400 italic text-sm">
            This course will be available soon
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Link 
              to={`/courses/${id}`}
              className="px-4 py-2 text-center border border-jdblue dark:border-blue-300 text-jdblue dark:text-blue-300 rounded-lg font-medium hover:bg-jdblue hover:text-white dark:hover:bg-blue-600 transition-all duration-300"
            >
              Details
            </Link>
            <button 
              className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm transition-all duration-300 ${
                status?.toLowerCase() === 'draft'
                  ? 'bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed opacity-80' 
                  : 'bg-gradient-to-r from-jdorange to-jdorange-dark text-white hover:opacity-90'
              }`}
              disabled={status?.toLowerCase() === 'draft'}
            >
              {status?.toLowerCase() === 'draft' ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Coming Soon
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4 mr-2" />
                  Rent
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
