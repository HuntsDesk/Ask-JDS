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
  
  // Add a ref to track the current request
  const requestIdRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  
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

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        console.log('Cleaning up intersection observer on unmount');
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Reset observer when collections change
  useEffect(() => {
    // We need to manually disconnect and reconnect the observer when collections change
    // to ensure the last card is properly observed
    if (observerRef.current) {
      observerRef.current.disconnect();
      
      // Check if there's a "last card" element to observe
      const lastCardElement = document.querySelector('.last-card-ref');
      if (lastCardElement && hasMore && !loadingMore) {
        console.log('Reconnecting observer to last card after collection change');
        observerRef.current.observe(lastCardElement);
      }
    }
  }, [collections, hasMore, loadingMore]);

  // Add showFilters state at the top of the component with the other state variables
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Add a loading state ref at the top of the component
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const isInitialLoadRef = useRef(true);

  // Consolidated effect for URL parameters and filter changes
  useEffect(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      console.log('Cancelling previous request');
      abortControllerRef.current.abort();
    }
    
    // Create a new request ID
    const requestId = Date.now().toString();
    requestIdRef.current = requestId;
    
    // Reset pagination when filter changes
    setPage(0);
    setHasMore(true);
    
    // Get filter from URL if present
    const filterParam = searchParams.get('filter');
    let currentFilter: 'all' | 'official' | 'my' = 'all';
    
    if (filterParam && ['all', 'official', 'my'].includes(filterParam)) {
      currentFilter = filterParam as 'all' | 'official' | 'my';
      if (currentFilter !== filter) {
        setFilter(currentFilter);
        // Don't load collections here, let the filter state change trigger it
        return;
      }
    }
    
    // Get subjects from URL if present
    const subjectParams = searchParams.getAll('subject');
    const subjectIdsChanged = 
      subjectParams.length !== selectedSubjectIds.length || 
      subjectParams.some(id => !selectedSubjectIds.includes(id));
    
    if (subjectIdsChanged) {
      setSelectedSubjectIds(subjectParams);
      // Don't load collections here, let the state change trigger it
      return;
    }
    
    // Load collections with the current filters
    loadCollections();
    
    // Load subjects in parallel if not already loaded
    if (subjects.length === 0) {
      loadSubjects().catch(err => {
        console.error("Error loading subjects:", err);
      });
    }
  }, [searchParams]);

  // Modify the filter change effect to prevent race conditions
  useEffect(() => {
    console.log(`Filter changed to: ${filter}, subjects: ${selectedSubjectIds.join(',')}`);
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      console.log('Cancelling previous request due to filter change');
      abortControllerRef.current.abort();
    }
    
    // Create a new request ID
    const requestId = Date.now().toString();
    requestIdRef.current = requestId;
    
    // Reset all pagination and collection state
    setCollections([]);
    setPage(0);
    setHasMore(true);
    setInitialLoadComplete(false);
    isInitialLoadRef.current = true;
    
    // Always reload collections when filters change
    loadCollections();
    
    // Update the URL params to match the current filters
    const newParams = new URLSearchParams(searchParams);
    
    // Update filter param
    if (filter !== 'all') {
      newParams.set('filter', filter);
    } else {
      newParams.delete('filter');
    }
    
    // Update subject params
    newParams.delete('subject');
    selectedSubjectIds.forEach(id => {
      newParams.append('subject', id);
    });
    
    // Only update URL if params actually changed
    const currentParamsString = searchParams.toString();
    const newParamsString = newParams.toString();
    if (currentParamsString !== newParamsString) {
      setSearchParams(newParams);
    }
  }, [filter, selectedSubjectIds, setSearchParams, searchParams]);

  // Add additional logging to the useEffect hook for page changes
  useEffect(() => {
    console.log(`Page changed to ${page}, initialLoadComplete: ${initialLoadComplete}`);
    
    // Only load more if we're past page 0 AND initial load is complete
    if (page > 0 && initialLoadComplete) {
      console.log(`Loading more collections for page ${page} - initial load is complete`);
      loadMoreCollections();
    } else if (page > 0) {
      console.log(`Skipping loadMore - page is ${page} but initial load is not complete yet`);
    }
  }, [page, initialLoadComplete]);

  async function loadCollections() {
    // Create a new abort controller for this request
    const abortController = new AbortController();
    const previousController = abortControllerRef.current;
    
    // If there's a previous request in progress, abort it
    if (previousController) {
      console.log('Aborting previous collection request');
      previousController.abort();
    }
    
    abortControllerRef.current = abortController;
    
    // Generate a unique ID for this request
    const requestId = Date.now().toString();
    console.log(`Starting new collection request: ${requestId}, isInitialLoad: ${isInitialLoadRef.current}`);
    requestIdRef.current = requestId;
    
    // Only show loading spinner on initial load
    if (isInitialLoadRef.current) {
      setLoading(true);
      console.log('Initial load started - showing full page spinner');
    } else {
      setLoadingMore(true);
      console.log('Non-initial load - showing inline spinner');
    }
    setError(null);
    
    try {
      // Check if this request has been superseded
      if (requestIdRef.current !== requestId) {
        console.log(`Request ${requestId} has been superseded, aborting`);
        return;
      }
      
      // Apply tab filters from state
      const currentFilter = filter;
      console.log(`Loading collections with filter: ${currentFilter}`);
      
      // Get subject filter from URL or state
      const subjectIds = selectedSubjectIds;
      
      // Build queries
      let countQuery = supabase
        .from('collections')
        .select('*', { count: 'exact', head: true });
      
      // Apply tab filters to the count query
      if (currentFilter === 'official') {
        countQuery = countQuery.eq('is_official', true);
      } else if (currentFilter === 'my' && user) {
        countQuery = countQuery.eq('user_id', user.id);
      }
      
      // Apply subject filter to the count query if present
      let filteredCollectionIds: string[] = [];
      
      if (subjectIds.length > 0) {
        console.log(`Filtering by subjects: ${subjectIds.join(', ')}`);
        
        // Get collection IDs that match these subjects
        const { data: collectionSubjects, error: junctionError } = await supabase
          .from('collection_subjects')
          .select('collection_id')
          .in('subject_id', subjectIds);
        
        if (junctionError) {
          console.error("Error fetching collections for subjects:", junctionError);
          throw junctionError;
        }
        
        // Check if request is still valid
        if (requestIdRef.current !== requestId || abortController.signal.aborted) {
          console.log(`Request ${requestId} aborted during subject filter query`);
          return;
        }
        
        if (collectionSubjects && collectionSubjects.length > 0) {
          filteredCollectionIds = [...new Set(collectionSubjects.map(cs => cs.collection_id))];
          console.log(`Found ${filteredCollectionIds.length} collections for these subjects`);
          
          // Apply filter to count query
          countQuery = countQuery.in('id', filteredCollectionIds);
        } else {
          console.log(`No collections found for subjects ${subjectIds.join(', ')}`);
          if (requestIdRef.current === requestId && !abortController.signal.aborted) {
            setTotalCollectionCount(0);
            setCollections([]);
            setHasMore(false);
            setLoading(false);
            setLoadingMore(false);
            updateCount(0);
          }
          return;
        }
      }
      
      // Get total count with filters applied
      const { count, error: countError } = await countQuery;
      
      // Check if request is still valid after count query
      if (requestIdRef.current !== requestId || abortController.signal.aborted) {
        console.log(`Request ${requestId} aborted after count query`);
        return;
      }
      
      if (countError) throw countError;
      
      console.log(`Total filtered collections count: ${count || 0}`);
      
      // Update counts immediately, even if we return early
      if (requestIdRef.current === requestId && !abortController.signal.aborted) {
        const totalCount = count || 0;
        setTotalCollectionCount(totalCount);
        updateCount(totalCount);
        
        // Log the totalCollectionCount to verify it's set
        console.log(`Setting totalCollectionCount to ${totalCount}`);
        
        // No results? Return early but mark as complete to avoid stuck loading state
        if (totalCount === 0) {
          console.log('No collections found, setting empty state');
          setCollections([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          setInitialLoadComplete(true);
          isInitialLoadRef.current = false;
          return;
        }
      }
      
      // Fetch collections with pagination
      // Subabase ranges start at 0 and are inclusive for start and end
      const startIndex = 0;
      const endIndex = ITEMS_PER_PAGE - 1;
      
      // Base query for fetching collections
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
      if (subjectIds.length > 0 && filteredCollectionIds.length > 0) {
        query = query.in('id', filteredCollectionIds);
      }
      
      // Execute the query
      const { data: collectionsData, error: collectionsError } = await query;
      
      // Check if request is still valid after collections query
      if (requestIdRef.current !== requestId || abortController.signal.aborted) {
        console.log(`Request ${requestId} aborted after collections query`);
        return;
      }
      
      if (collectionsError) throw collectionsError;
      
      console.log(`Received ${collectionsData?.length || 0} collections from server`);
      
      if (!collectionsData || collectionsData.length === 0) {
        if (requestIdRef.current === requestId && !abortController.signal.aborted) {
          setCollections([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
        }
        return;
      }
      
      // Extract all collection IDs for batch queries
      const fetchedCollectionIds = collectionsData.map(collection => collection.id);
      
      // BATCH QUERY 1: Get all subject relationships for these collections at once
      const { data: allCollectionSubjects, error: allSubjectsError } = await supabase
        .from('collection_subjects')
        .select('collection_id, subject_id')
        .in('collection_id', fetchedCollectionIds);
        
      // Check if request is still valid
      if (requestIdRef.current !== requestId || abortController.signal.aborted) {
        console.log(`Request ${requestId} aborted after subjects relationship query`);
        return;
      }
        
      if (allSubjectsError) throw allSubjectsError;
      
      // Create a lookup map for collection -> subject_id
      const collectionToSubjectMap = new Map();
      allCollectionSubjects?.forEach(cs => {
        // Just store the first subject for each collection for display purposes
        if (!collectionToSubjectMap.has(cs.collection_id)) {
          collectionToSubjectMap.set(cs.collection_id, cs.subject_id);
        }
      });
      
      // BATCH QUERY 2: Get all subjects data at once
      const relatedSubjectIds = [...new Set(allCollectionSubjects?.map(cs => cs.subject_id) || [])];
      let subjectsMap = new Map();
      
      if (relatedSubjectIds.length > 0) {
        const { data: subjectsData, error: subjectsQueryError } = await supabase
          .from('subjects')
          .select('id, name')
          .in('id', relatedSubjectIds);
          
        // Check if request is still valid
        if (requestIdRef.current !== requestId || abortController.signal.aborted) {
          console.log(`Request ${requestId} aborted after subjects data query`);
          return;
        }
          
        if (subjectsQueryError) throw subjectsQueryError;
        
        // Create a lookup map for subjects
        subjectsMap = new Map(subjectsData?.map(s => [s.id, s]) || []);
      }
      
      // BATCH QUERY 3: Get flashcard counts for all collections at once
      const { data: allFlashcardCollections, error: fcError } = await supabase
        .from('flashcard_collections_junction')
        .select('collection_id, flashcard_id')
        .in('collection_id', fetchedCollectionIds);
        
      // Check if request is still valid
      if (requestIdRef.current !== requestId || abortController.signal.aborted) {
        console.log(`Request ${requestId} aborted after flashcard collections query`);
        return;
      }
        
      if (fcError) throw fcError;
      
      // Create a map of collection -> flashcardIds arrays
      const collectionToFlashcardsMap = new Map();
      allFlashcardCollections?.forEach(fc => {
        if (!collectionToFlashcardsMap.has(fc.collection_id)) {
          collectionToFlashcardsMap.set(fc.collection_id, []);
        }
        collectionToFlashcardsMap.get(fc.collection_id).push(fc.flashcard_id);
      });
      
      // Count the total cards for each collection
      const collectionCardCountMap = new Map();
      for (const [collectionId, flashcardIds] of collectionToFlashcardsMap.entries()) {
        collectionCardCountMap.set(collectionId, flashcardIds.length);
      }
      
      // BATCH QUERY: Get progress data for all relevant flashcards if user is logged in
      let progressMap = new Map();
      
      if (user) {
        // Get all flashcard IDs from all collections
        const allFlashcardIds = Array.from(collectionToFlashcardsMap.values()).flat();
        
        if (allFlashcardIds.length > 0) {
          const { data: progressData, error: progressError } = await supabase
            .from('flashcard_progress')
            .select('flashcard_id, is_mastered')
            .eq('user_id', user.id)
            .eq('is_mastered', true)
            .in('flashcard_id', allFlashcardIds);
            
          // Check if request is still valid
          if (requestIdRef.current !== requestId || abortController.signal.aborted) {
            console.log(`Request ${requestId} aborted after progress query`);
            return;
          }
            
          if (!progressError && progressData) {
            // Group progress data by flashcard
            progressData.forEach(p => {
              progressMap.set(p.flashcard_id, p);
            });
          }
        }
      }
      
      // Calculate mastered count for each collection
      const collectionMasteredCountMap = new Map();
      for (const [collectionId, flashcardIds] of collectionToFlashcardsMap.entries()) {
        const masteredCount = flashcardIds.filter(id => progressMap.has(id)).length;
        collectionMasteredCountMap.set(collectionId, masteredCount);
      }
      
      // Combine all the data to create the final collection objects
      const collectionsWithSubjects = collectionsData.map(collection => {
        const subjectId = collectionToSubjectMap.get(collection.id);
        const subject = subjectId ? subjectsMap.get(subjectId) : null;
        const cardCount = collectionCardCountMap.get(collection.id) || 0;
        const masteredCount = collectionMasteredCountMap.get(collection.id) || 0;
        
        return {
          ...collection,
          subject,
          card_count: cardCount,
          mastered_count: masteredCount
        };
      });
      
      // Update hasMore flag - if we got fewer collections than requested, there are no more
      const mightHaveMore = collectionsWithSubjects.length === ITEMS_PER_PAGE;
      console.log(`Setting hasMore to ${mightHaveMore} (got ${collectionsWithSubjects.length} collections)`);
      
      // At the end, update the state if our request is still valid
      if (requestIdRef.current === requestId && !abortController.signal.aborted) {
        setHasMore(mightHaveMore);
        setCollections(collectionsWithSubjects);
        console.log(`Now showing ${collectionsWithSubjects.length} collections out of ${count}`);
        
        // Mark initial load as complete
        setInitialLoadComplete(true);
        isInitialLoadRef.current = false;
      }
    } catch (err: any) {
      // Only update error state if this is still the current request
      if (requestIdRef.current === requestId && !abortController.signal.aborted) {
        console.error("Error loading collections:", err);
        setError(err.message || "Failed to load collections");
        // Still mark as complete on error to prevent stuck loading state
        setInitialLoadComplete(true);
        isInitialLoadRef.current = false;
      }
    } finally {
      // Only update loading state if this is still the current request
      if (requestIdRef.current === requestId && !abortController.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  // Function to load more collections (for infinite scrolling)
  async function loadMoreCollections() {
    if (!hasMore || loadingMore) {
      console.log('Skipping loadMoreCollections - hasMore or already loading');
      return;
    }
    
    console.log(`Loading more collections for page ${page}`);
    setLoadingMore(true);
    
    // Create a new abort controller for this request
    const abortController = new AbortController();
    const previousController = abortControllerRef.current;
    
    // If there's a previous request in progress, abort it
    if (previousController) {
      console.log('Aborting previous loadMoreCollections request');
      previousController.abort();
    }
    
    abortControllerRef.current = abortController;
    
    // Generate a unique ID for this request
    const requestId = Date.now().toString();
    requestIdRef.current = requestId;
    
    // Calculate the range for the next page
    // Supabase ranges are zero-indexed and inclusive of both ends
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;
    
    console.log(`Loading more collections: range ${startIndex}-${endIndex}`);
    
    try {
      // Check if this request has been superseded
      if (requestIdRef.current !== requestId || abortController.signal.aborted) {
        console.log(`Request ${requestId} has been superseded or aborted, stopping`);
        return;
      }
      
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
        
        // Check if our request is still valid
        if (requestIdRef.current !== requestId || abortController.signal.aborted) {
          console.log(`Request ${requestId} aborted during subject filter query for loadMore`);
          return;
        }
        
        // Filter collections by the IDs we got from the junction table
        if (collectionSubjects && collectionSubjects.length > 0) {
          const collectionIds = [...new Set(collectionSubjects.map(cs => cs.collection_id))];
          // Apply filter directly in the query
          query = query.in('id', collectionIds);
          console.log(`Applied subject filter for ${collectionIds.length} collections`);
        } else {
          // No more collections for these subjects
          console.log(`No more collections for subjects ${subjectIds.join(', ')}`);
          if (requestIdRef.current === requestId && !abortController.signal.aborted) {
            setHasMore(false);
            setLoadingMore(false);
          }
          return;
        }
      }
      
      // Execute the query
      const { data: collectionsData, error: collectionsError } = await query;
      
      // Check if our request is still valid
      if (requestIdRef.current !== requestId || abortController.signal.aborted) {
        console.log(`Request ${requestId} aborted after collections query for loadMore`);
        return;
      }
      
      if (collectionsError) throw collectionsError;
      
      console.log(`Received ${collectionsData?.length || 0} more collections from server`);
      
      if (!collectionsData || collectionsData.length === 0) {
        console.log('No more collections returned, setting hasMore to false');
        if (requestIdRef.current === requestId && !abortController.signal.aborted) {
          setHasMore(false);
          setLoadingMore(false);
        }
        return;
      }
      
      // Process the fetched collections just like in loadCollections
      const fetchedCollectionIds = collectionsData.map(collection => collection.id);
      
      // BATCH QUERY 1: Get all subject relationships for these collections at once
      const { data: allCollectionSubjects, error: allSubjectsError } = await supabase
        .from('collection_subjects')
        .select('collection_id, subject_id')
        .in('collection_id', fetchedCollectionIds);
        
      // Check if our request is still valid
      if (requestIdRef.current !== requestId || abortController.signal.aborted) {
        console.log(`Request ${requestId} aborted after subjects relationship query for loadMore`);
        return;
      }
        
      if (allSubjectsError) throw allSubjectsError;
      
      // Create a lookup map for collection -> subject_id
      const collectionToSubjectMap = new Map();
      allCollectionSubjects?.forEach(cs => {
        // Just store the first subject for each collection for display purposes
        if (!collectionToSubjectMap.has(cs.collection_id)) {
          collectionToSubjectMap.set(cs.collection_id, cs.subject_id);
        }
      });
      
      // BATCH QUERY 2: Get all subjects data at once
      const relatedSubjectIds = [...new Set(allCollectionSubjects?.map(cs => cs.subject_id) || [])];
      let subjectsMap = new Map();
      
      if (relatedSubjectIds.length > 0) {
        const { data: subjectsData, error: subjectsQueryError } = await supabase
          .from('subjects')
          .select('id, name')
          .in('id', relatedSubjectIds);
          
        // Check if our request is still valid
        if (requestIdRef.current !== requestId || abortController.signal.aborted) {
          console.log(`Request ${requestId} aborted after subjects data query for loadMore`);
          return;
        }
          
        if (subjectsQueryError) throw subjectsQueryError;
        
        // Create a lookup map for subjects
        subjectsMap = new Map(subjectsData?.map(s => [s.id, s]) || []);
      }
      
      // BATCH QUERY 3: Get flashcard counts for all collections at once
      const { data: allFlashcardCollections, error: fcError } = await supabase
        .from('flashcard_collections_junction')
        .select('collection_id, flashcard_id')
        .in('collection_id', fetchedCollectionIds);
        
      // Check if our request is still valid
      if (requestIdRef.current !== requestId || abortController.signal.aborted) {
        console.log(`Request ${requestId} aborted after flashcard collections query for loadMore`);
        return;
      }
        
      if (fcError) throw fcError;
      
      // Create a map of collection -> flashcardIds arrays
      const collectionToFlashcardsMap = new Map();
      allFlashcardCollections?.forEach(fc => {
        if (!collectionToFlashcardsMap.has(fc.collection_id)) {
          collectionToFlashcardsMap.set(fc.collection_id, []);
        }
        collectionToFlashcardsMap.get(fc.collection_id).push(fc.flashcard_id);
      });
      
      // Count the total cards for each collection
      const collectionCardCountMap = new Map();
      for (const [collectionId, flashcardIds] of collectionToFlashcardsMap.entries()) {
        collectionCardCountMap.set(collectionId, flashcardIds.length);
      }
      
      // BATCH QUERY: Get progress data for all relevant flashcards if user is logged in
      let progressMap = new Map();
      
      if (user) {
        // Get all flashcard IDs from all collections
        const allFlashcardIds = Array.from(collectionToFlashcardsMap.values()).flat();
        
        if (allFlashcardIds.length > 0) {
          const { data: progressData, error: progressError } = await supabase
            .from('flashcard_progress')
            .select('flashcard_id, is_mastered')
            .eq('user_id', user.id)
            .eq('is_mastered', true)
            .in('flashcard_id', allFlashcardIds);
            
          // Check if our request is still valid
          if (requestIdRef.current !== requestId || abortController.signal.aborted) {
            console.log(`Request ${requestId} aborted after progress query for loadMore`);
            return;
          }
            
          if (!progressError && progressData) {
            // Group progress data by flashcard
            progressData.forEach(p => {
              progressMap.set(p.flashcard_id, p);
            });
          }
        }
      }
      
      // Calculate mastered count for each collection
      const collectionMasteredCountMap = new Map();
      for (const [collectionId, flashcardIds] of collectionToFlashcardsMap.entries()) {
        const masteredCount = flashcardIds.filter(id => progressMap.has(id)).length;
        collectionMasteredCountMap.set(collectionId, masteredCount);
      }
      
      // Combine all the data to create the final collection objects
      const collectionsWithSubjects = collectionsData.map(collection => {
        const subjectId = collectionToSubjectMap.get(collection.id);
        const subject = subjectId ? subjectsMap.get(subjectId) : null;
        const cardCount = collectionCardCountMap.get(collection.id) || 0;
        const masteredCount = collectionMasteredCountMap.get(collection.id) || 0;
        
        return {
          ...collection,
          subject,
          card_count: cardCount,
          mastered_count: masteredCount
        };
      });
      
      // Update hasMore flag - if we got fewer collections than requested, there are no more
      const mightHaveMore = collectionsWithSubjects.length === ITEMS_PER_PAGE;
      console.log(`Setting hasMore to ${mightHaveMore} (got ${collectionsWithSubjects.length} collections)`);
      
      // Only update the collections if our request is still valid
      if (requestIdRef.current === requestId && !abortController.signal.aborted) {
        setHasMore(mightHaveMore);
        
        // Append new collections to existing collections
        setCollections(prevCollections => {
          const newCollections = [...prevCollections, ...collectionsWithSubjects];
          console.log(`Now showing ${newCollections.length} collections out of ${totalCollectionCount}`);
          return newCollections;
        });
      }
    } catch (err: any) {
      // Only update error state if this is still the current request
      if (requestIdRef.current === requestId && !abortController.signal.aborted) {
        console.error("Error loading more collections:", err);
        // Don't set error state to avoid disrupting the UI
      }
    } finally {
      // Only update loading state if this is still the current request
      if (requestIdRef.current !== requestId || abortController.signal.aborted) {
        console.log(`Not updating loading state for aborted request ${requestId}`);
      } else {
        console.log(`Finished loading more collections for request ${requestId}`);
        setLoadingMore(false);
      }
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

  // Function to handle filter changes from the UI (e.g., tab clicks)
  function handleFilterChange(value: string) {
    if (['all', 'official', 'my'].includes(value)) {
      // Set the new filter - the useEffect will handle loading the data
      const newFilter = value as 'all' | 'official' | 'my';
      setFilter(newFilter);
      
      // Clear collections to avoid briefly showing old data
      setCollections([]);
    }
  }

  // Function to handle subject selection from dropdown
  function handleSubjectDropdownChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const subjectId = e.target.value;
    if (subjectId) {
      // Add subject to selection if not already selected
      if (!selectedSubjectIds.includes(subjectId)) {
        setSelectedSubjectIds(prev => [...prev, subjectId]);
        setCollections([]); // Clear collections to avoid showing incorrect data
      }
    }
  }

  // Function to remove a specific subject filter
  function removeSubjectFilter(subjectId: string) {
    setSelectedSubjectIds(prev => prev.filter(id => id !== subjectId));
    setCollections([]); // Clear collections to avoid showing incorrect data
  }

  // Function to clear all subject filters
  function clearSubjectFilters() {
    if (selectedSubjectIds.length > 0) {
      setSelectedSubjectIds([]);
      setCollections([]);
    }
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // This would be implemented with a proper search in a real app
    // For now, we'll just filter the collections client-side
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
    console.log("Rendering full-page loading spinner");
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    console.log(`Rendering error message: ${error}`);
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
                onChange={handleSubjectDropdownChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022] dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="">Select a subject to filter</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id} disabled={selectedSubjectIds.includes(subject.id)}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {selectedSubjectIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSubjectIds.map(id => {
                    const subject = subjects.find(s => s.id === id);
                    return subject ? (
                      <div key={id} className="flex items-center bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        <span className="text-sm text-gray-800 dark:text-gray-200">{subject.name}</span>
                        <button 
                          type="button" 
                          onClick={() => removeSubjectFilter(id)}
                          className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : null;
                  })}
                  
                  {selectedSubjectIds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSubjectFilters}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
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
                  className={isLastItem ? 'last-card-ref' : ''}
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