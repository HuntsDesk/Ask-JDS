import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Menu, BookOpen, Library, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarContext } from '@/App';
import { useLayoutState } from '@/hooks/useLayoutState';
import MobileBottomNav from './MobileBottomNav';

export default function CourseNavbar() {
  const { user } = useAuth();
  const location = useLocation();
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
    } else if (location.pathname.includes('/courses/my-courses')) {
      document.title = 'My Courses - Ask JDS';
    } else {
      document.title = 'All Courses - Ask JDS';
    }
  }, [location]);
  
  const NavLink = ({ to, icon, text, className = '' }) => (
    <Link 
      to={to} 
      className={`flex items-center space-x-1 py-2 px-3 rounded-md ${
        (location.pathname === to || 
         (to === '/courses' && location.pathname === '/courses') || 
         (to === '/courses/expired-courses' && location.pathname.includes('/courses/expired-courses')) ||
         (to === '/courses/my-courses' && location.pathname.includes('/courses/my-courses')))
          ? 'text-[#F37022]' 
          : 'text-gray-600 dark:text-gray-300'
      } ${className}`}
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
  
  return (
    <>
      <nav className={cn(
        "bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900 sticky top-0 z-20 w-full transition-all duration-300 ease-in-out",
        // Apply the proper left padding when the sidebar is collapsed and pinned
        isDesktop && isPinned && !isExpanded && contentMargin
      )}>
        <div className="max-w-6xl mx-auto px-4">
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
            </div>

            {/* Desktop layout container - Grid layout only applies at md breakpoint and above */}
            <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:w-full md:gap-4">
              {/* Navigation links */}
              <div className="md:flex md:items-center md:space-x-2 lg:space-x-4 xl:space-x-5">
                <NavLink 
                  to="/courses" 
                  icon={<BookOpen className="h-5 w-5" />} 
                  text="All Courses" 
                  className="text-base md:mr-2 lg:mr-3 xl:mr-4"
                />
                <NavLink 
                  to="/courses/my-courses" 
                  icon={<User className="h-5 w-5" />} 
                  text="My Courses" 
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
      
      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </>
  );
} 