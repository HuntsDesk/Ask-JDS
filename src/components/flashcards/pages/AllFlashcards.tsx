import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, EyeOff, Eye, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import useAuth from '@/hooks/useFlashcardAuth';
import useToast from '@/hooks/useFlashcardToast';
import LoadingSpinner from '../LoadingSpinner';
import Toast from '../Toast';
import EmptyState from '../EmptyState';
import DeleteConfirmation from '../DeleteConfirmation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hasActiveSubscription } from '@/lib/subscription';
import { FlashcardPaywall } from '../../FlashcardPaywall';
import EnhancedFlashcardItem from '../EnhancedFlashcardItem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Types
interface Subject {
  id: string;
  name: string;
}

interface Collection {
  id: string;
  title: string;
}

interface ExamType {
  id: string;
  name: string;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  is_mastered?: boolean;
  created_by?: string;
  collection?: {
    id: string;
    title: string;
    is_official: boolean;
    user_id: string;
    subject?: {
      name: string;
      id: string;
    }
  };
  exam_types?: ExamType[];
  relationships?: {
    collections: Collection[];
    subjects: Subject[];
  };
}

export default function AllFlashcards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Core state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  
  // Pagination state for infinite scrolling
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCardCount, setTotalCardCount] = useState(0);
  const ITEMS_PER_PAGE = 15;
  
  // Improved intersection observer setup
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCardRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) {
      console.log('Skipping observer attachment - currently loading');
      return;
    }
    
    if (!hasMore) {
      console.log('Skipping observer attachment - no more data to load');
      return;
    }
    
    // Disconnect previous observer
    if (observerRef.current) {
      console.log('Disconnecting previous observer');
      observerRef.current.disconnect();
    }
    
    // Create new observer
    observerRef.current = new IntersectionObserver(entries => {
      console.log('Intersection observer triggered', entries[0]?.isIntersecting);
      // If the last card is visible and we have more cards to load
      if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
        console.log('Last card is visible, loading more cards...');
        setPage(prevPage => {
          console.log(`Incrementing page from ${prevPage} to ${prevPage + 1}`);
          return prevPage + 1;
        });
      }
    }, {
      rootMargin: '200px', // Load more cards when we're 200px from the bottom
      threshold: 0.1 // Trigger when at least 10% of the element is visible
    });
    
    // Observe the last card
    if (node) {
      console.log('Attaching observer to last card node');
      observerRef.current.observe(node);
    } else {
      console.log('No node to observe');
    }
  }, [loadingMore, hasMore]);
  
  // UI state
  const [filter, setFilter] = useState<'all' | 'official' | 'my'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterCollection, setFilterCollection] = useState('all');
  const [filterExamType, setFilterExamType] = useState('all');
  const [showMastered, setShowMastered] = useState(true);
  const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);
  const [cardCollections, setCardCollections] = useState<{ id: string, title: string }[]>([]);

  // Delete card
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Study mode handling
  const [currentStudySubject, setCurrentStudySubject] = useState<any>(null);
  const [currentStudyCollection, setCurrentStudyCollection] = useState<any>(null);

  // Initialize filter from URL params
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && ['all', 'official', 'my'].includes(filterParam)) {
      setFilter(filterParam as 'all' | 'official' | 'my');
    } else {
      // Ensure URL reflects the current filter if missing
      searchParams.set('filter', filter);
      setSearchParams(searchParams);
    }
    
    // Load subjects and collections for filters
    loadSubjects();
    loadCollections();
    loadExamTypes();
    
    // Check subscription status
    checkSubscription();
  }, []);

  // Load data when filter changes or when component mounts
  useEffect(() => {
    if (user) {
      console.log(`Loading flashcards with filter: ${filter}`);
      loadFlashcards();
    }
  }, [filter, user]);

  // Handler function for when URL params change
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && ['all', 'official', 'my'].includes(filterParam) && filterParam !== filter) {
      console.log(`URL param changed to ${filterParam}, updating filter`);
      setFilter(filterParam as 'all' | 'official' | 'my');
    }
  }, [searchParams]);

  // Check subscription status
  const checkSubscription = async () => {
    if (user) {
      try {
        // In development, allow forcing subscription to true
        if (process.env.NODE_ENV === 'development') {
          // Check for a debug flag in localStorage
          const forceSubscription = localStorage.getItem('forceSubscription') === 'true';
          if (forceSubscription) {
            console.log("DEVELOPMENT MODE: Forcing subscription to TRUE");
            setHasSubscription(true);
            return;
          }
        }

        const hasAccess = await hasActiveSubscription(user.id);
        setHasSubscription(hasAccess);
        console.log("Subscription status:", hasAccess);
        
        // Also debug the flashcard-collection junction table
        try {
          const { data: junctionData, error: junctionError } = await supabase
            .from('flashcard_collections_junction')
            .select('*')
            .limit(10);
            
          if (junctionError) {
            console.error("Error fetching from junction table:", junctionError);
          } else {
            console.log("Sample from junction table:", junctionData);
          }
          
          // Check if any flashcards have direct is_official=true
          const { data: officialData, error: officialError } = await supabase
            .from('flashcards')
            .select('id, question')
            .eq('is_official', true)
            .limit(10);
            
          if (officialError) {
            console.error("Error checking official flashcards:", officialError);
          } else {
            console.log("Sample official flashcards by is_official=true:", officialData);
          }
          
        } catch (e) {
          console.error("Error in debug queries:", e);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasSubscription(false);
      }
    } else {
      setHasSubscription(false);
    }
  };

  // Load subjects for filter dropdown
  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setSubjects(data || []);
    } catch (err: any) {
      console.error("Error loading subjects:", err.message);
    }
  };

  // Load collections for filter dropdown
  const loadCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('id, title')
        .order('title');
      
      if (error) throw error;
      setCollections(data || []);
    } catch (err: any) {
      console.error("Error loading collections:", err.message);
    }
  };

  // Load exam types for filter dropdown
  const loadExamTypes = async () => {
    try {
        const { data, error } = await supabase
        .from('exam_types')
        .select('id, name')
        .order('name');
          
        if (error) throw error;
      setExamTypes(data || []);
    } catch (err: any) {
      console.error("Error loading exam types:", err.message);
    }
  };

  // Effect to load more cards when page changes
  useEffect(() => {
    if (page > 1 && user) {
      loadMoreFlashcards();
    }
  }, [page, user]);

  // Main function to load flashcards based on current filter
  const loadFlashcards = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setPage(1); // Reset pagination when loading fresh data
    setHasMore(true);
    
    // Get the current filter from URL to ensure consistency
    const urlFilter = searchParams.get('filter');
    const currentFilter = (urlFilter && ['all', 'official', 'my'].includes(urlFilter)) 
      ? urlFilter as 'all' | 'official' | 'my' 
      : filter;
    
    console.log(`Loading flashcards with filter: ${currentFilter} (state: ${filter}, URL: ${urlFilter})`);
    
    try {
      let flashcardsData: Flashcard[] = [];
      
      // First, get the total count based on the current filter
      let countQuery = supabase.from('flashcards').select('id', { count: 'exact' });
      
      if (currentFilter === 'official') {
        countQuery = countQuery.eq('is_official', true);
      } else if (currentFilter === 'my') {
        countQuery = countQuery.eq('created_by', user.id);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error("Error getting total count:", countError);
      } else {
        setTotalCardCount(count || 0);
        console.log(`Total cards for filter ${currentFilter}: ${count}`);
        
        // If count is 0 or less than or equal to initial page size, set hasMore to false
        if (count === 0 || count <= ITEMS_PER_PAGE) {
          console.log(`Count (${count}) <= ITEMS_PER_PAGE (${ITEMS_PER_PAGE}), setting hasMore=false`);
          setHasMore(false);
        }
      }
      
      if (currentFilter === 'all') {
        // Get all flashcards with their collections
        console.log(`Fetching first page of all flashcards (0-${ITEMS_PER_PAGE-1})`);
        const { data, error } = await supabase
          .from('flashcards')
          .select(`
            *,
            collection:collections(*),
            exam_types:flashcard_exam_types(
              exam_type:exam_type_id(
                id,
                name
              )
            )
          `)
          .order('created_at', { ascending: false })
          .range(0, ITEMS_PER_PAGE - 1);
        
        if (error) {
          console.error("Error fetching all flashcards:", error);
          throw error;
        }
        
        console.log(`Received ${data?.length || 0} flashcards from initial fetch`);
        
        // Transform the exam_types array to the expected format
        flashcardsData = (data || []).map(card => ({
          ...card,
          exam_types: card.exam_types?.map(et => et.exam_type) || []
        }));
        
        // Fetch additional relationship data (all collections and subjects)
        await enrichFlashcardsWithRelationships(flashcardsData);
        
        // Check if there might be more cards to load
        const mightHaveMore = data?.length === ITEMS_PER_PAGE && (count || 0) > ITEMS_PER_PAGE;
        console.log(`Setting hasMore to ${mightHaveMore} for all flashcards (got ${data?.length || 0} cards, total ${count || 0})`);
        setHasMore(mightHaveMore);
        
        console.log(`Loaded ${flashcardsData.length} total flashcards`);
      } 
      else if (currentFilter === 'official') {
        console.log("Loading official flashcards...");
        
        // Simply get flashcards that have is_official=true directly
        console.log(`Fetching first page of official flashcards (0-${ITEMS_PER_PAGE-1})`);
      const { data, error } = await supabase
          .from('flashcards')
          .select(`
            *,
            collection:collections(*),
            exam_types:flashcard_exam_types(
              exam_type:exam_type_id(
                id,
                name
              )
            )
          `)
          .eq('is_official', true)
          .order('created_at', { ascending: false })
          .range(0, ITEMS_PER_PAGE - 1);
        
        if (error) {
          console.error("Error fetching official flashcards:", error);
          throw error;
        }
        
        console.log(`Received ${data?.length || 0} official flashcards from initial fetch`);
        
        // Transform the exam_types array to the expected format
        flashcardsData = (data || []).map(card => ({
          ...card,
          exam_types: card.exam_types?.map(et => et.exam_type) || []
        }));
        
        // Fetch additional relationship data (all collections and subjects)
        await enrichFlashcardsWithRelationships(flashcardsData);
        
        // Check if there might be more cards to load
        const mightHaveMore = data?.length === ITEMS_PER_PAGE && (count || 0) > ITEMS_PER_PAGE;
        console.log(`Setting hasMore to ${mightHaveMore} for official flashcards (got ${data?.length || 0} cards, total ${count || 0})`);
        setHasMore(mightHaveMore);
        
        console.log(`Loaded ${flashcardsData.length} official flashcards`);
      } 
      else if (currentFilter === 'my') {
        console.log("Loading user's own flashcards...");
        // Get flashcards created by the user
        console.log(`Fetching first page of user flashcards (0-${ITEMS_PER_PAGE-1})`);
        const { data, error } = await supabase
          .from('flashcards')
          .select(`
            *,
            collection:collections(*),
            exam_types:flashcard_exam_types(
              exam_type:exam_type_id(
                id,
                name
              )
            )
          `)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .range(0, ITEMS_PER_PAGE - 1);
        
        if (error) {
          console.error("Error fetching user flashcards:", error);
          throw error;
        }
        
        console.log(`Received ${data?.length || 0} user flashcards from initial fetch`);
        
        // Transform the exam_types array to the expected format
        flashcardsData = (data || []).map(card => ({
          ...card,
          exam_types: card.exam_types?.map(et => et.exam_type) || []
        }));
        
        // Fetch additional relationship data (all collections and subjects)
        await enrichFlashcardsWithRelationships(flashcardsData);
        
        // Check if there might be more cards to load
        const mightHaveMore = data?.length === ITEMS_PER_PAGE && (count || 0) > ITEMS_PER_PAGE;
        console.log(`Setting hasMore to ${mightHaveMore} for user flashcards (got ${data?.length || 0} cards, total ${count || 0})`);
        setHasMore(mightHaveMore);
        
        console.log(`Loaded ${flashcardsData.length} user flashcards`);
      }
      
      // Load mastery status for these cards
      if (flashcardsData.length > 0) {
        const { data: progress, error: progressError } = await supabase
        .from('flashcard_progress')
        .select('flashcard_id, is_mastered')
          .eq('user_id', user.id)
          .in('flashcard_id', flashcardsData.map(c => c.id));
        
        if (!progressError && progress) {
          // Create a map of mastery status
          const masteryMap = new Map();
          progress.forEach(p => masteryMap.set(p.flashcard_id, p.is_mastered));
          
          // Update flashcards with mastery status
          flashcardsData = flashcardsData.map(card => ({
            ...card,
            is_mastered: masteryMap.has(card.id) ? masteryMap.get(card.id) : false
          }));
        }
      }
      
      // Enrich flashcards with their relationships
      const enrichedFlashcards = await enrichFlashcardsWithRelationships(flashcardsData);
      
      // Get real collections and subjects for premium cards
      const premiumData = await fetchPremiumContent();
      
      // Force premium cards to have relationships objects initialized
      const finalFlashcards = enrichedFlashcards.map(card => {
        if (card.is_official === true) {
          // Make sure relationships object exists
          if (!card.relationships) {
            card.relationships = {
              collections: [],
              subjects: []
            };
          }
          
          // For premium cards with no collections, ensure they get the official collections
          if (!card.relationships.collections || card.relationships.collections.length === 0) {
            // Use real collections if available
            if (premiumData.collections && premiumData.collections.length > 0) {
              card.relationships.collections = [...premiumData.collections];
              if (process.env.NODE_ENV === 'development') {
                console.log(`Added ${premiumData.collections.length} real collections to premium card ${card.id.substring(0, 8)}`);
              }
            }
          }
          
          // For premium cards with no subjects, ensure they get real subjects
          if (!card.relationships.subjects || card.relationships.subjects.length === 0) {
            // Use real subjects if available
            if (premiumData.subjects && premiumData.subjects.length > 0) {
              card.relationships.subjects = [...premiumData.subjects];
              if (process.env.NODE_ENV === 'development') {
                console.log(`Added ${premiumData.subjects.length} real subjects to premium card ${card.id.substring(0, 8)}`);
              }
            }
          }
          
          // Log what we're doing
          if (process.env.NODE_ENV === 'development') {
            console.log(`Premium card ${card.id.substring(0, 8)} relationships:`, {
              collections: card.relationships.collections?.map(c => c.title) || [],
              subjects: card.relationships.subjects?.map(s => s.name) || []
            });
          }
        }
        return card;
      });
      
      setFlashcards(finalFlashcards);
    } catch (err: any) {
      console.error("Error loading flashcards:", err.message);
      setError(`Failed to load flashcards: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to ensure flashcards have properly initialized relationships
  const enrichFlashcardsWithRelationships = async (flashcards: Flashcard[]) => {
    try {
      // Get all the flashcard IDs
      const flashcardIds = flashcards.map(card => card.id);
      
        if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching relationships for ${flashcardIds.length} flashcards`);
      }

      // Fetch all collection junctions for these flashcards
      const { data: collectionJunctions, error: collectionJunctionsError } = await supabase
        .from('flashcard_collections_junction')
        .select(`
          flashcard_id,
          collection_id,
          collections:collection_id(
            id,
            title,
            is_official
          )
        `)
        .in('flashcard_id', flashcardIds);

      if (collectionJunctionsError) {
        console.error('Error fetching collection junctions:', collectionJunctionsError);
        return flashcards;
      }

      console.log(`Found ${collectionJunctions?.length || 0} collection junctions`);

      // Fetch all subject junctions for these flashcards
      const { data: subjectJunctions, error: subjectJunctionsError } = await supabase
        .from('flashcard_subjects')
        .select(`
          flashcard_id,
          subject_id,
          subjects:subject_id(
            id,
            name
          )
        `)
        .in('flashcard_id', flashcardIds);

      if (subjectJunctionsError) {
        console.error('Error fetching subject junctions:', subjectJunctionsError);
        return flashcards;
      }
      
      console.log(`Found ${subjectJunctions?.length || 0} subject junctions`);

      // Create maps for efficient lookups
      const collectionsMap = new Map();
      const subjectsMap = new Map();

      // Process collection junctions
      collectionJunctions?.forEach(junction => {
        const flashcardId = junction.flashcard_id;
        if (!collectionsMap.has(flashcardId)) {
          collectionsMap.set(flashcardId, []);
        }
        
        // Debug the junction data
        if (process.env.NODE_ENV === 'development') {
          console.log(`Processing collection junction for card ${flashcardId.substring(0, 8)}:`, junction);
        }
        
        // Check if we have the collection data
        const collectionData = junction.collections;
        if (collectionData && typeof collectionData === 'object') {
          // If we get a proper collection object
          if (!collectionsMap.get(flashcardId).some(c => c.id === collectionData.id)) {
            collectionsMap.get(flashcardId).push(collectionData);
          }
        } else if (junction.collection_id) {
          // If we only have the ID, create a placeholder object
          if (!collectionsMap.get(flashcardId).some(c => c.id === junction.collection_id)) {
            // Use a placeholder for missing collection data
            collectionsMap.get(flashcardId).push({
              id: junction.collection_id,
              title: `Collection ${junction.collection_id.substring(0, 4)}`,
              is_official: false
            });
          }
        }
      });

      // Process subject junctions
      subjectJunctions?.forEach(junction => {
        const flashcardId = junction.flashcard_id;
        if (!subjectsMap.has(flashcardId)) {
          subjectsMap.set(flashcardId, []);
        }
        
        // Debug the junction data
        if (process.env.NODE_ENV === 'development') {
          console.log(`Processing subject junction for card ${flashcardId.substring(0, 8)}:`, junction);
        }
        
        // Check if we have the subject data
        const subjectData = junction.subjects;
        if (subjectData && typeof subjectData === 'object') {
          // If we get a proper subject object
          if (!subjectsMap.get(flashcardId).some(s => s.id === subjectData.id)) {
            subjectsMap.get(flashcardId).push(subjectData);
          }
        } else if (junction.subject_id) {
          // If we only have the ID, create a placeholder object
          if (!subjectsMap.get(flashcardId).some(s => s.id === junction.subject_id)) {
            // Use a placeholder for missing subject data
            subjectsMap.get(flashcardId).push({
              id: junction.subject_id,
              name: `Subject ${junction.subject_id.substring(0, 4)}`
            });
          }
        }
      });

      // Add relationships to each flashcard
      const enrichedFlashcards = flashcards.map(card => {
        // Initialize relationships object if it doesn't exist
        if (!card.relationships) {
          card.relationships = {
            collections: [],
            subjects: []
          };
        }

        // Get collections for this flashcard
        const cardCollections = collectionsMap.get(card.id) || [];
        
        // Get subjects for this flashcard
        const cardSubjects = subjectsMap.get(card.id) || [];
        
        // Add relationships to the flashcard
        card.relationships.collections = cardCollections;
        card.relationships.subjects = cardSubjects;
        
        return card;
      });

      // Log stats for debugging
      const cardsWithCollections = enrichedFlashcards.filter(card => 
        card.relationships?.collections?.length > 0).length;
      const cardsWithSubjects = enrichedFlashcards.filter(card => 
        card.relationships?.subjects?.length > 0).length;
      
      console.log(`Enriched ${flashcards.length} flashcards with relationships:`);
      console.log(`- Cards with collections: ${cardsWithCollections}`);
      console.log(`- Cards with subjects: ${cardsWithSubjects}`);
      console.log(`- Premium cards: ${enrichedFlashcards.filter(card => card.is_official === true).length}`);
      
      // Sample a premium and a non-premium card to debug their structure
      if (process.env.NODE_ENV === 'development') {
        const premiumCard = enrichedFlashcards.find(card => card.is_official === true);
        const regularCard = enrichedFlashcards.find(card => card.is_official !== true);
        
        if (premiumCard) {
          console.log('Premium card relationships example:', {
            id: premiumCard.id.substring(0, 8),
            question: premiumCard.question.substring(0, 20) + '...',
            hasRelObj: !!premiumCard.relationships,
            subjects: premiumCard.relationships?.subjects?.map(s => s.name) || [],
            collections: premiumCard.relationships?.collections?.map(c => c.title) || []
          });
        }
        
        if (regularCard) {
          console.log('Regular card relationships example:', {
            id: regularCard.id.substring(0, 8),
            question: regularCard.question.substring(0, 20) + '...',
            hasRelObj: !!regularCard.relationships,
            subjects: regularCard.relationships?.subjects?.map(s => s.name) || [],
            collections: regularCard.relationships?.collections?.map(c => c.title) || []
          });
        }
      }

      // Final debugging for relationships
      const premiumCards = flashcards.filter(card => card.is_official === true);
      if (process.env.NODE_ENV === 'development' && premiumCards.length > 0) {
        console.log(`---------- PREMIUM CARDS DEBUG -----------`);
        console.log(`Found ${premiumCards.length} premium cards`);
        premiumCards.forEach((card, idx) => {
          if (idx < 3) { // Only log the first 3 to avoid console spam
            console.log(`Premium card ${card.id.substring(0, 8)}:`);
            console.log(`- Question: ${card.question.substring(0, 30)}...`);
            console.log(`- Has relationships: ${!!card.relationships}`);
            console.log(`- Collections (${card.relationships?.collections?.length || 0}):`);
            card.relationships?.collections?.forEach((collection, cidx) => {
              console.log(`  ${cidx+1}. ${collection.title} (${collection.id.substring(0, 8)})`);
            });
            console.log(`- Subjects (${card.relationships?.subjects?.length || 0}):`);
            card.relationships?.subjects?.forEach((subject, sidx) => {
              console.log(`  ${sidx+1}. ${subject.name} (${subject.id.substring(0, 8)})`);
            });
          }
        });
        console.log(`---------- END DEBUG -----------`);
      }

      return enrichedFlashcards;
    } catch (error) {
      console.error('Error enriching flashcards with relationships:', error);
      return flashcards;
    }
  };

  // Function to load more flashcards (for infinite scrolling)
  const loadMoreFlashcards = async () => {
    if (!user || !hasMore) {
      console.log('Aborting loadMoreFlashcards - no user or no more data');
      return;
    }
    
    console.log(`Loading more flashcards for page ${page}`);
    setLoadingMore(true);
    
    // Calculate the range for the next page
    // Supabase ranges are zero-indexed and inclusive of both ends
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;
    
    // Get the current filter from URL to ensure consistency
    const currentFilter = (searchParams.get('filter') || filter) as 'all' | 'official' | 'my';
    
    console.log(`Loading more flashcards: page ${page}, range ${startIndex}-${endIndex}, filter: ${currentFilter}`);
    
    try {
      let query = supabase
        .from('flashcards')
        .select(`
          *,
          collection:collections(*),
          exam_types:flashcard_exam_types(
            exam_type:exam_type_id(
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);
        
      // Apply filter conditions
      if (currentFilter === 'official') {
        query = query.eq('is_official', true);
      } else if (currentFilter === 'my') {
        query = query.eq('created_by', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error loading more flashcards:", error);
        throw error;
      }
      
      console.log(`Received ${data?.length || 0} more flashcards from server`);
      
      if (data?.length === 0) {
        console.log('No more flashcards returned, setting hasMore to false');
        setHasMore(false);
        setLoadingMore(false);
      return;
    }
    
      // Transform the exam_types array to the expected format
      let moreFlashcards = (data || []).map(card => ({
        ...card,
        exam_types: card.exam_types?.map(et => et.exam_type) || []
      }));
      
      // Fetch additional relationship data (all collections and subjects)
      await enrichFlashcardsWithRelationships(moreFlashcards);
      
      // Get real collections and subjects for premium cards (same as in main load function)
      const premiumData = await fetchPremiumContent();
      
      // Apply premium content to premium cards that need it
      moreFlashcards = moreFlashcards.map(card => {
        if (card.is_official === true) {
          // Make sure relationships object exists
          if (!card.relationships) {
            card.relationships = {
              collections: [],
              subjects: []
            };
          }
          
          // For premium cards with no collections, ensure they get the official collections
          if (!card.relationships.collections || card.relationships.collections.length === 0) {
            // Use real collections if available
            if (premiumData.collections && premiumData.collections.length > 0) {
              card.relationships.collections = [...premiumData.collections];
              if (process.env.NODE_ENV === 'development') {
                console.log(`Added ${premiumData.collections.length} real collections to premium card ${card.id.substring(0, 8)}`);
              }
            }
          }
          
          // For premium cards with no subjects, ensure they get real subjects
          if (!card.relationships.subjects || card.relationships.subjects.length === 0) {
            // Use real subjects if available
            if (premiumData.subjects && premiumData.subjects.length > 0) {
              card.relationships.subjects = [...premiumData.subjects];
              if (process.env.NODE_ENV === 'development') {
                console.log(`Added ${premiumData.subjects.length} real subjects to premium card ${card.id.substring(0, 8)}`);
              }
            }
          }
        }
        return card;
      });
      
      // Load mastery status for the new cards
      if (moreFlashcards.length > 0) {
        const { data: progress, error: progressError } = await supabase
          .from('flashcard_progress')
          .select('flashcard_id, is_mastered')
          .eq('user_id', user.id)
          .in('flashcard_id', moreFlashcards.map(c => c.id));
        
        if (!progressError && progress) {
          // Create a map of mastery status
          const masteryMap = new Map();
          progress.forEach(p => masteryMap.set(p.flashcard_id, p.is_mastered));
          
          // Update the new flashcards with mastery status
          moreFlashcards = moreFlashcards.map(card => ({
            ...card,
            is_mastered: masteryMap.has(card.id) ? masteryMap.get(card.id) : false
          }));
        }
      }
      
      // Update hasMore flag - if we got fewer cards than requested, there are no more
      const mightHaveMore = moreFlashcards.length === ITEMS_PER_PAGE;
      console.log(`Setting hasMore to ${mightHaveMore} (got ${moreFlashcards.length} cards)`);
      setHasMore(mightHaveMore);
      
      // Append new cards to existing cards
      setFlashcards(prevCards => {
        const newCards = [...prevCards, ...moreFlashcards];
        console.log(`Now showing ${newCards.length} cards out of ${totalCardCount}`);
        return newCards;
      });
    } catch (err: any) {
      console.error("Error loading more flashcards:", err.message);
      // Don't set error state to avoid disrupting the UI
    } finally {
      setLoadingMore(false);
    }
  };

  // Handler for toggling mastery status
  const toggleMastered = async (card: Flashcard) => {
    if (!user) return;
    
    const newStatus = !card.is_mastered;
    
    // Update state optimistically
    setFlashcards(cards => 
      cards.map(c => c.id === card.id ? {...c, is_mastered: newStatus} : c)
    );
    
    try {
      // Update in database
      const { error } = await supabase
        .from('flashcard_progress')
        .upsert({
          flashcard_id: card.id,
          user_id: user.id,
          is_mastered: newStatus,
          last_reviewed: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (err: any) {
      // Revert optimistic update on error
      setFlashcards(cards => 
        cards.map(c => c.id === card.id ? {...c, is_mastered: !newStatus} : c)
      );
      
      showToast('Failed to update mastery status', 'error');
      console.error('Error updating mastery status:', err.message);
    }
  };

  // Handler for editing a card
  const handleEditCard = (card: Flashcard) => {
    navigate(`/flashcards/edit-card/${card.id}`);
  };

  // Handler for viewing/studying a card
  const handleViewCard = async (card: Flashcard) => {
    try {
      console.log('handleViewCard called for card:', card.id);
      
      // Special case for premium/official cards
      if (card.is_official === true) {
        console.log('This is a premium card, navigating to general study');
        navigate(`/flashcards/study/official`);
        return;
      }
      
      // Check if the card already has a collection ID directly
      if (card.collection?.id) {
        console.log(`Card has direct collection: ${card.collection.id} (${card.collection.title})`);
        
        // Check if this card might be in multiple collections
        const { data: junctionData, error: junctionError } = await supabase
          .from('flashcard_collections_junction')
          .select('collection_id')
          .eq('flashcard_id', card.id);
          
        if (junctionError) {
          console.error('Error checking for multiple collections:', junctionError);
          throw junctionError;
        }
        
        // If there's only one collection, navigate directly
        if (!junctionData || junctionData.length <= 1) {
          console.log('Card is in only one collection, navigating directly');
          navigate(`/flashcards/study/${card.collection.id}`);
          return;
        }
        
        // If there are multiple collections, fetch their details and show selector
        console.log(`Card is in ${junctionData.length} collections, showing selector`);
        const collectionIds = junctionData.map(item => item.collection_id);
        
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('collections')
          .select('id, title')
          .in('id', collectionIds);
          
        if (collectionsError) {
          console.error('Error fetching collections:', collectionsError);
          throw collectionsError;
        }
        
        setCardCollections(collectionsData || []);
        setSelectedCard(card);
        setShowCollectionSelector(true);
      } else {
        // If the card doesn't have a direct collection, query the junction table
        console.log('Card has no direct collection, checking junction table');
        const { data: junctionData, error: junctionError } = await supabase
          .from('flashcard_collections_junction')
          .select('collection_id')
          .eq('flashcard_id', card.id);
          
        if (junctionError) {
          console.error('Error checking junction table:', junctionError);
          throw junctionError;
        }
        
        if (!junctionData || junctionData.length === 0) {
          console.log('No collections found for this card');
          showToast('Cannot study this card - no collection found', 'error');
          return;
        }
        
        // If there's only one collection, navigate directly
        if (junctionData.length === 1) {
          const collectionId = junctionData[0].collection_id;
          console.log(`Found single collection ${collectionId} for flashcard ${card.id}`);
          navigate(`/flashcards/study/${collectionId}`);
          return;
        }
        
        // If there are multiple collections, fetch their details and show selector
        console.log(`Card is in ${junctionData.length} collections, showing selector`);
        const collectionIds = junctionData.map(item => item.collection_id);
        
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('collections')
          .select('id, title')
          .in('id', collectionIds);
          
        if (collectionsError) {
          console.error('Error fetching collections:', collectionsError);
          throw collectionsError;
        }
        
        setCardCollections(collectionsData || []);
        setSelectedCard(card);
        setShowCollectionSelector(true);
      }
    } catch (err: any) {
      console.error('Error finding collection for flashcard:', err);
      showToast('Error accessing study mode', 'error');
    }
  };

  // Handle collection selection
  const handleCollectionSelect = (collectionId: string) => {
    setShowCollectionSelector(false);
    navigate(`/flashcards/study/${collectionId}`);
  };

  // Delete a card
  const deleteCard = async () => {
    if (!cardToDelete) return;
    
    try {
      // Check if user is allowed to delete this card
      if (cardToDelete.is_official) {
        throw new Error('Official flashcards cannot be deleted');
      }
      
      if (cardToDelete.created_by && cardToDelete.created_by !== user?.id) {
        throw new Error('You can only delete your own flashcards');
      }
      
      console.log(`Deleting flashcard ${cardToDelete.id}`);
      
      // With cascading foreign key constraints, we can simply delete the flashcard directly
      // and all related records will be automatically deleted by Postgres
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardToDelete.id);
      
      if (error) {
        console.error("Error deleting flashcard:", error);
        
        // Handle specific error cases
        if (error.code === '42501') {
          // Permission denied - likely RLS policy preventing deletion
          throw new Error('You do not have permission to delete this flashcard');
        } else if (error.code === '23503') {
          // Foreign key violation - this should not happen with cascading deletes
          throw new Error('Unable to delete the flashcard due to related records. Please contact support.');
        } else {
          throw new Error(error.message || 'An error occurred while deleting the flashcard');
        }
      }
      
      console.log(`Successfully deleted flashcard ${cardToDelete.id}`);
      setFlashcards(cards => cards.filter(c => c.id !== cardToDelete.id));
      showToast('Card deleted successfully', 'success');
    } catch (err: any) {
      console.error('Error deleting flashcard:', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setCardToDelete(null);
    }
  };

  // Handle tab filter change
  const handleFilterChange = (value: string) => {
    const newFilter = value as 'all' | 'official' | 'my';
    
    // Don't do anything if we're already on this tab
    if (filter === newFilter) return;
    
    // Update filter and URL
    setFilter(newFilter);
    searchParams.set('filter', newFilter);
    setSearchParams(searchParams);
    
    // Clear cards and show loading
    setFlashcards([]);
    setLoading(true);
  };

  // Handle paywall
  const handleShowPaywall = () => setShowPaywall(true);
  const handleClosePaywall = () => setShowPaywall(false);
  
  // Toggle mastered filter
  const handleToggleMastered = () => setShowMastered(!showMastered);

  // Apply filters to cards
  const filteredCards = useMemo(() => {
    if (!flashcards.length) return [];
    
    return flashcards.filter(card => {
      // Skip mastered cards if filter is enabled
      if (!showMastered && card.is_mastered) return false;
      
      // Subject filter
      if (filterSubject !== 'all' && card.collection?.subject?.id !== filterSubject) {
        return false;
      }
      
      // Collection filter
      if (filterCollection !== 'all' && card.collection?.id !== filterCollection) {
        return false;
      }
      
      // Exam type filter
      if (filterExamType !== 'all') {
        // Check if card has any exam type that matches the filter
        const hasMatchingExamType = card.exam_types?.some(
          examType => examType.id === filterExamType
        );
        
        if (!hasMatchingExamType) return false;
      }
      
      return true;
    });
  }, [flashcards, showMastered, filterSubject, filterCollection, filterExamType]);

  // Add this helper function before the return statement
  const handleDeleteAction = (card: Flashcard) => {
    // Double-check that the user can delete this card
    if (card.is_official) {
      showToast('Official flashcards cannot be deleted', 'error');
      return;
    }
    
    if (card.created_by && card.created_by !== user?.id) {
      showToast('You can only delete your own flashcards', 'error');
      return;
    }
    
    // If passed all checks, show delete confirmation
    setCardToDelete(card);
  }

  // Handle study mode for subjects
  const handleStudySubject = (subject: any) => {
    console.log("Navigating to study mode with subject:", subject.id, subject.name);
    
    // Use the correct path structure for study mode with subject parameter
    navigate(`/flashcards/study/${subject.id}?type=subject`);
  };
  
  // Handle study mode for collections
  const handleStudyCollection = (collection: any) => {
    console.log("Navigating to study mode with collection:", collection.id, collection.title);
    
    // Use the correct path structure for study mode with collection
    navigate(`/flashcards/study/${collection.id}`);
  };

  // Fetch premium collections and subjects
  const fetchPremiumContent = async () => {
    let premiumCollections: Collection[] = [];
    let premiumSubjects: Subject[] = [];
    
    try {
      // Get official/premium collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('id, title, is_official')
        .eq('is_official', true)
        .order('title')
        .limit(5);
        
      if (!collectionsError && collectionsData && collectionsData.length > 0) {
        premiumCollections = collectionsData;
        if (process.env.NODE_ENV === 'development') {
          console.log(`Found ${collectionsData.length} premium collections`);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('No premium collections found:', collectionsError?.message);
        }
      }
      
      // Get subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name')
        .limit(5);
        
      if (!subjectsError && subjectsData && subjectsData.length > 0) {
        premiumSubjects = subjectsData;
        if (process.env.NODE_ENV === 'development') {
          console.log(`Found ${subjectsData.length} subjects for premium cards`);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('No subjects found:', subjectsError?.message);
        }
      }
      
      // Debug premium content
      if (process.env.NODE_ENV === 'development') {
        console.log('Premium collections:', premiumCollections.map(c => c.title));
        console.log('Premium subjects:', premiumSubjects.map(s => s.name));
      }
    } catch (err) {
      console.error('Error fetching premium content:', err);
    }
    
    return {
      collections: premiumCollections,
      subjects: premiumSubjects
    };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
      
      {/* Collection Selector Dialog */}
      <Dialog open={showCollectionSelector} onOpenChange={setShowCollectionSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose a Collection</DialogTitle>
            <DialogDescription>
              This flashcard appears in multiple collections. Which one would you like to study?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {cardCollections.map(collection => (
              <button
                key={collection.id}
                onClick={() => handleCollectionSelect(collection.id)}
                className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <p className="font-medium">{collection.title}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
              <p className="text-gray-600 dark:text-gray-400 flashcard-count">
                {totalCardCount} {totalCardCount === 1 ? 'card' : 'cards'} {!showMastered ? 'to study' : ''}
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2 md:gap-3 md:ml-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 md:gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 md:px-4 md:py-2 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Filter className="h-4 w-4 md:h-5 md:w-5" />
                <span className="md:inline">Filters</span>
              </button>
              
              <button
                onClick={handleToggleMastered}
                className="flex items-center gap-1 md:gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 md:px-4 md:py-2 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                aria-label={showMastered ? "Hide mastered cards" : "Show all cards"}
              >
                {showMastered ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                <span className="hidden xs:inline">{showMastered ? "Hide Mastered" : "Show All"}</span>
              </button>
            </div>
          </div>
          
          {/* Tabs */}
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
                  My Cards
                </TabsTrigger>
              </TabsList>
            </Tabs>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 dark:border dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Subject
              </label>
              <select
                id="subject-filter"
                value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
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
                  {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title}
                  </option>
                ))}
              </select>
            </div>
              
              <div>
                <label htmlFor="exam-type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Exam Type
                </label>
                <select
                  id="exam-type-filter"
                  value={filterExamType}
                  onChange={(e) => setFilterExamType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                >
                  <option value="all">All Exam Types</option>
                  {examTypes.map((examType) => (
                    <option key={examType.id} value={examType.id}>
                      {examType.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      
        {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredCards.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            {filter === 'my' ? (
              <EmptyState 
                icon={<FileText size={48} />}
                title="No Flashcards Found" 
                description="You haven't created any flashcards yet or they're being filtered out. Try creating your first flashcard or checking your filter settings."
                actionText="Create a Flashcard"
                  actionLink="/flashcards/create-flashcard"
              />
            ) : filter === 'official' ? (
              <EmptyState 
                icon={<FileText size={48} />}
                title="No Premium Flashcards Found" 
                description="There are no premium flashcards matching your current filters."
                actionText={!hasSubscription ? "Get Premium Access" : "Explore All Flashcards"}
                actionLink={!hasSubscription ? undefined : "/flashcards/flashcards?filter=all"}
                onActionClick={!hasSubscription ? handleShowPaywall : undefined}
              />
            ) : (
              <EmptyState 
                icon={<FileText size={48} />}
                title="No Flashcards Found" 
                description="No flashcards match your current filters. Try adjusting your filter settings."
                actionText="Create a Flashcard"
                  actionLink="/flashcards/create-flashcard"
              />
            )}
          </div>
        ) : (
          <>
              {filteredCards.map((card, index) => {
                // Check if this card is a premium/official card (official = premium)
                const isPremium = card.is_official === true;
                
                // Log subscription status and collections for debugging
                if (process.env.NODE_ENV === 'development' && isPremium && index < 2) {
                  console.log(`Premium card ${card.id.substring(0, 8)}: isPremium=${isPremium}, hasSubscription=${hasSubscription}`);
                  console.log(`Premium card ${card.id.substring(0, 8)} collections:`, card.relationships?.collections?.map(c => c.title) || []);
                  console.log(`Premium card ${card.id.substring(0, 8)} subjects:`, card.relationships?.subjects?.map(s => s.name) || []);
                }
              
              // Determine if the user can edit/delete this card
                // Only allow editing/deleting if:
                // 1. It's not a premium card (premium cards can never be edited)
                // 2. It's the user's own card
                const isUserOwned = user && (card.created_by === user.id);
                
                const canModify = !isPremium && isUserOwned;
                
                // If this is the last item and we might have more, use the ref
                const isLastItem = index === filteredCards.length - 1;
              
              return (
                  <div 
                    key={`${filter}-${card.id}-${index}`}
                    ref={isLastItem && hasMore ? lastCardRef : null}
                  >
                <EnhancedFlashcardItem
                  flashcard={card}
                  onToggleMastered={toggleMastered}
                  onEdit={canModify ? handleEditCard : undefined}
                      onDelete={canModify ? handleDeleteAction : undefined}
                  onView={handleViewCard}
                      onStudySubject={handleStudySubject}
                      onStudyCollection={handleStudyCollection}
                      isPremium={isPremium}
                  hasSubscription={hasSubscription}
                  onShowPaywall={handleShowPaywall}
                      key={`flashcard-${card.id}`}
                />
                  </div>
              );
            })}
              
              {/* Loading indicator for infinite scroll */}
              {loadingMore && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 py-4 flex justify-center">
                  <LoadingSpinner />
                </div>
              )}
          </>
        )}
        </div>
      </div>
    </div>
  );
} 