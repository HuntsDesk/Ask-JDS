import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, BookOpen, FileText, Layers, Menu, X, Search, Brain, Filter, Shuffle } from 'lucide-react';
import SearchBar from './SearchBar';
import useFlashcardAuth from '@/hooks/useFlashcardAuth';
import { useNavbar } from '@/contexts/NavbarContext';
import { SidebarContext } from '@/App';
import { useLayoutState } from '@/hooks/useLayoutState';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { user } = useFlashcardAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { itemCount, totalCollectionCount, totalCardCount, currentCardIndex } = useNavbar();
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
    } else if (path.includes('/flashcards/study')) {
      return {
        title: 'Study Mode',
        countKey: 'studyCount'
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
    
    if (path.includes('/flashcards/collections')) {
      // Always use the totalCollectionCount for the navbar title count
      return totalCollectionCount;
    } else if (path.includes('/flashcards/flashcards')) {
      // Always use the totalCardCount for the navbar title count
      return totalCardCount;
    }
    
    // For other pages, use the itemCount
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
        text: 'New Flashcard',
        link: '/flashcards/create-flashcard'
      };
    } else {
      return {
        text: 'New Collection',
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
                  {pageInfo.title}
                </h1>
                {pageInfo.countKey && (
                  <p className="text-sm text-gray-500 dark:text-gray-300 text-center">
                    {location.pathname.includes('/flashcards/study') && itemCount > 0 ? (
                      <>{currentCardIndex + 1} of {itemCount} flashcards</>
                    ) : (
                      <>{count} {pageInfo.title.toLowerCase()}</>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {/* Add shuffle button for study mode */}
                {location.pathname.includes('/flashcards/study') && (
                  <button
                    onClick={() => {
                      // Trigger a custom event for shuffle that components can listen for
                      const event = new CustomEvent('shuffleCards');
                      window.dispatchEvent(event);
                    }}
                    className="text-gray-600 dark:text-gray-300 flex items-center justify-center p-2"
                    aria-label="Shuffle Cards"
                  >
                    <Shuffle className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    // Trigger a custom event that filter components can listen for
                    const event = new CustomEvent('toggleFilter', { detail: { isOpen: !isFilterOpen } });
                    window.dispatchEvent(event);
                    setIsFilterOpen(!isFilterOpen);
                  }}
                  className={`text-gray-600 dark:text-gray-300 flex items-center justify-center p-2 ${
                    location.pathname.includes('/flashcards/subjects') ? 'hidden' : ''
                  }`}
                  aria-label="Filter"
                >
                  <Filter className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="text-gray-600 dark:text-gray-300 flex items-center justify-center p-2"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Desktop layout container - Grid layout only applies at md breakpoint and above */}
            <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:w-full md:gap-4">
              {/* Navigation links */}
              <div className="md:flex md:items-center md:space-x-2 lg:space-x-4 xl:space-x-5">
                <NavLink 
                  to="/flashcards/study" 
                  icon={<Brain className="h-5 w-5" />} 
                  text="Study" 
                  className="text-base md:mr-2 lg:mr-3 xl:mr-4"
                />
                <NavLink 
                  to="/flashcards/subjects" 
                  icon={<BookOpen className="h-5 w-5" />} 
                  text="Subjects" 
                  className="text-base md:mr-2 lg:mr-3 xl:mr-4"
                />
                <NavLink 
                  to="/flashcards/collections" 
                  icon={<Layers className="h-5 w-5" />} 
                  text="Collections" 
                  className="text-base md:mr-2 lg:mr-3 xl:mr-4"
                />
                <NavLink 
                  to="/flashcards/flashcards" 
                  icon={<FileText className="h-5 w-5" />} 
                  text="Flashcards" 
                  className="text-base md:flex"
                />
              </div>
              
              {/* Middle flexible space */}
              <div className="md:flex-1"></div>
              
              {/* Action items container - grid layout for search and button */}
              <div className="md:grid md:grid-cols-[minmax(40px,1fr)_auto] md:items-center md:gap-3">
                {/* Desktop search */}
                <div className="md:w-full">
                  <SearchBar />
                </div>
                
                {/* Create button - square in minimized state */}
                <div>
                  {user && !location.pathname.includes('/flashcards/create') && (
                    <Link 
                      to={createConfig.link} 
                      className="md:flex md:items-center md:justify-center bg-[#F37022] text-white rounded-md hover:bg-[#E36012] whitespace-nowrap h-10 md:w-10 md:aspect-square lg:aspect-auto lg:w-auto lg:px-3 transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <PlusCircle className="h-5 w-5" />
                      <span className="hidden lg:inline ml-1">{createConfig.text}</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          <MobileNavLink 
            to="/flashcards/study" 
            icon={<Brain className="h-5 w-5" />} 
            text="Study" 
          />
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
          <Link
            to={createConfig.link}
            className="flex flex-col items-center justify-center space-y-1 py-1 text-[#F37022]"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="text-xs">New</span>
          </Link>
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-600 dark:text-gray-300 p-2 rounded-md"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="w-full">
              <SearchBar 
                isMobileOverlay={true} 
                onSearchResultClick={() => setIsMenuOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 