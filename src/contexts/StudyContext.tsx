import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { hasActiveSubscription } from '@/lib/subscription';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Flashcard, loadStudyData } from '@/lib/studyDataLoader';

// Define study modes
export type StudyMode = 'subject' | 'collection' | 'unified';

// Define context type
interface StudyContextType {
  // Study mode state
  studyMode: StudyMode;
  studyId: string | null;
  allCards: Flashcard[];
  filteredCards: Flashcard[];
  currentIndex: number;
  showAnswer: boolean;
  loading: boolean;
  error: Error | null;
  hasSubscription: boolean;
  studyComplete: boolean;
  
  // Filter state
  filters: {
    subjects: string[];
    collections: string[];
    examTypes: string[];
    difficulty: string[];
    showMastered: boolean;
    searchQuery: string;
  };
  
  // Available relationships data for filtering
  subjects: { id: string; name: string }[];
  collections: { id: string; title: string }[];
  examTypes: { id: string; name: string }[];
  
  // Progress stats
  studyStats: {
    correct: number;
    incorrect: number;
    mastered: number;
    remaining: number;
    total: number;
  };
  
  // Actions
  setStudyParams: (mode: StudyMode, id: string | null, initialFilters?: any) => void;
  toggleShowAnswer: () => void;
  markCorrect: () => void;
  markIncorrect: () => void;
  nextCard: () => void;
  prevCard: () => void;
  toggleMastered: () => void;
  shuffleCards: () => void;
  
  // Filter actions
  updateFilters: (newFilters: any) => void;
  
  // Helper functions
  checkSubscription: () => void;
  getCurrentCard: () => Flashcard | null;
  startNewSession: () => void;
}

// Create context
const StudyContext = createContext<StudyContextType | undefined>(undefined);

