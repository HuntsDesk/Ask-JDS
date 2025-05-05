import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// Query keys for better cache management
export const flashcardKeys = {
  all: ['flashcards'] as const,
  collections: () => [...flashcardKeys.all, 'collections'] as const,
  collection: (id: string) => [...flashcardKeys.collections(), id] as const,
  cards: (collectionId: string) => [...flashcardKeys.collection(collectionId), 'cards'] as const,
  subjects: () => [...flashcardKeys.all, 'subjects'] as const,
  examTypes: () => [...flashcardKeys.all, 'examTypes'] as const,
  progress: (userId: string) => [...flashcardKeys.all, 'progress', userId] as const,
};

// Hook to fetch all collections
export function useFlashcardCollections(filter: 'all' | 'official' | 'my' = 'all', subjectIds: string[] = [], options = {}) {
  const { user } = useAuth();
  
  return useInfiniteQuery({
    queryKey: [...flashcardKeys.collections(), filter, subjectIds],
    queryFn: async ({ pageParam = 0 }) => {
      console.log("useFlashcardCollections: Fetching collections with filter:", filter, "and subjects:", subjectIds, "pageParam:", pageParam);
      
      // First build the base query
      let query = supabase
        .from('collections')
        .select(`
          id,
          title,
          description,
          created_at,
          is_official,
          user_id
        `)
        .order('created_at', { ascending: false });
      
      // Apply offset-based pagination (instead of cursor-based)
      // Each page is 30 items
      const pageSize = 30;
      const offset = typeof pageParam === 'number' ? pageParam * pageSize : 0;
      query = query.range(offset, offset + pageSize - 1);
      console.log(`Using offset pagination: offset=${offset}, limit=${pageSize}`);
      
      // Apply tab filters
      if (filter === 'official') {
        query = query.eq('is_official', true);
      } else if (filter === 'my' && user) {
        query = query.eq('user_id', user.id);
      }
      
      // Apply subject filter if present
      let filteredCollectionIds: string[] = [];
      
      if (subjectIds.length > 0) {
        // Get collection IDs that match these subjects
        const { data: collectionSubjects, error: junctionError } = await supabase
          .from('collection_subjects')
          .select('collection_id')
          .in('subject_id', subjectIds);
        
        if (junctionError) throw junctionError;
        
        if (collectionSubjects && collectionSubjects.length > 0) {
          filteredCollectionIds = Array.from(new Set(collectionSubjects.map(cs => cs.collection_id)));
          
          // Apply filter
          query = query.in('id', filteredCollectionIds);
        } else {
          // No collections match these subjects
          return {
            collections: [],
            totalCount: 0,
            subjectMap: {},
            cardCounts: {},
            masteryData: {},
            nextCursor: null
          };
        }
      }
      
      // Get total count with filters applied (but no pagination)
      // Create a separate query for counting (can't use clone())
      let countQuery = supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .order('created_at', { ascending: false });
        
      // Apply the same filters as the main query
      if (filter === 'official') {
        countQuery = countQuery.eq('is_official', true);
      } else if (filter === 'my' && user) {
        countQuery = countQuery.eq('user_id', user.id);
      }
      
      // Apply subject filter if present
      if (subjectIds.length > 0 && filteredCollectionIds.length > 0) {
        countQuery = countQuery.in('id', filteredCollectionIds);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      // Fetch the actual collections with pagination
      const { data: collectionsData, error: collectionsError } = await query;
      console.log("useFlashcardCollections: Fetched collections:", collectionsData?.length || 0);
      
      if (collectionsError) throw collectionsError;
      
      if (!collectionsData || collectionsData.length === 0) {
        return {
          collections: [],
          totalCount: count || 0,
          subjectMap: {},
          cardCounts: {},
          masteryData: {},
          nextCursor: null
        };
      }
      
      // Extract all collection IDs for batch queries
      const fetchedCollectionIds = collectionsData.map(collection => collection.id);
      
      // Calculate if there are more pages
      const hasNextPage = offset + collectionsData.length < (count || 0);
      console.log(`hasNextPage=${hasNextPage}, offset=${offset}, fetched=${collectionsData.length}, total=${count}`);
      
      // Get next page number
      const nextCursor = hasNextPage ? (pageParam as number) + 1 : null;
      
      // BATCH QUERY: Get all subject relationships for these collections at once
      const { data: allCollectionSubjects, error: allSubjectsError } = await supabase
        .from('collection_subjects')
        .select('collection_id, subject_id')
        .in('collection_id', fetchedCollectionIds);
        
      if (allSubjectsError) throw allSubjectsError;
      
      // Get all unique subject IDs to fetch subject details
      const uniqueSubjectIds = Array.from(new Set((allCollectionSubjects || []).map(cs => cs.subject_id)));
      
      // BATCH QUERY: Get subject details
      const { data: subjectDetails, error: subjectDetailsError } = await supabase
        .from('subjects')
        .select('id, name')
        .in('id', uniqueSubjectIds);
        
      if (subjectDetailsError) throw subjectDetailsError;
      
      // Create subject lookup map
      const subjectMap: Record<string, { id: string; name: string }> = {};
      (subjectDetails || []).forEach(subject => {
        subjectMap[subject.id] = subject;
      });
      
      // BATCH QUERY: Get card counts for all collections at once
      const { data: cardCounts, error: countQueryError } = await supabase
        .from('flashcard_collections_junction')
        .select('collection_id, flashcard_id')
        .in('collection_id', fetchedCollectionIds);
        
      if (countQueryError) throw countQueryError;
      
      console.log("useFlashcardCollections: Card junction data:", cardCounts?.length || 0, "entries");
      
      // Process card counts
      const cardCountMap: Record<string, number> = {};
      (cardCounts || []).forEach(junction => {
        if (!cardCountMap[junction.collection_id]) {
          cardCountMap[junction.collection_id] = 0;
        }
        cardCountMap[junction.collection_id]++;
      });
      
      console.log("useFlashcardCollections: Processed card counts:", cardCountMap);
      
      // BATCH QUERY: Get user progress data if user is logged in
      let masteryData: Record<string, { total: number; mastered: number }> = {};
      
      if (user) {
        // Get all flashcard IDs first
        const flashcardIds = Array.from(new Set((cardCounts || []).map(j => j.flashcard_id)));
        
        if (flashcardIds.length > 0) {
          console.log("useFlashcardCollections: Fetching progress for", flashcardIds.length, "flashcards");
          
          const { data: progressData, error: progressError } = await supabase
            .from('flashcard_progress')
            .select('flashcard_id, is_mastered')
            .eq('user_id', user.id)
            .in('flashcard_id', flashcardIds);
            
          if (progressError) throw progressError;
          
          console.log("useFlashcardCollections: Got progress data for", progressData?.length || 0, "flashcards");
          
          // Create a map of flashcard ID to mastery level
          const progressMap: Record<string, boolean> = {};
          (progressData || []).forEach(progress => {
            progressMap[progress.flashcard_id] = progress.is_mastered;
          });
          
          // Now map the progress data back to collections
          (cardCounts || []).forEach(junction => {
            if (!masteryData[junction.collection_id]) {
              masteryData[junction.collection_id] = { total: 0, mastered: 0 };
            }
            
            masteryData[junction.collection_id].total++;
            
            // Check if this card is mastered
            if (progressMap[junction.flashcard_id]) {
              masteryData[junction.collection_id].mastered++;
            }
          });
          
          console.log("useFlashcardCollections: Processed mastery data:", masteryData);
        }
      }
      
      // Return everything needed for rendering, including the cursor for next page
      return {
        collections: collectionsData,
        totalCount: count || 0,
        subjectMap,
        subjectRelationships: allCollectionSubjects || [],
        cardCounts: cardCountMap,
        masteryData,
        nextCursor
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // Default options can be overridden
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
}

// Hook to fetch a specific collection with its subjects
export function useFlashcardCollection(id: string, options = {}) {
  return useQuery({
    queryKey: flashcardKeys.collection(id),
    queryFn: async () => {
      // Fetch collection details
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select(`
          id,
          title,
          description,
          created_at,
          is_official,
          user_id
        `)
        .eq('id', id)
        .single();
      
      if (collectionError) throw collectionError;
      
      // Fetch associated subjects
      const { data: subjectData, error: subjectError } = await supabase
        .from('collection_subjects')
        .select(`
          subject_id,
          subjects:subject_id(id, name)
        `)
        .eq('collection_id', id);
      
      if (subjectError && !subjectError.message.includes('No rows returned')) {
        throw subjectError;
      }
      
      return {
        ...collection,
        subjects: subjectData?.map(s => s.subjects) || []
      };
    },
    // Don't fetch if no ID is provided
    enabled: !!id,
    ...options,
  });
}

// Hook to fetch cards for a collection
export function useFlashcards(collectionId: string, options = {}) {
  return useQuery({
    queryKey: flashcardKeys.cards(collectionId),
    queryFn: async () => {
      // Query the junction table to get flashcard IDs for this collection
      const { data: junctionData, error: junctionError } = await supabase
        .from('flashcard_collections_junction')
        .select('flashcard_id')
        .eq('collection_id', collectionId);
      
      if (junctionError) throw junctionError;
      
      if (!junctionData?.length) return [];
      
      // Get the flashcard details
      const flashcardIds = junctionData.map(j => j.flashcard_id);
      
      const { data: cardsData, error: cardsError } = await supabase
        .from('flashcards')
        .select(`
          *,
          flashcard_collections:flashcard_collections(
            collection_id,
            collections:collection_id(id, title, is_official, user_id)
          ),
          flashcard_subjects:flashcard_subjects(
            subject_id,
            subjects:subject_id(id, name)
          ),
          flashcard_exam_types:flashcard_exam_types(
            exam_type_id,
            exam_types:exam_type_id(id, name)
          )
        `)
        .in('id', flashcardIds)
        .order('created_at');
      
      if (cardsError) throw cardsError;
      
      // Process the cards to include their relationships
      const processedCards = (cardsData || []).map(card => {
        // Extract collections
        const cardCollections = card.flashcard_collections?.map(rel => rel.collections) || [];
        
        // Extract subjects
        const cardSubjects = card.flashcard_subjects?.map(rel => rel.subjects) || [];
        
        // Extract exam types
        const cardExamTypes = card.flashcard_exam_types?.map(rel => rel.exam_types) || [];
        
        // Return transformed card
        return {
          ...card,
          collections: cardCollections,
          subjects: cardSubjects,
          exam_types: cardExamTypes,
          // For backward compatibility
          collection: cardCollections.find(c => c.id === collectionId) || (cardCollections.length > 0 ? cardCollections[0] : null),
          // Clean up redundant junction data
          flashcard_collections: undefined,
          flashcard_subjects: undefined,
          flashcard_exam_types: undefined
        };
      });
      
      return processedCards;
    },
    // Don't fetch if no collection ID is provided
    enabled: !!collectionId,
    ...options,
  });
}

// Hook to fetch all subjects
export function useSubjects(options = {}) {
  return useQuery({
    queryKey: flashcardKeys.subjects(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
}

// Hook to fetch all exam types
export function useExamTypes(options = {}) {
  return useQuery({
    queryKey: flashcardKeys.examTypes(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_types')
        .select('id, name, description')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
}

// Hook to fetch cards with user progress
export function useFlashcardsWithProgress(collectionId: string, options = {}) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...flashcardKeys.cards(collectionId), 'withProgress', user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('User must be authenticated to fetch flashcard progress');
      }
      
      // First get the flashcard IDs from the junction table
      const { data: junctionData, error: junctionError } = await supabase
        .from('flashcard_collections_junction')
        .select('flashcard_id')
        .eq('collection_id', collectionId);
      
      if (junctionError) throw junctionError;
      
      if (!junctionData?.length) return [];
      
      const flashcardIds = junctionData.map(j => j.flashcard_id);
      
      // Get the flashcard details
      const { data: cardsData, error: cardsError } = await supabase
        .from('flashcards')
        .select(`
          *,
          flashcard_collections:flashcard_collections(
            collection_id,
            collections:collection_id(id, title, is_official, user_id)
          ),
          flashcard_subjects:flashcard_subjects(
            subject_id,
            subjects:subject_id(id, name)
          ),
          flashcard_exam_types:flashcard_exam_types(
            exam_type_id,
            exam_types:exam_type_id(id, name)
          )
        `)
        .in('id', flashcardIds)
        .order('created_at');
      
      if (cardsError) throw cardsError;
      
      if (!cardsData?.length) return [];
      
      // Then get the user's progress for these cards
      const { data: progress, error: progressError } = await supabase
        .from('flashcard_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('flashcard_id', cardsData.map(c => c.id));
      
      if (progressError) {
        console.error('Error fetching progress:', progressError);
        // Continue without progress data if there's an error
      }
      
      // Merge the cards with their progress
      const progressMap = (progress || []).reduce((map, p) => {
        map[p.flashcard_id] = p;
        return map;
      }, {});
      
      // Process the cards to include their relationships and progress
      const processedCards = cardsData.map(card => {
        // Extract collections
        const cardCollections = card.flashcard_collections?.map(rel => rel.collections) || [];
        
        // Extract subjects
        const cardSubjects = card.flashcard_subjects?.map(rel => rel.subjects) || [];
        
        // Extract exam types
        const cardExamTypes = card.flashcard_exam_types?.map(rel => rel.exam_types) || [];
        
        // Return transformed card with progress
        return {
          ...card,
          collections: cardCollections,
          subjects: cardSubjects,
          exam_types: cardExamTypes,
          // For backward compatibility
          collection: cardCollections.find(c => c.id === collectionId) || (cardCollections.length > 0 ? cardCollections[0] : null),
          // Progress data
          progress: progressMap[card.id] || null,
          is_mastered: progressMap[card.id]?.is_mastered || false,
          last_reviewed: progressMap[card.id]?.last_reviewed || null,
          // Clean up redundant junction data
          flashcard_collections: undefined,
          flashcard_subjects: undefined,
          flashcard_exam_types: undefined
        };
      });
      
      return processedCards;
    },
    enabled: !!collectionId && !!user?.id,
    ...options,
  });
}

// Mutation to toggle a card's mastered status in the progress table
export function useToggleCardMastered() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ cardId, isMastered }: { cardId: string; isMastered: boolean }) => {
      if (!user) {
        throw new Error('User must be authenticated to update flashcard progress');
      }
      
      // First, check if progress record exists
      const { data: existingProgress, error: fetchError } = await supabase
        .from('flashcard_progress')
        .select('*')
        .eq('flashcard_id', cardId)
        .eq('user_id', user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw fetchError;
      }
      
      if (existingProgress) {
        // Update existing progress
        const { data, error } = await supabase
          .from('flashcard_progress')
          .update({ 
            is_mastered: isMastered,
            last_reviewed: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new progress record
        const { data, error } = await supabase
          .from('flashcard_progress')
          .insert({
            user_id: user.id,
            flashcard_id: cardId,
            is_mastered: isMastered,
            last_reviewed: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    // When mutation succeeds, invalidate queries
    onSuccess: (updatedProgress) => {
      if (user) {
        // Get collections for this flashcard and invalidate related queries
        (async () => {
          try {
            // Get collections for this flashcard
            const { data, error } = await supabase
              .from('flashcard_collections_junction')
              .select('collection_id')
              .eq('flashcard_id', updatedProgress.flashcard_id);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              // Invalidate queries for each collection this flashcard belongs to
              data.forEach(item => {
                queryClient.invalidateQueries({ 
                  queryKey: flashcardKeys.cards(item.collection_id) 
                });
                queryClient.invalidateQueries({ 
                  queryKey: [...flashcardKeys.cards(item.collection_id), 'withProgress', user.id] 
                });
              });
            }
            
            // Also invalidate all flashcard queries
            queryClient.invalidateQueries({ 
              queryKey: flashcardKeys.all 
            });
          } catch (err) {
            console.error('Error invalidating queries:', err);
            // Fallback to invalidating all flashcard queries
            queryClient.invalidateQueries({ 
              queryKey: flashcardKeys.all 
            });
          }
        })();
      }
    }
  });
} 