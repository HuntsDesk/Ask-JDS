import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Layers, BookOpen, FileText, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  id: string;
  title: string;
  type: 'collection' | 'subject' | 'card';
  subtitle?: string;
  collection_id?: string;
  description?: string;
}

export default function SearchBar() {
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
      // Search collections
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select(`
          id,
          title,
          subjects (name)
        `)
        .ilike('title', `%${query}%`)
        .limit(5);

      if (collectionsError) throw collectionsError;

      // Search subjects
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, description')
        .ilike('name', `%${query}%`)
        .limit(5);

      if (subjectsError) throw subjectsError;

      // Search flashcards
      const { data: cards, error: cardsError } = await supabase
        .from('flashcards')
        .select(`
          id,
          question,
          collections (
            id, 
            title
          )
        `)
        .or(`question.ilike.%${query}%, answer.ilike.%${query}%`)
        .limit(10);

      if (cardsError) throw cardsError;

      // Format results
      const formattedResults: SearchResult[] = [
        ...(collections || []).map((collection) => {
          // Extract the first subject name if available
          const subjectName = collection.subjects && 
                             Array.isArray(collection.subjects) && 
                             collection.subjects.length > 0 ? 
                             collection.subjects[0].name : 'No Subject';
                             
          return {
            id: collection.id,
            title: collection.title,
            subtitle: subjectName,
            type: 'collection'
          };
        }),
        ...subjects.map((subject): SearchResult => ({
          id: subject.id,
          title: subject.name,
          subtitle: subject.description || 'Subject',
          type: 'subject'
        })),
        ...(cards || []).map((card): SearchResult => {
          // Get the first collection if available
          const collection = card.collections && 
                            Array.isArray(card.collections) && 
                            card.collections.length > 0 ? 
                            card.collections[0] : null;
                            
          return {
            id: card.id,
            title: card.question,
            subtitle: collection ? `In: ${collection.title}` : 'No Collection',
            type: 'card',
            collection_id: collection?.id
          };
        })
      ];

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
    
    switch (result.type) {
      case 'collection':
        navigate(`/flashcards/study?collection=${result.id}`);
        break;
      case 'subject':
        navigate(`/flashcards/subjects/${result.id}`);
        break;
      case 'card':
        navigate(`/flashcards/study?collection=${result.collection_id}`);
        break;
    }
  };

  const handleViewAllResults = () => {
    navigate(`/flashcards/search?q=${encodeURIComponent(query)}`);
    setShowResults(false);
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative md:flex md:justify-end">
        {/* Search container with transition */}
        <div className={`md:flex md:items-center md:transition-all md:duration-200 md:ease-in-out h-10 
          md:border md:border-gray-300 md:dark:border-gray-600 md:rounded-md md:shadow-sm md:dark:bg-gray-700
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
            placeholder="Search collections, subjects, cards..."
            className={`hidden md:block flex-grow py-0 pl-10 border-none shadow-none text-gray-500 
              dark:text-gray-300 focus:outline-none focus:ring-0 text-sm bg-transparent 
              placeholder:text-gray-400 dark:placeholder:text-gray-500 text-ellipsis overflow-hidden 
              whitespace-nowrap min-w-0 h-10 ${isExpanded ? 'md:opacity-100' : 'md:opacity-0 lg:opacity-100'}`}
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
        <div className="absolute top-full right-0 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg overflow-hidden z-50 md:w-64 md:min-w-[180px] lg:w-full">
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
                    {result.type === 'collection' && (
                      <Layers className="h-4 w-4 text-[#F37022] mr-2" />
                    )}
                    {result.type === 'subject' && (
                      <BookOpen className="h-4 w-4 text-[#F37022] mr-2" />
                    )}
                    {result.type === 'card' && (
                      <FileText className="h-4 w-4 text-[#F37022] mr-2" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{result.subtitle}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div 
                className="px-4 py-3 text-center text-sm text-blue-600 dark:text-blue-400 font-medium border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={handleViewAllResults}
              >
                View all results
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
} 