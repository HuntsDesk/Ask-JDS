import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, BookOpen, Search, X } from 'lucide-react';
import { SidebarContext } from '@/App';

interface MobileTopBarProps {
  title: string;
  count?: number | null;
  countLabel?: string;
}

export default function MobileTopBar({ title, count, countLabel }: MobileTopBarProps) {
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isExpanded, setIsExpanded } = useContext(SidebarContext);

  return (
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
          {title}
        </h1>
        {count !== undefined && count !== null && (
          <p className="text-sm text-gray-500 dark:text-gray-300 text-center">
            {count} {countLabel || title.toLowerCase()}
          </p>
        )}
      </div>
      <button
        onClick={() => setIsSearchOpen(true)}
        className="text-gray-600 dark:text-gray-300 flex items-center gap-1 ml-4"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Mobile search overlay - can be implemented later */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsSearchOpen(false)}>
          <div 
            className="absolute top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold dark:text-white">Search</h2>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-gray-600 dark:text-gray-300 p-2 rounded-md"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Search courses, lessons..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 