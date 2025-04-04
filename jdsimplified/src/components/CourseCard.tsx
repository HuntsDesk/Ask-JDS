import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, BookOpen, Clock, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  duration: string;
  lessons: number;
  level: string;
  featured?: boolean;
  isBlue?: boolean; // Option to switch between orange and blue styling
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
  isBlue = false
}: CourseCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={cn(
        "premium-card h-full flex flex-col bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm transition-all duration-300 relative",
        featured && "border border-jdorange/30",
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
              "w-full h-full object-contain transition-transform duration-300 dark:brightness-0 dark:invert",
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
      
      {/* Course Info */}
      <div className="flex items-center mt-1 mb-1.5 text-sm text-gray-500 dark:text-gray-400">
        <BookOpen className="h-4 w-4 mr-1" />
        <span>{lessons} lessons</span>
      </div>
      
      {/* Description */}
      <p className="text-gray-600 dark:text-gray-300 text-left line-clamp-3 flex-grow text-sm leading-relaxed">{description}</p>
      
      {/* Bottom actions */}
      <div className="mt-6">
        {featured && (
          <div className="absolute top-3 right-3">
            <span className="bg-gradient-to-r from-amber-500 to-jdorange text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
              Featured
            </span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <Link 
            to={`/courses/${id}`} 
            className="px-4 py-2 text-center border border-jdblue text-jdblue dark:border-blue-400 dark:text-blue-400 rounded-lg font-medium hover:bg-jdblue hover:text-white dark:hover:bg-blue-700 transition-all duration-300"
          >
            Details
          </Link>
          <button 
            className="px-4 py-2 bg-gradient-to-r from-jdorange to-jdorange-dark text-white rounded-lg font-medium flex items-center justify-center hover:opacity-90 transition-all duration-300 shadow-sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
