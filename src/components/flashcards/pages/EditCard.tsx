import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Save, ArrowLeft, ExternalLink, ChevronLeft, Plus, X, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import Toast from '../Toast';
import useToast from '@/hooks/useFlashcardToast';
import useAuth from '@/hooks/useFlashcardAuth';
import { invalidateCache } from '@/hooks/use-cached-data';

interface Collection {
  id: string;
  title: string;
}

interface Subject {
  id: string;
  name: string;
}

interface ExamType {
  id: string;
  name: string;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  is_mastered: boolean;
  created_by?: string;
}

export default function EditCard() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();
  
  // Card data
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  
  // Relationship data
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [originalCollections, setOriginalCollections] = useState<string[]>([]);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [originalSubjects, setOriginalSubjects] = useState<string[]>([]);
  
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [selectedExamTypes, setSelectedExamTypes] = useState<string[]>([]);
  const [originalExamTypes, setOriginalExamTypes] = useState<string[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check for unsaved changes
  useEffect(() => {
    const hasContentChanges = 
      originalQuestion !== question || 
      originalAnswer !== answer;
    
    const hasCollectionChanges = 
      selectedCollections.length !== originalCollections.length || 
      !selectedCollections.every(id => originalCollections.includes(id));
    
    const hasSubjectChanges = 
      selectedSubjects.length !== originalSubjects.length || 
      !selectedSubjects.every(id => originalSubjects.includes(id));
    
    const hasExamTypeChanges = 
      selectedExamTypes.length !== originalExamTypes.length || 
      !selectedExamTypes.every(id => originalExamTypes.includes(id));
    
    setHasUnsavedChanges(
      hasContentChanges || 
      hasCollectionChanges || 
      hasSubjectChanges || 
      hasExamTypeChanges
    );
  }, [
    question, answer, 
    selectedCollections, originalCollections,
    selectedSubjects, originalSubjects,
    selectedExamTypes, originalExamTypes
  ]);

  // Original content for comparison
  const [originalQuestion, setOriginalQuestion] = useState('');
  const [originalAnswer, setOriginalAnswer] = useState('');

  const handleCollectionToggle = (collectionId: string) => {
    setSelectedCollections(prev => {
      if (prev.includes(collectionId)) {
        return prev.filter(id => id !== collectionId);
      } else {
        return [...prev, collectionId];
      }
    });
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleExamTypeToggle = (examTypeId: string) => {
    setSelectedExamTypes(prev => {
      if (prev.includes(examTypeId)) {
        return prev.filter(id => id !== examTypeId);
      } else {
        return [...prev, examTypeId];
      }
    });
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load card details
        const { data: cardData, error: cardError } = await supabase
          .from('flashcards')
          .select('*')
          .eq('id', cardId)
          .single();

        if (cardError) throw cardError;
        
        if (!cardData) {
          throw new Error('Card not found');
        }

        // Prevent editing official cards
        if (cardData.is_official) {
          showToast('Official flashcards cannot be edited', 'error');
          navigate('/flashcards/collections');
          return;
        }

        // Set card details
        setQuestion(cardData.question);
        setAnswer(cardData.answer);
        setOriginalQuestion(cardData.question);
        setOriginalAnswer(cardData.answer);

        // Load all collections for selection
        const { data: allCollections, error: collectionsError } = await supabase
          .from('collections')
          .select('id, title')
          .order('title');
          
        if (collectionsError) throw collectionsError;
        setCollections(allCollections || []);

        // Load all subjects
        const { data: allSubjects, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name')
          .order('name');
          
        if (subjectsError) throw subjectsError;
        setSubjects(allSubjects || []);

        // Load all exam types
        const { data: allExamTypes, error: examTypesError } = await supabase
          .from('exam_types')
          .select('id, name')
          .order('name');
          
        if (examTypesError) throw examTypesError;
        setExamTypes(allExamTypes || []);

        // Load collections associated with this flashcard
        const { data: cardCollections, error: cardCollectionsError } = await supabase
          .from('flashcard_collections_junction')
          .select('collection_id')
          .eq('flashcard_id', cardId);
          
        if (cardCollectionsError) throw cardCollectionsError;
        
        const collectionIds = cardCollections?.map(item => item.collection_id) || [];
        setSelectedCollections(collectionIds);
        setOriginalCollections([...collectionIds]);

        // Load subjects directly associated with this flashcard
        const { data: cardSubjects, error: cardSubjectsError } = await supabase
          .from('flashcard_subjects')
          .select('subject_id')
          .eq('flashcard_id', cardId);
          
        if (cardSubjectsError) throw cardSubjectsError;
        
        const subjectIds = cardSubjects?.map(item => item.subject_id) || [];
        setSelectedSubjects(subjectIds);
        setOriginalSubjects([...subjectIds]);

        // Load exam types associated with this flashcard
        const { data: cardExamTypes, error: cardExamTypesError } = await supabase
          .from('flashcard_exam_types')
          .select('exam_type_id')
          .eq('flashcard_id', cardId);
          
        if (cardExamTypesError) throw cardExamTypesError;
        
        const examTypeIds = cardExamTypes?.map(item => item.exam_type_id) || [];
        setSelectedExamTypes(examTypeIds);
        setOriginalExamTypes([...examTypeIds]);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [cardId]);

  const saveChanges = async () => {
    if (!hasUnsavedChanges) return true;

    setSaving(true);
    setError(null);

    try {
      // 1. Update flashcard content
      const { error: updateError } = await supabase
        .from('flashcards')
        .update({
          question: question.trim(),
          answer: answer.trim(),
          // Always preserve the created_by field
          // This ensures ownership is maintained and prevents filter confusion
          ...(user ? { created_by: user.id } : {})
        })
        .eq('id', cardId);

      if (updateError) throw updateError;

      // 2. Update collection associations
      if (selectedCollections.sort().join(',') !== originalCollections.sort().join(',')) {
        // Delete existing associations
        const { error: deleteCollectionsError } = await supabase
          .from('flashcard_collections_junction')
          .delete()
          .eq('flashcard_id', cardId);
          
        if (deleteCollectionsError) throw deleteCollectionsError;
        
        // Add new associations
        if (selectedCollections.length > 0) {
          const collectionRecords = selectedCollections.map(collectionId => ({
            flashcard_id: cardId,
            collection_id: collectionId
          }));
          
          const { error: insertCollectionsError } = await supabase
            .from('flashcard_collections_junction')
            .insert(collectionRecords);
            
          if (insertCollectionsError) throw insertCollectionsError;
        }
      }

      // 3. Update subject associations
      if (selectedSubjects.sort().join(',') !== originalSubjects.sort().join(',')) {
        // Delete existing associations
        const { error: deleteSubjectsError } = await supabase
          .from('flashcard_subjects')
          .delete()
          .eq('flashcard_id', cardId);
          
        if (deleteSubjectsError) throw deleteSubjectsError;
        
        // Add new associations
        if (selectedSubjects.length > 0) {
          const subjectRecords = selectedSubjects.map(subjectId => ({
            flashcard_id: cardId,
            subject_id: subjectId
          }));
          
          const { error: insertSubjectsError } = await supabase
            .from('flashcard_subjects')
            .insert(subjectRecords);
            
          if (insertSubjectsError) throw insertSubjectsError;
        }
      }

      // 4. Update exam type associations
      if (selectedExamTypes.sort().join(',') !== originalExamTypes.sort().join(',')) {
        // Delete existing associations
        const { error: deleteExamTypesError } = await supabase
          .from('flashcard_exam_types')
          .delete()
          .eq('flashcard_id', cardId);
          
        if (deleteExamTypesError) throw deleteExamTypesError;
        
        // Add new associations
        if (selectedExamTypes.length > 0) {
          const examTypeRecords = selectedExamTypes.map(examTypeId => ({
            flashcard_id: cardId,
            exam_type_id: examTypeId
          }));
          
          const { error: insertExamTypesError } = await supabase
            .from('flashcard_exam_types')
            .insert(examTypeRecords);
            
          if (insertExamTypesError) throw insertExamTypesError;
        }
      }

      // Update the original state to match the current state
      setOriginalQuestion(question);
      setOriginalAnswer(answer);
      setOriginalCollections([...selectedCollections]);
      setOriginalSubjects([...selectedSubjects]);
      setOriginalExamTypes([...selectedExamTypes]);
      
      // Collect all cache keys to invalidate
      const cachesToInvalidate = [
        // Main flashcard list caches
        `flashcards-all-${user?.id || 'anonymous'}`,
        `flashcards-my-${user?.id || 'anonymous'}`,
        `flashcards-official-${user?.id || 'anonymous'}`,
        
        // Relationship caches
        'flashcard-relationships',
        
        // Mastery status cache
        `flashcard-mastery-${user?.id || 'anonymous'}`,
        
        // Progress tracking cache
        `flashcard-progress-${user?.id || 'anonymous'}`
      ];
      
      // Add collection-specific caches for both original and new collections
      // This ensures we update caches for collections that were added OR removed
      const allCollectionIds = [...new Set([...originalCollections, ...selectedCollections])];
      allCollectionIds.forEach(collectionId => {
        cachesToInvalidate.push(`flashcards-collection-${collectionId}`);
        cachesToInvalidate.push(`collection-stats-${collectionId}`);
      });
      
      // Add subject-specific caches
      const allSubjectIds = [...new Set([...originalSubjects, ...selectedSubjects])];
      allSubjectIds.forEach(subjectId => {
        cachesToInvalidate.push(`flashcards-subject-${subjectId}`);
        cachesToInvalidate.push(`subject-stats-${subjectId}`);
      });
      
      // Add exam-type specific caches
      const allExamTypeIds = [...new Set([...originalExamTypes, ...selectedExamTypes])];
      allExamTypeIds.forEach(examTypeId => {
        cachesToInvalidate.push(`flashcards-examtype-${examTypeId}`);
      });
      
      // Invalidate all collected caches
      invalidateCache(cachesToInvalidate);
      
      // DRASTIC MEASURE: Force-clear all localStorage entries that might contain this card
      // This guarantees a fresh load on next visit
      const CACHE_PREFIX = 'ask-jds-cache-';
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          try {
            const cachedData = JSON.parse(localStorage.getItem(key) || '{}');
            // If this cache contains flashcard data, clear it to be safe
            if (cachedData && 
                (cachedData.data && Array.isArray(cachedData.data)) || 
                key.includes('flashcard')) {
              console.log(`Clearing potentially stale cache: ${key}`);
              localStorage.removeItem(key);
            }
          } catch (e) {
            // If we can't parse the cache, clear it to be safe
            localStorage.removeItem(key);
          }
        }
      });
      
      setHasUnsavedChanges(false);
      showToast('Card updated successfully', 'success');
      
      return true;
    } catch (err: any) {
      setError(err.message);
      showToast(`Error: ${err.message}`, 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || !answer.trim()) {
      showToast('Question and answer cannot be empty', 'error');
      return;
    }
    
    await saveChanges();
  };

  const handleSaveAndExit = async () => {
    if (!question.trim() || !answer.trim()) {
      showToast('Question and answer cannot be empty', 'error');
      return;
    }
    
    const saved = await saveChanges();
    if (saved) {
      navigate('/flashcards/flashcards');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error || 'Card not found'} 
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
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Consolidated form container */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:border dark:border-gray-700">
          {/* Card Content Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Card Content</h2>
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
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

          {/* Collections Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Collections</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Select the collections this flashcard belongs to. A flashcard can be part of multiple collections.
            </p>
            
            <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-36 overflow-y-auto">
              {collections.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic">No collections available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {collections.map((collection) => (
                    <div key={collection.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`collection-${collection.id}`}
                        checked={selectedCollections.includes(collection.id)}
                        onChange={() => handleCollectionToggle(collection.id)}
                        className="h-4 w-4 text-[#F37022] focus:ring-[#F37022] border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label htmlFor={`collection-${collection.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {collection.title}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

          {/* Two-column layout for Subjects and Exam Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subjects Section */}
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Subjects</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Select subjects directly related to this card.
              </p>
              
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-36 overflow-y-auto">
                {subjects.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 italic">No subjects available</p>
                ) : (
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`subject-${subject.id}`}
                          checked={selectedSubjects.includes(subject.id)}
                          onChange={() => handleSubjectToggle(subject.id)}
                          className="h-4 w-4 text-[#F37022] focus:ring-[#F37022] border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label htmlFor={`subject-${subject.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {subject.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Exam Types Section */}
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Exam Types</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Select relevant exam types (MBE, MEE, etc.).
              </p>
              
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-36 overflow-y-auto">
                {examTypes.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 italic">No exam types available</p>
                ) : (
                  <div className="space-y-2">
                    {examTypes.map((examType) => (
                      <div key={examType.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`exam-type-${examType.id}`}
                          checked={selectedExamTypes.includes(examType.id)}
                          onChange={() => handleExamTypeToggle(examType.id)}
                          className="h-4 w-4 text-[#F37022] focus:ring-[#F37022] border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label htmlFor={`exam-type-${examType.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {examType.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || !hasUnsavedChanges}
              className={`flex items-center gap-2 px-6 py-2 rounded-md ${
                hasUnsavedChanges
                  ? 'bg-[#F37022] text-white hover:bg-[#E36012]' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
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