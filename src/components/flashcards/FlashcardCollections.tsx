import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Plus, Search, BookOpen, Trash2, Filter, Library, Book, Layers, FilterX, X } from 'lucide-react';
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
  
  const [collections, setCollections] = useState<FlashcardCollection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<FlashcardCollection | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'official' | 'my'>('all');

  // Pagination state for infinite scrolling
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCollectionCount, setTotalCollectionCount] = useState(0);
  const ITEMS_PER_PAGE = 20;
  
  // Improved intersection observer setup
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCardRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) {
      console.log('Skipping observer attachment - currently loading');
      return;
    }
    
    if (!hasMore) {
      console.log('Skipping observer attachment - no more data to load');
      return;
    }
    
    // Disconnect previous observer
    if (observerRef.current) {
      console.log('Disconnecting previous observer');
      observerRef.current.disconnect();
    }
    
    // Create new observer
    observerRef.current = new IntersectionObserver(entries => {
      console.log('Intersection observer triggered', entries[0]?.isIntersecting);
      // If the last card is visible and we have more cards to load
      if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
        console.log('Last card is visible, loading more collections...');
        setPage(prevPage => {
          console.log(`Incrementing page from ${prevPage} to ${prevPage + 1}`);
          return prevPage + 1;
        });
      }
    }, {
      rootMargin: '200px', // Load more cards when we're 200px from the bottom
      threshold: 0.1 // Trigger when at least 10% of the element is visible
    });
    
    // Observe the last card
    if (node) {
      console.log('Attaching observer to last card node');
      observerRef.current.observe(node);
    } else {
      console.log('No node to observe');
    }
  }, [loadingMore, hasMore]);

  // Add showFilters state at the top of the component with the other state variables
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    // Reset pagination when filter changes
    setPage(1);
    setHasMore(true);
    
    // Get filter from URL if present
    const filterParam = searchParams.get('filter');
    let currentFilter: 'all' | 'official' | 'my' = 'all';
    
    if (filterParam && ['all', 'official', 'my'].includes(filterParam)) {
      currentFilter = filterParam as 'all' | 'official' | 'my';
      setFilter(currentFilter);
    }
    
    // Get subjects from URL if present
    const subjectParams = searchParams.getAll('subject');
    if (subjectParams.length > 0) {
      setSelectedSubjectIds(subjectParams);
    } else {
      setSelectedSubjectIds([]);
    }
    
    // Load collections with the current filters
    loadCollections(currentFilter);
    
    // Load subjects in parallel if not already loaded
    if (subjects.length === 0) {
      loadSubjects().catch(err => {
        console.error("Error loading subjects:", err);
      });
    }
  }, [searchParams]);

  // Add a new effect to handle filter changes
  useEffect(() => {
    if (selectedSubjectIds.length > 0 || filter !== 'all') {
      loadCollections();
    }
  }, [selectedSubjectIds, filter]);

  // Load more collections when page changes
  useEffect(() => {
    if (page > 1) {
      loadMoreCollections();
    }
  }, [page]);

  async function loadCollections(currentFilter?: 'all' | 'official' | 'my') {
    try {
      // Only show loading spinner on initial load, not filter changes
      const isInitialLoad = collections.length === 0;
      if (isInitialLoad) {
        setLoading(true);
      }
      
      // Use the provided filter or fall back to the state filter
      const filterToUse = currentFilter || filter;
      console.log(`Loading collections with filter: ${filterToUse}`);
      
      // Get subject filter from URL or state
      const subjectIds = selectedSubjectIds;
      console.log(`Subject filters: ${subjectIds.join(', ') || 'none'}`);
      
      // Build base query for collections count
      let countQuery = supabase.from('collections').select('id', { count: 'exact' });
      
      // Apply tab filters to count query
      if (filterToUse === 'official') {
        countQuery = countQuery.eq('is_official', true);
      } else if (filterToUse === 'my' && user) {
        countQuery = countQuery.eq('user_id', user.id);
      }
      
      // If there are subject filters, get all collection IDs for these subjects first
      let collectionIds: string[] = [];
      if (subjectIds.length > 0) {
        console.log(`Getting collection IDs for subjects: ${subjectIds.join(', ')}`);
        const { data: collectionSubjects, error: junctionError } = await supabase
          .from('collection_subjects')
          .select('collection_id')
          .in('subject_id', subjectIds);
          
        if (junctionError) {
          console.error("Error fetching collections for subjects:", junctionError);
          throw junctionError;
        }
        
        if (collectionSubjects && collectionSubjects.length > 0) {
          collectionIds = [...new Set(collectionSubjects.map(cs => cs.collection_id))];
          console.log(`Found ${collectionIds.length} collections for subjects ${subjectIds.join(', ')}`);
          
          // Apply collection IDs to count query
          countQuery = countQuery.in('id', collectionIds);
        } else {
          console.log(`No collections found for subjects ${subjectIds.join(', ')}`);
          setCollections([]);
          setHasMore(false);
          setLoading(false);
          setTotalCollectionCount(0);
          updateCount(0);
          return;
        }
      }
      
      // Get total count with all filters applied
      const { count: totalFilteredCount, error: countError } = await countQuery;
      
      if (countError) {
        console.error("Error getting collection count:", countError);
        throw countError;
      }
      
      console.log(`Total filtered count: ${totalFilteredCount}`);
      
      // Update the collection count
      setTotalCollectionCount(totalFilteredCount || 0);
      updateCount(totalFilteredCount || 0);
      
      // Now get collections with pagination
      let query = supabase
        .from('collections')
        .select(`
          id,
          title,
          description,
          created_at,
          is_official,
          user_id
        `)
        .order('created_at', { ascending: false })
        .range(0, ITEMS_PER_PAGE - 1);
      
      // Apply tab filters
      if (filterToUse === 'official') {
        query = query.eq('is_official', true);
      } else if (filterToUse === 'my' && user) {
        query = query.eq('user_id', user.id);
      }
      
      // Apply subject filter if we have collection IDs
      if (subjectIds.length > 0) {
        query = query.in('id', collectionIds);
      }
      
      // Execute the query
      const { data: collectionsData, error: collectionsError } = await query;
      
      if (collectionsError) {
        console.error("Error fetching collections:", collectionsError);
        throw collectionsError;
      }
      
      console.log(`Fetched ${collectionsData?.length || 0} collections`);
      
      let filteredCollections = collectionsData || [];
      
      // Get subjects for each collection using the junction table
      const collectionsWithSubjects = await Promise.all(
        filteredCollections.map(async (collection) => {
          // Get subject IDs from the junction table
          const { data: collectionSubjects, error: subjectsError } = await supabase
            .from('collection_subjects')
            .select('subject_id')
            .eq('collection_id', collection.id)
            .limit(1); // Just get one subject for display purposes
            
          if (subjectsError) throw subjectsError;
          
          let subject = null;
          
          // If the collection has subjects, get the first one's details
          if (collectionSubjects && collectionSubjects.length > 0) {
            const { data: subjectData, error: subjectError } = await supabase
              .from('subjects')
              .select('id, name')
              .eq('id', collectionSubjects[0].subject_id)
              .single();
              
            if (subjectError) throw subjectError;
            subject = subjectData;
          }
          
          // Get card counts from the flashcard_collections_junction table
          const { data: flashcardCollections, error: fcError } = await supabase
            .from('flashcard_collections_junction')
            .select('flashcard_id')
            .eq('collection_id', collection.id);
            
          if (fcError) throw fcError;
          
          const totalCount = flashcardCollections?.length || 0;
          
          // Count mastered cards by checking progress records
          let masteredCount = 0;
          if (totalCount > 0 && user) {
            const flashcardIds = flashcardCollections.map(fc => fc.flashcard_id);
            
            // Get mastered count
            const { count, error: masteredError } = await supabase
              .from('flashcard_progress')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .in('flashcard_id', flashcardIds)
              .eq('is_mastered', true);
              
            if (masteredError) throw masteredError;
            masteredCount = count || 0;
          }
          
          return {
            ...collection,
            subject: subject,
            card_count: totalCount,
            mastered_count: masteredCount
          };
        })
      );
      
      setCollections(collectionsWithSubjects);
      setError(null);
    } catch (err: any) {
      console.error("Error loading collections:", err);
      setError(err.message || "An error occurred loading collections");
    } finally {
      setLoading(false);
    }
  }

  // Function to load more collections (for infinite scrolling)
  async function loadMoreCollections() {
    if (!hasMore || loadingMore) {
      return;
    }
    
    console.log(`Loading more collections for page ${page}`);
    setLoadingMore(true);
    
    // Calculate the range for the next page
    // Supabase ranges are zero-indexed and inclusive of both ends
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;
    
    console.log(`Loading more collections: range ${startIndex}-${endIndex}`);
    
    try {
      // Apply tab filters - use the current filter from state
      const currentFilter = filter;
      
      // Get subject filter from URL or state
      const subjectIds = selectedSubjectIds;
      
      // First, get collections with pagination
      let query = supabase
        .from('collections')
        .select(`
          id,
          title,
          description,
          created_at,
          is_official,
          user_id
        `)
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);
      
      // Apply tab filters
      if (currentFilter === 'official') {
        query = query.eq('is_official', true);
      } else if (currentFilter === 'my' && user) {
        query = query.eq('user_id', user.id);
      }
      
      // Apply subject filter if present
      if (subjectIds.length > 0) {
        // Get collection IDs for these subjects from the junction table
        const { data: collectionSubjects, error: junctionError } = await supabase
          .from('collection_subjects')
          .select('collection_id')
          .in('subject_id', subjectIds);
          
        if (junctionError) {
          console.error("Error fetching more collections for subjects:", junctionError);
          throw junctionError;
        }
        
        // Filter collections by the IDs we got from the junction table
        if (collectionSubjects && collectionSubjects.length > 0) {
          const collectionIds = collectionSubjects.map(cs => cs.collection_id);
          // Apply filter directly in the query
          query = query.in('id', collectionIds);
          console.log(`Applied subject filter for ${collectionIds.length} collections`);
        } else {
          // No more collections for these subjects
          console.log(`No more collections for subjects ${subjectIds.join(', ')}`);
          setHasMore(false);
          setLoadingMore(false);
          return;
        }
      }
      
      // Execute the query
      const { data: collectionsData, error: collectionsError } = await query;
      
      if (collectionsError) throw collectionsError;
      
      console.log(`Received ${collectionsData?.length || 0} more collections from server`);
      
      if (!collectionsData || collectionsData.length === 0) {
        console.log('No more collections returned, setting hasMore to false');
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      // Get subjects for each collection using the junction table
      const collectionsWithSubjects = await Promise.all(
        collectionsData.map(async (collection) => {
          // Get subject IDs from the junction table
          const { data: collectionSubjects, error: subjectsError } = await supabase
            .from('collection_subjects')
            .select('subject_id')
            .eq('collection_id', collection.id)
            .limit(1); // Just get one subject for display purposes
            
          if (subjectsError) throw subjectsError;
          
          let subject = null;
          
          // If the collection has subjects, get the first one's details
          if (collectionSubjects && collectionSubjects.length > 0) {
            const { data: subjectData, error: subjectError } = await supabase
              .from('subjects')
              .select('id, name')
              .eq('id', collectionSubjects[0].subject_id)
              .single();
              
            if (subjectError) throw subjectError;
            subject = subjectData;
          }
          
          // Get card counts from the flashcard_collections_junction table
          const { data: flashcardCollections, error: fcError } = await supabase
            .from('flashcard_collections_junction')
            .select('flashcard_id')
            .eq('collection_id', collection.id);
            
          if (fcError) throw fcError;
          
          const totalCount = flashcardCollections?.length || 0;
          
          // Count mastered cards by checking progress records
          let masteredCount = 0;
          if (totalCount > 0 && user) {
            const flashcardIds = flashcardCollections.map(fc => fc.flashcard_id);
            
            // Get mastered count
            const { count, error: masteredError } = await supabase
              .from('flashcard_progress')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .in('flashcard_id', flashcardIds)
              .eq('is_mastered', true);
              
            if (masteredError) throw masteredError;
            masteredCount = count || 0;
          }
          
          return {
            ...collection,
            subject: subject,
            card_count: totalCount,
            mastered_count: masteredCount
          };
        })
      );
      
      // Update hasMore flag - if we got fewer collections than requested, there are no more
      const mightHaveMore = collectionsWithSubjects.length === ITEMS_PER_PAGE;
      console.log(`Setting hasMore to ${mightHaveMore} (got ${collectionsWithSubjects.length} collections)`);
      setHasMore(mightHaveMore);
      
      // Append new collections to existing collections
      setCollections(prevCollections => {
        const newCollections = [...prevCollections, ...collectionsWithSubjects];
        console.log(`Now showing ${newCollections.length} collections out of ${totalCollectionCount}`);
        return newCollections;
      });
    } catch (err: any) {
      console.error("Error loading more collections:", err);
      // Don't set error state to avoid disrupting the UI
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setSubjects(data || []);
    } catch (err: any) {
      console.error('Error loading subjects:', err);
    }
  }

  async function handleDeleteCollection() {
    if (!collectionToDelete) return;
    
    try {
      // First delete entries in the flashcard_collections junction table
      const { error: junctionError } = await supabase
        .from('flashcard_collections_junction')
        .delete()
        .eq('collection_id', collectionToDelete.id);
      
      if (junctionError) throw junctionError;
      
      // Delete entries in the collection_subjects junction table
      const { error: subjectsError } = await supabase
        .from('collection_subjects')
        .delete()
        .eq('collection_id', collectionToDelete.id);
      
      if (subjectsError) throw subjectsError;
      
      // Then delete the collection itself
      const { error: collectionError } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionToDelete.id);
      
      if (collectionError) throw collectionError;
      
      // Update state
      setCollections(collections.filter(c => c.id !== collectionToDelete.id));
      setCollectionToDelete(null);
      showToast('Collection deleted successfully!', 'success');
    } catch (err: any) {
      console.error('Error deleting collection:', err);
      showToast(`Error deleting collection: ${err.message}`, 'error');
    }
  }

  function handleSubjectFilter(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value && !selectedSubjectIds.includes(value)) {
      setSelectedSubjectIds(prev => {
        const newSubjects = [...prev, value];
        // Update URL parameters
        const params = new URLSearchParams(searchParams.toString());
        params.delete('subject'); // Remove all existing subject parameters
        newSubjects.forEach(id => {
          params.append('subject', id);
        });
        setSearchParams(params);
        return newSubjects;
      });
    }
  }

  const removeSubject = (id: string) => {
    setSelectedSubjectIds(prev => {
      const newSubjects = prev.filter(subId => subId !== id);
      // Update URL parameters
      const params = new URLSearchParams(searchParams.toString());
      params.delete('subject'); // Remove all existing subject parameters
      newSubjects.forEach(subId => {
        params.append('subject', subId);
      });
      setSearchParams(params);
      return newSubjects;
    });
  };

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // This would be implemented with a proper search in a real app
    // For now, we'll just filter the collections client-side
  }

  // This function needs to run after filter changes to update counts correctly
  function handleFilterChange(value: string) {
    if (['all', 'official', 'my'].includes(value)) {
      // Reset pagination when filter changes
      setPage(1);
      setHasMore(true);
      setCollections([]);
      
      const newFilter = value as 'all' | 'official' | 'my';
      setFilter(newFilter);
      
      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set('filter', newFilter);
      setSearchParams(params);
      
      // Get counts first before loading collections
      updateCountsForCurrentFilter(newFilter).then(() => {
        // Pass the new filter directly to loadCollections
        loadCollections(newFilter);
      });
    }
  }
  
  // Separate function to update counts based on filter
  async function updateCountsForCurrentFilter(currentFilter: 'all' | 'official' | 'my') {
    try {
      // First, get the total count of ALL collections for the navbar
      const { count: totalCount } = await supabase
        .from('collections')
        .select('id', { count: 'exact' });
      
      // Always update the total collection count in the navbar
      updateTotalCollectionCount(totalCount || 0);
      
      // Now get the filtered count
      let filteredQuery = supabase.from('collections').select('id', { count: 'exact' });
      
      if (currentFilter === 'official') {
        filteredQuery = filteredQuery.eq('is_official', true);
      } else if (currentFilter === 'my' && user) {
        filteredQuery = filteredQuery.eq('user_id', user.id);
      }
      
      const { count: filteredCount } = await filteredQuery;
      
      // Check if there's a subject filter applied
      const subjectIds = selectedSubjectIds;
      if (subjectIds.length > 0) {
        // Get collections for these subjects
        const { data: collectionSubjects } = await supabase
          .from('collection_subjects')
          .select('collection_id')
          .in('subject_id', subjectIds);
          
        if (collectionSubjects && collectionSubjects.length > 0) {
          const collectionIds = collectionSubjects.map(cs => cs.collection_id);
          
          // Get filtered collections that also belong to these subjects
          let subjectFilteredQuery = supabase
            .from('collections')
            .select('id', { count: 'exact' })
            .in('id', collectionIds);
            
          if (currentFilter === 'official') {
            subjectFilteredQuery = subjectFilteredQuery.eq('is_official', true);
          } else if (currentFilter === 'my' && user) {
            subjectFilteredQuery = subjectFilteredQuery.eq('user_id', user.id);
          }
          
          const { count: subjectFilteredCount } = await subjectFilteredQuery;
          
          // Update the local state with subject-filtered count
          setTotalCollectionCount(subjectFilteredCount || 0);
          
          // Update the item count in the navbar
          updateCount(subjectFilteredCount || 0);
          
          return { totalCount, filteredCount: subjectFilteredCount || 0 };
        } else {
          // No collections for these subjects
          setTotalCollectionCount(0);
          updateCount(0);
          return { totalCount, filteredCount: 0 };
        }
      }
      
      // If no subject filter, update with the filtered count
      // Update the local state with filtered count
      setTotalCollectionCount(filteredCount || 0);
      
      // Update the item count in the navbar
      updateCount(filteredCount || 0);
      
      return { totalCount, filteredCount };
    } catch (error) {
      console.error("Error updating counts:", error);
      return { totalCount: 0, filteredCount: 0 };
    }
  }

  // Filter collections based on search query and filter type
  const filteredCollections = collections.filter(collection => {
    const matchesSearch = searchQuery 
      ? collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (collection.description && collection.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    
    // Apply filter type
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'official' ? collection.is_official :
      filter === 'my' ? !collection.is_official :
      true;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-8 px-4">
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

      {/* Desktop header with title and count - hidden on mobile */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Collections</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {totalCollectionCount} {totalCollectionCount === 1 ? 'collection' : 'collections'}
            </p>
          </div>
          
          {/* Filter controls - desktop */}
          <div className="flex items-center gap-3">
            <Tooltip text={showFilters ? "Hide filters" : "Show filters"} position="top">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F37022] dark:focus:ring-offset-gray-800"
              >
                {showFilters ? <FilterX className="mr-2 h-4 w-4" /> : <Filter className="mr-2 h-4 w-4" />}
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </Tooltip>
          </div>
        </div>
        
        <div className="w-[340px]">
          <Tabs value={filter} onValueChange={handleFilterChange}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="official"
                className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400"
              >
                Premium
              </TabsTrigger>
              <TabsTrigger 
                value="my"
                className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400"
              >
                My Collections
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Mobile tabs - only shown on mobile */}
      <div className="md:hidden w-full mb-6">
        <Tabs value={filter} onValueChange={handleFilterChange}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="official"
              className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400"
            >
              Premium
            </TabsTrigger>
            <TabsTrigger 
              value="my"
              className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400"
            >
              My Collections
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile filter control */}
      <div className="md:hidden mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex w-full items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F37022] dark:focus:ring-offset-gray-800"
        >
          {showFilters ? <FilterX className="mr-2 h-4 w-4" /> : <Filter className="mr-2 h-4 w-4" />}
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 dark:border dark:border-gray-700">
          <div className="grid md:grid-cols-1 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filter by Subject
                </label>
              </div>
              <select
                id="subject-filter"
                value=""
                onChange={handleSubjectFilter}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022] dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="">Select subjects...</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {selectedSubjectIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSubjectIds.map(id => {
                    const subject = subjects.find(s => s.id === id);
                    return subject && (
                      <div key={id} className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md flex items-center">
                        <span className="text-sm dark:text-gray-200">{subject.name}</span>
                        <button 
                          type="button" 
                          onClick={() => removeSubject(id)}
                          className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collections grid */}
      <div>
        {filteredCollections.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Layers className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No collections found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {filter === 'my' 
                ? "You haven't created any collections yet. Create your first collection using the New Collection button."
                : filter === 'official'
                ? "No official collections available for this filter."
                : "No collections found. Try adjusting your filters or create a new collection."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCollections.map((collection, index) => {
              // Determine if this is the last item for observer attachment
              const isLastItem = index === filteredCollections.length - 1;
              
              return (
                <div
                  key={collection.id}
                  ref={isLastItem ? lastCardRef : null}
                >
                  <Card
                    id={collection.id}
                    title={collection.title}
                    description={collection.description || ''}
                    tag={collection.subject ? collection.subject.name : ''}
                    isOfficial={collection.is_official || false}
                    count={collection.card_count || 0}
                    masteredCount={collection.mastered_count || 0}
                    onDelete={!collection.is_official || (user && user.user_metadata?.admin) ? () => setCollectionToDelete(collection) : undefined}
                    collectionId={collection.id}
                    subjectId={collection.subject ? collection.subject.id : ''}
                  />
                </div>
              );
            })}
            
            {/* Loading indicator for infinite scroll */}
            {loadingMore && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-4 flex justify-center">
                <LoadingSpinner />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 