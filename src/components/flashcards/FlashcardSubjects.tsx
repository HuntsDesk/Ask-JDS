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

interface Subject {
  id: string;
  name: string;
  description: string;
  is_official: boolean;
  created_at: string;
  collection_count?: number;
}

type SubjectFilter = 'all' | 'official' | 'my';

export default function FlashcardSubjects() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [filter, setFilter] = useState<SubjectFilter>('all');

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    try {
      setLoading(true);
      
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
      
      setSubjects(subjectsWithCounts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAddSubject = () => {
    navigate('/flashcards/create-subject');
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectToDelete.id)
        .eq('is_official', false);
      
      if (error) throw error;
      
      setSubjects(subjects.filter(s => s.id !== subjectToDelete.id));
      setSubjectToDelete(null);
      showToast('Subject deleted successfully', 'success');
    } catch (err: any) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleStudySubject = (subjectId: string) => {
    console.log("Navigating to subject study page with ID:", subjectId);
    navigate(`/flashcards/subjects/${subjectId}`);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value as 'all' | 'official' | 'my');
  };

  // Filter subjects based on the selected filter
  const filteredSubjects = subjects.filter(subject => {
    if (filter === 'all') return true;
    if (filter === 'official') return subject.is_official;
    if (filter === 'my') return !subject.is_official;
    return true;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-md flex items-start">
        <div>
          <h3 className="font-medium mb-1">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <DeleteConfirmation
        isOpen={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={handleDeleteSubject}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? All collections in this subject will also be deleted."
        itemName={subjectToDelete?.name}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}

      <div className="mb-6">
        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subjects</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredSubjects.length} {filteredSubjects.length === 1 ? 'subject' : 'subjects'}
            </p>
          </div>
          
          <div className="w-auto">
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
                  My Subjects
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subjects</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredSubjects.length} {filteredSubjects.length === 1 ? 'subject' : 'subjects'}
            </p>
          </div>
          
          <div className="w-full">
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
                  My Subjects
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No subjects found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filter === 'my' 
              ? "You haven't created any subjects yet. Create your first subject using the New Subject button."
              : filter === 'official'
              ? "No premium subjects available for this filter."
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