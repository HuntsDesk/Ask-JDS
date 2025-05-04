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
import { useFlashcardCollections, useSubjects } from '@/hooks/use-query-flashcards';
import { SkeletonFlashcardGrid } from './SkeletonFlashcard';
import { Button } from '@/components/ui/button';

// Import the skeleton component for collections
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
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCollectionCard key={index} />
    ))}
  </div>
);

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
  
  // UI State
  const [collectionToDelete, setCollectionToDelete] = useState<FlashcardCollection | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isFilteringSubjects, setIsFilteringSubjects] = useState<boolean>(false);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'official' | 'my'>('all');
  
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
  
  // Update count in navbar when total changes
  useEffect(() => {
    updateCount(totalCount);
  }, [totalCount, updateCount]);
  
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
  
  // Handle URL parameters for filters
  useEffect(() => {
    // Get filter from URL if present
    const filterParam = searchParams.get('filter');
    if (filterParam && ['all', 'official', 'my'].includes(filterParam)) {
      setFilter(filterParam as 'all' | 'official' | 'my');
    }
    
    // Get subjects from URL if present
    const subjectParams = searchParams.getAll('subject');
    if (subjectParams.length > 0) {
      setSelectedSubjectIds(subjectParams);
    }
  }, [searchParams]);
  
  // Load more collections when user scrolls to bottom
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCardRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingNextPage) {
      console.log('Skipping observer setup - loading in progress:', isLoading, isFetchingNextPage);
      return;
    }
    
    if (!hasNextPage && collections.length >= totalCount) {
      console.log('Skipping observer setup - all collections loaded');
      return;
    }
    
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Create new observer
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        if (hasNextPage || collections.length < totalCount) {
          console.log('Last card intersecting, fetching next page');
          fetchNextPage();
        }
      }
    }, {
      rootMargin: '300px', // Increased margin to trigger earlier
      threshold: 0.1
    });
    
    // Observe the last card
    if (node) {
      console.log('Setting up observer on last card');
      observerRef.current.observe(node);
    }
  }, [isLoading, isFetchingNextPage, hasNextPage, collections.length, totalCount, fetchNextPage]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Force a refetch if we're missing data but hasNextPage is false
  useEffect(() => {
    if (collections.length > 0 && totalCount > collections.length && !hasNextPage && !isLoading && !isFetchingNextPage) {
      console.log(`Collections loaded: ${collections.length}/${totalCount}. HasNextPage: ${hasNextPage}`);
      console.warn("Warning: hasNextPage is false but we haven't loaded all collections yet");
      
      // Force a refetch if we have less than 50% of the total
      if (collections.length < totalCount * 0.5) {
        console.log(`Forcing next page fetch - only have ${collections.length}/${totalCount} collections`);
        fetchNextPage();
      }
    }
  }, [collections.length, totalCount, hasNextPage, isLoading, isFetchingNextPage, fetchNextPage]);

  // Handle collection deletion
  async function handleDeleteCollection() {
    if (!collectionToDelete) return;
    
    try {
      // First delete entries in the junction tables
      const tasks = [
        supabase
          .from('collection_subjects')
          .delete()
          .eq('collection_id', collectionToDelete.id),
        supabase
        .from('flashcard_collections_junction')
        .delete()
          .eq('collection_id', collectionToDelete.id)
      ];
      
      await Promise.all(tasks);
      
      // Then delete the collection itself
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionToDelete.id)
        .eq('user_id', user.id); // Safety check
      
      if (error) throw error;
      
      showToast('Collection deleted successfully', 'success');
      setCollectionToDelete(null);
      
      // Invalidate the query to refresh the data
      // This will happen automatically in React Query
    } catch (err: any) {
      showToast(`Error deleting collection: ${err.message}`, 'error');
    }
  }

  // Filter changes
  function handleFilterChange(value: string) {
    const newFilter = value as 'all' | 'official' | 'my';
    setFilter(newFilter);
      
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.set('filter', newFilter);
    setSearchParams(newParams, { replace: true });
  }
  
  // Subject filter
  function handleSubjectDropdownChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const subjectId = e.target.value;
    if (!subjectId) return;
    
    // Add to selected subjects if not already added
    if (!selectedSubjectIds.includes(subjectId)) {
      setIsFilteringSubjects(true);
      const newSubjectIds = [...selectedSubjectIds, subjectId];
      setSelectedSubjectIds(newSubjectIds);
      
      // Update URL params without causing a navigation/refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('subject');
      newSubjectIds.forEach(id => newParams.append('subject', id));
      setSearchParams(newParams, { replace: true });
    }
  }
  
  // Remove subject filter
  function removeSubjectFilter(subjectId: string) {
    setIsFilteringSubjects(true);
    const newSubjectIds = selectedSubjectIds.filter(id => id !== subjectId);
    setSelectedSubjectIds(newSubjectIds);
    
    // Update URL params without causing a navigation/refresh
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('subject');
    newSubjectIds.forEach(id => newParams.append('subject', id));
    setSearchParams(newParams, { replace: true });
  }
  
  // Clear all subject filters
  function clearSubjectFilters() {
    setIsFilteringSubjects(true);
    setSelectedSubjectIds([]);
    
    // Update URL params without causing a navigation/refresh
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('subject');
    setSearchParams(newParams, { replace: true });
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
  
  // Reset the filtering state when data is loaded
  useEffect(() => {
    if (!isFetching && isFilteringSubjects) {
      setIsFilteringSubjects(false);
    }
  }, [isFetching, isFilteringSubjects]);
  
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
  
  // Get all available subjects for the dropdown
  const allSubjects = subjectsData || [];
  
  // Render the component
  if (isLoading && collections.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Collections</h1>
            <p className="text-gray-600 dark:text-gray-400">Loading collections...</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 text-gray-700 dark:text-gray-300 dark:hover:text-white dark:border-gray-600 dark:hover:border-gray-500"
              disabled
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            
            <Tabs value={filter} onValueChange={handleFilterChange} className="w-[340px]">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">All</TabsTrigger>
                <TabsTrigger value="official" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">Premium</TabsTrigger>
                <TabsTrigger value="my" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">My Collections</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <SkeletonCollectionGrid />
      </div>
    );
  }

  if (isError && error instanceof Error) {
    return (
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <ErrorMessage message={error.message} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-10">
      <DeleteConfirmation
        isOpen={!!collectionToDelete}
        onClose={() => setCollectionToDelete(null)}
        onConfirm={handleDeleteCollection}
        title="Delete Collection"
        message="Are you sure you want to delete this collection? This action cannot be undone."
        itemName={collectionToDelete?.title}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Collections</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isLoadingFilteredData ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Filtering collections...
                </span>
              ) : (
                `${totalCount} ${totalCount === 1 ? 'collection' : 'collections'}`
              )}
            </p>
          </div>
          
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white dark:border-gray-600 dark:hover:border-gray-500 dark:bg-gray-800"
            onClick={() => setShowFilters(!showFilters)}
            disabled={isLoadingFilteredData}
          >
            {isLoadingFilteredData ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : showFilters ? (
              <FilterX className="h-4 w-4" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
            {showFilters ? 'Hide Filters' : 'Filter'}
          </Button>
          
          <Tabs value={filter} onValueChange={handleFilterChange} className="w-[340px]">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">All</TabsTrigger>
              <TabsTrigger value="official" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">Premium</TabsTrigger>
              <TabsTrigger value="my" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">My Collections</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium dark:text-gray-200">Filter by Subject</h3>
            
            {selectedSubjectIds.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:text-white dark:hover:border-gray-500 dark:bg-gray-800"
                onClick={clearSubjectFilters}
                disabled={isLoadingFilteredData}
              >
                {isLoadingFilteredData ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : null}
                Clear All
              </Button>
            )}
              </div>
          
          <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200"
                    >
                      {subject.name}
                        <button 
                          type="button" 
                          onClick={() => removeSubjectFilter(id)}
                          className="ml-1 focus:outline-none"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedCollections.map((collection, index) => {
            // Add ref to last item for infinite scroll
            const isLastItem = index === processedCollections.length - 1;
            
            if (isLastItem) {
              console.log(`Rendering last item (index ${index}) with id ${collection.id}`);
            }
            
            return (
              <div 
                key={collection.id} 
                ref={isLastItem ? lastCardRef : null}
                className={`${isLastItem ? 'last-card' : ''}`}
                data-testid={isLastItem ? 'last-collection-card' : undefined}
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

      {/* Loading indicator for pagination */}
      {(isLoading || isFetchingNextPage) && collections.length > 0 && (
        <div className="flex flex-col items-center my-8 gap-2">
          <LoadingSpinner className="w-8 h-8 text-jdblue" />
          <span className="text-gray-600 dark:text-gray-400">
            Loading collections... ({collections.length}/{totalCount})
          </span>
        </div>
      )}
    </div>
  );
} 