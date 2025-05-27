import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  id: string;
  title: string;
  type: 'course';
  subtitle?: string;
  description?: string;
}

interface SearchBarProps {
  isMobileOverlay?: boolean;
  onSearchResultClick?: () => void;
}

export default function CourseSearchBar({ isMobileOverlay = false, onSearchResultClick }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(isMobileOverlay);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  useEffect(() => {
    if (isMobileOverlay && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isMobileOverlay]);

  const performSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      // Search courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          overview,
          tile_description,
          what_youll_learn,
          status
        `)
        .or(`title.ilike.%${query}%,overview.ilike.%${query}%,tile_description.ilike.%${query}%`)
        .eq('status', 'Published')
        .limit(8);

      if (coursesError) throw coursesError;

      // Format results
      const formattedResults: SearchResult[] = (courses || []).map((course) => ({
        id: course.id,
        title: course.title,
        subtitle: course.tile_description || course.overview?.substring(0, 100) + '...' || 'Course',
        type: 'course',
        description: course.tile_description
      }));

      setResults(formattedResults);
    } catch (error) {
      console.error('Course search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery('');
    
    if (isMobileOverlay && onSearchResultClick) {
      setTimeout(() => {
        navigate(`/course/${result.id}`);
      }, 50);
      onSearchResultClick();
    } else {
    navigate(`/course/${result.id}`);
    }
  };

  const handleViewAllResults = () => {
    setShowResults(false);
    
    if (isMobileOverlay && onSearchResultClick) {
      setTimeout(() => {
        navigate(`/courses/search?q=${encodeURIComponent(query)}`);
      }, 50);
      onSearchResultClick();
    } else {
      navigate(`/courses/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative md:flex md:justify-end">
        {/* Search container with transition */}
        <div className={`flex items-center transition-all duration-200 ease-in-out h-10 
          border border-gray-300 rounded-md shadow-sm 
          focus-within:ring-1 focus-within:ring-[#F37022] focus-within:border-[#F37022]
          dark:border-gray-600 dark:bg-gray-700 w-full
          md:transition-all md:duration-200 md:ease-in-out
          ${isExpanded || isMobileOverlay ? 'md:w-[300px]' : 'md:w-10'}
          lg:w-full md:aspect-square lg:aspect-auto`}>
          
          {/* Search icon - always visible */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-300" />
          </div>
          
          {/* For md screens: clickable search icon that expands on click - NOT SHOWN IN MOBILE OVERLAY */}
          {!isMobileOverlay && (
          <button 
              className="hidden md:block lg:hidden absolute inset-0 flex items-center justify-center z-20"
            onClick={() => {
              setIsExpanded(true);
              setShowResults(true);
            }}
          >
            <span className="sr-only">Search</span>
          </button>
          )}
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => {
              setShowResults(true);
              setIsExpanded(true);
            }}
            onBlur={() => {
              if (!query && !isMobileOverlay) {
                setIsExpanded(false);
              }
            }}
            placeholder="Search courses..."
            className="block flex-grow pl-10 pr-3 py-2 border-none shadow-none text-gray-500 
              focus:outline-none focus:ring-0 text-sm bg-transparent text-ellipsis overflow-hidden 
              whitespace-nowrap min-w-0 h-10 w-full dark:text-gray-300 dark:placeholder-gray-400 dark:caret-white
              md:flex-grow z-30"
          />
          
          {query && (
            <button
              className="flex items-center justify-center h-full px-3 text-gray-400 hover:text-gray-500 bg-transparent z-30"
              onClick={() => {
                setQuery('');
                setResults([]);
                
                if (isMobileOverlay && inputRef.current) {
                  inputRef.current.focus();
                }
              }}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {showResults && query.length >= 2 && (
        <div className="absolute top-full right-0 left-0 md:right-0 md:left-auto w-full md:w-64 md:min-w-[180px] lg:w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg overflow-hidden z-50">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#F37022] mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-80 overflow-auto">
              {results.map((result) => (
                <div 
                  key={`${result.type}-${result.id}`}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mr-2">
                      <BookOpen className="h-4 w-4 text-[#F37022]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {results.length >= 5 && (
                <div className="border-t border-gray-200 dark:border-gray-600">
                  <button
                    className="w-full px-4 py-2 text-sm text-[#F37022] hover:bg-gray-100 dark:hover:bg-gray-700 text-center"
                  onClick={handleViewAllResults}
                >
                  View all results
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              No courses found
            </div>
          )}
        </div>
      )}
    </div>
  );
} 