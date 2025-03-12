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
  progress: (userId: string) => [...flashcardKeys.all, 'progress', userId] as const,
};

// Hook to fetch all collections
export function useFlashcardCollections(options = {}) {
  return useQuery(
    flashcardKeys.collections(),
    async () => {
      const { data, error } = await supabase
        .from('flashcard_collections')
        .select(`
          id,
          title,
          description,
          created_at,
          subject_id,
          subject:subject_id(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    {
      // Default options can be overridden
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options,
    }
  );
}

// Hook to fetch a specific collection with its cards
export function useFlashcardCollection(id: string, options = {}) {
  return useQuery(
    flashcardKeys.collection(id),
    async () => {
      // Fetch collection details
      const { data: collection, error: collectionError } = await supabase
        .from('flashcard_collections')
        .select(`
          id,
          title,
          description,
          subject_id,
          created_at,
          subject:subject_id (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();
      
      if (collectionError) throw collectionError;
      
      return collection;
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
      const { data, error } = await supabase
        .from('flashcards')
        .select(`
          *,
          collection:collection_id (
            id,
            title,
            is_official,
            user_id
          )
        `)
        .eq('collection_id', collectionId)
        .order('position')
        .order('created_at');
      
      if (error) throw error;
      return data || [];
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

// Hook to fetch cards with user progress
export function useFlashcardsWithProgress(collectionId: string, options = {}) {
  const { user } = useAuth();
  
  return useQuery(
    [...flashcardKeys.cards(collectionId), 'withProgress', user?.id],
    async () => {
      if (!user) {
        throw new Error('User must be authenticated to fetch flashcard progress');
      }
      
      // First get the flashcards
      const { data: cards, error: cardsError } = await supabase
        .from('flashcards')
        .select(`
          *,
          collection:collection_id (
            id,
            title,
            is_official,
            user_id
          )
        `)
        .eq('collection_id', collectionId)
        .order('position')
        .order('created_at');
      
      if (cardsError) throw cardsError;
      if (!cards?.length) return [];
      
      // Then get the user's progress for these cards
      const { data: progress, error: progressError } = await supabase
        .from('flashcard_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('flashcard_id', cards.map(c => c.id));
      
      if (progressError) {
        console.error('Error fetching progress:', progressError);
        // Continue without progress data if there's an error
      }
      
      // Merge the cards with their progress
      const progressMap = (progress || []).reduce((map, p) => {
        map[p.flashcard_id] = p;
        return map;
      }, {});
      
      return cards.map(card => ({
        ...card,
        progress: progressMap[card.id] || null,
        is_mastered: progressMap[card.id]?.is_mastered || false,
        last_reviewed: progressMap[card.id]?.last_reviewed || null
      }));
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
          // Get collection ID to invalidate collection-specific queries
          supabase
            .from('flashcards')
            .select('collection_id')
            .eq('id', updatedProgress.flashcard_id)
            .single()
            .then(({ data }) => {
              if (data?.collection_id) {
                queryClient.invalidateQueries(flashcardKeys.cards(data.collection_id));
                queryClient.invalidateQueries([...flashcardKeys.cards(data.collection_id), 'withProgress', user.id]);
              }
            });
          
          // Also invalidate general progress queries
          queryClient.invalidateQueries(flashcardKeys.progress(user.id));
        }
      },
    }
  );
} 