import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, BookOpen, FileText, Layers, Menu, X, Search } from 'lucide-react';
import SearchBar from './SearchBar';
import useFlashcardAuth from '@/hooks/useFlashcardAuth';

export default function Navbar() {
  const { user } = useFlashcardAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get current page title
  const getCurrentPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/subjects')) return 'Subjects';
    if (path.includes('/collections')) return 'Collections';
    if (path.includes('/flashcards')) return 'Flashcards';
    if (path.includes('/unified-study')) return 'Study';
    return 'Flashcards';
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

  const NavLink = ({ to, icon, text }) => (
    <Link 
      to={to} 
      className={`flex items-center space-x-1 py-2 px-3 rounded-md ${
        (location.pathname === to || 
        (to === '/flashcards/subjects' && location.pathname.includes('/flashcards/subjects/')) ||
        (to === '/flashcards/collections' && (location.pathname === to || location.pathname.includes('/flashcards/study/'))))
          ? 'text-white bg-[#F37022] font-medium' 
          : 'text-gray-600 dark:text-gray-300 hover:text-[#F37022] hover:bg-gray-100'
      }`}
      onClick={() => setIsMenuOpen(false)}
    >
      {icon}
      <span>{text}</span>
    </Link>
  );

  const MobileNavLink = ({ to, icon, text }) => (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center px-2 py-1 ${
        (location.pathname === to || 
        (to === '/flashcards/subjects' && location.pathname.includes('/flashcards/subjects/')) ||
        (to === '/flashcards/collections' && (location.pathname === to || location.pathname.includes('/flashcards/study/'))))
          ? 'text-[#F37022]' 
          : 'text-gray-600'
      }`}
      onClick={() => setIsMenuOpen(false)}
    >
      {icon}
      <span className="text-xs mt-1">{text}</span>
    </Link>
  );

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900 sticky top-0 z-20 w-full">
      <div className="max-w-6xl mx-auto px-4">
        {/* Mobile header */}
        {isMobile && (
          <>
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center">
                <button
                  className="text-gray-600 dark:text-gray-300 hover:text-[#F37022] focus:outline-none p-2 rounded-md"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
                <h1 className="ml-2 text-lg font-semibold">{getCurrentPageTitle()}</h1>
              </div>
              <Link
                to={createConfig.link}
                className="flex items-center space-x-1 bg-[#F37022] text-white px-3 py-1.5 rounded-md text-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{createConfig.text}</span>
              </Link>
            </div>

            {/* Mobile navigation bar */}
            <div className="border-t border-gray-100">
              <div className="flex justify-between items-center py-2">
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
                  icon={<Layers className="h-5 w-5" />} 
                  text="Study" 
                />
              </div>
              <div className="py-2 border-t border-gray-100">
                <SearchBar />
              </div>
            </div>
          </>
        )}

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
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
              icon={<Layers className="h-5 w-5" />} 
              text="Study" 
            />
          </div>

          {/* Desktop search */}
          <div className="flex-grow mx-4">
            <SearchBar />
          </div>

          {/* Desktop create button */}
          <div>
            <Link
              to={createConfig.link}
              className="flex items-center space-x-1 bg-[#F37022] text-white px-4 py-2 rounded-md"
            >
              <PlusCircle className="h-5 w-5" />
              <span>{createConfig.text}</span>
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobile && isMenuOpen && (
          <div className="border-t border-gray-100">
            <div className="flex flex-col space-y-3 py-4">
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
                icon={<Layers className="h-5 w-5" />} 
                text="Study" 
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 