import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Menu, BookOpen, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarContext } from '@/App';
import { useLayoutState } from '@/hooks/useLayoutState';
import CourseSearchBar from './CourseSearchBar';

export default function CourseNavbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { isExpanded, setIsExpanded } = useContext(SidebarContext);
  const { isDesktop, isPinned, contentMargin } = useLayoutState();
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Set document title based on current route
  useEffect(() => {
    if (location.pathname.includes('/courses/search')) {
      document.title = 'Search Courses - Ask JDS';
    } else {
      document.title = 'All Courses - Ask JDS';
    }
  }, [location]);
  
  // Check if we're on the main courses page
  const isCoursesPage = location.pathname === '/courses';
  
  const NavLink = ({ to, icon, text, className = '' }) => (
    <Link 
      to={to} 
      className={`flex items-center space-x-1 py-2 px-3 rounded-md ${
        (location.pathname === to || 
         (to === '/courses' && location.pathname === '/courses'))
          ? 'text-[#F37022]' 
          : 'text-gray-600 dark:text-gray-300'
      } ${className}`}
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
  
  return (
      <nav className={cn(
        "bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900 sticky top-0 z-20 w-full transition-all duration-300 ease-in-out",
        // Apply the proper left padding when the sidebar is collapsed and pinned
        isDesktop && isPinned && !isExpanded && contentMargin
      )}>
        <div className="max-w-6xl mx-auto px-4">
        <div className="relative flex items-center justify-between h-16">
          {/* Mobile menu button */}
          {isMobile && (
              <button
              onClick={() => setIsExpanded(!isExpanded)} 
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white md:hidden"
              >
              <Menu className="h-6 w-6" />
              </button>
          )}
          
          {/* Main navigation content */}
          <div className="flex-1 flex items-center justify-between">
            {/* Mobile view - Show Courses link */}
            {isMobile ? (
              <div className="flex-1 flex justify-center">
                {isCoursesPage ? (
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Courses
                  </span>
                ) : (
                  <Link 
                    to="/courses" 
                    className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100 hover:text-[#F37022] dark:hover:text-orange-400"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Courses
                  </Link>
                )}
              </div>
            ) : (
              // Desktop view - existing navigation
              <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:w-full md:gap-4">
                {/* Navigation links */}
                <div className="md:flex md:items-center md:space-x-2 lg:space-x-4 xl:space-x-5">
                  <NavLink 
                    to="/courses" 
                    icon={<BookOpen className="h-5 w-5" />} 
                    text="All Courses" 
                    className="text-base"
                  />
                </div>
                
                {/* Middle flexible space */}
                <div className="md:flex-1"></div>
                
                {/* Right actions - Search bar positioned like flashcards "New Flashcard" button */}
                <div className="md:grid md:grid-cols-[minmax(40px,1fr)] md:items-center md:gap-3">
                  {/* Course search */}
                  <div className="md:w-full">
                    <CourseSearchBar />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </nav>
  );
} 