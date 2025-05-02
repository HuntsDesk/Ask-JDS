import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, ExternalLink, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import Toast from '../Toast';
import useToast from '@/hooks/useFlashcardToast';
import useAuth from '@/hooks/useFlashcardAuth';

interface Collection {
  id: string;
  title: string;
  subject: {
    name: string;
  };
}

export default function AddCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCollection() {
      try {
        // First, get the collection data
        const { data: collectionData, error: collectionError } = await supabase
          .from('collections')
          .select('*')
          .eq('id', id)
          .single();

        if (collectionError) throw collectionError;
        
        // Then get the subject information from the collection_subjects junction table
        let subjectData = null;
        try {
          const { data, error } = await supabase
            .from('collection_subjects')
            .select(`
              subject_id,
              subjects:subject_id(id, name)
            `)
            .eq('collection_id', id);
          
          if (error) {
            console.error("Error loading subjects:", error);
          } else if (data && data.length > 0) {
            // Just use the first subject if there are multiple
            subjectData = data[0];
          } else {
            console.log("No subjects found for this collection");
          }
        } catch (err) {
          console.error("Error in subject query:", err);
          // Continue without subject data
        }
        
        // Combine the data
        const completeCollectionData = {
          ...collectionData,
          subject: subjectData?.subjects || { id: '', name: 'No Subject' }
        };
        
        setCollection(completeCollectionData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCollection();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      console.log('Creating flashcard with user ID:', user?.id);
      
      // Step 1: Create the flashcard without collection_id
      const { data: flashcardData, error: flashcardError } = await supabase
        .from('flashcards')
        .insert([
          {
            question,
            answer,
            created_by: user?.id
          },
        ])
        .select();

      if (flashcardError) throw flashcardError;
      
      if (!flashcardData || flashcardData.length === 0) {
        throw new Error('Flashcard created but no data returned');
      }
      
      const flashcardId = flashcardData[0].id;
      
      // Step 2: Create the relationship in the junction table
      const { error: junctionError } = await supabase
        .from('flashcard_collections_junction')
        .insert([
          {
            flashcard_id: flashcardId,
            collection_id: id
          }
        ]);
        
      if (junctionError) throw junctionError;

      // Clear form and show success message
      setQuestion('');
      setAnswer('');
      showToast('Card added successfully', 'success');
      
      // Log the creation with user ID
      console.log('Flashcard created successfully:', flashcardData);
      console.log('User ID attached to card:', user?.id);
      console.log('Added to collection using junction table');
      
      // Skip if we're still creating more cards
      if (mode === 'addAnother') {
        // Reset form and show success message
        resetForm();
        setIsSubmitting(false);
        showToast('Flashcard added successfully!', 'success');
      } else {
        // Navigate to study mode after successful save
        navigate(`/flashcards/study?collection=${id}`);
      }
    } catch (err: any) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    // Don't save if fields are empty
    if (!question.trim() || !answer.trim()) {
      navigate(`/flashcards/study?collection=${id}`);
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      console.log('Creating flashcard with user ID:', user?.id);
      
      // Step 1: Create the flashcard without collection_id
      const { data: flashcardData, error: flashcardError } = await supabase
        .from('flashcards')
        .insert([
          {
            question,
            answer,
            created_by: user?.id
          },
        ])
        .select();

      if (flashcardError) throw flashcardError;
      
      if (!flashcardData || flashcardData.length === 0) {
        throw new Error('Flashcard created but no data returned');
      }
      
      const flashcardId = flashcardData[0].id;
      
      // Step 2: Create the relationship in the junction table
      const { error: junctionError } = await supabase
        .from('flashcard_collections_junction')
        .insert([
          {
            flashcard_id: flashcardId,
            collection_id: id
          }
        ]);
        
      if (junctionError) throw junctionError;
      
      // Log the creation with user ID
      console.log('Flashcard created successfully:', flashcardData);
      console.log('User ID attached to card:', user?.id);
      console.log('Added to collection using junction table');
      
      showToast('Card added successfully', 'success');
      
      // Navigate to study mode after successful save
      navigate(`/flashcards/study?collection=${id}`);
    } catch (err: any) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !collection) {
    return (
      <ErrorMessage 
        message={error || 'Collection not found'} 
        backLink={{
          to: "/flashcards/collections",
          label: "Back to Collections"
        }}
      />
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
        <Link to={`/flashcards/edit/${id}`} className="text-[#F37022] hover:text-[#E36012] flex items-center gap-2">
          <ChevronLeft className="h-5 w-5" />
          Back to Collection
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Add Card to Collection</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {collection.title} • {collection.subject.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022] dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022] dark:bg-gray-700 dark:text-white"
                rows={5}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                You can provide a detailed explanation for this answer.
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
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <ExternalLink className="h-5 w-5" />
              Save & Exit
            </button>
          </div>
          
          {/* Extra spacing element for alignment */}
          <div></div>
        </div>
      </form>
    </div>
  );
} 