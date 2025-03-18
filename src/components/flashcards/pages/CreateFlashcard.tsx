import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Save, ArrowLeft, PlusCircle, Library, ChevronLeft, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import Toast from '../Toast';
import useToast from '@/hooks/useFlashcardToast';
import { useAuth } from '@/lib/auth';

interface Collection {
  id: string;
  title: string;
  subject?: {
    id: string;
    name: string;
  };
}

interface Subject {
  id: string;
  name: string;
}

export default function CreateFlashcard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Get collection ID from URL if present
  const collectionIdFromUrl = searchParams.get('collection');

  // Form states
  const [collections, setCollections] = useState<Collection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    collectionIdFromUrl ? [collectionIdFromUrl] : []
  );
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  
  // Loading/error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        setError('You must be logged in to create flashcards');
        return;
      }
      
      try {
        setLoading(true);
        
        // Load collections
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('collections')
          .select(`
            id,
            title,
            subject:collection_subjects(
              subject:subject_id(
                id,
                name
              )
            )
          `)
          .order('title');

        if (collectionsError) throw collectionsError;
        
        // Transform collections data
        const formattedCollections = collectionsData?.map(item => ({
          id: item.id,
          title: item.title,
          subject: item.subject?.[0]?.subject
        })) || [];
        
        setCollections(formattedCollections);
        
        // Load subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name')
          .order('name');
          
        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCollectionIds.length === 0) {
      showToast('Please select at least one collection', 'error');
      return;
    }
    
    if (!question.trim() || !answer.trim()) {
      showToast('Please provide both a question and an answer', 'error');
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      // First insert the flashcard
      const { data: flashcardData, error: flashcardError } = await supabase
        .from('flashcards')
        .insert([
          {
            question,
            answer,
            created_by: user?.id,
            is_official: false
          },
        ])
        .select();

      if (flashcardError) throw flashcardError;

      if (flashcardData && flashcardData.length > 0) {
        const flashcardId = flashcardData[0].id;
        
        // Create junction entries for each selected collection
        for (const collectionId of selectedCollectionIds) {
          const { error: junctionError } = await supabase
            .from('flashcard_collections_junction')
            .insert([
              {
                flashcard_id: flashcardId,
                collection_id: collectionId
              },
            ]);

          if (junctionError) throw junctionError;
        }
        
        // Create entries for each selected subject
        for (const subjectId of selectedSubjectIds) {
          const { error: subjectError } = await supabase
            .from('flashcard_subjects')
            .insert([
              {
                flashcard_id: flashcardId,
                subject_id: subjectId
              },
            ]);

          if (subjectError) throw subjectError;
        }
      }

      // Clear form
      setQuestion('');
      setAnswer('');
      setSelectedCollectionIds([]);
      setSelectedSubjectIds([]);
      showToast('Card added successfully', 'success');
    } catch (err: any) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    if (selectedCollectionIds.length === 0) {
      showToast('Please select at least one collection', 'error');
      return;
    }
    
    if (!question.trim() || !answer.trim()) {
      navigate(`/flashcards/flashcards`);
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      // First insert the flashcard
      const { data: flashcardData, error: flashcardError } = await supabase
        .from('flashcards')
        .insert([
          {
            question,
            answer,
            created_by: user?.id,
            is_official: false
          },
        ])
        .select();

      if (flashcardError) throw flashcardError;

      if (flashcardData && flashcardData.length > 0) {
        const flashcardId = flashcardData[0].id;
        
        // Create junction entries for each selected collection
        for (const collectionId of selectedCollectionIds) {
          const { error: junctionError } = await supabase
            .from('flashcard_collections_junction')
            .insert([
              {
                flashcard_id: flashcardId,
                collection_id: collectionId
              },
            ]);

          if (junctionError) throw junctionError;
        }
        
        // Create entries for each selected subject
        for (const subjectId of selectedSubjectIds) {
          const { error: subjectError } = await supabase
            .from('flashcard_subjects')
            .insert([
              {
                flashcard_id: flashcardId,
                subject_id: subjectId
              },
            ]);

          if (subjectError) throw subjectError;
        }
      }

      showToast('Card added successfully', 'success');
      
      // Navigate to flashcards view
      navigate(`/flashcards/flashcards`);
    } catch (err: any) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
      setSaving(false);
    }
  };
  
  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedCollectionIds.includes(value)) {
      setSelectedCollectionIds([...selectedCollectionIds, value]);
    }
  };
  
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedSubjectIds.includes(value)) {
      setSelectedSubjectIds([...selectedSubjectIds, value]);
    }
  };
  
  const removeCollection = (id: string) => {
    setSelectedCollectionIds(selectedCollectionIds.filter(collId => collId !== id));
  };
  
  const removeSubject = (id: string) => {
    setSelectedSubjectIds(selectedSubjectIds.filter(subId => subId !== id));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (collections.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create a Flashcard</h1>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <Library className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No Collections Available</h2>
          <p className="text-gray-600 mb-6">
            You need to create a collection before you can add flashcards.
          </p>
          <Link
            to="/flashcards/create-collection"
            className="inline-flex items-center gap-2 bg-[#F37022] text-white px-6 py-2 rounded-md hover:bg-[#E36012]"
          >
            <PlusCircle className="h-4 w-4" />
            Create New Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
      
      <div className="mb-8">
        <Link to="/flashcards/flashcards" className="text-[#F37022] hover:text-[#E36012] flex items-center gap-2">
          <ChevronLeft className="h-5 w-5" />
          Back to Flashcards
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Create New Flashcard</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            {/* Question and Answer first */}
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input
                id="question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                required
              />
            </div>

            <div>
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                rows={5}
                required
              />
            </div>
            
            {/* Collections selection */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="collection" className="block text-sm font-medium text-gray-700">
                  Collections
                </label>
                <Link
                  to="/flashcards/create-collection"
                  className="text-sm text-[#F37022] hover:text-[#E36012]"
                >
                  Create new collection
                </Link>
              </div>
              <select
                id="collection"
                value=""
                onChange={handleCollectionChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
              >
                <option value="">Select collections...</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title} {collection.subject ? `(${collection.subject.name})` : ''}
                  </option>
                ))}
              </select>
              {selectedCollectionIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCollectionIds.map(id => {
                    const collection = collections.find(c => c.id === id);
                    return (
                      <div key={id} className="bg-gray-100 px-3 py-1 rounded-md flex items-center">
                        <span className="text-sm">{collection?.title}</span>
                        <button 
                          type="button" 
                          onClick={() => removeCollection(id)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Select one or more collections for this flashcard.
              </p>
            </div>
            
            {/* Subjects selection */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subjects (Optional)
                </label>
                <Link
                  to="/flashcards/create-subject"
                  className="text-sm text-[#F37022] hover:text-[#E36012]"
                >
                  Create new subject
                </Link>
              </div>
              <select
                id="subject"
                value=""
                onChange={handleSubjectChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
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
                    return (
                      <div key={id} className="bg-gray-100 px-3 py-1 rounded-md flex items-center">
                        <span className="text-sm">{subject?.name}</span>
                        <button 
                          type="button" 
                          onClick={() => removeSubject(id)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Select one or more subjects to categorize this flashcard.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#F37022] text-white px-6 py-2 rounded-md hover:bg-[#E36012] disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Saving...' : 'Save & Add Another'}
            </button>
            
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={saving}
              className="flex items-center gap-2 bg-gray-100 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              <ArrowLeft className="h-5 w-5" />
              Save & Go Back
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 