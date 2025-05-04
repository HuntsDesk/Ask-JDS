import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Menu, X, BookOpen, Library, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarContext } from '@/App';
import { useLayoutState } from '@/hooks/useLayoutState';

export default function CourseNavbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isExpanded, setIsExpanded } = useContext(SidebarContext);
  const { isDesktop, isPinned, contentMargin } = useLayoutState();
  
  // Determine which tab is active
  const isPathActive = (path: string) => {
    if (path === '/courses' && location.pathname === '/courses') {
      return true;
    }
    if (path !== '/courses' && location.pathname.includes(path)) {
      return true;
    }
    return false;
  };
  
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
    if (location.pathname.includes('/courses/expired-courses')) {
      document.title = 'Expired Courses - Ask JDS';
    } else {
      document.title = 'Courses Dashboard - Ask JDS';
    }
  }, [location]);
  
  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);
  
  const NavLink = ({ to, icon, text, className = '' }) => (
    <Link 
      to={to} 
      className={`flex items-center space-x-1 py-2 px-3 rounded-md ${
        (location.pathname === to || 
         (to === '/courses' && location.pathname === '/courses') || 
         (to === '/courses/expired-courses' && location.pathname.includes('/courses/expired-courses')))
          ? 'text-[#F37022]' 
          : 'text-gray-600 dark:text-gray-300'
      } ${className}`}
      onClick={() => setIsMenuOpen(false)}
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
  
  return (
    <>
      <nav className={cn(
        "bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900 sticky top-0 z-20 w-full transition-all duration-300 ease-in-out",
        // Apply proper margin based on sidebar state
        isDesktop && isPinned && isExpanded && "pl-[280px]", // Full sidebar width
        isDesktop && isPinned && !isExpanded && "pl-[70px]"  // Collapsed sidebar width
      )}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Mobile header */}
            <div className="md:hidden flex items-center justify-between w-full">
              {/* Hamburger menu button */}
              <button
                onClick={() => setIsExpanded(true)}
                className="bg-[#F37022] text-white flex items-center justify-center p-2 rounded-md hover:bg-[#E36012]"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex flex-col flex-grow">
                <h1 className="text-lg font-semibold text-center dark:text-white">
                  Courses
                </h1>
              </div>
              <button
                onClick={() => setIsMenuOpen(true)}
                className="text-gray-600 flex items-center gap-1 ml-4"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Desktop layout container - Grid layout only applies at md breakpoint and above */}
            <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:w-full md:gap-4">
              {/* Navigation links */}
              <div className="md:flex md:items-center md:space-x-2 lg:space-x-4 xl:space-x-5">
                <div className="flex items-center text-xl font-semibold mr-4 text-gray-800 dark:text-white pl-2">
                  <BookOpen className="h-6 w-6 mr-2 text-[#F37022]" />
                  Courses
                </div>
                <NavLink 
                  to="/courses" 
                  icon={<Library className="h-5 w-5" />} 
                  text="Dashboard" 
                  className="text-base md:mr-2 lg:mr-3 xl:mr-4"
                />
                <NavLink 
                  to="/courses/expired-courses" 
                  icon={<Clock className="h-5 w-5" />} 
                  text="Expired Courses" 
                  className="text-base"
                />
              </div>
              
              {/* Center section - empty for now */}
              <div className="flex-1 flex justify-center">
                {/* Can add search or other centered elements here later */}
              </div>
              
              {/* Right actions - empty for now */}
              <div className="flex items-center space-x-4">
                {/* Can add buttons or controls here later */}
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 shadow-lg">
          <div className="p-4 space-y-2">
            <Link
              to="/courses"
              className={cn(
                "flex items-center space-x-3 p-3 rounded-md",
                isPathActive('/courses') && !location.pathname.includes('/courses/') 
                  ? "bg-gray-100 dark:bg-gray-700 text-[#F37022]"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <Library className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            
            <Link
              to="/courses/expired-courses"
              className={cn(
                "flex items-center space-x-3 p-3 rounded-md",
                isPathActive('/courses/expired-courses')
                  ? "bg-gray-100 dark:bg-gray-700 text-[#F37022]"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <Clock className="h-5 w-5" />
              <span className="font-medium">Expired Courses</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
} 