import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, PlusCircle, Library, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import Toast from '../Toast';
import useToast from '@/hooks/useFlashcardToast';
import { useAuth } from '@/lib/auth';

interface Collection {
  id: string;
  title: string;
  subject: {
    name: string;
  };
}

export default function CreateFlashcard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  // Form states
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  
  // Loading/error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCollections() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('flashcard_collections')
          .select(`
            id,
            title,
            subject:subject_id (
              name
            )
          `)
          .order('title');

        if (error) throw error;
        setCollections(data || []);
        
        // If there's only one collection, select it automatically
        if (data && data.length === 1) {
          setSelectedCollectionId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadCollections();
    } else {
      setLoading(false);
      setError('You must be logged in to create flashcards');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCollectionId) {
      showToast('Please select a collection', 'error');
      return;
    }
    
    if (!question.trim() || !answer.trim()) {
      showToast('Please provide both a question and an answer', 'error');
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('flashcards')
        .insert([
          {
            collection_id: selectedCollectionId,
            question,
            answer,
            created_by: user?.id,
            is_official: false
          },
        ]);

      if (error) throw error;

      // Clear form
      setQuestion('');
      setAnswer('');
      showToast('Card added successfully', 'success');
    } catch (err: any) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    if (!selectedCollectionId) {
      showToast('Please select a collection', 'error');
      return;
    }
    
    if (!question.trim() || !answer.trim()) {
      navigate(`/flashcards/flashcards`);
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('flashcards')
        .insert([
          {
            collection_id: selectedCollectionId,
            question,
            answer,
            created_by: user?.id,
            is_official: false
          },
        ]);

      if (error) throw error;
      
      showToast('Card added successfully', 'success');
      
      // Navigate to flashcards view
      navigate(`/flashcards/flashcards`);
    } catch (err: any) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
      setSaving(false);
    }
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
            <div className="mb-4">
              <label htmlFor="collection" className="block text-sm font-medium text-gray-700 mb-1">
                Collection
              </label>
              <select
                id="collection"
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                required
              >
                <option value="">Select a collection...</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title} ({collection.subject.name})
                  </option>
                ))}
              </select>
              <div className="flex justify-end mt-1">
                <Link
                  to="/flashcards/create-collection"
                  className="text-sm text-[#F37022] hover:text-[#E36012]"
                >
                  Create new collection
                </Link>
              </div>
            </div>

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
              <p className="text-xs text-gray-500 mt-1">
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