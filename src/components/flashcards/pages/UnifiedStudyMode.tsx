import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Rotate3D as Rotate, BookOpen, Shuffle, 
  Check, Edit, EyeOff, Eye, FileEdit, FolderCog, ChevronLeft, 
  Settings, PlusCircle, FileText, Lock, Filter, FilterX, Tag, Layers
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
import { useNavbar } from '../../../contexts/NavbarContext';
import { useLayoutState } from '@/hooks/useLayoutState';

interface FilterState {
  subjects: string[];
  examTypes: string[];
  collections: string[];
  difficultyLevels: string[];
  showCommonPitfalls: boolean;
  showMastered: boolean;
}

interface UnifiedStudyModeProps {
  mode?: 'subject' | 'collection' | 'unified';
  id?: string;
  subjectId?: boolean;
  collectionId?: boolean;
}

export default function UnifiedStudyMode({ mode: propMode, id: propId, subjectId, collectionId }: UnifiedStudyModeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { mode: routeMode, id: routeId } = useParams();
  const { toast, showToast, hideToast } = useToast();
  const { updateCount, updateCurrentCardIndex } = useNavbar();
  const { isDesktop } = useLayoutState();
  
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

  // Determine current study mode and ID
  useEffect(() => {
    // Parse the search params
    const searchParams = new URLSearchParams(location.search);
    const subjectParam = searchParams.get('subject');
    const collectionParam = searchParams.get('collection');
    const cardParam = searchParams.get('card');
    
    console.log('UnifiedStudyMode: URL Parameters detected:', {
      subject: subjectParam,
      collection: collectionParam,
      card: cardParam
    });
    
    // Determine the mode
    let studyMode: 'unified' | 'subject' | 'collection' = 'unified';
    let studyId: string | null = null;
    
    // Check for query parameters first
    if (subjectParam) {
      studyMode = 'subject';
      studyId = subjectParam;
      console.log(`UnifiedStudyMode: Found subject in query params: ${subjectParam}`);
    } else if (collectionParam) {
      studyMode = 'collection';
      studyId = collectionParam;
      console.log(`UnifiedStudyMode: Found collection in query params: ${collectionParam}`);
    }
    // Check for prop modes
    else if (propMode) {
      studyMode = propMode;
      studyId = propId || null;
      console.log(`UnifiedStudyMode: Using prop mode: ${propMode}, ID: ${propId || 'none'}`);
    } 
    // Check for special props
    else if (subjectId && routeId) {
      studyMode = 'subject';
      studyId = routeId;
      console.log(`UnifiedStudyMode: Using subject route param: ${routeId}`);
    }
    else if (collectionId && routeId) {
      studyMode = 'collection';
      studyId = routeId;
      console.log(`UnifiedStudyMode: Using collection route param: ${routeId}`);
    }
    // Check route params if path is like /study/:mode/:id
    else if (routeMode && routeId) {
      if (['subject', 'collection'].includes(routeMode)) {
        studyMode = routeMode as 'subject' | 'collection';
        studyId = routeId;
        console.log(`UnifiedStudyMode: Using route mode/ID: ${routeMode}/${routeId}`);
      }
    }
    // Direct route param for collection study (legacy mode)
    else if (routeId && !routeMode && location.pathname.includes('/study/')) {
      studyMode = 'collection';
      studyId = routeId;
      console.log(`UnifiedStudyMode: Using legacy collection route: ${routeId}`);
    }
    
    console.log(`UnifiedStudyMode: Determined study mode: ${studyMode}, ID: ${studyId || 'none'}`);
    
    // Set initial filters based on mode
    let initialFilters: FilterState = {
      subjects: [],
      examTypes: [],
      collections: [],
      difficultyLevels: [],
      showCommonPitfalls: false,
      showMastered: cardParam ? true : false // Always show mastered cards if a specific card was requested
    };
    
    if (studyMode === 'subject' && studyId) {
      console.log(`UnifiedStudyMode: Setting initial filter for subject: ${studyId}`);
      initialFilters.subjects = [studyId];
    } else if (studyMode === 'collection' && studyId) {
      console.log(`UnifiedStudyMode: Setting initial filter for collection: ${studyId}`);
      initialFilters.collections = [studyId];
    }
    
    // Completely replace the filters rather than merging
    setFilters(initialFilters);
    console.log(`UnifiedStudyMode: Initial filters set:`, initialFilters);
    
    // Store the card ID in sessionStorage - will be handled by our direct search mechanism
    if (cardParam) {
      console.log(`UnifiedStudyMode: Found card ID in query params: ${cardParam}`);
      sessionStorage.setItem('initialCardId', cardParam);
    }
    
  }, [propMode, propId, subjectId, collectionId, routeMode, routeId, location.pathname, location.search]);

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
        console.log("UnifiedStudyMode: Loading flashcards with relationships");
        
        // Create the filter condition safely
        let filterCondition = 'is_official.eq.true,is_public_sample.eq.true';
        if (user?.id) {
          filterCondition = `created_by.eq.${user.id},${filterCondition}`;
          console.log(`UnifiedStudyMode: Filter condition includes user ID ${user.id}`);
        } else {
          console.log('UnifiedStudyMode: No user ID available, only showing official and public flashcards');
        }
        
        console.log(`UnifiedStudyMode: Using filter condition: ${filterCondition}`);
        
        // PRIVACY FIX: Only fetch flashcards the user is allowed to see
        const { data: flashcardsData, error: flashcardsError } = await supabase
          .from('flashcards')
          .select(`*`)
          .or(filterCondition);
          
        if (flashcardsError) {
          console.error("UnifiedStudyMode: Error loading flashcards:", flashcardsError);
          throw flashcardsError;
        }
        
        console.log(`UnifiedStudyMode: Loaded ${flashcardsData?.length || 0} flashcards`);
        
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
    console.log("UnifiedStudyMode: Applying filters", filters);
    console.log(`UnifiedStudyMode: Starting with ${cardsToFilter.length} cards to filter`);
    
    let filtered = [...cardsToFilter];
    
    // Filter by subjects
    if (filters.subjects.length > 0) {
      console.log(`UnifiedStudyMode: Filtering by subjects:`, filters.subjects);
      filtered = filtered.filter(card => {
        // A card matches if any of its collections' subjects match any of the filter subjects
        if (!card.collections || card.collections.length === 0) {
          return false;
        }
        
        // Check each collection of the card
        return card.collections.some(collection => {
          // Collection must have subjects property and at least one subject
          if (!collection.subjects || collection.subjects.length === 0) {
            return false;
          }
          
          // Check if any subject in the collection matches any subject in the filter
          return collection.subjects.some(subject => 
            filters.subjects.includes(subject.id)
          );
        });
      });
      console.log(`UnifiedStudyMode: After subject filtering: ${filtered.length} cards`);
    }
    
    // Filter by exam types
    if (filters.examTypes.length > 0) {
      console.log(`UnifiedStudyMode: Filtering by exam types:`, filters.examTypes);
      filtered = filtered.filter(card => 
        card.exam_types && card.exam_types.some(examType => 
          filters.examTypes.includes(examType.id)
        )
      );
      console.log(`UnifiedStudyMode: After exam type filtering: ${filtered.length} cards`);
    }
    
    // Filter by collections
    if (filters.collections.length > 0) {
      console.log(`UnifiedStudyMode: Filtering by collections:`, filters.collections);
      filtered = filtered.filter(card => 
        card.collections && card.collections.some(collection => 
          filters.collections.includes(collection.id)
        )
      );
      console.log(`UnifiedStudyMode: After collection filtering: ${filtered.length} cards`);
    }
    
    // Filter by difficulty levels
    if (filters.difficultyLevels.length > 0) {
      console.log(`UnifiedStudyMode: Filtering by difficulty levels:`, filters.difficultyLevels);
      filtered = filtered.filter(card => 
        filters.difficultyLevels.includes(card.difficulty_level || 'medium')
      );
      console.log(`UnifiedStudyMode: After difficulty filtering: ${filtered.length} cards`);
    }
    
    // Filter by common pitfalls
    if (filters.showCommonPitfalls) {
      console.log(`UnifiedStudyMode: Filtering to show only common pitfalls`);
      filtered = filtered.filter(card => card.is_common_pitfall);
      console.log(`UnifiedStudyMode: After common pitfalls filtering: ${filtered.length} cards`);
    }
    
    // Filter by mastered status
    if (!filters.showMastered) {
      console.log(`UnifiedStudyMode: Filtering to hide mastered cards`);
      filtered = filtered.filter(card => !card.is_mastered);
      console.log(`UnifiedStudyMode: After mastery filtering: ${filtered.length} cards`);
    }
    
    console.log(`UnifiedStudyMode: Filtered ${cardsToFilter.length} cards down to ${filtered.length} cards`);
    
    if (filtered.length === 0) {
      console.log("UnifiedStudyMode: No cards match current filters:", filters);
    }
    
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
    // For non-subscribers, keep public samples at the beginning even when shuffling
    let cardsToShuffle = [...filteredCards];
    
    if (!hasSubscription) {
      // Separate public samples from regular cards
      const publicSamples = cardsToShuffle.filter(card => card.is_public_sample);
      const regularCards = cardsToShuffle.filter(card => !card.is_public_sample);
      
      // Shuffle the public samples among themselves
      const shuffledSamples = publicSamples
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
      
      // Shuffle only the regular cards
      const shuffledRegular = regularCards
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
      
      // Combine with public samples first
      setFilteredCards([...shuffledSamples, ...shuffledRegular]);
    } else {
      // Subscribers see a complete shuffle
      const shuffled = cardsToShuffle
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
      
      setFilteredCards(shuffled);
    }
    
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const goToNextCard = () => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      updateCurrentCardIndex(currentIndex + 1);
    }
  };

  const goToPreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
      updateCurrentCardIndex(currentIndex - 1);
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

  // Add a reset filters function
  const resetFilters = () => {
    // Get the current search params
    const searchParams = new URLSearchParams(location.search);
    const subjectParam = searchParams.get('subject');
    const collectionParam = searchParams.get('collection');
    
    // Create a new filter object with only the essential filters
    let newFilters: FilterState = {
      subjects: [],
      examTypes: [],
      collections: [],
      difficultyLevels: [],
      showCommonPitfalls: false,
      showMastered: true // Enable showing mastered cards by default
    };
    
    // Maintain the subject or collection filter from the URL
    if (subjectParam) {
      newFilters.subjects = [subjectParam];
    } else if (collectionParam) {
      newFilters.collections = [collectionParam];
    } else if (routeMode === 'subject' && routeId) {
      newFilters.subjects = [routeId];
    } else if (routeMode === 'collection' && routeId) {
      newFilters.collections = [routeId];
    }
    
    // Apply the new filters
    setFilters(newFilters);
    console.log("UnifiedStudyMode: Filters reset to:", newFilters);
  };

  // Add a direct search for card by ID
  const findCardDirectly = (cardId: string) => {
    console.log(`UnifiedStudyMode: DIRECT SEARCH - Looking for card: ${cardId}`);
    
    // First check in the filtered list
    let cardIndex = filteredCards.findIndex(card => card.id === cardId);
    
    if (cardIndex !== -1) {
      console.log(`UnifiedStudyMode: DIRECT SEARCH - Card found in filtered list at index ${cardIndex}`);
      return cardIndex;
    }
    
    // If not found in filtered list, we need to modify our filters to include it
    const cardData = cards.find(card => card.id === cardId);
    if (!cardData) {
      console.log(`UnifiedStudyMode: DIRECT SEARCH - Card not found in any list`);
      return -1;
    }
    
    // Find the collections this card belongs to
    if (!cardData.collections || cardData.collections.length === 0) {
      console.log(`UnifiedStudyMode: DIRECT SEARCH - Card has no collections assigned`);
      return -1;
    }
    
    // Get the first collection ID
    const collectionId = cardData.collections[0].id;
    console.log(`UnifiedStudyMode: DIRECT SEARCH - Card belongs to collection ${collectionId}`);
    
    // Update filters to include all cards from this collection and show mastered cards
    setFilters({
      ...filters,
      collections: [collectionId],
      showMastered: true // Show all cards including mastered
    });
    
    // This will trigger a refilter, so return -1 for now
    console.log(`UnifiedStudyMode: DIRECT SEARCH - Updated filters, wait for refiltering`);
    return -1;
  };

  // Add URL parameter handler
  useEffect(() => {
    // Skip if loading or no cards
    if (loading || cards.length === 0) {
      return;
    }
    
    // Check URL for card ID
    const searchParams = new URLSearchParams(location.search);
    const cardParam = searchParams.get('card');
    
    if (cardParam) {
      console.log(`UnifiedStudyMode: URL has card parameter: ${cardParam}`);
      
      // Direct search for the card
      const cardIndex = findCardDirectly(cardParam);
      
      if (cardIndex !== -1) {
        console.log(`UnifiedStudyMode: Setting initial card index to ${cardIndex} from URL param`);
        setCurrentIndex(cardIndex);
      }
    }
  }, [loading, cards, location.search, filteredCards]);

  // Existing useEffect for sessionStorage - ensure this runs after the URL param handler
  useEffect(() => {
    // Only run when cards are loaded and we have filtered cards
    if (loading || filteredCards.length === 0) return;
    
    // Check if we need to show a specific card
    const initialCardId = sessionStorage.getItem('initialCardId');
    if (initialCardId) {
      console.log(`UnifiedStudyMode: Looking for initial card in session storage: ${initialCardId}`);
      
      // Direct search
      const cardIndex = findCardDirectly(initialCardId);
      
      if (cardIndex !== -1) {
        // Card found directly
        console.log(`UnifiedStudyMode: Setting card index to ${cardIndex} from session storage`);
        setCurrentIndex(cardIndex);
        sessionStorage.removeItem('initialCardId');
      }
    }
  }, [filteredCards, loading, cards]);

  // Update the navbar count when filteredCards or currentIndex changes
  useEffect(() => {
    if (filteredCards.length > 0) {
      // Update both the total count and current index
      updateCount(filteredCards.length);
      updateCurrentCardIndex(currentIndex);
    }
  }, [filteredCards.length, currentIndex, updateCount, updateCurrentCardIndex]);

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
      <div className="max-w-6xl mx-auto pb-20 md:pb-8 px-4">
        <div className="mb-8">
          {isDesktop && (
            <Link to="/flashcards/collections" className="text-[#F37022] hover:text-[#E36012] flex items-center mb-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1">Back to Collections</span>
            </Link>
          )}
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
      <div className="max-w-6xl mx-auto pb-20 md:pb-8 px-4">
        <div className="mb-8">
          {isDesktop && (
            <Link to="/flashcards/collections" className="text-[#F37022] hover:text-[#E36012] flex items-center mb-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1">Back to Collections</span>
            </Link>
          )}
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
    <div className="max-w-6xl mx-auto pb-20 md:pb-8 px-4">
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
          {isDesktop && (
            <Link to="/flashcards" className="text-[#F37022] hover:text-[#E36012] flex items-center mb-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1">Back to Flashcards</span>
            </Link>
          )}
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden relative mb-16 md:mb-4" style={{ isolation: 'isolate' }}>
        {isPremiumBlurred && (
          <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-5 font-bold">
            PREMIUM CONTENT - SUBSCRIPTION REQUIRED
          </div>
        )}
        
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
                  {showAnswer ? currentCard?.answer : currentCard?.question}
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
            className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-3" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 50 }}>
            {currentCard && !currentCard.is_mastered && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  markAsMastered();
                }}
                type="button"
                className="bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-700 cursor-pointer flex items-center gap-1 px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-medium"
              >
                <Check className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden xs:inline">Mark Mastered</span>
                <span className="xs:hidden">Mark</span>
              </button>
            )}
            
            {currentCard && currentCard.is_mastered && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  unmarkAsMastered();
                }}
                type="button"
                className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 cursor-pointer flex items-center gap-1 px-2 md:px-3 py-1 rounded-md text-xs md:text-sm"
              >
                <Check className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden xs:inline">Undo Mastered</span>
                <span className="xs:hidden">Undo</span>
              </button>
            )}
          </div>

          <button
            onClick={goToNextCard}
            disabled={currentIndex === filteredCards.length - 1}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          >
            <span className="hidden sm:inline">Next</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 