// Provider component
export function StudyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Core state
  const [studyMode, setStudyMode] = useState<StudyMode>('unified');
  const [studyId, setStudyId] = useState<string | null>(null);
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [studyComplete, setStudyComplete] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    subjects: [] as string[],
    collections: [] as string[],
    examTypes: [] as string[],
    difficulty: [] as string[],
    showMastered: true,
    searchQuery: '',
  });
  
  // Available relationships for filtering
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [collections, setCollections] = useState<{ id: string; title: string }[]>([]);
  const [examTypes, setExamTypes] = useState<{ id: string; name: string }[]>([]);
  
  // Stats tracking
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  
  // Check if user has an active subscription
  const checkSubscription = useCallback(async () => {
    if (!user) {
      setHasSubscription(false);
      return;
    }
    
    try {
      const hasAccess = await hasActiveSubscription(user.id);
      setHasSubscription(hasAccess);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setHasSubscription(false);
    }
  }, [user]);
  
  // Initialize study session
  const setStudyParams = useCallback(async (mode: StudyMode, id: string | null, initialFilters?: any) => {
    setLoading(true);
    setError(null);
    setStudyMode(mode);
    setStudyId(id);
    setCurrentIndex(0);
    setShowAnswer(false);
    setStudyComplete(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    
    // Initialize filters
    if (initialFilters) {
      setFilters(prev => ({
        ...prev,
        ...initialFilters
      }));
    }
    
    try {
      const data = await loadStudyData(mode, user?.id || null, id);
      
      // Set cards and related data
      setAllCards(data.cards || []);
      
      // Set filter options
      if (data.subjects) setSubjects(data.subjects);
      if (data.collections) setCollections(data.collections);
      if (data.examTypes) setExamTypes(data.examTypes);
      
      // Apply filters
      // This will happen in a useEffect that watches filters and allCards
    } catch (err: any) {
      console.error('Error loading study data:', err);
      setError(err);
      toast.error(`Error: ${err.message || 'Failed to load study data'}`);
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Apply filters to cards
  useEffect(() => {
    if (allCards.length === 0) {
      setFilteredCards([]);
      return;
    }
    
    let results = [...allCards];
    
    // Filter by mastery
    if (!filters.showMastered) {
      results = results.filter(card => !card.is_mastered);
    }
    
    // Filter by subjects
    if (filters.subjects.length > 0) {
      results = results.filter(card => {
        // Check if card has subjects that match any in the filter
        return card.subjects?.some(subject => 
          filters.subjects.includes(subject.id)
        );
      });
    }
    
    // Filter by collections
    if (filters.collections.length > 0) {
      results = results.filter(card => {
        if (card.collection_id) {
          return filters.collections.includes(card.collection_id);
        }
        return card.collections?.some(collection => 
          filters.collections.includes(collection.id)
        );
      });
    }
    
    // Filter by exam types
    if (filters.examTypes.length > 0) {
      results = results.filter(card => {
        return card.exam_types?.some(examType => 
          filters.examTypes.includes(examType.id)
        );
      });
    }
    
    // Filter by difficulty
    if (filters.difficulty.length > 0) {
      results = results.filter(card => {
        return card.difficulty_level && filters.difficulty.includes(card.difficulty_level);
      });
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      results = results.filter(card => {
        return (
          card.question.toLowerCase().includes(query) ||
          card.answer.toLowerCase().includes(query)
        );
      });
    }
    
    setFilteredCards(results);
    
    // Reset current index if we're beyond the bounds of the filtered cards
    if (currentIndex >= results.length) {
      setCurrentIndex(Math.max(0, results.length - 1));
    }
  }, [allCards, filters, currentIndex]);
  
  // Update filters
  const updateFilters = useCallback((newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);
  
  // Toggle showing the answer
  const toggleShowAnswer = useCallback(() => {
    setShowAnswer(prev => !prev);
  }, []);
  
  // Mark card as correct
  const markCorrect = useCallback(() => {
    setCorrectCount(prev => prev + 1);
    
    // Save progress to database if user is logged in
    if (user && filteredCards.length > 0) {
      const card = filteredCards[currentIndex];
      
      // If this card already has progress, update it
      if (card.progress?.id) {
        supabase
          .from('flashcard_progress')
          .update({
            last_correct: new Date().toISOString(),
            last_reviewed: new Date().toISOString(),
            correct_count: (card.progress.correct_count || 0) + 1,
          })
          .eq('id', card.progress.id)
          .then(({ error }) => {
            if (error) console.error('Error updating progress:', error);
          });
      } else {
        // Create new progress entry
        supabase
          .from('flashcard_progress')
          .insert({
            user_id: user.id,
            flashcard_id: card.id,
            last_correct: new Date().toISOString(),
            last_reviewed: new Date().toISOString(),
            correct_count: 1,
            is_mastered: card.is_mastered,
          })
          .then(({ error }) => {
            if (error) console.error('Error creating progress:', error);
          });
      }
    }
  }, [user, filteredCards, currentIndex]);
  
  // Mark card as incorrect
  const markIncorrect = useCallback(() => {
    setIncorrectCount(prev => prev + 1);
    
    // Save progress to database if user is logged in
    if (user && filteredCards.length > 0) {
      const card = filteredCards[currentIndex];
      
      // If this card already has progress, update it
      if (card.progress?.id) {
        supabase
          .from('flashcard_progress')
          .update({
            last_incorrect: new Date().toISOString(),
            last_reviewed: new Date().toISOString(),
            incorrect_count: (card.progress.incorrect_count || 0) + 1,
          })
          .eq('id', card.progress.id)
          .then(({ error }) => {
            if (error) console.error('Error updating progress:', error);
          });
      } else {
        // Create new progress entry
        supabase
          .from('flashcard_progress')
          .insert({
            user_id: user.id,
            flashcard_id: card.id,
            last_incorrect: new Date().toISOString(),
            last_reviewed: new Date().toISOString(),
            incorrect_count: 1,
            is_mastered: card.is_mastered,
          })
          .then(({ error }) => {
            if (error) console.error('Error creating progress:', error);
          });
      }
    }
  }, [user, filteredCards, currentIndex]);
  
  // Toggle mastery status for current card
  const toggleMastered = useCallback(() => {
    if (filteredCards.length === 0 || currentIndex >= filteredCards.length) {
      return;
    }
    
    const card = filteredCards[currentIndex];
    const newMasteredStatus = !card.is_mastered;
    
    // Update local state
    setAllCards(prev => 
      prev.map(c => 
        c.id === card.id ? { ...c, is_mastered: newMasteredStatus } : c
      )
    );
    
    // Save to database if user is logged in
    if (user) {
      // If this card already has progress, update it
      if (card.progress?.id) {
        supabase
          .from('flashcard_progress')
          .update({
            is_mastered: newMasteredStatus,
            last_reviewed: new Date().toISOString(),
          })
          .eq('id', card.progress.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating mastery status:', error);
              toast.error('Failed to update mastery status');
            }
          });
      } else {
        // Create new progress entry
        supabase
          .from('flashcard_progress')
          .insert({
            user_id: user.id,
            flashcard_id: card.id,
            is_mastered: newMasteredStatus,
            last_reviewed: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) {
              console.error('Error creating progress:', error);
              toast.error('Failed to update mastery status');
            }
          });
      }
    }
  }, [user, filteredCards, currentIndex]);
  
  // Next card
  const nextCard = useCallback(() => {
    if (currentIndex >= filteredCards.length - 1) {
      // We've reached the end of the deck
      setStudyComplete(true);
      return;
    }
    
    setCurrentIndex(prev => prev + 1);
    setShowAnswer(false);
  }, [filteredCards.length, currentIndex]);
  
  // Previous card
  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  }, [currentIndex]);
  
  // Shuffle cards
  const shuffleCards = useCallback(() => {
    // Create a shuffled copy of filtered cards
    const shuffled = [...filteredCards]
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    
    setAllCards(prev => {
      // Create a map of card IDs to easily look up cards
      const cardMap = new Map(prev.map(card => [card.id, card]));
      
      // Return new array with shuffled order
      return shuffled.map(card => cardMap.get(card.id)!);
    });
    
    // Reset to first card
    setCurrentIndex(0);
    setShowAnswer(false);
    toast.success('Cards shuffled');
  }, [filteredCards]);
  
  // Start a new study session with the same parameters
  const startNewSession = useCallback(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setStudyComplete(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    
    // Optionally shuffle cards for new session
    shuffleCards();
  }, [shuffleCards]);
  
  // Get current card
  const getCurrentCard = useCallback(() => {
    if (filteredCards.length === 0 || currentIndex >= filteredCards.length) {
      return null;
    }
    return filteredCards[currentIndex];
  }, [filteredCards, currentIndex]);
  
  // Calculate study stats
  const studyStats = useMemo(() => {
    const mastered = filteredCards.filter(card => card.is_mastered).length;
    
    return {
      correct: correctCount,
      incorrect: incorrectCount,
      mastered,
      remaining: filteredCards.length - currentIndex,
      total: filteredCards.length,
    };
  }, [filteredCards, currentIndex, correctCount, incorrectCount]);
  
  // Context value
  const contextValue: StudyContextType = {
    // State
    studyMode,
    studyId,
    allCards,
    filteredCards,
    currentIndex,
    showAnswer,
    loading,
    error,
    hasSubscription,
    studyComplete,
    filters,
    subjects,
    collections,
    examTypes,
    studyStats,
    
    // Actions
    setStudyParams,
    toggleShowAnswer,
    markCorrect,
    markIncorrect,
    nextCard,
    prevCard,
    toggleMastered,
    shuffleCards,
    updateFilters,
    
    // Helper functions
    checkSubscription,
    getCurrentCard,
    startNewSession,
  };
  
  return (
    <StudyContext.Provider value={contextValue}>
      {children}
    </StudyContext.Provider>
  );
}

// Context hook
export function useStudyContext() {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error('useStudyContext must be used within a StudyProvider');
  }
  return context;
} 