import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Rotate3D as Rotate, BookOpen, Shuffle, 
  Check, Edit, EyeOff, Eye, FileEdit, FolderCog, ChevronLeft, 
  Settings, PlusCircle, FileText, Lock, Filter, FilterX, Tag
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import Toast from '../Toast';
import useToast from '@/hooks/useFlashcardToast';
import Tooltip from '../Tooltip';
import { hasActiveSubscription } from '@/lib/subscription';
import { FlashcardPaywall } from '@/components/FlashcardPaywall';
import { useAuth } from '@/lib/auth';
import { Flashcard, Subject, ExamType, FlashcardCollection } from '@/types';

interface FilterState {
  subjects: string[];
  examTypes: string[];
  collections: string[];
  difficultyLevels: string[];
  showCommonPitfalls: boolean;
  showMastered: boolean;
}

export default function UnifiedStudyMode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  
  // Data states
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [collections, setCollections] = useState<FlashcardCollection[]>([]);
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>([]);
  
  // UI states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    subjects: [],
    examTypes: [],
    collections: [],
    difficultyLevels: [],
    showCommonPitfalls: false,
    showMastered: false
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("UnifiedStudyMode: Starting to load data...");
        setLoading(true);
        
        // Check subscription status
        if (user) {
          console.log("UnifiedStudyMode: User is logged in, checking subscription status...");
          try {
            const hasAccess = await hasActiveSubscription(user.id);
            console.log("UnifiedStudyMode: User subscription status:", hasAccess);
            setHasSubscription(hasAccess);
          } catch (subscriptionError) {
            console.error("UnifiedStudyMode: Error checking subscription:", subscriptionError);
            // Default to allowing access if there's an error with subscription check
            setHasSubscription(true);
          }
        } else {
          console.log("UnifiedStudyMode: No user logged in, setting hasSubscription to false");
          setHasSubscription(false);
        }
        
        // Load collections
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('collections')
          .select('*');
          
        if (collectionsError) {
          console.error("UnifiedStudyMode: Error loading collections:", collectionsError);
          throw collectionsError;
        }
        
        setCollections(collectionsData || []);
        console.log(`UnifiedStudyMode: Loaded ${collectionsData?.length || 0} collections`);
        
        // Load subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*');
          
        if (subjectsError) {
          console.error("UnifiedStudyMode: Error loading subjects:", subjectsError);
          throw subjectsError;
        }
        
        setSubjects(subjectsData || []);
        console.log(`UnifiedStudyMode: Loaded ${subjectsData?.length || 0} subjects`);
        
        // Load exam types
        const { data: examTypesData, error: examTypesError } = await supabase
          .from('exam_types')
          .select('*');
          
        if (examTypesError) {
          console.error("UnifiedStudyMode: Error loading exam types:", examTypesError);
          throw examTypesError;
        }
        
        setExamTypes(examTypesData || []);
        console.log(`UnifiedStudyMode: Loaded ${examTypesData?.length || 0} exam types`);
        
        // Load flashcards with their relationships
        const { data: flashcardsData, error: flashcardsError } = await supabase
          .from('flashcards')
          .select(`*`);
          
        if (flashcardsError) {
          console.error("UnifiedStudyMode: Error loading flashcards:", flashcardsError);
          throw flashcardsError;
        }
        
        // Get junction table data to link flashcards to collections
        const { data: flashcardCollections, error: fcError } = await supabase
          .from('flashcard_collections_junction')
          .select(`
            flashcard_id,
            collection_id
          `);
          
        if (fcError) {
          console.error("UnifiedStudyMode: Error loading flashcard-collection relationships:", fcError);
          throw fcError;
        }
        
        // Get junction table data to link collections to subjects
        const { data: collectionSubjects, error: csError } = await supabase
          .from('collection_subjects')
          .select(`
            collection_id,
            subject_id
          `);
          
        if (csError) {
          console.error("UnifiedStudyMode: Error loading collection-subject relationships:", csError);
          throw csError;
        }
        
        // Get flashcard progress for the current user if logged in
        let progressMap = new Map();
        if (user) {
          const { data: progressData, error: progressError } = await supabase
            .from('flashcard_progress')
            .select('flashcard_id, is_mastered')
            .eq('user_id', user.id);
            
          if (progressError) {
            console.error("UnifiedStudyMode: Error loading flashcard progress:", progressError);
          } else if (progressData) {
            // Create a map for O(1) lookups
            progressMap = new Map(progressData.map(p => [p.flashcard_id, p.is_mastered]));
          }
        }
        
        // Process flashcards to include collection and subject info
        const processedCards = flashcardsData?.map(card => {
          // Find matching junction entries for this card
          const junctionEntries = flashcardCollections?.filter(fc => fc.flashcard_id === card.id) || [];
          
          // Get all the collection IDs for this card
          const cardCollectionIds = junctionEntries.map(j => j.collection_id);
          
          // Find the actual collection objects
          const cardCollections = collectionsData?.filter(c => cardCollectionIds.includes(c.id)) || [];
          
          // For each collection, find its subjects
          const collectionsWithSubjects = cardCollections.map(collection => {
            // Find subject IDs for this collection
            const subjectIdsForCollection = collectionSubjects
              ?.filter(cs => cs.collection_id === collection.id)
              .map(cs => cs.subject_id) || [];
              
            // Find the actual subject objects
            const subjectsForCollection = subjectsData?.filter(s => subjectIdsForCollection.includes(s.id)) || [];
            
            return {
              ...collection,
              subjects: subjectsForCollection
            };
          });
          
          // Get mastery status from the progress map
          const isMastered = progressMap.get(card.id) || false;
          
          return {
            ...card,
            is_mastered: isMastered,
            collections: collectionsWithSubjects
          };
        }) || [];
        
        setCards(processedCards);
        
        // Apply filters to determine which cards to actually show
        applyFilters(processedCards);
        
      } catch (err: any) {
        console.error('UnifiedStudyMode: Error loading study data:', err);
        setError(err.message);
      } finally {
        console.log("UnifiedStudyMode: Finished loading data, setting loading to false");
        setLoading(false);
      }
    };
    
    console.log("UnifiedStudyMode: Running effect to load data");
    loadData();
  }, [user]);

  // Define the applyFilters function
  const applyFilters = (cardsToFilter: Flashcard[]) => {
    console.log("UnifiedStudyMode: Applying initial filters");
    
    let filtered = [...cardsToFilter];
    
    // Filter by subjects
    if (filters.subjects.length > 0) {
      filtered = filtered.filter(card => 
        card.subjects && card.subjects.some(subject => 
          filters.subjects.includes(subject.id)
        )
      );
    }
    
    // Filter by exam types
    if (filters.examTypes.length > 0) {
      filtered = filtered.filter(card => 
        card.exam_types && card.exam_types.some(examType => 
          filters.examTypes.includes(examType.id)
        )
      );
    }
    
    // Filter by collections
    if (filters.collections.length > 0) {
      filtered = filtered.filter(card => 
        card.collections && card.collections.some(collection => 
          filters.collections.includes(collection.id)
        )
      );
    }
    
    // Filter by difficulty levels
    if (filters.difficultyLevels.length > 0) {
      filtered = filtered.filter(card => 
        filters.difficultyLevels.includes(card.difficulty_level || 'medium')
      );
    }
    
    // Filter by common pitfalls
    if (filters.showCommonPitfalls) {
      filtered = filtered.filter(card => card.is_common_pitfall);
    }
    
    // Filter by mastered status
    if (!filters.showMastered) {
      filtered = filtered.filter(card => !card.is_mastered);
    }
    
    console.log(`UnifiedStudyMode: Filtered ${cardsToFilter.length} cards down to ${filtered.length} cards`);
    setFilteredCards(filtered);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  // Apply filters whenever filters state changes
  useEffect(() => {
    if (cards.length === 0) return;
    
    console.log("UnifiedStudyMode: Applying filters from useEffect", filters);
    applyFilters(cards);
  }, [filters, cards]);

  // Card navigation functions
  const shuffleCards = () => {
    const shuffled = [...filteredCards]
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    setFilteredCards(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const goToNextCard = () => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const goToPreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const markAsMastered = async () => {
    if (!user) {
      showToast('Please sign in to mark cards as mastered', 'error');
      return;
    }
    
    if (filteredCards.length === 0 || currentIndex >= filteredCards.length) {
      return;
    }
    
    const currentCard = filteredCards[currentIndex];
    
    if (currentCard.is_mastered) {
      return;
    }
    
    try {
      // Update Supabase
      const { error } = await supabase
        .from('flashcards')
        .update({ is_mastered: true })
        .eq('id', currentCard.id);

      if (error) {
        throw error;
      }
      
      // Show toast notification
      showToast('Card marked as mastered', 'success');
      
      // Update local state
      const newCards = cards.map(card => 
        card.id === currentCard.id ? { ...card, is_mastered: true } : card
      );
      setCards(newCards);
      
      if (!filters.showMastered) {
        // If not showing mastered cards, remove it from filtered list
        const newFiltered = filteredCards.filter((_, i) => i !== currentIndex);
        setFilteredCards(newFiltered);
        
        // Adjust current index if needed
        if (currentIndex >= newFiltered.length) {
          setCurrentIndex(Math.max(0, newFiltered.length - 1));
        }
      } else {
        // Just update the card in the filtered array
        const newFiltered = [...filteredCards];
        newFiltered[currentIndex] = { ...currentCard, is_mastered: true };
        setFilteredCards(newFiltered);
      }
    } catch (err: any) {
      console.error("Error in markAsMastered:", err);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const unmarkAsMastered = async () => {
    if (!user) {
      showToast('Please sign in to change card status', 'error');
      return;
    }
    
    if (filteredCards.length === 0 || currentIndex >= filteredCards.length) {
      return;
    }
    
    const currentCard = filteredCards[currentIndex];
    
    if (!currentCard.is_mastered) {
      return;
    }
    
    try {
      // Update Supabase
      const { error } = await supabase
        .from('flashcards')
        .update({ is_mastered: false })
        .eq('id', currentCard.id);

      if (error) {
        throw error;
      }
      
      // Show toast notification
      showToast('Card unmarked as mastered', 'success');
      
      // Update local state
      const newCards = cards.map(card => 
        card.id === currentCard.id ? { ...card, is_mastered: false } : card
      );
      setCards(newCards);
      
      // Update filtered cards
      const newFiltered = [...filteredCards];
      newFiltered[currentIndex] = { ...currentCard, is_mastered: false };
      setFilteredCards(newFiltered);
    } catch (err: any) {
      console.error("Error in unmarkAsMastered:", err);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleShowPaywall = () => {
    setShowPaywall(true);
  };
  
  const handleClosePaywall = () => {
    setShowPaywall(false);
    navigate('/flashcards/collections');
  };

  const resetFilters = () => {
    setFilters({
      subjects: [],
      examTypes: [],
      collections: [],
      difficultyLevels: [],
      showCommonPitfalls: false,
      showMastered: false
    });
  };

  // Render function
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading flashcards...</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a moment</p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error || 'An error occurred while loading flashcards'} 
      />
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/flashcards/collections" className="text-[#F37022] hover:text-[#E36012] flex items-center mb-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1">Back to Collections</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Unified Study Mode</h1>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No flashcards available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            There are no flashcards to study. Please add some cards to get started.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to="/flashcards/create-flashcard"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Create Flashcards
              </Link>
            ) : (
              <Link
                to="/auth"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Sign In to Create Cards
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (filteredCards.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/flashcards/collections" className="text-[#F37022] hover:text-[#E36012] flex items-center mb-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1">Back to Collections</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Unified Study Mode</h1>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No matching flashcards
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            There are no flashcards that match your current filters. Please adjust your filters to see more cards.
          </p>
          
          <button
            onClick={resetFilters}
            className="bg-[#F37022] text-white px-4 py-2 rounded-md hover:bg-[#E36012]"
          >
            Reset Filters
          </button>
        </div>
      </div>
    );
  }

  const currentCard = filteredCards[currentIndex];
  
  // Determine if the current card should be premium blurred:
  // 1. Card is official/premium
  // 2. User doesn't have subscription
  // 3. Card was NOT created by the current user (user-created cards should always be visible to that user)
  const isUserCard = currentCard && user && currentCard.created_by === user.id;
  const isPremiumBlurred = currentCard && currentCard.is_official && !hasSubscription && !isUserCard;

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
      
      {showPaywall && (
        <FlashcardPaywall onCancel={handleClosePaywall} />
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/flashcards" className="text-[#F37022] hover:text-[#E36012] flex items-center mb-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1">Back to Flashcards</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unified Study Mode</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'} • 
            {currentIndex + 1} of {filteredCards.length}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Tooltip text={showFilters ? "Hide filters" : "Show filters"} position="top">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-600 dark:text-gray-400 hover:text-[#F37022] dark:hover:text-[#F37022]"
            >
              {showFilters ? <FilterX className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
            </button>
          </Tooltip>
          <Tooltip text={filters.showMastered ? "Hide mastered cards" : "Show all cards"} position="top">
            <button
              onClick={() => handleFilterChange('showMastered', !filters.showMastered)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {filters.showMastered ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </Tooltip>
          <Tooltip text="Shuffle cards" position="top">
            <button
              onClick={shuffleCards}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Shuffle className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-4 mb-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
            <button
              onClick={resetFilters}
              className="text-[#F37022] hover:text-[#E36012] text-sm"
            >
              Reset All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subjects Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subjects
              </label>
              <select
                multiple
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filters.subjects}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  handleFilterChange('subjects', options);
                }}
              >
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Collections Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Collections
              </label>
              <select
                multiple
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filters.collections}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  handleFilterChange('collections', options);
                }}
              >
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Exam Types Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Exam Types
              </label>
              <select
                multiple
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filters.examTypes}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  handleFilterChange('examTypes', options);
                }}
              >
                {examTypes.map(examType => (
                  <option key={examType.id} value={examType.id}>
                    {examType.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Difficulty Levels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                multiple
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filters.difficultyLevels}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  handleFilterChange('difficultyLevels', options);
                }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="common-pitfalls"
              checked={filters.showCommonPitfalls}
              onChange={(e) => handleFilterChange('showCommonPitfalls', e.target.checked)}
              className="h-4 w-4 text-[#F37022] focus:ring-[#F37022] border-gray-300 rounded"
            />
            <label htmlFor="common-pitfalls" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Show only common pitfalls
            </label>
          </div>
        </div>
      )}

      {/* Flashcard Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden relative" style={{ isolation: 'isolate' }}>
        {isPremiumBlurred && (
          <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-5 font-bold">
            PREMIUM CONTENT - SUBSCRIPTION REQUIRED
          </div>
        )}
        
        {/* Card metadata tags */}
        <div className="px-8 pt-4 flex flex-wrap gap-2">
          {/* Subject tags */}
          {currentCard?.subjects?.map(subject => (
            <span key={subject.id} className="inline-flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">
              <BookOpen className="h-3 w-3 mr-1" />
              {subject.name}
            </span>
          ))}
          
          {/* Collection tags */}
          {currentCard?.collections?.map(collection => (
            <span key={collection.id} className="inline-flex items-center bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded">
              <Tag className="h-3 w-3 mr-1" />
              {collection.title}
            </span>
          ))}
          
          {/* Exam type tags */}
          {currentCard?.exam_types?.map(examType => (
            <span key={examType.id} className="inline-flex items-center bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded">
              <FileText className="h-3 w-3 mr-1" />
              {examType.name}
            </span>
          ))}
          
          {/* Difficulty tag */}
          {currentCard?.difficulty_level && (
            <span className={`inline-flex items-center text-xs px-2 py-1 rounded ${
              currentCard.difficulty_level === 'easy' 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                : currentCard.difficulty_level === 'medium'
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {currentCard.difficulty_level.charAt(0).toUpperCase() + currentCard.difficulty_level.slice(1)} Difficulty
            </span>
          )}
          
          {/* Common pitfall tag */}
          {currentCard?.is_common_pitfall && (
            <span className="inline-flex items-center bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded">
              Common Pitfall
            </span>
          )}
          
          {/* Official content tag */}
          {currentCard?.is_official && (
            <span className="inline-flex items-center bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs px-2 py-1 rounded">
              Official Content
            </span>
          )}
        </div>
        
        <div className="p-8 flex flex-col">
          <div
            className="min-h-[250px] flex items-center justify-center cursor-pointer"
            onClick={toggleAnswer}
            style={{ zIndex: 5 }}
          >
            <div className="text-center w-full">
              {isPremiumBlurred && showAnswer ? (
                <div className="premium-content-placeholder mt-6">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-6 rounded-lg">
                    <div className="flex flex-col items-center gap-4">
                      <Lock className="h-12 w-12 text-orange-500 dark:text-orange-400" />
                      <h2 className="text-2xl font-semibold text-orange-800 dark:text-orange-300">Premium Flashcard</h2>
                      <p className="text-orange-700 dark:text-orange-300 max-w-md mx-auto">
                        The answer is only available to premium subscribers.
                      </p>
                      <div className="mt-2">
                        <button
                          onClick={handleShowPaywall}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          Upgrade to Premium
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {showAnswer ? currentCard.answer : currentCard.question}
                </h2>
              )}
            </div>
          </div>
          
          <div className="text-center mt-4">
            <button
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-2 mx-auto"
              onClick={toggleAnswer}
              disabled={false}
            >
              <Rotate className="h-5 w-5" />
              {showAnswer ? 'Show Question' : 'Show Answer'}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 px-8 py-4 flex justify-between items-center relative" style={{ isolation: 'isolate', zIndex: 1 }}>
          <button
            onClick={goToPreviousCard}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          >
            <ArrowLeft className="h-5 w-5" />
            Previous
          </button>

          <div className="flex items-center gap-3" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 50 }}>
            {!currentCard.is_mastered && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  markAsMastered();
                }}
                type="button"
                className="bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-700 cursor-pointer flex items-center gap-1 px-3 py-1 rounded-md font-medium"
              >
                <Check className="h-4 w-4" />
                Mark Mastered
              </button>
            )}
            
            {currentCard.is_mastered && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  unmarkAsMastered();
                }}
                type="button"
                className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 cursor-pointer flex items-center gap-1 px-3 py-1 rounded-md"
              >
                <Check className="h-4 w-4" />
                Undo Mastered
              </button>
            )}
          </div>

          <button
            onClick={goToNextCard}
            disabled={currentIndex === filteredCards.length - 1}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          >
            Next
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 