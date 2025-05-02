import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import useToast from '@/hooks/useFlashcardToast';
import Toast from '../Toast';
import { useAuth } from '@/lib/auth';

interface Flashcard {
  question: string;
  answer: string;
}

interface Subject {
  id: string;
  name: string;
  description: string;
}

export default function CreateSet() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSubjectId = searchParams.get('subject');
  const { user } = useAuth();
  
  const { toast, showToast, hideToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(
    initialSubjectId ? [initialSubjectId] : []
  );
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [showNewSubjectForm, setShowNewSubjectForm] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([
    { question: '', answer: '' }
  ]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setSubjects(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleNewSubjectForm = () => {
    setShowNewSubjectForm(!showNewSubjectForm);
    if (showNewSubjectForm) {
      setNewSubjectName('');
      setNewSubjectDescription('');
    }
  };

  const validateForm = () => {
    if (!title.trim()) return 'Please enter a title for your flashcard collection';
    if (selectedSubjectIds.length === 0 && !newSubjectName) return 'Please select or create at least one subject';
    if (cards.length === 0) return 'Please add at least one flashcard';
    
    for (let index = 0; index < cards.length; index++) {
      const card = cards[index];
      if (!card.question.trim()) return `Card ${index + 1} is missing a question`;
      if (!card.answer.trim()) return `Card ${index + 1} is missing an answer`;
    }
    
    return null;
  };

  const addCard = () => {
    setCards([...cards, { question: '', answer: '' }]);
  };

  const removeCard = (index: number) => {
    if (cards.length > 1) {
      setCards(cards.filter((_, i) => i !== index));
    }
  };

  const updateCard = (index: number, field: keyof Flashcard, value: string) => {
    const updatedCards = [...cards];
    updatedCards[index][field] = value;
    setCards(updatedCards);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedSubjectIds.includes(value)) {
      setSelectedSubjectIds([...selectedSubjectIds, value]);
    }
  };

  const removeSubject = (id: string) => {
    setSelectedSubjectIds(selectedSubjectIds.filter(subId => subId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showToast('You must be logged in to create flashcards', 'error');
      return;
    }
    
    const validationError = validateForm();
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }
    
    try {
      setSaving(true);
      
      let newSubjectId = null;
      
      // If creating a new subject
      if (newSubjectName) {
        const { data: newSubject, error: subjectError } = await supabase
          .from('subjects')
          .insert([{ 
            name: newSubjectName, 
            description: newSubjectDescription,
            is_official: false
          }])
          .select()
          .single();
        
        if (subjectError) throw subjectError;
        newSubjectId = newSubject.id;
        
        // Add the new subject to the selected subjects
        if (newSubjectId) {
          setSelectedSubjectIds([...selectedSubjectIds, newSubjectId]);
        }
      }
      
      // Create the flashcard collection
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .insert([{
          title,
          description,
          is_official: false,
          user_id: user.id
        }])
        .select()
        .single();
      
      if (collectionError) throw collectionError;
      
      // Create subject associations with the collection
      const subjectIds = [...selectedSubjectIds];
      if (newSubjectId && !subjectIds.includes(newSubjectId)) {
        subjectIds.push(newSubjectId);
      }
      
      if (subjectIds.length > 0) {
        const collectionSubjects = subjectIds.map(subjectId => ({
          collection_id: collection.id,
          subject_id: subjectId
        }));
        
        const { error: relationError } = await supabase
          .from('collection_subjects')
          .insert(collectionSubjects);
        
        if (relationError) throw relationError;
      }
      
      // Add the flashcards
      const flashcardsToInsert = cards.map((card, index) => ({
        question: card.question,
        answer: card.answer,
        created_by: user.id,
        is_official: false
      }));
      
      const { data: insertedCards, error: cardsError } = await supabase
        .from('flashcards')
        .insert(flashcardsToInsert)
        .select('id');
      
      if (cardsError) throw cardsError;
      
      // Create flashcard-collection associations
      if (insertedCards && insertedCards.length > 0) {
        const flashcardCollections = insertedCards.map(card => ({
          flashcard_id: card.id,
          collection_id: collection.id
        }));
        
        const { error: junctionError } = await supabase
          .from('flashcard_collections_junction')
          .insert(flashcardCollections);
        
        if (junctionError) throw junctionError;
      }
      
      showToast('Flashcard collection created successfully!', 'success');
      
      // Navigate to the new collection
      if (newCollection) {
        navigate(`/flashcards/study?collection=${collection.id}`);
      }
      
    } catch (err: any) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
      
      {error && <ErrorMessage message={error} />}
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create Flashcard Collection</h1>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Collection Title*
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
              placeholder="Midterm: Professor Hints for Civ Pro, etc"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
              placeholder="Optional description of this flashcard collection"
              rows={3}
            />
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subjects*
              </label>
              <button
                type="button"
                onClick={toggleNewSubjectForm}
                className="text-sm text-[#F37022] hover:text-[#E36012]"
              >
                {showNewSubjectForm ? 'Select Existing Subjects' : 'Create New Subject'}
              </button>
            </div>
            
            {!showNewSubjectForm ? (
              <div>
                <select
                  id="subject"
                  value=""
                  onChange={handleSubjectChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
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
                        <div key={id} className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md flex items-center">
                          <span className="text-sm">{subject?.name}</span>
                          <button 
                            type="button" 
                            onClick={() => removeSubject(id)}
                            className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select one or more subjects for this collection.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                    placeholder="New subject name"
                  />
                </div>
                <div>
                  <textarea
                    value={newSubjectDescription}
                    onChange={(e) => setNewSubjectDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                    placeholder="Description (optional)"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Flashcards</h2>
            
            {cards.map((card, index) => (
              <div key={index} className="mb-8 p-5 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Card {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeCard(index)}
                    className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    disabled={cards.length === 1}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <div className="mb-3">
                  <label htmlFor={`question-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Question*
                  </label>
                  <textarea
                    id={`question-${index}`}
                    value={card.question}
                    onChange={(e) => updateCard(index, 'question', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`answer-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Answer*
                  </label>
                  <textarea
                    id={`answer-${index}`}
                    value={card.answer}
                    onChange={(e) => updateCard(index, 'answer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                    rows={2}
                    required
                  />
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addCard}
              className="flex items-center gap-1 text-[#F37022] hover:text-[#E36012]"
            >
              <Plus className="h-4 w-4" />
              Add Another Card
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#F37022] text-white px-6 py-2 rounded-md hover:bg-[#E36012] disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving...' : 'Create Collection'}
          </button>
        </div>
      </form>
    </div>
  );
} 