import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Plus, Search, BookOpen, Trash2, Filter, Library, Book, Layers } from 'lucide-react';
import Card from './Card';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import DeleteConfirmation from './DeleteConfirmation';
import useToast from '@/hooks/useFlashcardToast';
import Toast from './Toast';
import useFlashcardAuth from '@/hooks/useFlashcardAuth';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  
  const [collections, setCollections] = useState<FlashcardCollection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<FlashcardCollection | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
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

  useEffect(() => {
    // Reset pagination when filter changes
    setPage(1);
    setHasMore(true);
    setCollections([]);
    
    Promise.all([
      loadCollections(),
      loadSubjects()
    ]).then(() => {
      // Check if there's a filter in the URL
      const filterParam = searchParams.get('filter');
      if (filterParam && ['all', 'official', 'my'].includes(filterParam)) {
        setFilter(filterParam as 'all' | 'official' | 'my');
      }
      
      // Check if there's a subject filter in the URL
      const subjectParam = searchParams.get('subject');
      if (subjectParam) {
        setSelectedSubjectId(subjectParam);
      }
    });
  }, [searchParams]);
  
  // Load more collections when page changes
  useEffect(() => {
    if (page > 1) {
      loadMoreCollections();
    }
  }, [page]);

  async function loadCollections() {
    try {
      setLoading(true);
      
      // First, get the total count based on filters
      let countQuery = supabase.from('collections').select('id', { count: 'exact' });
      
      // Apply filters to count query
      if (filter === 'official') {
        countQuery = countQuery.eq('is_official', true);
      } else if (filter === 'my' && user) {
        countQuery = countQuery.eq('user_id', user.id);
      }
      
      // Apply subject filter if selected
      const subjectId = searchParams.get('subject');
      if (subjectId) {
        // We'll get the count from the filtered results later
        const { data: collectionSubjects } = await supabase
          .from('collection_subjects')
          .select('collection_id')
          .eq('subject_id', subjectId);
          
        const collectionIds = collectionSubjects?.map(cs => cs.collection_id) || [];
        if (collectionIds.length > 0) {
          countQuery = countQuery.in('id', collectionIds);
        } else {
          // No collections for this subject
          setCollections([]);
          setTotalCollectionCount(0);
          setHasMore(false);
          setLoading(false);
          return;
        }
      }
      
      // Get the count
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error("Error getting total count:", countError);
      } else {
        setTotalCollectionCount(count || 0);
        console.log(`Total collections: ${count}`);
        
        // If count is 0 or less than or equal to initial page size, set hasMore to false
        if (count === 0 || count <= ITEMS_PER_PAGE) {
          console.log(`Count (${count}) <= ITEMS_PER_PAGE (${ITEMS_PER_PAGE}), setting hasMore=false`);
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
      
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
        .range(0, ITEMS_PER_PAGE - 1);
      
      // Apply filters
      if (filter === 'official') {
        query = query.eq('is_official', true);
      } else if (filter === 'my' && user) {
        query = query.eq('user_id', user.id);
      }
      
      const { data: collectionsData, error: collectionsError } = await query;
      
      if (collectionsError) throw collectionsError;
      
      // Apply subject filter if selected
      let filteredCollections = collectionsData || [];
      
      // If subject filter is applied, filter collections using the junction table
      if (subjectId) {
        // Get collection IDs for this subject from the junction table
        const { data: collectionSubjects, error: junctionError } = await supabase
          .from('collection_subjects')
          .select('collection_id')
          .eq('subject_id', subjectId);
          
        if (junctionError) throw junctionError;
        
        // Filter collections by the IDs we got from the junction table
        const collectionIds = collectionSubjects?.map(cs => cs.collection_id) || [];
        filteredCollections = filteredCollections.filter(c => collectionIds.includes(c.id));
      }
      
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
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;
    
    console.log(`Loading more collections: range ${startIndex}-${endIndex}`);
    
    try {
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
      
      // Apply filters
      if (filter === 'official') {
        query = query.eq('is_official', true);
      } else if (filter === 'my' && user) {
        query = query.eq('user_id', user.id);
      }
      
      // Apply subject filter if selected
      const subjectId = searchParams.get('subject');
      
      const { data: collectionsData, error: collectionsError } = await query;
      
      if (collectionsError) throw collectionsError;
      
      console.log(`Received ${collectionsData?.length || 0} more collections from server`);
      
      if (!collectionsData || collectionsData.length === 0) {
        console.log('No more collections returned, setting hasMore to false');
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      // Apply subject filter if selected
      let filteredCollections = collectionsData || [];
      
      // If subject filter is applied, filter collections using the junction table
      if (subjectId) {
        // Get collection IDs for this subject from the junction table
        const { data: collectionSubjects, error: junctionError } = await supabase
          .from('collection_subjects')
          .select('collection_id')
          .eq('subject_id', subjectId);
          
        if (junctionError) throw junctionError;
        
        // Filter collections by the IDs we got from the junction table
        const collectionIds = collectionSubjects?.map(cs => cs.collection_id) || [];
        filteredCollections = filteredCollections.filter(c => collectionIds.includes(c.id));
      }
      
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

  function handleSubjectFilter(subjectId: string) {
    // Reset pagination when filter changes
    setPage(1);
    setHasMore(true);
    
    if (subjectId === selectedSubjectId) {
      // Clear filter
      setSelectedSubjectId('');
      // Update URL without triggering a re-render yet
      const params = new URLSearchParams(searchParams.toString());
      params.delete('subject');
      setSearchParams(params);
      
      // Set loading state before reloading collections
      setLoading(true);
      // Keep old collections visible until new ones load
      loadCollections().catch(err => {
        console.error("Error reloading collections:", err);
        setError("Failed to load collections. Please try again.");
      });
    } else {
      // Apply filter
      setSelectedSubjectId(subjectId);
      
      // Set loading state before changing the URL or collections
      setLoading(true);
      
      // First fetch the new data without changing the UI
      const fetchFilteredCollections = async () => {
        try {
          // Get collection IDs for this subject from the junction table
          const { data: collectionSubjects, error: junctionError } = await supabase
            .from('collection_subjects')
            .select('collection_id')
            .eq('subject_id', subjectId);
            
          if (junctionError) throw junctionError;
          
          // If no collections found for this subject, handle gracefully
          if (!collectionSubjects || collectionSubjects.length === 0) {
            // Update state with empty collections
            setCollections([]);
            setHasMore(false);
            setLoading(false);
            
            // Now update the URL parameter since we've handled the empty state
            const params = new URLSearchParams(searchParams.toString());
            params.set('subject', subjectId);
            setSearchParams(params);
            return;
          }
          
          // Otherwise, update the URL and reload collections normally
          const params = new URLSearchParams(searchParams.toString());
          params.set('subject', subjectId);
          setSearchParams(params);
          
          // Now load the collections with the new filter
          await loadCollections();
        } catch (err) {
          console.error("Error applying subject filter:", err);
          setError("Failed to filter by subject. Please try again.");
          setLoading(false);
        }
      };
      
      // Execute the function
      fetchFilteredCollections();
    }
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // This would be implemented with a proper search in a real app
    // For now, we'll just filter the collections client-side
  }

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
      
      // Force reload with new filter
      setLoading(true);
      loadCollections();
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
    <div className="max-w-6xl mx-auto pb-20 md:pb-8">
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

      {/* Desktop layout */}
      <div className="hidden md:block mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Collections</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {totalCollectionCount} {totalCollectionCount === 1 ? 'collection' : 'collections'}
            </p>
          </div>
          
          <div className="w-[340px]">
            <Tabs value={filter} onValueChange={handleFilterChange}>
              <TabsList className="grid w-full grid-cols-3" style={{ backgroundColor: '#f8f8f8' }}>
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="official"
                  className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white"
                >
                  Premium
                </TabsTrigger>
                <TabsTrigger 
                  value="my"
                  className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white"
                >
                  My Collections
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Mobile layout - only filter tabs */}
      <div className="md:hidden mb-6">
        <Tabs value={filter} onValueChange={handleFilterChange}>
          <TabsList className="grid w-full grid-cols-3" style={{ backgroundColor: '#f8f8f8' }}>
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="official"
              className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white"
            >
              Premium
            </TabsTrigger>
            <TabsTrigger 
              value="my"
              className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white"
            >
              My Collections
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between w-full">
        <div className="flex flex-col flex-grow">
          <h1 className="text-lg font-semibold text-center">
            Collections
          </h1>
          <p className="text-sm text-gray-500 text-center">
            {totalCollectionCount} {totalCollectionCount === 1 ? 'collection' : 'collections'}
          </p>
        </div>
      </div>

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
                    link={`/flashcards/study/${collection.id}`}
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