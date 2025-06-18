import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, BookOpen, Lock, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DeleteConfirmation from './DeleteConfirmation';
import LoadingSpinner from './LoadingSpinner';
import SubjectCard from './SubjectCard';
import useToast from '@/hooks/useFlashcardToast';
import Toast from './Toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavbar } from '@/contexts/NavbarContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SkeletonSubjectGrid } from './SkeletonSubject';
import { useAuth } from '@/lib/auth';

interface Subject {
  id: string;
  name: string;
  description: string;
  is_official: boolean;
  created_at: string;
  collection_count?: number;
  user_id: string;
}

type SubjectFilter = 'all' | 'official' | 'my';

export default function FlashcardSubjects() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { updateCount } = useNavbar();
  const { user } = useAuth();
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [filter, setFilter] = useState<SubjectFilter>('all');
  const queryClient = useQueryClient();

  // Define query keys
  const subjectKeys = {
    all: ['subjects'] as const,
    list: () => [...subjectKeys.all, 'list'] as const,
    withCounts: () => [...subjectKeys.list(), 'withCounts'] as const,
  };

  // Use React Query to fetch subjects
  const { 
    data: subjects = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: subjectKeys.withCounts(),
    queryFn: async () => {
      // Get all subjects
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('is_official', { ascending: false })
        .order('name');
      
      if (error) throw error;
      
      // Get collection counts for each subject using the junction table
      const subjectsWithCounts = await Promise.all(
        (data || []).map(async (subject) => {
          const { count, error: countError } = await supabase
            .from('collection_subjects')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subject.id);
            
          if (countError) throw countError;
          
          return {
            ...subject,
            collection_count: count || 0
          };
        })
      );
      
      return subjectsWithCounts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Filter subjects based on the selected filter
  const filteredSubjects = subjects.filter(subject => {
    if (filter === 'all') return true;
    if (filter === 'official') return subject.is_official;
    if (filter === 'my') return !subject.is_official;
    return true;
  });

  // Update filtered subjects count when filter changes
  useEffect(() => {
    updateCount(filteredSubjects.length);
  }, [filteredSubjects.length, updateCount]);

  const handleAddSubject = () => {
    navigate('/flashcards/create-subject');
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    
    console.log('🗑️ Starting subject deletion:', {
      subjectId: subjectToDelete.id,
      subjectName: subjectToDelete.name,
      isOfficial: subjectToDelete.is_official,
      subjectUserId: subjectToDelete.user_id,  // Check the subject's owner
      currentUserId: user?.id,                 // Check current user
      userMatch: subjectToDelete.user_id === user?.id // Do they match?
    });
    
    try {
      // First delete entries in the collection_subjects junction table
      console.log('🔗 Deleting collection_subjects junction entries...');
      const { error: junctionError, count: junctionCount } = await supabase
        .from('collection_subjects')
        .delete({ count: 'exact' })
        .eq('subject_id', subjectToDelete.id);
      
      if (junctionError) {
        console.error('❌ Junction table deletion error:', junctionError);
        throw junctionError;
      }
      
      console.log(`✅ Junction table deletion completed. Rows affected: ${junctionCount}`);
      console.log('📝 Deleting subject from subjects table...');
      const { error, data, count } = await supabase
        .from('subjects')
        .delete({ count: 'exact' })
        .eq('id', subjectToDelete.id);
      
      console.log('📊 Delete operation result:', { error, data, count, rowsAffected: count });
      
      if (error) {
        console.error('❌ Database error during deletion:', error);
        throw error;
      }
      
      // Check if any rows were actually deleted
      if (count === 0) {
        console.warn('⚠️ No rows were deleted. This might indicate an RLS policy issue.');
        console.log('🔍 RLS Debug Info:', {
          expectedConditions: 'auth.is_admin() = true OR (is_official = false AND auth.uid() = user_id)',
          subjectIsOfficial: subjectToDelete.is_official,
          subjectUserId: subjectToDelete.user_id,
          currentUserId: user?.id,
          policyWillAllow: user?.id && subjectToDelete.user_id === user.id && !subjectToDelete.is_official
        });
        throw new Error('Subject could not be deleted. You may not have permission to delete this subject.');
      }
      
      console.log(`✅ Subject deleted successfully! ${count} row(s) affected`);
      
      // Invalidate the subjects query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: subjectKeys.all });
      
      setSubjectToDelete(null);
      showToast('Subject deleted successfully', 'success');
    } catch (err: any) {
      console.error('💥 Error deleting subject:', err);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleStudySubject = (subjectId: string) => {
    navigate(`/flashcards/study?subject=${subjectId}`);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value as 'all' | 'official' | 'my');
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto pb-20 md:pb-8 px-4">
        {/* Desktop layout */}
        <div className="hidden md:block mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subjects</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Loading subjects...
              </p>
            </div>
            
            <div className="w-[340px]">
              <Tabs value={filter} onValueChange={handleFilterChange}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
                  <TabsTrigger value="all" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">All</TabsTrigger>
                  <TabsTrigger value="official" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">Official</TabsTrigger>
                  <TabsTrigger value="my" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">My Subjects</TabsTrigger>
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
              <TabsTrigger value="my" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">My Subjects</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <SkeletonSubjectGrid count={6} />
      </div>
    );
  }

  if (isError && error instanceof Error) {
    return (
      <div className="max-w-6xl mx-auto pb-20 md:pb-8 px-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-md flex items-start">
        <div>
          <h3 className="font-medium mb-1">Error</h3>
            <p>{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-8 px-4">
      <DeleteConfirmation
        isOpen={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={handleDeleteSubject}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This action cannot be undone."
        itemName={subjectToDelete?.name}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subjects</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredSubjects.length} {filteredSubjects.length === 1 ? 'subject' : 'subjects'}
            </p>
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
                  Official
                </TabsTrigger>
                <TabsTrigger 
                  value="my"
                  className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400"
                >
                  My Subjects
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Mobile layout - only filter tabs */}
      <div className="md:hidden mb-6">
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
              Official
            </TabsTrigger>
            <TabsTrigger 
              value="my"
              className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400"
            >
              My Subjects
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No subjects found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filter === 'my' 
              ? "You haven't created any subjects yet. Create your first subject using the New Subject button."
              : filter === 'official'
              ? "No official subjects available for this filter."
              : "No subjects found. Try adjusting your filters or create a new subject."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              id={subject.id}
              name={subject.name}
              description={subject.description}
              isOfficial={subject.is_official}
              collectionCount={subject.collection_count || 0}
              onStudy={() => handleStudySubject(subject.id)}
              onDelete={!subject.is_official ? () => setSubjectToDelete(subject) : undefined}
              showDeleteButton={!subject.is_official}
            />
          ))}
        </div>
      )}
    </div>
  );
} 