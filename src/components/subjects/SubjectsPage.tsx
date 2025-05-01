import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import SubjectCard from './SubjectCard';
import SearchBar from '../flashcards/SearchBar';
import PageContainer from '@/components/layout/PageContainer';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Pagination state for infinite scrolling
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalSubjectCount, setTotalSubjectCount] = useState(0);
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
        console.log('Last card is visible, loading more subjects...');
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

  // Initial load effect
  useEffect(() => {
    fetchSubjects();
  }, []);
  
  // Load more subjects when page changes
  useEffect(() => {
    if (page > 1) {
      loadMoreSubjects();
    }
  }, [page]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      
      // First, get the total count of subjects
      const { count, error: countError } = await supabase
        .from('flashcard_subjects')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error("Error getting total count:", countError);
      } else {
        setTotalSubjectCount(count || 0);
        console.log(`Total subjects: ${count}`);
        
        // If count is 0 or less than or equal to initial page size, set hasMore to false
        if (count === 0 || count <= ITEMS_PER_PAGE) {
          console.log(`Count (${count}) <= ITEMS_PER_PAGE (${ITEMS_PER_PAGE}), setting hasMore=false`);
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
      
      // Fetch first page of subjects with pagination
      const { data, error } = await supabase
        .from('flashcard_subjects')
        .select('*')
        .order('name', { ascending: true })
        .range(0, ITEMS_PER_PAGE - 1);

      if (error) {
        console.error('Error fetching subjects:', error);
        return;
      }

      setSubjects(data || []);
      setPage(1);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to load more subjects (for infinite scrolling)
  const loadMoreSubjects = async () => {
    if (!hasMore || loadingMore) {
      console.log('Aborting loadMoreSubjects - no more data or already loading');
      return;
    }
    
    console.log(`Loading more subjects for page ${page}`);
    setLoadingMore(true);
    
    // Calculate the range for the next page
    // Supabase ranges are zero-indexed and inclusive of both ends
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;
    
    console.log(`Loading more subjects: range ${startIndex}-${endIndex}`);
    
    try {
      const { data, error } = await supabase
        .from('flashcard_subjects')
        .select('*')
        .order('name', { ascending: true })
        .range(startIndex, endIndex);
      
      if (error) {
        console.error('Error loading more subjects:', error);
        throw error;
      }
      
      console.log(`Received ${data?.length || 0} more subjects from server`);
      
      if (!data || data.length === 0) {
        console.log('No more subjects returned, setting hasMore to false');
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      // Update hasMore flag - if we got fewer subjects than requested, there are no more
      const mightHaveMore = data.length === ITEMS_PER_PAGE;
      console.log(`Setting hasMore to ${mightHaveMore} (got ${data.length} subjects)`);
      setHasMore(mightHaveMore);
      
      // Append new subjects to existing subjects
      setSubjects(prevSubjects => {
        const newSubjects = [...prevSubjects, ...data];
        console.log(`Now showing ${newSubjects.length} subjects out of ${totalSubjectCount}`);
        return newSubjects;
      });
    } catch (err) {
      console.error("Error loading more subjects:", err);
      // Don't set error state to avoid disrupting the UI
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Reset pagination when search term changes
    setPage(1);
    setHasMore(true);
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer>
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Subjects</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {totalSubjectCount} {totalSubjectCount === 1 ? 'subject' : 'subjects'}
            </p>
          </div>
          <div className="w-full sm:w-auto max-w-md">
            <SearchBar value={searchTerm} onChange={handleSearchChange} placeholder="Search subjects..." />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredSubjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {filteredSubjects.map((subject, index) => {
              // Determine if this is the last item for observer attachment
              const isLastItem = index === filteredSubjects.length - 1;
              
              return (
                <div 
                  key={subject.id}
                  ref={isLastItem && !searchTerm ? lastCardRef : null}
                >
                  <SubjectCard key={subject.id} subject={subject} />
                </div>
              );
            })}
            
            {/* Loading indicator for infinite scroll */}
            {loadingMore && !searchTerm && (
              <div className="col-span-1 sm:col-span-2 md:col-span-3 py-4 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        ) : searchTerm ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">No subjects found matching "{searchTerm}"</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="text-sm text-[#F37022] hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">No subjects have been created yet.</p>
            <button 
              onClick={() => navigate('/flashcards/create-subject')}
              className="px-4 py-2 bg-[#F37022] text-white rounded-md hover:bg-[#E36012] transition-colors"
            >
              Create your first subject
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
} 