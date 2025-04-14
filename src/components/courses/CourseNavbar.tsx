import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, X, BookOpen } from 'lucide-react';
import CourseSearchBar from './CourseSearchBar';
import { useAuth } from '@/lib/auth';
import { useNavbar } from '@/contexts/NavbarContext';
import { SidebarContext } from '@/App';
import { supabase } from '@/lib/supabase';

export default function CourseNavbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { itemCount } = useNavbar();
  const { isExpanded, setIsExpanded } = useContext(SidebarContext);
  const [hasActiveCourses, setHasActiveCourses] = useState(false);

  // Check if user has any active course enrollments
  useEffect(() => {
    if (user) {
      const checkActiveCourses = async () => {
        try {
          // Query for course enrollments without filtering by status since the column doesn't exist
          const { data, error } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('user_id', user.id);
          
          if (error) {
            console.error('Error checking course enrollments:', error);
            // Even in case of error, set hasActiveCourses to false to prevent navigation issues
            setHasActiveCourses(false);
            return;
          }
          setHasActiveCourses(data && data.length > 0);

          // If at /courses root and no active route selected, redirect based on enrollments
          const path = location.pathname;
          if (path === '/courses') {
            navigate(data && data.length > 0 ? '/courses/my-courses' : '/courses/available-courses', { replace: true });
          }
        } catch (err) {
          console.error('Error checking course enrollments:', err);
          // Set hasActiveCourses to false to prevent navigation issues
          setHasActiveCourses(false);
        }
      };
      
      checkActiveCourses();
    }
  }, [user, location.pathname, navigate]);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get the current page title and count
  const getPageInfo = () => {
    const path = location.pathname;
    // Use more specific path matching to handle nested routes correctly
    if (path.includes('/courses/my-courses')) {
      return {
        title: 'My Courses',
        countKey: 'courseCount'
      };
    } else if (path.includes('/courses/available-courses')) {
      return {
        title: 'Available Courses',
        countKey: 'courseCount'
      };
    } else {
      return {
        title: 'Courses',
        countKey: null
      };
    }
  };

  // Get the count based on the current page
  const getCount = () => {
    return itemCount;
  };

  const pageInfo = getPageInfo();
  const count = getCount();

  const NavLink = ({ to, text, className = '' }) => (
    <Link 
      to={to} 
      className={`flex items-center space-x-1 py-2 px-3 rounded-md ${
        location.pathname.includes(to)
          ? 'text-[#F37022]' 
          : 'text-gray-600 dark:text-gray-300'
      } ${className}`}
      onClick={() => setIsMenuOpen(false)}
    >
      <span>{text}</span>
    </Link>
  );

  const MobileNavLink = ({ to, text }) => (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center py-3 ${
        location.pathname.includes(to)
          ? 'text-[#F37022] border-t-2 border-[#F37022]' 
          : 'text-gray-600 dark:text-gray-300'
      }`}
    >
      <span className="text-sm font-medium">{text}</span>
    </Link>
  );

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900 fixed top-0 z-20 w-full md:w-[calc(100%-var(--sidebar-collapsed-width))] md:left-[var(--sidebar-collapsed-width)] transition-all duration-300 ease-in-out" style={isExpanded ? {width: 'calc(100% - var(--sidebar-width))', left: 'var(--sidebar-width)'} : {}}>
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
                  {pageInfo.title}
                </h1>
                {pageInfo.countKey && (
                  <p className="text-sm text-gray-500 dark:text-gray-300 text-center">
                    {count} {pageInfo.title.toLowerCase()}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsMenuOpen(true)}
                className="text-gray-600 flex items-center gap-1 ml-4"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            {/* Desktop layout container - Grid layout only applies at md breakpoint and above */}
            <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:w-full md:gap-4">
              {/* Navigation links */}
              <div className="md:flex md:items-center md:space-x-2 lg:space-x-4 xl:space-x-5">
                <div className="flex items-center text-xl font-semibold mr-8 text-gray-800 dark:text-white">
                  <BookOpen className="h-5 w-5 mr-2 text-[#F37022]" />
                  Courses
                </div>
                <NavLink 
                  to="/courses/my-courses" 
                  text="My Courses" 
                  className="text-base md:mr-2 lg:mr-3 xl:mr-4"
                />
                <NavLink 
                  to="/courses/available-courses" 
                  text="Available Courses" 
                  className="text-base md:mr-2 lg:mr-3 xl:mr-4"
                />
              </div>
              
              {/* Middle flexible space */}
              <div className="md:flex-1"></div>
              
              {/* Action items container - grid layout for search */}
              <div className="md:w-full max-w-xs">
                <CourseSearchBar />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile course navigation */}
      <div className="md:hidden fixed top-16 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30">
        <div className="grid grid-cols-2">
          <MobileNavLink 
            to="/courses/my-courses" 
            text="My Courses" 
          />
          <MobileNavLink 
            to="/courses/available-courses" 
            text="Available Courses" 
          />
        </div>
      </div>

      {/* Mobile search overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Search</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-600 dark:text-gray-300 p-2 rounded-md"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <CourseSearchBar />
          </div>
        </div>
      )}
    </>
  );
} 