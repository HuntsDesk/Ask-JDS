import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Plus, Search, BookOpen, Trash2, Filter, Library, Book } from 'lucide-react';
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

  useEffect(() => {
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

  async function loadCollections() {
    try {
      setLoading(true);
      
      // First, get all collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select(`
          id,
          title,
          description,
          created_at,
          is_official
        `)
        .order('created_at', { ascending: false });
      
      if (collectionsError) throw collectionsError;
      
      // Apply subject filter if selected
      const subjectId = searchParams.get('subject');
      
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
    if (subjectId === selectedSubjectId) {
      // Clear filter
      setSelectedSubjectId('');
      setSearchParams({});
      // Reload collections without subject filter
      loadCollections();
    } else {
      // Apply filter
      setSelectedSubjectId(subjectId);
      setSearchParams({ subject: subjectId });
      // Force reload collections with the new subject filter
      setLoading(true);
      loadCollections().then(() => {
        console.log("Collections reloaded with subject filter:", subjectId);
      });
    }
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // This would be implemented with a proper search in a real app
    // For now, we'll just filter the collections client-side
  }

  function handleFilterChange(value: string) {
    const newFilter = value as 'all' | 'official' | 'my';
    setFilter(newFilter);
    
    // Update URL params
    searchParams.set('filter', newFilter);
    setSearchParams(searchParams);
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
    <div className="max-w-6xl mx-auto">
      <DeleteConfirmation
        isOpen={!!collectionToDelete}
        onClose={() => setCollectionToDelete(null)}
        onConfirm={handleDeleteCollection}
        title="Delete Collection"
        message="Are you sure you want to delete this collection? All flashcards in this collection will be permanently deleted."
        itemName={collectionToDelete?.title}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}

      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {selectedSubject ? `${selectedSubject.name} Collections` : 'Collections'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {filteredCollections.length} {filteredCollections.length === 1 ? 'collection' : 'collections'}
              </p>
            </div>
            
            {/* Subject filter moved to the left of the slider */}
            <div className="relative">
              <select
                className="pl-8 pr-4 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
                value={selectedSubjectId}
                onChange={(e) => handleSubjectFilter(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="" className="bg-white dark:bg-gray-700">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id} className="bg-white dark:bg-gray-700">
                    {subject.name}
                  </option>
                ))}
              </select>
              <Book className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-5 w-5" />
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Filter tabs */}
          <div>
            <Tabs value={filter} onValueChange={handleFilterChange}>
              <TabsList className="grid grid-cols-3" style={{ backgroundColor: 'var(--background)' }}>
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

      {/* Collections grid */}
      <div className="mb-8">
        {filteredCollections.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Library className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map(collection => (
              <Card 
                key={collection.id}
                title={collection.title}
                description={collection.description}
                tag={collection.subject ? collection.subject.name : 'No Subject'}
                count={collection.card_count || 0}
                masteredCount={collection.mastered_count || 0}
                link={`/flashcards/study/${collection.id}`}
                onDelete={!collection.is_official ? () => setCollectionToDelete(collection) : undefined}
                collectionId={collection.id}
                isOfficial={collection.is_official || false}
                subjectId={collection.subject ? collection.subject.id : ''}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 