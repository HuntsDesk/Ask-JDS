import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Plus, Search, BookOpen, Trash2, Filter, Library, Book, Layers, FilterX, X, Loader2 } from 'lucide-react';
import Card from './Card';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import DeleteConfirmation from './DeleteConfirmation';
import useToast from '@/hooks/useFlashcardToast';
import Toast from './Toast';
import useFlashcardAuth from '@/hooks/useFlashcardAuth';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavbar } from '@/contexts/NavbarContext';
import Tooltip from '@/components/flashcards/Tooltip';
import { useFlashcardCollections, useSubjects, flashcardKeys } from '@/hooks/use-query-flashcards';
import { SkeletonFlashcardGrid } from './SkeletonFlashcard';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { usePersistedState } from '@/hooks/use-persisted-state';

// Define skeleton components
const SkeletonCollectionCard = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col animate-pulse ${className}`}>
    <div className="p-6">
      {/* Title placeholder */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
      
      {/* Description placeholder */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
      
      {/* Subject tags placeholder */}
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
      
      {/* Stats placeholder */}
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mt-auto"></div>
    </div>
    
    {/* Footer actions placeholder */}
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

const SkeletonCollectionGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCollectionCard key={index} />
    ))}
  </div>
);

// Define collection keys for query invalidation
const collectionKeys = {
  all: ['collections'] as const
};

interface FlashcardCollection {
  id: string;
  title: string;
  description: string;
  created_at: string;
  card_count?: number;
  is_official?: boolean;
  subject?: {
    id: string;
    name: string;
  } | null;
  mastered_count: number;
}

interface Subject {
  id: string;
  name: string;
}

export default function FlashcardCollections() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const { user } = useFlashcardAuth();
  const { updateTotalCollectionCount, updateCount } = useNavbar();
  const queryClient = useQueryClient();
  
  // UI State
  const [collectionToDelete, setCollectionToDelete] = useState<FlashcardCollection | null>(null);
  const [showFilters, setShowFilters] = usePersistedState<boolean>('collections-show-filters', false);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = usePersistedState<string[]>('collections-filter-subjects', []);
  const [filter, setFilter] = usePersistedState<'all' | 'official' | 'my'>('collections-filter-tab', 'all');
  
  // Fetch subjects separately to have them available immediately
  const { data: subjectsData, isLoading: isLoadingSubjects } = useSubjects({
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Fetch collections using React Query
  const { 
    data: collectionsData,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isFetching
  } = useFlashcardCollections(filter, selectedSubjectIds, {
    staleTime: 30 * 1000, // 30 seconds
    keepPreviousData: true // Keep displaying previous data while fetching new data
  });
  
  // Track when we're waiting for new data after filter change
  const isLoadingFilteredData = isPending || (isFetching && !isFetchingNextPage);
  
  // Process the collection data - updated to handle infinite query pages
  const collections = collectionsData?.pages 
    ? collectionsData.pages.flatMap(page => page.collections || []) 
    : [];
  const totalCount = collectionsData?.pages?.[0]?.totalCount || 0;
  const subjectMap = collectionsData?.pages?.[0]?.subjectMap || {};
  const cardCounts = collectionsData?.pages
    ? collectionsData.pages.reduce((acc, page) => ({ ...acc, ...page.cardCounts }), {})
    : {};
  const masteryData = collectionsData?.pages
    ? collectionsData.pages.reduce((acc, page) => ({ ...acc, ...page.masteryData }), {})
    : {};
  
  // Add debugging logs
  console.log("FlashcardCollections: Query data", { 
    pagesCount: collectionsData?.pages?.length || 0,
    collectionsCount: collections.length,
    hasNextPage,
    totalCount,
    subjectMapSize: Object.keys(subjectMap).length,
    cardCountsSize: Object.keys(cardCounts).length,
    masteryDataSize: Object.keys(masteryData).length
  });
  
  // Debug if some collections are missing
  useEffect(() => {
    if (collections.length > 0 && totalCount > collections.length) {
      console.log(`Collections loaded: ${collections.length}/${totalCount}. HasNextPage: ${hasNextPage}`);
      
      if (!hasNextPage && collections.length < totalCount) {
        console.warn("Warning: hasNextPage is false but we haven't loaded all collections yet");
      }
    }
  }, [collections.length, totalCount, hasNextPage]);
  
  // Prepare data for rendering
  const processedCollections = collections.map(collection => {
    // Get card count for this collection
    const cardCount = cardCounts[collection.id] || 0;
    
    // Get mastery data for this collection
    const mastery = masteryData[collection.id] || { total: 0, mastered: 0 };
    
    // Get subject data for this collection from all pages
    const allSubjectRelationships = collectionsData?.pages
      ? collectionsData.pages.flatMap(page => page.subjectRelationships || [])
      : [];
      
    const collectionSubjects = allSubjectRelationships
      .filter(rel => rel.collection_id === collection.id)
      .map(rel => subjectMap[rel.subject_id])
      .filter(Boolean);
    
    return {
      ...collection,
      card_count: cardCount,
      mastered_count: mastery.mastered,
      subjects: collectionSubjects
    };
  });
  
  // Update both navbar counts using the same data
  useEffect(() => {
    if (!isLoadingFilteredData) {
      // Use totalCount for both navbar displays since this is what's shown in the top text
      updateCount(totalCount);
      updateTotalCollectionCount(totalCount);
    }
  }, [totalCount, updateCount, updateTotalCollectionCount, isLoadingFilteredData]);
  
  // Get all available subjects for the dropdown
  const allSubjects = subjectsData || [];
  
  // Check RLS policies on component mount
  useEffect(() => {
    async function checkRLSPolicies() {
      try {
        // Check directly if we can query the table
        const { data: collections, error: collectionsError } = await supabase
          .from('collections')
          .select('*')
          .limit(5);
          
        if (collectionsError) {
          console.error('Error directly querying collections:', collectionsError);
        } else {
          console.log('Direct collections query successful');
        }
      } catch (err) {
        console.error('Error checking collections:', err);
      }
    }
    
    checkRLSPolicies();
  }, []);
  
  // NEW: Replace the complex ref callback with a simple useRef for infinite scroll
  const observerTarget = useRef(null);
  
  // NEW: Implement the observer in a useEffect, similar to AllFlashcards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log('Loading more collections...');
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Handle collection deletion
  async function handleDeleteCollection() {
    if (!collectionToDelete) return;
    
    try {
      // Get the ID before clearing the state
      const collectionIdToDelete = collectionToDelete.id;
      
      // Optimistically update the UI by filtering out the collection being deleted
      const updatedCollections = collections.filter(c => c.id !== collectionIdToDelete);
      
      // Clear the deletion modal immediately for better UX
      setCollectionToDelete(null);
      
      // First delete entries in the junction tables
      const tasks = [
        supabase
          .from('collection_subjects')
          .delete()
          .eq('collection_id', collectionIdToDelete),
        supabase
          .from('flashcard_collections_junction')
          .delete()
          .eq('collection_id', collectionIdToDelete)
      ];
      
      await Promise.all(tasks);
      
      // Then delete the collection itself
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionIdToDelete)
        .eq('user_id', user.id)
        .eq('is_official', false);
      
      if (error) throw error;
      
      // Invalidate related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: [...flashcardKeys.collections(), filter, selectedSubjectIds] });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.collections() });
      
    } catch (err: any) {
      console.error("Error deleting collection:", err);
      showToast(`Error: ${err.message}`, 'error');
      
      // If there was an error, make sure to refetch to restore correct state
      queryClient.invalidateQueries({ queryKey: [...flashcardKeys.collections(), filter, selectedSubjectIds] });
    }
  }

  // Filter changes
  function handleFilterChange(value: string) {
    const newFilter = value as 'all' | 'official' | 'my';
    setFilter(newFilter);
  }
  
  // Subject filter
  function handleSubjectDropdownChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const subjectId = e.target.value;
    if (!subjectId) return;
    
    // Add to selected subjects if not already added
    if (!selectedSubjectIds.includes(subjectId)) {
      setSelectedSubjectIds([...selectedSubjectIds, subjectId]);
    }
    
    // Reset the select element
    e.target.value = '';
  }
  
  // Remove subject filter
  function removeSubjectFilter(subjectId: string) {
    setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subjectId));
  }
  
  // Clear all subject filters
  function clearSubjectFilters() {
    setSelectedSubjectIds([]);
  }
  
  // Handle search
  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    
    if (searchQuery) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    
    setSearchParams(newParams, { replace: true });
  }
  
  // Listen for the custom filter toggle event from the navbar
  useEffect(() => {
    const handleFilterToggle = (event: any) => {
      if (event.detail && typeof event.detail.isOpen !== 'undefined') {
        setShowFilters(event.detail.isOpen);
      } else {
        setShowFilters(prev => !prev);
      }
    };
    
    window.addEventListener('toggleFilter', handleFilterToggle);
    return () => {
      window.removeEventListener('toggleFilter', handleFilterToggle);
    };
  }, []);
  
  // Render the component
  if (isLoading && collections.length === 0) {
    return (
      <div className="max-w-6xl mx-auto pb-20 md:pb-8 px-4">
        <div className="hidden md:block mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Collections</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Loading collections...
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Filter button skeleton - replaced with the actual button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
                disabled={true}
              >
                <span className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  Filter
                </span>
              </Button>
              
              {/* Tabs skeleton */}
              <Tabs value={filter} onValueChange={handleFilterChange}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
                  <TabsTrigger value="all" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">All</TabsTrigger>
                  <TabsTrigger value="official" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">Official</TabsTrigger>
                  <TabsTrigger value="my" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">My Collections</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Mobile layout - only filter tabs */}
        <div className="md:hidden mb-6">
          <Tabs value={filter} onValueChange={handleFilterChange}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">All</TabsTrigger>
              <TabsTrigger value="official" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">Official</TabsTrigger>
              <TabsTrigger value="my" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">My Collections</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <SkeletonCollectionGrid />
      </div>
    );
  }

  if (isError && error instanceof Error) {
    return (
      <div className="max-w-6xl mx-auto pb-20 md:pb-8 px-4">
        <ErrorMessage message={error.message} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Page title - only visible on desktop */}
      <div className="hidden md:block mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Collections</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedSubjectIds.length > 0 
                ? `${totalCount} ${totalCount === 1 ? 'collection' : 'collections'} (filtered)` 
                : `${totalCount} ${totalCount === 1 ? 'collection' : 'collections'}`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Filter button moved here */}
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? (
                <span className="flex items-center gap-1">
                  <FilterX className="h-4 w-4" />
                  Hide Filters
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  Filter
                </span>
              )}
            </Button>
            
            <Tabs value={filter} onValueChange={handleFilterChange}>
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700 w-[340px]">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">All</TabsTrigger>
                <TabsTrigger value="official" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">Official</TabsTrigger>
                <TabsTrigger value="my" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">My Collections</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Mobile layout - only filter tabs */}
      <div className="md:hidden mb-6">
        <Tabs value={filter} onValueChange={handleFilterChange}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">All</TabsTrigger>
            <TabsTrigger value="official" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">Official</TabsTrigger>
            <TabsTrigger value="my" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">My Collections</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Remove the standalone filter controls since we've moved it to the header */}
      {/* Filter controls - only show on desktop */}
      {/* Remove this section */}

      <DeleteConfirmation
        isOpen={!!collectionToDelete}
        onClose={() => setCollectionToDelete(null)}
        onConfirm={handleDeleteCollection}
        title="Delete Collection"
        message="Are you sure you want to delete this collection? All flashcards in this collection will be removed from it, but they will not be deleted."
        itemName={collectionToDelete?.title}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/70">
          <div className="mb-4 pb-3 border-b dark:border-gray-700 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Subject</label>
            
            {selectedSubjectIds.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                className="ml-auto text-xs dark:border-gray-600 dark:text-gray-300 dark:hover:text-white dark:hover:border-gray-500 dark:bg-gray-800"
                onClick={clearSubjectFilters}
                disabled={isLoadingFilteredData}
              >
                {isLoadingFilteredData ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : null}
                Clear All Filters
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            {/* Subject filter */}
            <div>
              <div className="flex flex-col gap-2">
                <select
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  value=""
                  onChange={handleSubjectDropdownChange}
                  disabled={isLoadingFilteredData || isLoadingSubjects}
                >
                  {isLoadingSubjects ? (
                    <option>Loading subjects...</option>
                  ) : (
                    <>
                      <option value="">Select a subject...</option>
                      {allSubjects.map(subject => (
                        <option 
                          key={subject.id} 
                          value={subject.id}
                          disabled={selectedSubjectIds.includes(subject.id)}
                        >
                          {subject.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                
                {selectedSubjectIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSubjectIds.map(id => {
                      // First check the full subjects list
                      const subject = allSubjects.find(s => s.id === id) || subjectMap[id];
                      return subject && (
                        <span
                          key={id}
                          className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm flex items-center text-gray-800 dark:text-gray-200"
                        >
                          {subject.name}
                          <button 
                            type="button" 
                            onClick={() => removeSubjectFilter(id)}
                            className="ml-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            disabled={isLoadingFilteredData}
                          >
                            {isLoadingFilteredData ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection grid */}
      {isLoadingFilteredData && collections.length === 0 ? (
        <SkeletonCollectionGrid />
      ) : collections.length === 0 ? (
        <EmptyState 
          title="No collections found" 
          description={selectedSubjectIds.length > 0 
            ? "Try removing some subject filters"
            : "Try a different filter or create a new collection"
          }
          icon={<Layers className="h-12 w-12 text-gray-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {processedCollections.map((collection, index) => {
            return (
              <div 
                key={collection.id} 
                className=""
              >
                <Card
                  id={collection.id}
                  title={collection.title}
                  description={collection.description}
                  isOfficial={!!collection.is_official}
                  cardCount={collection.card_count || 0}
                  masteredCount={collection.mastered_count}
                  subjects={collection.subjects}
                  link={`/flashcards/study?collection=${collection.id}`}
                  collectionId={collection.id}
                  onDelete={collection.user_id === user?.id ? () => setCollectionToDelete(collection) : undefined}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* NEW: Observer element for infinite scroll with loading indicator */}
      {hasNextPage && (
        <div 
          ref={observerTarget} 
          className="flex justify-center my-8"
        >
          {isFetchingNextPage ? (
            <LoadingSpinner className="w-8 h-8 text-jdblue" />
          ) : (
            <div className="h-10"></div> /* Spacer for observer */
          )}
        </div>
      )}
    </div>
  );
} 