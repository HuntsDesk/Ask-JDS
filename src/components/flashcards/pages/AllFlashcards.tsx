import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Check, EyeOff, Eye, Trash2, Filter, BookOpen, FileEdit, Lock } from 'lucide-react';
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

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  is_mastered: boolean;
  collection_id: string;
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
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<{id: string, name: string}[]>([]);
  const [collections, setCollections] = useState<{id: string, title: string, subject_id: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [filter, setFilter] = useState<'all' | 'official' | 'my'>('all');

  // Replace regular state with persisted state
  const [showMastered, setShowMastered] = usePersistedState<boolean>('flashcards-show-mastered', true);
  const [filterSubject, setFilterSubject] = usePersistedState<string>('flashcards-filter-subject', 'all');
  const [filterCollection, setFilterCollection] = usePersistedState<string>('flashcards-filter-collection', 'all');
  const [showFilters, setShowFilters] = usePersistedState<boolean>('flashcards-show-filters', false);

  // Add a separate effect to handle filter changes and reload data
  useEffect(() => {
    console.log("Filter changed, reloading data:", filter);
    loadData();
  }, [filter]);
  
  // This effect handles other filter changes (subject, collection, mastered status)
  useEffect(() => {
    console.log("Other filters changed, applying client-side filtering");
    // No need to reload data from server, just apply client-side filtering
  }, [showMastered, filterSubject, filterCollection]);

  // Load data when filter changes
  useEffect(() => {
    console.log('Filter useEffect running with filter:', filter);
    // The loadData function is now called directly in handleFilterChange
    // This useEffect is still useful for initial load and URL parameter changes
    if (!initialLoadComplete) {
      loadData().catch(error => {
        console.error('Error loading data on filter change:', error);
        setLoading(false);
      });
      setInitialLoadComplete(true);
    }
  }, [filter, initialLoadComplete]);

  // Initial data loading and URL parameter check
  useEffect(() => {
    // Check if there's a filter in the URL
    const filterParam = searchParams.get('filter');
    if (filterParam && ['all', 'official', 'my'].includes(filterParam)) {
      setFilter(filterParam as 'all' | 'official' | 'my');
    }
    
    // Initial data loading and subscription check
    loadData().catch(error => {
      console.error('Error during initial data load:', error);
      setLoading(false);
    });
    checkSubscription();
  }, []);

  async function loadData() {
    setLoading(true);
    console.log("Loading data with filter:", filter);
    console.log("User ID:", user?.id);
    
    try {
      // Load subjects first
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      
      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);
      
      // Different approach for user's cards vs. all/official cards
      if (filter === 'my' && user) {
        console.log("Loading MY flashcards for user:", user.id);
        
        // First query all collections where the user is the creator 
        const { data: userCollections, error: collectionsError } = await supabase
          .from('flashcard_collections')
          .select('id, title, subject_id, is_official')
          .eq('user_id', user.id);
        
        if (collectionsError) {
          console.error("Error fetching user collections:", collectionsError);
          throw collectionsError;
        }
        
        console.log("User collections found:", userCollections?.length || 0, 
                   "Collection IDs:", userCollections?.map(c => c.id));
                   
        // Set these as the available collections
        setCollections(userCollections || []);
        
        // If no collections found, show empty result
        if (!userCollections || userCollections.length === 0) {
          setCards([]);
          setLoading(false);
          return;
        }
        
        // Query flashcards that belong to these collections
        const collectionIds = userCollections.map(c => c.id);
        
        // Apply subject filter if needed
        let filteredCollectionIds = [...collectionIds];
        if (filterSubject !== 'all') {
          const filteredBySubject = userCollections
            .filter(c => c.subject_id === filterSubject)
            .map(c => c.id);
            
          filteredCollectionIds = filteredBySubject;
          
          if (filteredCollectionIds.length === 0) {
            setCards([]);
            setLoading(false);
            return;
          }
        }
        
        // Base query for flashcards
        let query = supabase
          .from('flashcards')
          .select(`
            *,
            collection:collection_id (
              title,
              is_official,
              user_id,
              subject:subject_id (
                name,
                id
              )
            )
          `)
          .in('collection_id', filteredCollectionIds)
          .order('created_at', { ascending: false });
          
        // Apply mastered filter if needed
        if (!showMastered) {
          query = query.eq('is_mastered', false);
        }
        
        // Apply collection filter if needed
        if (filterCollection !== 'all') {
          query = query.eq('collection_id', filterCollection);
        }
        
        // Execute the query
        const { data: userCards, error: cardsError } = await query;
        
        if (cardsError) {
          console.error("Error fetching user cards:", cardsError);
          throw cardsError;
        }
        
        console.log(`Found ${userCards?.length || 0} user flashcards`);
        setCards(userCards || []);
        setLoading(false);
        return;
      }
      
      // Standard flow for "All" and "Official" filters
      // Load collections with is_official flag
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('flashcard_collections')
        .select('id, title, subject_id, is_official, user_id')
        .order('title');
      
      if (collectionsError) throw collectionsError;
      console.log("Total collections loaded:", collectionsData?.length || 0);
      
      // Filter collections based on the official/my filter
      let filteredCollectionsData = collectionsData;
      
      // For "Premium" tab, we only want official collections
      if (filter === 'official') {
        // For Premium tab, only include official collections
        filteredCollectionsData = collectionsData.filter(c => c.is_official);
        console.log("Filtered to official collections:", filteredCollectionsData.length);
      }
      
      setCollections(filteredCollectionsData || []);
      
      // Get all collection IDs that match our filter
      const collectionIds = filteredCollectionsData.map(c => c.id);
      console.log("Collection IDs after filtering:", collectionIds);
      
      // If no collections match our filter, return empty result
      if (collectionIds.length === 0) {
        console.log("No collections match the filter, returning empty card set");
        setCards([]);
        setLoading(false);
        return;
      }
      
      // Build flashcards query
      let query = supabase
        .from('flashcards')
        .select(`
          *,
          collection:collection_id (
            title,
            is_official,
            user_id,
            subject:subject_id (
              name,
              id
            )
          )
        `)
        .in('collection_id', collectionIds)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (!showMastered) {
        query = query.eq('is_mastered', false);
      }
      
      if (filterSubject !== 'all') {
        // Get all collections in this subject
        const subjectCollections = filteredCollectionsData
          .filter(c => c.subject_id === filterSubject)
          .map(c => c.id);
        
        console.log("Subject collections:", subjectCollections);
        
        if (subjectCollections.length > 0) {
          query = query.in('collection_id', subjectCollections);
        } else {
          // No collections in this subject, return empty result
          console.log("No collections in selected subject, returning empty card set");
          setCards([]);
          setLoading(false);
          return;
        }
      }
      
      if (filterCollection !== 'all') {
        query = query.eq('collection_id', filterCollection);
      }
      
      const { data: cardsData, error: cardsError } = await query;
      
      if (cardsError) {
        console.error("Error fetching cards:", cardsError);
        throw cardsError;
      }
      
      console.log(`Loaded ${cardsData?.length || 0} cards after all filters`);
      setCards(cardsData || []);
    } catch (err: any) {
      console.error("Error in loadData:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const checkSubscription = async () => {
    if (user) {
      try {
        console.log("AllFlashcards: Checking subscription status...");
        const hasAccess = await hasActiveSubscription(user.id);
        console.log("AllFlashcards: Subscription status:", hasAccess);
        setHasSubscription(hasAccess);
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasSubscription(false);
      }
    } else {
      console.log("AllFlashcards: No user logged in, setting hasSubscription to false");
      setHasSubscription(false);
    }
  };

  // Memoize the filtered collections list
  const filteredCollections = useMemo(() => {
    if (filterSubject === 'all') {
      return collections;
    }
    return collections.filter(c => c.subject_id === filterSubject);
  }, [collections, filterSubject]);

  const handleEditCard = (card: Flashcard) => {
    navigate(`/flashcards/manage/${card.collection_id}`, { 
      state: { editCardId: card.id } 
    });
  };

  const toggleMastered = async (card: Flashcard) => {
    try {
      const { error } = await supabase
        .from('flashcards')
        .update({ is_mastered: !card.is_mastered })
        .eq('id', card.id);
      
      if (error) throw error;
      
      // Update the local state
      setCards(cards.map(c => 
        c.id === card.id ? { ...c, is_mastered: !card.is_mastered } : c
      ));
      
      showToast(
        card.is_mastered ? 'Card unmarked as mastered' : 'Card marked as mastered', 
        'success'
      );
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
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
      
      // Update the local state
      setCards(cards.filter(c => c.id !== cardToDelete.id));
      showToast('Card deleted successfully', 'success');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setCardToDelete(null);
    }
  };

  const handleFilterChange = (newFilterValue: string) => {
    console.log('Filter changed to:', newFilterValue);
    const newFilter = newFilterValue as 'all' | 'official' | 'my';
    
    // Clear cards and set loading state to indicate fresh data is coming
    setCards([]);
    setLoading(true);
    
    // Update the filter state
    setFilter(newFilter);
    
    // Update URL params
    searchParams.set('filter', newFilter);
    setSearchParams(searchParams);
    
    // Explicitly load data with the new filter
    loadData().catch(error => {
      console.error("Error loading data in handleFilterChange:", error);
      setLoading(false);
    });
  };

  // Force premium content protection for testing - DISABLED
  const forcePremiumTest = false;

  // Check if a card is premium content
  const isCardPremium = useCallback((card: Flashcard) => {
    // Debug information
    const cardId = card.id;
    const collectionId = card.collection_id;
    const isOfficial = card.collection?.is_official || false;
    const collectionUserId = card.collection?.user_id;
    const currentUserId = user?.id;
    
    console.log(`Card premium check - ID: ${cardId}, Collection: ${collectionId}, Official: ${isOfficial}, CollectionUserId: ${collectionUserId}, UserId: ${currentUserId}, Filter: ${filter}`);
    
    // User's own cards are NEVER premium, regardless of other settings
    if (user && card.collection?.user_id === user.id) {
      console.log(`Card ${cardId} belongs to user - NOT premium`);
      return false;
    }
    
    // Cards shown in the "My" filter tab should never be premium
    if (filter === 'my') {
      console.log(`Card ${cardId} is in "My" tab - NOT premium`);
      return false;
    }
    
    // Only official collections can have premium cards
    const isPremium = isOfficial && !forcePremiumTest && !hasSubscription;
    console.log(`Card ${cardId} premium result: ${isPremium}`);
    return isPremium;
  }, [filter, user, hasSubscription, forcePremiumTest]);

  // Create a memoized filteredCards array that updates when dependencies change
  const filteredCards = useMemo(() => {
    console.log('Filtering cards with:', {
      totalCards: cards.length,
      filter,
      subject: filterSubject,
      collection: filterCollection,
      showMastered
    });

    return cards.filter(card => {
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
      
      // Apply tab filters
      if (filter === 'official' && (!card.collection?.is_official || !isCardPremium(card))) {
        return false;
      }
      
      // For 'my' and 'all' tabs, no additional filtering needed
      return true;
    });
  }, [cards, filter, filterSubject, filterCollection, showMastered, isCardPremium]);

  // Debug effect to track filter changes
  useEffect(() => {
    console.log('Filter state changed:', { 
      filter,
      totalCards: cards.length,
      filteredCards: filteredCards.length,
      loading
    });
  }, [filter, cards.length, filteredCards.length, loading]);

  // Create a dedicated function to toggle showing mastered cards
  const handleToggleMastered = () => {
    console.log("Toggling mastered cards visibility from", showMastered, "to", !showMastered);
    setShowMastered(!showMastered);
    // No need to directly manipulate the cards array
  };
  
  // Remove the effect that uses direct DOM manipulation
  useEffect(() => {
    console.log('showMastered changed to:', showMastered);
  }, [showMastered]);

  // Add a more robust effect to handle showMastered changes
  useEffect(() => {
    // This will safely handle filter changes without direct DOM manipulation
    if (!loading) {
      console.log(`Filter applied: showMastered=${showMastered}, found ${filteredCards.length} matching cards`);
    }
  }, [showMastered, filteredCards.length, loading]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <DeleteConfirmation
        isOpen={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        onConfirm={deleteCard}
        title="Delete Flashcard"
        message="Are you sure you want to delete this flashcard?"
        itemName={cardToDelete?.question}
      />
      
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
      
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Flashcards</h1>
              <p className="text-gray-600 dark:text-gray-400 flashcard-count">
                {filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'} {!showMastered ? 'to study' : ''}
              </p>
            </div>
            
            {/* Controls moved to the left of the slider */}
            <div className="flex items-center gap-3 ml-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Filter className="h-5 w-5" />
                Filters
              </button>
              
              <button
                onClick={handleToggleMastered}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                aria-label={showMastered ? "Hide mastered cards" : "Show all cards"}
              >
                {showMastered ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                {showMastered ? "Hide Mastered" : "Show All"}
              </button>
            </div>
          </div>
          
          {/* Filter tabs */}
          <div>
            <Tabs value={filter} onValueChange={handleFilterChange}>
              <TabsList className="grid grid-cols-3" style={{ backgroundColor: 'var(--background)' }}>
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
                  My Flashcards
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
      
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
      
      {cards.length === 0 && loading === false ? (
        <EmptyState
          title="No flashcards found"
          description={
            filter === 'official'
              ? 'No premium flashcards available.'
              : filter === 'my' 
                ? 'You haven\'t created any flashcards yet.'
                : 'No flashcards available.'
          }
          icon={<FileText className="h-12 w-12 text-gray-400 dark:text-gray-600" />}
          actionText={filter === 'my' ? "Create Flashcard" : undefined}
          actionLink={filter === 'my' ? "/flashcards/create-flashcard" : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {!loading && filteredCards.length === 0 ? (
            <EmptyState
              title="No matching flashcards"
              description="No flashcards match your current filters. Try adjusting your filters or creating new flashcards."
              icon={<FileText className="h-12 w-12 text-gray-400 dark:text-gray-600" />}
              actionText="Clear Filters"
              onActionClick={() => {
                setFilterSubject('all');
                setFilterCollection('all');
                setShowMastered(true);
              }}
            />
          ) : (
            <div key={`cards-${showMastered ? 'all' : 'unmastered'}`} className="space-y-6">
              {filteredCards.map((card) => {
                const isPremium = isCardPremium(card);
                
                return (
                  <div key={card.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden dark:border dark:border-gray-700 mb-2 ${card.is_mastered ? 'border-l-4 border-green-500' : ''} ${isPremium ? 'border-orange-500 border' : ''}`}>
                    {isPremium && (
                      <div className="bg-orange-500 text-white text-center py-1 font-bold">
                        PREMIUM CONTENT
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <div>
                          <Link 
                            to={`/flashcards/study/${card.collection_id}`}
                            className="text-sm font-medium text-[#F37022] hover:underline"
                          >
                            {card.collection.title}
                          </Link>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <BookOpen className="h-4 w-4 mr-1" />
                            <Link 
                              to={`/flashcards/subjects/${card.collection.subject.id}`}
                              className="dark:text-gray-300 hover:text-[#F37022] dark:hover:text-[#F37022] hover:underline"
                            >
                              {card.collection.subject.name}
                            </Link>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleMastered(card)}
                            className={`p-1 rounded-full ${
                              card.is_mastered 
                                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title={card.is_mastered ? 'Unmark as mastered' : 'Mark as mastered'}
                            disabled={isPremium}
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          {user && !isPremium && (
                            <>
                              <button
                                onClick={() => handleEditCard(card)}
                                className="p-1 rounded-full text-gray-600 dark:text-gray-400 hover:text-[#F37022] hover:bg-[#F37022]/10"
                                title="Edit card"
                              >
                                <FileEdit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => setCardToDelete(card)}
                                className="p-1 rounded-full text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-100"
                                title="Delete card"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        {isPremium ? (
                          <div className="premium-content-placeholder">
                            <div className="bg-orange-100 p-4 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Lock className="h-10 w-10 text-orange-500" />
                                <div>
                                  <h3 className="text-lg font-semibold text-orange-800">Premium Flashcard</h3>
                                  <p className="text-orange-700">
                                    Upgrade your account to access premium flashcard content.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{card.question}</h3>
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                              <p className="text-gray-700 dark:text-gray-200">{card.answer}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 