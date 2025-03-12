import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
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

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  collection_id: string;
  is_mastered: boolean;
  created_by?: string;
}

export default function EditCard() {
  const { cardId } = useParams<{ cardId: string }>();
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
    async function loadCardAndCollection() {
      try {
        // First load the card details
        const { data: cardData, error: cardError } = await supabase
          .from('flashcards')
          .select('*')
          .eq('id', cardId)
          .single();

        if (cardError) throw cardError;
        
        if (!cardData) {
          throw new Error('Card not found');
        }

        // Set card details
        setQuestion(cardData.question);
        setAnswer(cardData.answer);

        // Then load the collection details
        const { data: collectionData, error: collectionError } = await supabase
          .from('flashcard_collections')
          .select(`
            *,
            subject:subject_id (
              name
            )
          `)
          .eq('id', cardData.collection_id)
          .single();

        if (collectionError) throw collectionError;
        setCollection(collectionData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCardAndCollection();
  }, [cardId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!question.trim() || !answer.trim()) {
      showToast('Question and answer cannot be empty', 'error');
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('flashcards')
        .update({
          question: question.trim(),
          answer: answer.trim()
        })
        .eq('id', cardId);

      if (error) throw error;

      showToast('Card updated successfully', 'success');
    } catch (err: any) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    if (!question.trim() || !answer.trim()) {
      showToast('Question and answer cannot be empty', 'error');
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('flashcards')
        .update({
          question: question.trim(),
          answer: answer.trim()
        })
        .eq('id', cardId);

      if (error) throw error;
      
      showToast('Card updated successfully', 'success');
      
      // Navigate back to the flashcards view
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

  if (error || !collection) {
    return (
      <ErrorMessage 
        message={error || 'Card or collection not found'} 
        backLink={{
          to: "/flashcards/flashcards",
          label: "Back to Flashcards"
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
        <Link to="/flashcards/flashcards" className="text-[#F37022] hover:text-[#E36012] flex items-center gap-2">
          <ChevronLeft className="h-5 w-5" />
          Back to Flashcards
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Edit Flashcard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {collection.title} • {collection.subject.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:border dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                rows={5}
                required
              />
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={saving}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-6 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
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