import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, BookOpen, FileText, Layers, Menu, X } from 'lucide-react';
import SearchBar from './SearchBar';
import useFlashcardAuth from '@/hooks/useFlashcardAuth';

export default function Navbar() {
  const { user } = useFlashcardAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      className={`flex items-center space-x-1 py-2 ${
        (location.pathname === to || 
        (to === '/flashcards/subjects' && location.pathname.includes('/flashcards/subjects/')) ||
        (to === '/flashcards/collections' && (location.pathname === to || location.pathname.includes('/flashcards/study/'))))
          ? 'text-[#F37022] font-medium' 
          : 'text-gray-600 dark:text-gray-300 hover:text-[#F37022]'
      }`}
      onClick={() => setIsMenuOpen(false)}
    >
      {icon}
      <span>{text}</span>
    </Link>
  );

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900 sticky top-0 z-10 w-full">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              className="text-gray-600 dark:text-gray-300 hover:text-[#F37022] focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
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
              icon={<Layers className="h-5 w-5" />} 
              text="Study" 
            />
          </div>

          {/* Desktop search */}
          <div className="hidden md:block flex-grow mx-4">
            <SearchBar />
          </div>

          {/* Create button - visible on both desktop and mobile */}
          <div className="flex-shrink-0">
            {user && !location.pathname.includes('/flashcards/create') && (
              <Link 
                to={createConfig.link} 
                className="flex items-center gap-1 bg-[#F37022] text-white px-3 py-2 text-sm md:text-base md:px-4 rounded-md hover:bg-[#E36012]"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden xs:inline">{createConfig.text}</span>
              </Link>
            )}
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        {isMenuOpen && (
          <div className="md:hidden py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-1 pt-2 pb-3">
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
        
        {/* Mobile search bar, always visible when menu is closed */}
        <div className="md:hidden pb-3">
          <SearchBar />
        </div>
      </div>
    </nav>
  );
} 