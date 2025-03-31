import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Check, EyeOff, Eye, Trash2, Filter, BookOpen, FileEdit, Lock, FilterX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import useAuth from '@/hooks/useFlashcardAuth';
import useToast from '@/hooks/useFlashcardToast';
import LoadingSpinner from '../LoadingSpinner';
import Toast from '../Toast';
import EmptyState from '../EmptyState';
import ErrorMessage from '../ErrorMessage';
import DeleteConfirmation from '../DeleteConfirmation';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hasActiveSubscription } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { FlashcardPaywall } from '../../FlashcardPaywall';
import { useCachedData, clearCache, invalidateCache } from '@/hooks/use-cached-data';
import { useFlashcardRelationships } from '@/hooks/useFlashcardRelationships';
import FlashcardItem from '../FlashcardItem';
import { useNavbar } from '@/contexts/NavbarContext';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';

// Debug flag - set to false to disable most console logs
// Set to localStorage.getItem('enableFlashcardDebug') === 'true' to control via localStorage
const DEBUG_LOGGING = process.env.NODE_ENV === 'development' && 
                     (localStorage.getItem('enableFlashcardDebug') === 'true');

// Function to log only when debug is enabled
const debugLog = (message: string, data?: any) => {
  if (DEBUG_LOGGING) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

interface Collection {
  id: string;
  title: string;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  is_mastered: boolean;
  collection_id: string;
  created_by?: string;
  collection: {
    id: string;
    title: string;
    is_official: boolean;
    user_id: string;
    subject: {
      name: string;
      id: string;
    }
  };
}

export default function AllFlashcards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'official' | 'my'>('all');
  const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { updateTotalCardCount } = useNavbar();
  const [masteringCardId, setMasteringCardId] = useState<string | null>(null);

  // Replace regular state with persisted state
  const [showMastered, setShowMastered] = usePersistedState<boolean>('flashcards-show-mastered', true);
  const [filterSubject, setFilterSubject] = usePersistedState<string>('flashcards-filter-subject', 'all');
  const [filterCollection, setFilterCollection] = usePersistedState<string>('flashcards-filter-collection', 'all');
  const [showFilters, setShowFilters] = usePersistedState<boolean>('flashcards-show-filters', false);

  // Use the relationship hook to efficiently load and cache all relationships
  const {
    relationshipData,
    loading: relationshipsLoading,
    error: relationshipsError,
    refetch: refetchRelationships,
    enrichFlashcard
  } = useFlashcardRelationships();

  // Use cached data for subjects and collections
  const [subjects, subjectsLoading] = useCachedData<{id: string, name: string}[]>(
    'flashcard-subjects',
    async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    { expiration: 30 * 60 * 1000 } // 30 minutes cache
  );

  const [collections, collectionsLoading] = useCachedData<Collection[]>(
    'flashcard-collections',
    async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('id, title')
        .order('title');
      
      if (error) throw error;
      return data || [];
    },
    { expiration: 15 * 60 * 1000 } // 15 minutes cache
  );

  // Cache flashcards based on the current filter
  // Memoize the cache key to ensure stability
  const flashcardsCacheKey = useMemo(() => (
    `flashcards-${filter}-${user?.id || 'anonymous'}`
  ), [filter, user?.id]);
  
  const [flashcardsData, flashcardsLoading, flashcardsError, refetchFlashcards] = useCachedData<any[]>(
    flashcardsCacheKey,
    async () => {
      if (filter === 'my' && user) {
        // Get user's flashcards
        const { data, error } = await supabase
          .from('flashcards')
          .select('*')
          .eq('created_by', user.id);
          
        if (error) throw error;
        return data || [];
      } else if (filter === 'official') {
        // Get official flashcards
        // First get all official collection IDs
        const { data: officialCollections, error: ocError } = await supabase
          .from('collections')
          .select('id')
          .eq('is_official', true);
          
        if (ocError) throw ocError;
        
        if (!officialCollections || officialCollections.length === 0) {
          return [];
        }
        
        const officialCollectionIds = officialCollections.map(c => c.id);
        
        // Get flashcard IDs from junction table
        const { data: flashcardJunctions, error: fjError } = await supabase
          .from('flashcard_collections_junction')
          .select('flashcard_id')
          .in('collection_id', officialCollectionIds);
          
        if (fjError) throw fjError;
        
        if (!flashcardJunctions || flashcardJunctions.length === 0) {
          return [];
        }
        
        const flashcardIds = flashcardJunctions.map(fj => fj.flashcard_id);
        
        // Get the flashcards
      const { data, error } = await supabase
          .from('flashcards')
          .select('*')
          .in('id', flashcardIds);
          
        if (error) throw error;
        return data || [];
      } else {
        // Get all flashcards
        const { data, error } = await supabase
          .from('flashcards')
          .select('*');
          
        if (error) throw error;
        return data || [];
      }
    },
    { expiration: 5 * 60 * 1000 } // 5 minutes cache
  );

  // Cache mastery status
  const [masteryStatus, masteryLoading, masteryError, refetchMastery] = useCachedData<Record<string, boolean>>(
    `flashcard-mastery-${user?.id || 'anonymous'}`,
    async () => {
      if (!user) return {}; 
      
      const { data, error } = await supabase
        .from('flashcard_progress')
        .select('flashcard_id, is_mastered')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Convert to a map for easy lookup
      const masteryMap: Record<string, boolean> = {};
      (data || []).forEach(item => {
        masteryMap[item.flashcard_id] = item.is_mastered;
      });
      
      return masteryMap;
    },
    { expiration: 5 * 60 * 1000 } // 5 minutes cache
  );

  // Create a memoized function for processing cards to avoid recreating it on every render
  const processCards = useMemo(() => {
    return (cards: any[]) => {
      if (!cards || !cards.length) return [];
      
      return cards.map(card => {
        // Add mastery status
        const enrichedCard = {
          ...card,
          is_mastered: masteryStatus?.[card.id] || false
        };
        
        // Add relationships (collections, subjects, exam types)
        return enrichFlashcard(enrichedCard);
      });
    };
  }, [masteryStatus, enrichFlashcard]);
  
  // Modified effect to prevent infinite loops
  useEffect(() => {
    // Skip if any data is still loading
    if (flashcardsLoading || relationshipsLoading || masteryLoading) {
      setLoading(true);
      return;
    }
    
    // Skip if we don't have flashcard data
    if (!flashcardsData) {
      setAllCards([]);
      setLoading(false);
      return;
    }
    
    try {
      // Use our memoized function to process cards
      const processedCards = processCards(flashcardsData);
      setAllCards(processedCards);
    } catch (err) {
      console.error('Error processing flashcards:', err);
      setError('Error processing flashcards data');
    } finally {
      setLoading(false);
    }
  }, [flashcardsData, relationshipsLoading, masteryLoading, flashcardsLoading, processCards]);

  // Effect for handling filter changes
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && ['all', 'official', 'my'].includes(filterParam)) {
      setFilter(filterParam as 'all' | 'official' | 'my');
    }
    
    checkSubscription();
  }, [searchParams]);

  const checkSubscription = async () => {
    if (user) {
      try {
        const hasAccess = await hasActiveSubscription(user.id);
        setHasSubscription(hasAccess);
        debugLog("Subscription status updated:", hasAccess);
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasSubscription(false);
      }
    } else {
      setHasSubscription(false);
    }
  };

  // Memoize the filtered collections list
  const filteredCollections = useMemo(() => {
    if (filterSubject === 'all') {
      return collections;
    }
    
    // We need to check the collection_subjects junction table
    // Since this is a client-side filter only, we'll skip the filtering
    // and handle subject filtering elsewhere in the component
    return collections;
  }, [collections, filterSubject]);

  const handleEditCard = (card: Flashcard) => {
    navigate(`/flashcards/edit-card/${card.id}`);
  };

  // Add a handler for the Study Now button
  const handleViewCard = (card: Flashcard) => {
    // Check all possible places where collection ID might be stored
    const collectionId = card.collection_id || card.collection?.id;
    
    if (collectionId) {
      navigate(`/flashcards/study/${collectionId}`);
    } else {
      // If we still can't find a collection ID, show error
      console.error('No collection found for card:', card);
      showToast('Cannot study this card - no collection found', 'error');
    }
  };

  const toggleMastered = async (card: Flashcard) => {
    try {
      // Prevent multiple clicks on the same card
      if (masteringCardId === card.id) return;
      
      // Set loading state for this specific card
      setMasteringCardId(card.id);
      
      const newMasteredState = !card.is_mastered;
      let updateSuccessful = false;
      
      // Update in database
      if (user) {
        // First check if a record already exists for this flashcard and user
        const { data: existingRecord, error: fetchError } = await supabase
          .from('flashcard_progress')
          .select('*')
          .eq('flashcard_id', card.id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        
        let error;
        
        if (existingRecord) {
          // Update the existing record
          const { error: updateError } = await supabase
            .from('flashcard_progress')
            .update({ is_mastered: newMasteredState })
            .eq('flashcard_id', card.id)
            .eq('user_id', user.id);
          
          error = updateError;
        } else {
          // Insert a new record
          const { error: insertError } = await supabase
            .from('flashcard_progress')
            .insert({
              flashcard_id: card.id,
              user_id: user.id,
              is_mastered: newMasteredState
            });
          
          error = insertError;
        }
        
        if (error) throw error;
        updateSuccessful = true;
      }
      
      // Only update local state if server update was successful
      if (updateSuccessful) {
        // Use functional update to avoid race conditions with multiple card updates
        setAllCards(prevCards => 
          prevCards.map(c => 
            c.id === card.id ? { ...c, is_mastered: newMasteredState } : c
          )
        );
        
        // Invalidate mastery cache
        invalidateCache([`flashcard-mastery-${user?.id || 'anonymous'}`]);
        
        showToast(
          card.is_mastered ? 'Card unmarked as mastered' : 'Card marked as mastered', 
          'success'
        );
      }
    } catch (err: any) {
      console.error('Error toggling mastered state:', err);
      showToast(`Error updating card status. Please try again.`, 'error');
      
      // Refresh cards to ensure UI is in sync
      refetchFlashcards();
      refetchMastery();
    } finally {
      setMasteringCardId(null);
    }
  };

  const deleteCard = async () => {
    if (!cardToDelete) return;
    
    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardToDelete.id);
      
      if (error) throw error;
      
      // Update local state
      setAllCards(allCards.filter(c => c.id !== cardToDelete.id));
      
      // Invalidate caches that might contain this card
      invalidateCache([
        `flashcards-all-${user?.id || 'anonymous'}`,
        `flashcards-my-${user?.id || 'anonymous'}`,
        `flashcards-official-${user?.id || 'anonymous'}`,
        'flashcard-relationships'
      ]);
      
      showToast('Card deleted successfully', 'success');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setCardToDelete(null);
    }
  };

  const handleFilterChange = (newFilterValue: string) => {
    debugLog('Filter changed to:', newFilterValue);
    const newFilter = newFilterValue as 'all' | 'official' | 'my';
    
    // Update the filter state
    setFilter(newFilter);
    
    // Update URL params
    searchParams.set('filter', newFilter);
    setSearchParams(searchParams);
  };

  // Force premium content protection for testing - DISABLED
  const forcePremiumTest = false;

  // Check if a card is premium content
  const isCardPremium = useCallback((card: Flashcard) => {
    // User's own cards are NEVER premium, regardless of other settings
    if (user && card.collection?.user_id === user.id) {
      return false;
    }
    
    // User created cards are NEVER premium
    if (user && (card.created_by === user.id || String(card.created_by) === String(user.id))) {
      return false;
    }
    
    // Cards shown in the "My" filter tab should never be premium
    if (filter === 'my') {
        return false;
    }
      
    // Only official collections can have premium cards
    return card.collection?.is_official === true && !forcePremiumTest && !hasSubscription;
  }, [filter, user, hasSubscription, forcePremiumTest]);

  // Create a memoized filteredCards array that updates when dependencies change
  const filteredCards = useMemo(() => {
    // Only log at a high level rather than per-card
    debugLog('Filtering cards:', {
      totalCards: allCards.length,
      filter,
      subject: filterSubject,
      collection: filterCollection,
      showMastered
    });

    // First apply basic filters that apply to all tabs
    const basicFiltered = allCards.filter(card => {
      // Filter by mastered status
      if (!showMastered && card.is_mastered) {
        return false;
      }
      
      // Filter by subject
      if (filterSubject !== 'all' && card.collection?.subject?.id !== filterSubject) {
        return false;
      }
      
      // Filter by collection
      if (filterCollection !== 'all' && card.collection_id !== filterCollection) {
        return false;
      }
      
      return true;
    });
    
    // Now apply the tab-specific filtering with clear separation
    if (filter === 'official') {
      // Debug log official cards - log counts only, not individual cards
      debugLog('Official tab filtering:', {
        before: basicFiltered.length,
        isPremiuResults: basicFiltered.filter(card => isCardPremium(card)).length,
        isOfficialResults: basicFiltered.filter(card => card.collection?.is_official === true).length,
        hasSubscription: hasSubscription,
        forceSubscriptionLS: process.env.NODE_ENV === 'development' ? localStorage.getItem('forceSubscription') : null
      });
      
      // Premium tab: Show all official cards if user has a subscription
      // or only premium official cards if user doesn't have a subscription
      return basicFiltered.filter(card => {
        const isPremium = isCardPremium(card); 
        const isOfficial = card.collection?.is_official === true;
        const isUserOwned = user && card.collection?.user_id === user.id;
        const isUserCreated = user && (
          card.created_by === user.id || 
          String(card.created_by) === String(user.id)
        );
        
        // If user has a subscription, show all official cards
        if (hasSubscription) {
          return isOfficial && !isUserOwned && !isUserCreated;
        }
        
        // Otherwise, only show premium official cards
        return isPremium && isOfficial && !isUserOwned && !isUserCreated;
      });
    }
    
    if (filter === 'my' && user) {
      // Debug log only general info about my cards
      debugLog('My tab filtering:', {
        before: basicFiltered.length,
        userOwnedResults: basicFiltered.filter(card => user && card.collection?.user_id === user.id).length,
        userCreatedResults: basicFiltered.filter(card => 
          user && (card.created_by === user.id || String(card.created_by) === String(user.id))
        ).length
      });
      
      // My tab: ONLY show user-created or user-owned cards
      // Explicitly exclude any official/premium cards that the user doesn't own
      return basicFiltered.filter(card => {
        const isUserOwned = user && card.collection?.user_id === user.id;
        const isUserCreated = user && (
          card.created_by === user.id || 
          String(card.created_by) === String(user.id)
        );
        
        // Only include cards that are user-owned or user-created
        return isUserOwned || isUserCreated;
      });
    }
    
    // For 'all' tab, show all cards that passed the basic filters
    return basicFiltered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards, filter, filterSubject, filterCollection, showMastered, isCardPremium, user]);

  // Replace debug effects with a ref-based logger to prevent re-renders
  const prevFilterStateRef = useRef({ 
    filter, 
    allCardsLength: allCards.length, 
    filteredCardsLength: 0,
    showMastered
  });
  
  // Use a single effect for all logging to reduce render cycles
  useEffect(() => {
    // Skip during loading or if debug is disabled
    if (loading || !DEBUG_LOGGING) return;
    
    // Save current filtered length
    const currentFilteredLength = filteredCards.length;
    prevFilterStateRef.current.filteredCardsLength = currentFilteredLength;
    
    // Log filter state changes when they actually change
    if (
      prevFilterStateRef.current.filter !== filter ||
      prevFilterStateRef.current.allCardsLength !== allCards.length ||
      prevFilterStateRef.current.filteredCardsLength !== currentFilteredLength
    ) {
      debugLog('Filter state changed:', { 
        filter,
        totalCards: allCards.length,
        filteredCards: currentFilteredLength
      });
    }
    
    // Log show mastered changes
    if (prevFilterStateRef.current.showMastered !== showMastered) {
      debugLog(`Filter applied: showMastered=${showMastered}, found ${currentFilteredLength} matching cards`);
    }
    
    // Update the previous state reference
    prevFilterStateRef.current = {
      filter,
      allCardsLength: allCards.length,
      filteredCardsLength: currentFilteredLength,
      showMastered
    };
  }, [filter, allCards.length, filteredCards.length, showMastered, loading]);

  // Keep the simplified schema check effect
  useEffect(() => {
    // Only run this check once on initial component mount
    if (user && !initialLoadComplete) {
      supabase
        .from('flashcards')
        .select('*')
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setInitialLoadComplete(true);
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Update the card count in the navbar when filtered cards change
  useEffect(() => {
    if (!loading) {
      updateTotalCardCount(filteredCards.length);
    }
  }, [filteredCards.length, updateTotalCardCount, loading]);

  const handleShowPaywall = () => {
    setShowPaywall(true);
  };
  
  const handleClosePaywall = () => {
    setShowPaywall(false);
  };

  // Add back the handleToggleMastered function
  const handleToggleMastered = () => {
    setShowMastered(!showMastered);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <TooltipProvider>
      <div className="max-w-6xl mx-auto pb-20 md:pb-8 px-4">
        {/* Toast notification */}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={hideToast} 
          />
        )}
        
        {/* Delete Confirmation Modal */}
        {cardToDelete && (
        <DeleteConfirmation
          isOpen={!!cardToDelete}
          onClose={() => setCardToDelete(null)}
          onConfirm={deleteCard}
          title="Delete Flashcard"
          message="Are you sure you want to delete this flashcard? This action cannot be undone."
          itemName={cardToDelete?.question}
        />
        )}
        
        {/* Paywall Modal */}
        {showPaywall && (
          <FlashcardPaywall onCancel={handleClosePaywall} />
        )}
        
        {/* Desktop header with title and count - hidden on mobile */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'}
              </p>
            </div>
            
            {/* Filter controls - desktop */}
            <div className="flex items-center gap-3">
              <Tooltip text={showFilters ? "Hide filters" : "Show filters"} position="top">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F37022]"
                >
                  {showFilters ? <FilterX className="mr-2 h-4 w-4" /> : <Filter className="mr-2 h-4 w-4" />}
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
              </Tooltip>
              <Tooltip text={showMastered ? "Hide mastered cards" : "Show all cards"} position="top">
                <button
                  onClick={handleToggleMastered}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F37022]"
                  aria-label={showMastered ? "Hide mastered cards" : "Show all cards"}
                >
                  {showMastered ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showMastered ? "Hide Mastered" : "Show All"}
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="w-[340px]">
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
                    My Cards
                  </TabsTrigger>
                </TabsList>
              </Tabs>
          </div>
        </div>

        {/* Mobile layout - only filter tabs */}
        <div className="md:hidden mb-6">
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
                My Cards
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile filter controls */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F37022]"
          >
            {showFilters ? <FilterX className="mr-2 h-4 w-4" /> : <Filter className="mr-2 h-4 w-4" />}
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <button
            onClick={handleToggleMastered}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F37022]"
            aria-label={showMastered ? "Hide mastered cards" : "Show all cards"}
          >
            {showMastered ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showMastered ? "Hide Mastered" : "Show All"}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 dark:border dark:border-gray-700">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Subject
                </label>
                <select
                  id="subject-filter"
                  value={filterSubject}
                  onChange={(e) => {
                    setFilterSubject(e.target.value);
                    setFilterCollection('all'); // Reset collection filter when subject changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="collection-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Collection
                </label>
                <select
                  id="collection-filter"
                  value={filterCollection}
                  onChange={(e) => setFilterCollection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                >
                  <option value="all">All Collections</option>
                  {filteredCollections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters and cards display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!loading && filteredCards.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              {filter === 'my' ? (
                <EmptyState 
                  icon={<FileText size={48} />}
                  title="No Flashcards Found" 
                  description="You haven't created any flashcards yet or they're being filtered out. Try creating your first flashcard or checking your filter settings."
                  actionText="Create a Flashcard"
                  actionLink="/flashcards/create-flashcard-select"
                />
              ) : (
                <EmptyState 
                  icon={<FileText size={48} />}
                  title="No Flashcards Found" 
                  description="No flashcards match your current filters. Try adjusting your filter settings."
                  actionText={filter === 'official' && !hasActiveSubscription ? 
                    "Get Premium for Official Flashcards" : "Create a Flashcard"}
                  actionLink={filter === 'official' && !hasActiveSubscription ? 
                    undefined : "/flashcards/create-flashcard-select"}
                  onActionClick={filter === 'official' && !hasActiveSubscription ? 
                    handleShowPaywall : undefined}
                />
              )}
            </div>
          ) : (
            filteredCards.map((card) => (
              <FlashcardItem
                key={card.id}
                flashcard={card}
                onToggleMastered={toggleMastered}
                onEdit={handleEditCard}
                onDelete={setCardToDelete}
                onView={handleViewCard}
                isPremium={isCardPremium(card)}
                hasSubscription={hasSubscription}
                onShowPaywall={handleShowPaywall}
                isMastering={masteringCardId === card.id}
              />
            ))
          )}
        </div>
      </div>
    </TooltipProvider>
  );
} 