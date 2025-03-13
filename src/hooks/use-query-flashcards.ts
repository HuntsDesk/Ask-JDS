import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
export function useFlashcardCollections(options = {}) {
  return useQuery(
    flashcardKeys.collections(),
    async () => {
      // First get all collections
      const { data: collectionsData, error: collectionsError } = await supabase
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
      
      if (collectionsError) throw collectionsError;
      
      // For each collection, get its associated subjects through the junction table
      const collections = await Promise.all((collectionsData || []).map(async (collection) => {
        const { data: subjectData, error: subjectError } = await supabase
          .from('collection_subjects')
          .select(`
            subject_id,
            subjects:subject_id(id, name)
          `)
          .eq('collection_id', collection.id);
        
        return {
          ...collection,
          subjects: subjectError ? [] : subjectData?.map(s => s.subjects) || []
        };
      }));
      
      return collections;
    },
    {
      // Default options can be overridden
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options,
    }
  );
}

// Hook to fetch a specific collection with its subjects
export function useFlashcardCollection(id: string, options = {}) {
  return useQuery(
    flashcardKeys.collection(id),
    async () => {
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
    {
      // Don't fetch if no ID is provided
      enabled: !!id,
      ...options,
    }
  );
}

// Hook to fetch cards for a collection
export function useFlashcards(collectionId: string, options = {}) {
  return useQuery(
    flashcardKeys.cards(collectionId),
    async () => {
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
    {
      // Don't fetch if no collection ID is provided
      enabled: !!collectionId,
      ...options,
    }
  );
}

// Hook to fetch all subjects
export function useSubjects(options = {}) {
  return useQuery(
    flashcardKeys.subjects(),
    async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      ...options,
    }
  );
}

// Hook to fetch all exam types
export function useExamTypes(options = {}) {
  return useQuery(
    flashcardKeys.examTypes(),
    async () => {
      const { data, error } = await supabase
        .from('exam_types')
        .select('id, name, description')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      ...options,
    }
  );
}

// Hook to fetch cards with user progress
export function useFlashcardsWithProgress(collectionId: string, options = {}) {
  const { user } = useAuth();
  
  return useQuery(
    [...flashcardKeys.cards(collectionId), 'withProgress', user?.id],
    async () => {
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
    {
      enabled: !!collectionId && !!user?.id,
      ...options,
    }
  );
}

// Mutation to toggle a card's mastered status in the progress table
export function useToggleCardMastered() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation(
    async ({ cardId, isMastered }: { cardId: string; isMastered: boolean }) => {
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
    {
      // When mutation succeeds, invalidate queries
      onSuccess: (updatedProgress) => {
        if (user) {
          // Get collections for this flashcard to invalidate collection-specific queries
          supabase
            .from('flashcard_collections_junction')
            .select('collection_id')
            .eq('flashcard_id', updatedProgress.flashcard_id)
            .then(({ data }) => {
              if (data && data.length > 0) {
                // Invalidate queries for each collection this flashcard belongs to
                data.forEach(item => {
                  queryClient.invalidateQueries(flashcardKeys.cards(item.collection_id));
                  queryClient.invalidateQueries([...flashcardKeys.cards(item.collection_id), 'withProgress', user.id]);
                });
              }
              // Also invalidate all flashcard queries
              queryClient.invalidateQueries(flashcardKeys.all);
            })
            .catch(err => {
              console.error('Error invalidating queries:', err);
              // Fallback to invalidating all flashcard queries
              queryClient.invalidateQueries(flashcardKeys.all);
            });
        }
      }
    }
  );
} 