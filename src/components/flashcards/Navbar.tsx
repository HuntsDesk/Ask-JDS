import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, BookOpen, FileText, Layers, Menu, X, Search, Brain } from 'lucide-react';
import SearchBar from './SearchBar';
import useFlashcardAuth from '@/hooks/useFlashcardAuth';
import { useNavbar } from '@/contexts/NavbarContext';
import { SidebarContext } from '@/App';

export default function Navbar() {
  const { user } = useFlashcardAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { itemCount, totalCollectionCount, totalCardCount } = useNavbar();
  const { isExpanded, setIsExpanded } = useContext(SidebarContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width <= 1024);
      
      // Check for dark mode preference
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(darkModeMediaQuery.matches);
    };
    
    // Check for scroll position
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    // Initial checks
    checkDeviceType();
    handleScroll();
    
    // Add event listeners
    window.addEventListener('resize', checkDeviceType);
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkDeviceType);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Get the current page title and count
  const getPageInfo = () => {
    const path = location.pathname;
    if (path.includes('/flashcards/subjects')) {
      return {
        title: 'Subjects',
        countKey: 'subjectCount'
      };
    } else if (path.includes('/flashcards/collections')) {
      return {
        title: 'Collections',
        countKey: 'collectionCount'
      };
    } else if (path.includes('/flashcards/flashcards')) {
      return {
        title: 'Flashcards',
        countKey: 'flashcardCount'
      };
    } else if (path.includes('/flashcards/unified-study')) {
      return {
        title: 'Study',
        countKey: null
      };
    }
    return {
      title: 'Flashcards',
      countKey: null
    };
  };

  // Get the count based on the current page
  const getCount = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const currentFilter = searchParams.get('filter');
    
    if (path.includes('/flashcards/collections')) {
      // When viewing "all" collections, show total count
      if (!currentFilter || currentFilter === 'all') {
        return totalCollectionCount;
      }
      // For filtered views (my/official), use the itemCount
      return itemCount;
    } else if (path.includes('/flashcards/flashcards')) {
      return totalCardCount;
    }
    return itemCount;
  };

  // Determine create button text and link based on current page
  const getCreateConfig = () => {
    const path = location.pathname;
    
    if (path === '/flashcards/collections' || path.startsWith('/flashcards/collections')) {
      return {
        text: 'New Collection',
        link: '/flashcards/create-collection'
      };
    } else if (path === '/flashcards/subjects' || path.startsWith('/flashcards/subjects/')) {
      return {
        text: 'New Subject',
        link: '/flashcards/create-subject'
      };
    } else if (path === '/flashcards/flashcards') {
      return {
        text: 'New Flashcard',
        link: '/flashcards/create-flashcard'
      };
    } else if (path.includes('/flashcards/study/') || path.startsWith('/flashcards/study')) {
      return {
        text: 'Create Flashcard',
        link: '/flashcards/create-flashcard'
      };
    } else {
      return {
        text: 'Create',
        link: '/flashcards/create-collection'
      };
    }
  };

  const createConfig = getCreateConfig();
  const pageInfo = getPageInfo();
  const count = getCount();

  const NavLink = ({ to, icon, text, className = '' }) => (
    <Link 
      to={to} 
      className={`flex items-center space-x-1 py-2 px-3 rounded-md ${
        (location.pathname === to || 
        (to === '/flashcards/subjects' && location.pathname.includes('/flashcards/subjects/')) ||
        (to === '/flashcards/collections' && (location.pathname === to || location.pathname.includes('/flashcards/study/'))))
          ? 'text-[#F37022]' 
          : 'text-gray-600 dark:text-gray-300'
      } ${className}`}
      onClick={() => setIsMenuOpen(false)}
    >
      {icon}
      <span>{text}</span>
    </Link>
  );

  const MobileNavLink = ({ to, icon, text }) => (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center space-y-1 py-1 ${
        (location.pathname === to || 
        (to === '/flashcards/subjects' && location.pathname.includes('/flashcards/subjects/')) ||
        (to === '/flashcards/collections' && (location.pathname === to || location.pathname.includes('/flashcards/study/'))))
          ? 'text-[#F37022]' 
          : 'text-gray-600 dark:text-gray-300'
      }`}
    >
      {icon}
      <span className="text-xs">{text}</span>
    </Link>
  );

  return (
    <>
      <nav className={`
        bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900 
        fixed top-0 left-0 right-0 z-40 w-full
        top-nav transition-all duration-300
        ${isScrolled ? 'shadow-md' : ''}
        ${isTablet ? 'tablet-navbar' : ''}
      `}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and hamburger menu */}
            <div className="flex items-center">
              {/* Hamburger menu for mobile */}
              {isMobile && (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-600 hover:text-[#F37022] mr-3 focus:outline-none"
                  aria-label="Toggle mobile menu"
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
              
              {/* Hamburger for tablet/desktop to toggle sidebar */}
              {!isMobile && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-600 hover:text-[#F37022] mr-3 focus:outline-none"
                  aria-label="Toggle sidebar"
                >
                  <Menu size={24} />
                </button>
              )}
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <NavLink 
                to="/flashcards/subjects" 
                icon={<BookOpen className="h-5 w-5" />} 
                text="Subjects" 
              />
              <NavLink 
                to="/flashcards/collections" 
                icon={<Layers className="h-5 w-5" />} 
                text="Collections" 
              />
              <NavLink 
                to="/flashcards/flashcards" 
                icon={<FileText className="h-5 w-5" />} 
                text="Flashcards" 
              />
              <NavLink 
                to="/flashcards/unified-study" 
                icon={<Brain className="h-5 w-5" />} 
                text="Study" 
              />
            </div>

            {/* Desktop search */}
            <div className="hidden md:block flex-grow mx-4">
              <SearchBar />
            </div>

            {/* Create button - visible on desktop only */}
            <div className="hidden md:block flex-shrink-0">
              {user && !location.pathname.includes('/flashcards/create') && (
                <Link 
                  to={createConfig.link} 
                  className="flex items-center gap-1 bg-[#F37022] text-white px-3 py-2 text-sm md:text-base md:px-4 rounded-md hover:bg-[#E36012]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{createConfig.text}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <MobileNavLink 
            to="/flashcards/subjects" 
            icon={<BookOpen className="h-5 w-5" />} 
            text="Subjects" 
          />
          <MobileNavLink 
            to="/flashcards/collections" 
            icon={<Layers className="h-5 w-5" />} 
            text="Collections" 
          />
          <MobileNavLink 
            to="/flashcards/flashcards" 
            icon={<FileText className="h-5 w-5" />} 
            text="Flashcards" 
          />
          <MobileNavLink 
            to="/flashcards/unified-study" 
            icon={<Brain className="h-5 w-5" />} 
            text="Study" 
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
            <SearchBar />
          </div>
        </div>
      )}
    </>
  );
} 