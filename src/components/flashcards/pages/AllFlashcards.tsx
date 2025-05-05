import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Check, EyeOff, Eye, Trash2, Filter, BookOpen, FileEdit, Lock, FilterX, X, Loader2, Plus } from 'lucide-react';
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
import { useFlashcardRelationships } from '@/hooks/useFlashcardRelationships';
import FlashcardItem from '../FlashcardItem';
import { useNavbar } from '@/contexts/NavbarContext';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { SkeletonFlashcardGrid } from '../SkeletonFlashcard';
import { enrichFlashcardWithRelationships, processRelationshipData, isFlashcardReadOnly } from '@/utils/flashcard-utils';

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

// Define query keys for React Query
const flashcardKeys = {
  all: ['flashcards'] as const,
  cards: () => [...flashcardKeys.all, 'cards'] as const,
  basic: () => [...flashcardKeys.cards(), 'basic'] as const,
  filtered: (filter: string, page = 0) => [...flashcardKeys.basic(), filter, page] as const,
  relationships: () => [...flashcardKeys.all, 'relationships'] as const,
  subjects: () => [...flashcardKeys.all, 'subjects'] as const,
  collections: () => [...flashcardKeys.all, 'collections'] as const,
  progress: (userId: string) => [...flashcardKeys.all, 'progress', userId] as const,
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
  const queryClient = useQueryClient();
  
  // UI state
  const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { updateTotalCardCount } = useNavbar();
  const [masteringCardId, setMasteringCardId] = useState<string | null>(null);
  const [pageSize] = useState(30); // Number of cards to fetch per page

  // DEV ONLY: Check for forced subscription
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const forceSubscription = localStorage.getItem('forceSubscription');
      if (forceSubscription === 'true') {
        console.log('DEV OVERRIDE: Forcing subscription to true in AllFlashcards component');
        setHasSubscription(true);
      }
    }
  }, []);

  // Persisted user preferences
  const [showMastered, setShowMastered] = usePersistedState<boolean>('flashcards-show-mastered', true);
  const [selectedSubjectIds, setSelectedSubjectIds] = usePersistedState<string[]>('flashcards-filter-subjects', []);
  const [selectedCollectionIds, setSelectedCollectionIds] = usePersistedState<string[]>('flashcards-filter-collections', []);
  const [showFilters, setShowFilters] = usePersistedState<boolean>('flashcards-show-filters', false);

  // Filter state
  const [filter, setFilter] = useState<'all' | 'official' | 'my'>('all');

  // Fetch subscription status
  const { data: subscriptionStatus = false, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['user', user?.id, 'subscription'],
    queryFn: async () => {
      if (!user) return false;
      return hasActiveSubscription(user.id);
    },
    enabled: !!user,
    staleTime: 60 * 1000, // Reduce to 1 minute
    refetchOnMount: 'always', // Always fetch fresh data on component mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
    onSuccess: (data) => {
      setHasSubscription(data);
    }
  });

  // Ensure subscription status is refreshed when user changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const forceSubscription = localStorage.getItem('forceSubscription');
      if (forceSubscription === 'true') {
        console.log('DEV OVERRIDE: Forcing subscription to true in useEffect user change handler');
        setHasSubscription(true);
        return; // Skip the rest of the effect
      }
    }

    if (user) {
      // Invalidate subscription query when user changes
      queryClient.invalidateQueries(['user', user.id, 'subscription']);
    } else {
      // Reset subscription status when no user
      setHasSubscription(false);
    }
  }, [user, queryClient]);

  // Fetch subjects for filtering
  const { data: subjects = [] } = useQuery({
    queryKey: flashcardKeys.subjects(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000 // 30 minutes
  });

  // Fetch collections for filtering
  const { data: collections = [] } = useQuery({
    queryKey: flashcardKeys.collections(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('id, title')
        .order('title');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000 // 15 minutes
  });

  // Primary flashcards query - basic data only
  const { 
    data: flashcardsData,
    isLoading: flashcardsLoading,
    isError: isFlashcardsError,
    error: flashcardsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: flashcardKeys.filtered(filter),
    queryFn: async ({ pageParam = 0 }) => {
      console.log('Executing main flashcards query with filter:', filter, 'page:', pageParam);
      
      // Calculate offset for pagination
      const offset = pageParam * pageSize;
      console.log(`Using offset pagination: offset=${offset}, limit=${pageSize}`);
      
      // We need to fetch flashcards with their collections through the junction table
      if (filter === 'my' && user) {
        // Get user's own flashcards
        console.log('Fetching user-created flashcards for user ID:', user.id);
        
        // Count query for pagination
        const { count, error: countError } = await supabase
          .from('flashcards')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);
          
        if (countError) throw countError;
        
        // Data query with pagination
        const { data, error } = await supabase
          .from('flashcards')
          .select(`
            *,
            flashcard_collections_junction (
              collection:collection_id (
                id, 
                title, 
                is_official, 
                user_id
              )
            )
          `)
          .eq('created_by', user.id)
          .range(offset, offset + pageSize - 1)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching user flashcards:', error);
          throw error;
        }
        
        // Process the junction table data to put collection directly on the flashcard
        const processedData = data?.map(card => {
          if (card.flashcard_collections_junction && card.flashcard_collections_junction.length > 0) {
            return {
              ...card,
              collection: card.flashcard_collections_junction[0].collection
            };
          }
          return card;
        }) || [];
        
        console.log(`Fetched ${processedData.length} user flashcards (page ${pageParam + 1})`);
        if (processedData.length > 0) {
          console.log('First card sample:', processedData[0]);
          console.log('Collection data:', processedData[0]?.collection);
        }
        
        // Determine if there are more pages
        const hasNextPage = offset + processedData.length < (count || 0);
        const nextCursor = hasNextPage ? pageParam + 1 : null;
        
        return {
          flashcards: processedData,
          nextCursor,
          totalCount: count || 0
        };
        
      } else if (filter === 'official') {
        // For official cards, we need to query using the junction table to get official collections
        console.log('Fetching official flashcards (from official collections)');
        
        // Count query for pagination - ensure correct join condition
        const { count, error: countError } = await supabase
          .from('flashcards')
          .select('*', { count: 'exact', head: true })
          .or('is_official.eq.true');
          
        if (countError) {
          console.error('Error in official cards count query:', countError);
          throw countError;
        }
        
        console.log(`Official cards count: ${count || 0}`);
        
        // Enhanced - first try the direct query using a different approach
        let data, error;
        try {
          // First query directly for official flashcards
          const result = await supabase
            .from('flashcards')
            .select(`
              *,
              flashcard_collections_junction (
                collection:collection_id (
                  id, 
                  title, 
                  is_official, 
                  user_id
                )
              )
            `)
            .eq('is_official', true)
            .range(offset, offset + pageSize - 1)
            .order('created_at', { ascending: false });
            
            data = result.data;
            error = result.error;
            
            console.log(`Found ${data?.length || 0} directly marked official flashcards`);
            
            // If we don't have enough cards, try to get cards from official collections
            if (!error && (!data || data.length < pageSize)) {
              console.log('Looking for additional cards in official collections');
              const additionalResult = await supabase
                .from('flashcards')
                .select(`
                  *,
                  flashcard_collections_junction (
                    collection:collection_id (
                      id, 
                      title, 
                      is_official, 
                      user_id
                    )
                  )
                `)
                .not('id', 'in', `(${(data || []).map(c => c.id).join(',')})`)
                .eq('flashcard_collections_junction.collection.is_official', true)
                .range(0, pageSize - (data?.length || 0) - 1)
                .order('created_at', { ascending: false });
                
                console.log(`Found ${additionalResult.data?.length || 0} additional cards in official collections`);
                
                // Combine the results
                if (additionalResult.data && additionalResult.data.length > 0) {
                  data = [...(data || []), ...(additionalResult.data || [])];
                }
              }
            } catch (queryError) {
              console.error('Error in complex official cards query:', queryError);
              
              // Fallback to the original query if the enhanced approach fails
              const result = await supabase
                .from('flashcards')
                .select(`
                  *,
                  flashcard_collections_junction (
                    collection:collection_id (
                      id, 
                      title, 
                      is_official, 
                      user_id
                    )
                  )
                `)
                .or('is_official.eq.true')
                .range(offset, offset + pageSize - 1)
                .order('created_at', { ascending: false });
                
                data = result.data;
                error = result.error;
            }
            
            if (error) {
              console.error('Error fetching official flashcards:', error);
              throw error;
            }
            
            // Process the junction table data to put collection directly on the flashcard
            const processedData = data?.map(card => {
              if (card.flashcard_collections_junction && card.flashcard_collections_junction.length > 0) {
                return {
                  ...card,
                  collection: card.flashcard_collections_junction[0].collection
                };
              }
              return card;
            }) || [];
            
            console.log(`Fetched ${processedData.length} official flashcards (page ${pageParam + 1})`);
            if (processedData.length > 0) {
              console.log('First official card sample:', processedData[0]);
              console.log('Official collection data:', processedData[0]?.collection);
            } else {
              console.log('No official flashcards found. Check SQL query or database content.');
            }
            
            // Determine if there are more pages
            const hasNextPage = offset + processedData.length < (count || 0);
            const nextCursor = hasNextPage ? pageParam + 1 : null;
            
            return {
              flashcards: processedData,
              nextCursor,
              totalCount: count || 0
            };
        
      } else {
        // For all cards, fetch with their collections
        console.log('Fetching all flashcards with their collections');
        
        // Create the filter condition safely
        let filterCondition = 'is_official.eq.true,is_public_sample.eq.true';
        if (user?.id) {
          filterCondition = `created_by.eq.${user.id},${filterCondition}`;
          console.log(`Filter condition includes user ID ${user.id}`);
        } else {
          console.log('No user ID available, only showing official and public flashcards');
        }
        
        console.log(`Using filter condition: ${filterCondition}`);
        
        // Count query for pagination
        const { count, error: countError } = await supabase
          .from('flashcards')
          .select('*', { count: 'exact', head: true })
          .or(filterCondition);
          
        if (countError) throw countError;
        
        // Data query with pagination
        const { data, error } = await supabase
          .from('flashcards')
          .select(`
            *,
            flashcard_collections_junction (
              collection:collection_id (
                id, 
                title, 
                is_official, 
                user_id
              )
            )
          `)
          // Only show the user's own flashcards or official/public ones
          .or(filterCondition)
          .range(offset, offset + pageSize - 1)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching all flashcards:', error);
          throw error;
        }
        
        // Process the junction table data to put collection directly on the flashcard
        const processedData = data?.map(card => {
          if (card.flashcard_collections_junction && card.flashcard_collections_junction.length > 0) {
            return {
              ...card,
              collection: card.flashcard_collections_junction[0].collection
            };
          }
          return card;
        }) || [];
        
        console.log(`Fetched ${processedData.length} flashcards in total (page ${pageParam + 1})`);
        if (processedData.length > 0) {
          console.log('First card sample:', processedData[0]);
          console.log('Collection data:', processedData[0]?.collection);
        }
        
        // Determine if there are more pages
        const hasNextPage = offset + processedData.length < (count || 0);
        const nextCursor = hasNextPage ? pageParam + 1 : null;
        
        return {
          flashcards: processedData,
          nextCursor,
          totalCount: count || 0
        };
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Handle initialization when data is loaded (replacing onSuccess)
  useEffect(() => {
    if (flashcardsData?.pages && flashcardsData.pages.length > 0 && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [flashcardsData, initialLoadComplete]);

  // Secondary query for relationships (won't block UI rendering)
  const { 
    data: relationshipsData,
    isLoading: relationshipsLoading 
  } = useQuery({
    queryKey: flashcardKeys.relationships(),
    queryFn: async () => {
      console.log("Fetching relationship data");
      
      // Step 1: Fetch base data for lookups
      const [
        { data: subjects = [], error: subjectsError },
        { data: collections = [], error: collectionsError },
        { data: examTypes = [], error: examTypesError }
      ] = await Promise.all([
        supabase.from('subjects').select('id, name').order('name'),
        supabase.from('collections').select('id, title, is_official, user_id').order('title'),
        supabase.from('exam_types').select('id, name').order('name')
      ]);
          
      if (subjectsError) throw subjectsError;
      if (collectionsError) throw collectionsError;
      if (examTypesError) throw examTypesError;
      
      // Step 2: Fetch all junction table data in parallel
      const [
        { data: flashcardCollections = [], error: fcError },
        { data: flashcardSubjects = [], error: fsError },
        { data: flashcardExamTypes = [], error: feError },
        { data: collectionSubjects = [], error: csError }
      ] = await Promise.all([
        supabase.from('flashcard_collections_junction').select('flashcard_id, collection_id'),
        supabase.from('flashcard_subjects').select('flashcard_id, subject_id'),
        supabase.from('flashcard_exam_types').select('flashcard_id, exam_type_id'),
        supabase.from('collection_subjects').select('collection_id, subject_id')
      ]);
      
      if (fcError) throw fcError;
      if (fsError) throw fsError;
      if (feError) throw feError;
      if (csError) throw csError;
      
      // Process the data using our utility function
      return processRelationshipData({
        subjects,
        collections,
        examTypes,
        flashcardCollections,
        flashcardSubjects,
        flashcardExamTypes,
        collectionSubjects
      });
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });

  // Fetch mastery status for user
  const { data: masteryStatus = {} } = useQuery({
    queryKey: flashcardKeys.progress(user?.id || 'anonymous'),
    queryFn: async () => {
      if (!user) return {}; 
      
      const { data, error } = await supabase
        .from('flashcard_progress')
        .select('flashcard_id, is_mastered')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Convert to an object for easy lookup
      const progressMap: Record<string, boolean> = {};
      (data || []).forEach(progress => {
        progressMap[progress.flashcard_id] = progress.is_mastered;
      });
      
      return progressMap;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Helper function to determine if a card is premium
  const isCardPremium = useCallback((card: Flashcard) => {
    // Get a safer reference to the collection data
    const cardCollectionData = card.collection || {};
    
    // Determine ownership
    const isCreatedByUser = card.created_by === user?.id;
    const isUserCollection = cardCollectionData.user_id === user?.id;
    
    // Check for is_official with strict equality
    const isOfficial = cardCollectionData.is_official === true;
    
    // DEV ONLY: Check for forced subscription
    if (process.env.NODE_ENV === 'development') {
      const forceSubscription = localStorage.getItem('forceSubscription');
      if (forceSubscription === 'true') {
        // In development, with force flag, content is never premium (always accessible)
        return false;
      }
    }
    
    // User's own content is never premium to them (regardless of filter)
    if (isCreatedByUser || isUserCollection || filter === 'my') {
      return false;
    }
    
    // Official content requires subscription
    const isPremium = isOfficial && !hasSubscription;
    
    // Log premium cards for debugging
    if (isPremium && card.id) {
      console.log(`Premium card detected: ${card.id}, official=${isOfficial}, hasSubscription=${hasSubscription}`);
    }
    
    return isPremium;
  }, [user?.id, filter, hasSubscription]);
  
  // Track if we've logged premium card info (to reduce console spam)
  const [loggedPremiumCard, setLoggedPremiumCard] = useState(false);
  const [checkedForOfficialCards, setCheckedForOfficialCards] = useState(false);

  // Fix the useEffect for checking official cards
  useEffect(() => {
    // Only run this once to avoid excessive logging
    if (flashcardsData?.pages && flashcardsData.pages.length > 0 && !flashcardsLoading && !checkedForOfficialCards) {
      setCheckedForOfficialCards(true);
      
      console.log('Checking for official cards...');
      // Process and count official cards from all pages
      const officialCards = flashcardsData.pages.flatMap(page => {
        return page.flashcards.filter(card => {
          return card.collection && card.collection.is_official === true;
        });
      });
      
      // Get total count from the first page (all pages should have the same totalCount)
      const totalCount = flashcardsData.pages[0]?.totalCount || 0;
      console.log(`Found ${officialCards.length} official cards out of ${totalCount} total`);
      
      if (officialCards.length > 0 && !loggedPremiumCard) {
        // Check if the user already has some premium access
        return;
      }
    }
  }, [flashcardsData, flashcardsLoading, checkedForOfficialCards, loggedPremiumCard]);
  
  // Helper function to determine if a card is editable
  const isCardEditable = useCallback((card: Flashcard) => {
    // First check if it's an official card - those are never editable by regular users
    if (isFlashcardReadOnly(card)) {
      return false;
    }
    // Only allow editing of user's own cards
    return card.created_by === user?.id;
  }, [user?.id]);
  
  // Helper function to determine if a card is deletable
  const isCardDeletable = useCallback((card: Flashcard) => {
    // First check if it's an official card - those are never deletable by regular users
    if (isFlashcardReadOnly(card)) {
      return false;
    }
    // Only allow deletion of user's own cards
    return card.created_by === user?.id;
  }, [user?.id]);
  
  // Process cards from all pages into a flat array
  const processedCards = useMemo(() => {
    if (!flashcardsData?.pages) return [];
    
    // Flatten the pages array into a single array
    const allCards = flashcardsData.pages.flatMap(page => page.flashcards || []);
    
    // Apply mastery data to cards
    return allCards.map(card => {
      const isMastered = masteryStatus?.[card.id] ?? false;
      return {
        ...card,
        is_mastered: isMastered,
        // Add empty relationships as placeholder
        relationships: {
          collections: [],
          subjects: [],
          examTypes: []
        }
      };
    });
  }, [flashcardsData, masteryStatus]);
  
  // Enrich cards with relationships once they're loaded
  const enrichedCards = useMemo(() => {
    if (!relationshipsData) return processedCards;
    
    return processedCards.map(card => 
      enrichFlashcardWithRelationships(card, relationshipsData)
    );
  }, [processedCards, relationshipsData]);

  // Filter the cards based on user preferences
  const filteredCards = useMemo(() => {
    let filtered = enrichedCards;
    
    // Apply subject filter
    if (selectedSubjectIds.length > 0) {
      filtered = filtered.filter(card => {
        // Check if card has any of the selected subjects
        const cardSubjects = card.relationships?.subjects || [];
        if (cardSubjects.length === 0) return false;
        
        return cardSubjects.some(subject => 
          selectedSubjectIds.includes(subject.id)
        );
      });
    }
    
    // Apply collection filter
    if (selectedCollectionIds.length > 0) {
      filtered = filtered.filter(card => {
        // Check if card is in any of the selected collections
        const cardCollections = card.relationships?.collections || [];
        if (cardCollections.length === 0) return false;
        
        return cardCollections.some(collection => 
          selectedCollectionIds.includes(collection.id)
        );
      });
    }
    
    // Apply mastered filter
    if (!showMastered) {
      filtered = filtered.filter(card => !card.is_mastered);
    }
    
    // Sort: public samples first, then by position or created_at
    return filtered.sort((a, b) => {
      // Public samples first
      if (a.is_public_sample && !b.is_public_sample) return -1;
      if (!a.is_public_sample && b.is_public_sample) return 1;
      
      // Then use existing order (position, created_at, etc.)
      return 0;
    });
  }, [enrichedCards, selectedSubjectIds, selectedCollectionIds, showMastered]);

  // Action to toggle mastery status - UPDATED to use object syntax for useMutation
  const toggleMasteredMutation = useMutation({
    mutationFn: async ({ cardId, isMastered }: { cardId: string, isMastered: boolean }) => {
      if (!user) throw new Error('User must be logged in to update mastery status');
      
      // Update or insert progress record
      const { data, error } = await supabase
        .from('flashcard_progress')
        .upsert({
          user_id: user.id,
          flashcard_id: cardId,
          is_mastered: isMastered,
          last_reviewed: new Date().toISOString()
        },
        {
          onConflict: 'user_id,flashcard_id',
          ignoreDuplicates: false
        })
        .select();
      
      if (error) throw error;
      return data;
    },
    onMutate: ({ cardId }) => {
      setMasteringCardId(cardId);
    },
    onSuccess: (_, { cardId, isMastered }) => {
      // Update the cache
      queryClient.setQueryData(
        flashcardKeys.progress(user?.id || 'anonymous'),
        (old: Record<string, boolean> = {}) => ({
          ...old,
          [cardId]: isMastered
        })
      );
      
      // Show success message
      showToast(
        isMastered ? "Card marked as mastered!" : "Card marked as not mastered", 
        "success"
      );
      
      setMasteringCardId(null);
      
      // Invalidate the progress query to ensure consistency
      queryClient.invalidateQueries({ queryKey: flashcardKeys.progress(user?.id || 'anonymous') });
    },
    onError: (err) => {
      console.error("Error toggling mastered status:", err);
      setMasteringCardId(null);
      showToast("Failed to update mastery status", "error");
    }
  });

  // Toggle mastered status handler
  const toggleMastered = async (card: Flashcard) => {
    const isMastered = masteryStatus[card.id];
    await toggleMasteredMutation.mutate({ 
      cardId: card.id, 
      isMastered: !isMastered 
    });
  };

  // Handler to edit a card
  const handleEditCard = (card: Flashcard) => {
    // Check if card is read-only (official)
    if (isFlashcardReadOnly(card)) {
      showToast(
        "Official content cannot be edited",
        "error"
      );
      return;
    }
    
    // Only allow editing of user's own cards
    if (card.created_by !== user?.id) {
      showToast(
        "You can only edit your own flashcards",
        "error"
      );
      return;
    }
    
    navigate(`/flashcards/edit-card/${card.id}`);
  };

  // Handler to view a card
  const handleViewCard = (card: Flashcard) => {
    // Check if we're in development mode with forced subscription
    if (process.env.NODE_ENV === 'development') {
      const forceSubscription = localStorage.getItem('forceSubscription');
      if (forceSubscription === 'true') {
        console.log('DEV OVERRIDE: Bypassing premium check in handleViewCard due to forceSubscription');
        // Navigate directly without showing paywall
        const collectionId = card.collection?.id;
        if (collectionId) {
          navigate(`/flashcards/study?collection=${collectionId}&card=${card.id}`);
          return;
        }
      }
    }
    
    // If premium card and user doesn't have subscription, show paywall
    const isPremium = isCardPremium(card);
    if (isPremium && !hasSubscription) {
      setShowPaywall(true);
      return;
    }
    
    // Navigate to unified study mode with this card's collection
    const collectionId = card.collection?.id;
    if (collectionId) {
      navigate(`/flashcards/study?collection=${collectionId}&card=${card.id}`);
    } else {
      // If no collection, show an error
      showToast(
        "Card cannot be viewed without a collection",
        "error"
      );
    }
  };
        
  // Delete card handler
  const deleteCard = async () => {
    if (!cardToDelete || !user) return;
    
    try {
      // Delete the card
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardToDelete.id)
        .eq('created_by', user.id); // Safety check
      
      if (error) throw error;
      
      // Invalidate relevant queries
      queryClient.invalidateQueries(flashcardKeys.cards());
      
      // Clear the card to delete
      setCardToDelete(null);
    } catch (err) {
      console.error("Error deleting flashcard:", err);
      showToast(
        "Failed to delete flashcard",
        "error"
      );
    }
  };

  // Handler for delete button click
  const handleDeleteClick = (card: Flashcard) => {
    // Check if card is read-only (official)
    if (isFlashcardReadOnly(card)) {
      showToast(
        "Official content cannot be deleted",
        "error"
      );
      return;
    }
    
    // Only allow deletion of user's own cards
    if (card.created_by !== user?.id) {
      showToast(
        "You can only delete your own flashcards",
        "error"
      );
      return;
    }
    
    // Set the card to delete
    setCardToDelete(card);
  };

  // Handler for filter change
  const handleFilterChange = (newFilterValue: string) => {
    setFilter(newFilterValue as 'all' | 'official' | 'my');
  };

  // Handler for subject filter
  const handleSubjectFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectId = e.target.value;
    if (!subjectId) return;

    // Add to selected subjects if not already included
    if (!selectedSubjectIds.includes(subjectId)) {
      setSelectedSubjectIds([...selectedSubjectIds, subjectId]);
    }
    
    // Reset the select element
    e.target.value = '';
  };

  // Handler to remove a subject filter
  const removeSubject = (id: string) => {
    setSelectedSubjectIds(selectedSubjectIds.filter(subjectId => subjectId !== id));
  };

  // Handler for collection filter
  const handleCollectionFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const collectionId = e.target.value;
    if (!collectionId) return;
    
    // Add to selected collections if not already included
    if (!selectedCollectionIds.includes(collectionId)) {
      setSelectedCollectionIds([...selectedCollectionIds, collectionId]);
    }
    
    // Reset the select element
    e.target.value = '';
  };

  // Handler to remove a collection filter
  const removeCollection = (id: string) => {
    setSelectedCollectionIds(selectedCollectionIds.filter(collectionId => collectionId !== id));
  };

  // Handlers for paywall
  const handleShowPaywall = () => {
    setShowPaywall(true);
  };
  
  const handleClosePaywall = () => {
    setShowPaywall(false);
  };

  // Toggle showing mastered cards
  const handleToggleMastered = () => {
    setShowMastered(!showMastered);
  };

  // Update card count in navbar
  useEffect(() => {
    if (!flashcardsLoading && flashcardsData?.pages?.[0]?.totalCount !== undefined) {
      updateTotalCardCount(flashcardsData.pages[0].totalCount);
    }
  }, [flashcardsData?.pages?.[0]?.totalCount, updateTotalCardCount, flashcardsLoading]);

  // Calculate loading states
  const isInitialLoading = flashcardsLoading && !initialLoadComplete;
  const isRefining = initialLoadComplete && relationshipsLoading;

  // Implement infinite scrolling
  const observerTarget = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log('Loading more flashcards...');
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Render our enriched data
  if (showPaywall) {
    return <FlashcardPaywall onClose={handleClosePaywall} />;
  }

  // Show skeleton loaders during initial data loading
  if (flashcardsLoading && !initialLoadComplete) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 pb-20 md:pb-10">
        {/* Desktop layout */}
        <div className="hidden md:block mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
              <p className="text-gray-600 dark:text-gray-400">Loading flashcards...</p>
            </div>
            
            <div className="w-[340px]">
              <Tabs value={filter} onValueChange={handleFilterChange}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
                  <TabsTrigger value="all" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">All</TabsTrigger>
                  <TabsTrigger value="official" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">Premium</TabsTrigger>
                  <TabsTrigger value="my" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">My Cards</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Mobile layout - only filter tabs */}
        <div className="md:hidden mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Flashcards</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-3">Loading flashcards...</p>
          <Tabs value={filter} onValueChange={handleFilterChange}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">All</TabsTrigger>
              <TabsTrigger value="official" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">Premium</TabsTrigger>
              <TabsTrigger value="my" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">My Cards</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <SkeletonFlashcardGrid />
      </div>
    );
  }

  if (isFlashcardsError && flashcardsError instanceof Error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 pb-20 md:pb-10">
        <ErrorMessage 
          title="Could not load flashcards" 
          message={flashcardsError.message} 
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-20 md:pb-10">
      <DeleteConfirmation
        isOpen={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        onConfirm={deleteCard}
        title="Delete Flashcard"
        message="Are you sure you want to delete this flashcard? This action cannot be undone."
        itemName={cardToDelete?.question}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      
      {/* Desktop layout */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {flashcardsData?.pages?.[0]?.totalCount || 0} {(flashcardsData?.pages?.[0]?.totalCount || 0) === 1 ? 'card' : 'cards'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <FilterX className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              {showFilters ? 'Hide Filters' : 'Filter'}
            </Button>
          </div>

          <div>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={handleToggleMastered}
            >
              {showMastered ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showMastered ? 'Hide Mastered' : 'Show Mastered'}
            </Button>
          </div>
          
          <div className="w-[340px]">
            <Tabs value={filter} onValueChange={handleFilterChange}>
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">All</TabsTrigger>
                <TabsTrigger value="official" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">Premium</TabsTrigger>
                <TabsTrigger value="my" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">My Cards</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Flashcards</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-3">
          {flashcardsData?.pages?.[0]?.totalCount || 0} {(flashcardsData?.pages?.[0]?.totalCount || 0) === 1 ? 'card' : 'cards'}
        </p>
        <div className="flex items-center gap-2 mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? <FilterX className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            {showFilters ? 'Hide' : 'Filter'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
            onClick={handleToggleMastered}
          >
            {showMastered ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showMastered ? 'Hide' : 'Show'}
          </Button>
        </div>
        <Tabs value={filter} onValueChange={handleFilterChange}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">All</TabsTrigger>
            <TabsTrigger value="official" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">Premium</TabsTrigger>
            <TabsTrigger value="my" className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white dark:text-gray-200 data-[state=inactive]:dark:text-gray-400">My Cards</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      {showFilters && (
      <div className="mb-6 p-4 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/70">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subject filter */}
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
            <div className="flex flex-col gap-2">
              <select
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                onChange={handleSubjectFilter}
                value=""
              >
                <option value="" disabled>Select a subject</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>

              {selectedSubjectIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSubjectIds.map(subjectId => {
                    const subject = subjects.find(s => s.id === subjectId);
                    if (!subject) return null;
                    return (
                      <span 
                        key={subjectId}
                        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm flex items-center text-gray-800 dark:text-gray-200"
                      >
                        {subject.name}
                        <button 
                          className="ml-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          onClick={() => removeSubject(subjectId)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
            
          {/* Collection filter */}
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Collection</label>
            <div className="flex flex-col gap-2">
              <select
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                onChange={handleCollectionFilter}
                value=""
              >
                <option value="" disabled>Select a collection</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title}
                  </option>
                ))}
              </select>

              {selectedCollectionIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCollectionIds.map(collectionId => {
                    const collection = collections.find(c => c.id === collectionId);
                    if (!collection) return null;
                    return (
                      <span 
                        key={collectionId}
                        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm flex items-center text-gray-800 dark:text-gray-200"
                      >
                        {collection.title}
                        <button 
                          className="ml-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          onClick={() => removeCollection(collectionId)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
      
    {flashcardsLoading && initialLoadComplete && (
      <div className="flex justify-center my-8">
        <LoadingSpinner className="w-8 h-8 text-jdblue" />
      </div>
    )}

    {!flashcardsLoading && filteredCards.length === 0 && (
              <EmptyState 
        title="No flashcards found"
        description={
          selectedSubjectIds.length > 0 || selectedCollectionIds.length > 0 
            ? "Try adjusting your filters to see more flashcards."
            : filter === 'my'
              ? "You haven't created any flashcards yet. Create your first flashcard using the New Flashcard button."
              : "No flashcards found. Try changing your filters or create a new flashcard."
        }
        icon={<BookOpen className="w-12 h-12 text-gray-400" />}
        action={
          <Button onClick={() => navigate('/flashcards/create-flashcard-select')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Flashcard
          </Button>
        }
      />
    )}

    {filteredCards.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card) => {
          const isMastered = masteryStatus[card.id];
          const isPremium = isCardPremium(card);
          const isReadOnly = isFlashcardReadOnly(card);
          // FIXED: Also consider official cards as locked to prevent showing edit/delete buttons
          const isLocked = isPremium || isReadOnly;
          
          return (
            <FlashcardItem
              key={card.id}
              id={card.id}
              question={card.question}
              answer={isPremium ? "Premium content requires a subscription." : card.answer}
              collectionTitle={card.collection?.title || "No Collection"}
              isPremium={isPremium}
              isLocked={isLocked}
              isReadOnly={isReadOnly}
              isMastered={isMastered}
              isToggling={masteringCardId === card.id}
              onView={() => handleViewCard(card)}
              onEdit={() => handleEditCard(card)}
              onDelete={() => handleDeleteClick(card)}
              onToggleMastered={() => toggleMastered(card)}
              onUnlock={handleShowPaywall}
            />
          );
        })}
      </div>
    )}

    {relationshipsLoading && filteredCards.length > 0 && (
      <div className="flex justify-center my-8">
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          Loading additional card details...
        </p>
      </div>
    )}

    {/* Loading indicator for infinite scroll */}
    {hasNextPage && (
      <div 
        ref={observerTarget} 
        className="flex justify-center my-8"
      >
        {isFetchingNextPage ? (
          <LoadingSpinner className="w-8 h-8 text-jdblue" />
        ) : (
          <div className="h-10"></div> /* Spacer for observer */
        )}
      </div>
    )}
    </div>
  );
} 