import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
}

export default function CourseSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

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

  const performSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      // Search courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, tile_description, overview')
        .or(`title.ilike.%${query}%, overview.ilike.%${query}%, tile_description.ilike.%${query}%`)
        .limit(10);

      if (coursesError) throw coursesError;

      // Format results
      const formattedResults: SearchResult[] = (courses || []).map((course) => ({
        id: course.id,
        title: course.title,
        description: course.tile_description || course.overview || ''
      }));

      setResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery('');
    navigate(`/course/${result.id}`);
  };

  const handleViewAllResults = () => {
    navigate(`/courses/search?q=${encodeURIComponent(query)}`);
    setShowResults(false);
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative md:flex md:justify-end">
        {/* Search container with transition */}
        <div className={`md:flex md:items-center md:transition-all md:duration-200 md:ease-in-out h-10 
          md:border md:border-gray-300 md:rounded-md md:shadow-sm 
          md:focus-within:ring-1 md:focus-within:ring-[#F37022] md:focus-within:border-[#F37022]
          ${isExpanded ? 'md:w-[300px]' : 'md:w-10'}
          lg:w-full md:aspect-square lg:aspect-auto`}>
          
          {/* Search icon - always visible */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          
          {/* For md screens: clickable search icon that expands on click */}
          <button 
            className="md:block lg:hidden absolute inset-0 flex items-center justify-center z-20"
            onClick={() => {
              setIsExpanded(true);
              setShowResults(true);
            }}
          >
            <span className="sr-only">Search</span>
          </button>
          
          <input
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
              if (!query) {
                setIsExpanded(false);
              }
            }}
            placeholder="Search courses..."
            className={`hidden md:block md:flex-grow md:py-0 md:pl-10 md:border-none md:shadow-none md:text-gray-500 
              md:focus:outline-none md:focus:ring-0 md:text-sm md:bg-transparent md:text-ellipsis md:overflow-hidden 
              md:whitespace-nowrap md:min-w-0 md:h-10 ${isExpanded ? 'md:opacity-100' : 'md:opacity-0 lg:opacity-100'}`}
          />
          
          {query && (
            <button
              className="md:flex md:items-center md:justify-center md:h-full md:px-3 md:text-gray-400 md:hover:text-gray-500 md:bg-transparent"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {showResults && query.length >= 2 && (
        <div className="md:absolute md:top-full md:right-0 md:w-64 md:min-w-[180px] lg:w-full md:mt-1 md:bg-white md:border md:border-gray-300 md:rounded-md md:shadow-lg md:overflow-hidden md:z-50">
          {isSearching ? (
            <div className="md:p-4 md:text-center md:text-gray-500">
              <div className="md:animate-spin md:rounded-full md:h-5 md:w-5 md:border-t-2 md:border-b-2 md:border-[#F37022] md:mx-auto md:mb-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="md:max-h-80 md:overflow-auto">
              {results.map((result) => (
                <div 
                  key={result.id}
                  className="md:px-4 md:py-2 md:hover:bg-gray-100 md:cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="md:flex md:items-center">
                    <BookOpen className="md:h-4 md:w-4 md:text-[#F37022] md:mr-2" />
                    <div>
                      <div className="md:font-medium md:text-gray-900">{result.title}</div>
                      {result.description && (
                        <div className="md:text-xs md:text-gray-500 md:truncate">{result.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {results.length > 0 && (
                <div 
                  className="md:px-4 md:py-2 md:bg-gray-50 md:text-center md:cursor-pointer md:hover:bg-gray-100 md:text-[#F37022] md:text-sm"
                  onClick={handleViewAllResults}
                >
                  View all results
                </div>
              )}
            </div>
          ) : (
            <div className="md:p-4 md:text-center md:text-gray-500">
              No courses found
            </div>
          )}
        </div>
      )}
    </div>
  );
} 