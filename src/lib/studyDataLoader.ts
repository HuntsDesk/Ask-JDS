import { supabase } from './supabase';
import { StudyMode } from '@/contexts/StudyContext';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  is_mastered: boolean;
  created_at: string;
  user_id?: string;
  created_by?: string;
  is_official?: boolean;
  difficulty_level?: string;
  collection_id?: string;
  collection?: {
    id: string;
    title: string;
    is_official?: boolean;
    user_id?: string;
    subject?: {
      id: string;
      name: string;
    }
  };
  subjects?: { id: string; name: string }[];
  collections?: { id: string; title: string }[];
  exam_types?: { id: string; name: string }[];
  progress?: any;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  is_official?: boolean;
}

export interface FlashcardCollection {
  id: string;
  title: string;
  description?: string;
  is_official?: boolean;
  user_id?: string;
  subject?: {
    id: string;
    name: string;
  };
}

export interface ExamType {
  id: string;
  name: string;
  description?: string;
}

interface LoadStudyDataResult {
  cards: Flashcard[];
  subject?: Subject | null;
  collection?: FlashcardCollection | null;
  subjects?: Subject[];
  collections?: FlashcardCollection[];
  examTypes?: ExamType[];
}

/**
 * Load study data based on the mode and ID
 */
export async function loadStudyData(mode: StudyMode, userId?: string | null, id?: string | null): Promise<LoadStudyDataResult> {
  switch (mode) {
    case 'subject':
      return loadSubjectData(userId, id);
    case 'collection':
      return loadCollectionData(userId, id);
    case 'unified':
      return loadUnifiedData(userId);
    default:
      throw new Error(`Invalid study mode: ${mode}`);
  }
}

/**
 * Load study data for a specific subject
 */
async function loadSubjectData(userId?: string | null, subjectId?: string | null): Promise<LoadStudyDataResult> {
  if (!subjectId) {
    throw new Error('Subject ID is required for subject mode');
  }
  
  try {
    // Get the subject first
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .single();
      
    if (subjectError) throw subjectError;
    
    // Get all collections for this subject
    const { data: collections, error: collectionsError } = await supabase
      .from('collection_subjects')
      .select(`
        collection_id,
        collection:collection_id (
          id,
          title,
          description,
          is_official,
          user_id
        )
      `)
      .eq('subject_id', subjectId);
      
    if (collectionsError) throw collectionsError;
    
    // Extract collection IDs
    const collectionIds = collections
      ?.map(cs => cs.collection?.id)
      .filter(Boolean) as string[];
      
    if (!collectionIds || collectionIds.length === 0) {
      return { cards: [], subject };
    }
    
    // Get flashcard IDs from the flashcard_collections junction table
    const { data: flashcardCollections, error: flashcardCollectionsError } = await supabase
      .from('flashcard_collections_junction')
      .select('flashcard_id, collection_id')
      .in('collection_id', collectionIds);
      
    if (flashcardCollectionsError) throw flashcardCollectionsError;
    
    if (!flashcardCollections || flashcardCollections.length === 0) {
      return { cards: [], subject };
    }
    
    // Deduplicate flashcard IDs
    const uniqueFlashcardIds = Array.from(
      new Set(flashcardCollections.map(fc => fc.flashcard_id))
    );
    
    // Get flashcard progress if user is logged in
    let progressMap = new Map();
    if (userId) {
      const { data: progressData, error: progressError } = await supabase
        .from('flashcard_progress')
        .select('flashcard_id, is_mastered, id, last_reviewed')
        .eq('user_id', userId)
        .in('flashcard_id', uniqueFlashcardIds);
        
      if (!progressError && progressData) {
        // Create a map of flashcard_id to progress
        progressMap = new Map(progressData.map(p => [p.flashcard_id, p]));
      }
    }
    
    // Fetch the actual flashcards
    const { data: cardsData, error: cardsError } = await supabase
      .from('flashcards')
      .select('*')
      .in('id', uniqueFlashcardIds);
      
    if (cardsError) throw cardsError;
    
    if (!cardsData) {
      return { cards: [], subject };
    }
    
    // Transform cards to include collection title and mastery status
    const transformedCards = cardsData.map((card: any) => {
      // Find which collection this card belongs to
      const flashcardCollection = flashcardCollections.find(fc => fc.flashcard_id === card.id);
      const collectionId = flashcardCollection ? flashcardCollection.collection_id : null;
      const collection = collections?.find(c => c.collection?.id === collectionId)?.collection;
      
      // Get mastery status from progress
      const progress = progressMap.get(card.id);
      
      return {
        ...card,
        collection_id: collectionId,
        collection: collection || { title: 'Unknown Collection' },
        is_mastered: progress ? progress.is_mastered : false,
        progress
      };
    });
    
    return {
      cards: transformedCards,
      subject
    };
  } catch (err) {
    console.error('Error loading subject data:', err);
    throw err;
  }
}

/**
 * Load study data for a specific collection
 */
async function loadCollectionData(userId?: string | null, collectionId?: string | null): Promise<LoadStudyDataResult> {
  if (!collectionId) {
    throw new Error('Collection ID is required for collection mode');
  }
  
  try {
    // Get collection details
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select(`
        id,
        title,
        description,
        is_official,
        user_id,
        subject:subject_id (
          id,
          name
        )
      `)
      .eq('id', collectionId)
      .single();
      
    if (collectionError) throw collectionError;
    
    // Get flashcards for this collection
    const { data: flashcardJunctions, error: junctionError } = await supabase
      .from('flashcard_collections_junction')
      .select('flashcard_id')
      .eq('collection_id', collectionId);
      
    if (junctionError) throw junctionError;
    
    if (!flashcardJunctions || flashcardJunctions.length === 0) {
      return { cards: [], collection };
    }
    
    const flashcardIds = flashcardJunctions.map(j => j.flashcard_id);
    
    // Get flashcard progress if user is logged in
    let progressMap = new Map();
    if (userId) {
      const { data: progressData, error: progressError } = await supabase
        .from('flashcard_progress')
        .select('flashcard_id, is_mastered, id, last_reviewed')
        .eq('user_id', userId)
        .in('flashcard_id', flashcardIds);
        
      if (!progressError && progressData) {
        // Create a map of flashcard_id to progress
        progressMap = new Map(progressData.map(p => [p.flashcard_id, p]));
      }
    }
    
    // Get the actual flashcards
    const { data: cardsData, error: cardsError } = await supabase
      .from('flashcards')
      .select('*')
      .in('id', flashcardIds);
      
    if (cardsError) throw cardsError;
    
    if (!cardsData) {
      return { cards: [], collection };
    }
    
    // Process cards with progress data
    const processedCards = cardsData.map(card => {
      const progress = progressMap.get(card.id);
      
      return {
        ...card,
        collection,
        is_mastered: progress ? progress.is_mastered : false,
        progress
      };
    });
    
    return {
      cards: processedCards,
      collection
    };
  } catch (err) {
    console.error('Error loading collection data:', err);
    throw err;
  }
}

/**
 * Load study data for unified study mode
 */
async function loadUnifiedData(userId?: string | null): Promise<LoadStudyDataResult> {
  try {
    // Get all subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
      
    if (subjectsError) throw subjectsError;
    
    // Get all collections
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select(`
        id,
        title,
        description,
        is_official,
        user_id,
        subject:subject_id (
          id,
          name
        )
      `)
      .order('title');
      
    if (collectionsError) throw collectionsError;
    
    // Get all exam types
    const { data: examTypes, error: examTypesError } = await supabase
      .from('exam_types')
      .select('*')
      .order('name');
      
    if (examTypesError) throw examTypesError;
    
    // Get all flashcards
    console.log('StudyDataLoader: Loading flashcards for unified view');
    
    // Create the filter condition safely
    let filterCondition = 'is_official.eq.true,is_public_sample.eq.true';
    if (userId) {
      filterCondition = `created_by.eq.${userId},${filterCondition}`;
      console.log(`StudyDataLoader: Filter condition includes user ID ${userId}`);
    } else {
      console.log('StudyDataLoader: No user ID available, only showing official and public flashcards');
    }
    
    console.log(`StudyDataLoader: Using filter condition: ${filterCondition}`);
    
    // PRIVACY FIX: Only fetch flashcards the user is allowed to see
    const { data: cardsData, error: cardsError } = await supabase
      .from('flashcards')
      .select('*')
      .or(filterCondition);
      
    if (cardsError) throw cardsError;
    
    if (!cardsData) {
      return { 
        cards: [], 
        subjects: subjects || [],
        collections: collections || [],
        examTypes: examTypes || []
      };
    }
    
    // Get junction data to link flashcards to collections
    const { data: flashcardCollections, error: fcError } = await supabase
      .from('flashcard_collections_junction')
      .select('flashcard_id, collection_id');
      
    if (fcError) throw fcError;
    
    // Get progress data if user is logged in
    let progressMap = new Map();
    if (userId) {
      const { data: progressData, error: progressError } = await supabase
        .from('flashcard_progress')
        .select('flashcard_id, is_mastered, id, last_reviewed')
        .eq('user_id', userId);
        
      if (!progressError && progressData) {
        // Create a map of flashcard_id to progress
        progressMap = new Map(progressData.map(p => [p.flashcard_id, p]));
      }
    }
    
    // Process cards with relationships and progress
    const processedCards = cardsData.map(card => {
      // Get collections for this card
      const cardCollectionIds = flashcardCollections
        ?.filter(fc => fc.flashcard_id === card.id)
        ?.map(fc => fc.collection_id) || [];
        
      const cardCollections = collections
        ?.filter(c => cardCollectionIds.includes(c.id)) || [];
        
      // Get subjects for this card through collections
      const subjectIds = new Set<string>();
      cardCollections.forEach(collection => {
        if (collection.subject?.id) {
          subjectIds.add(collection.subject.id);
        }
      });
      
      const cardSubjects = subjects
        ?.filter(s => subjectIds.has(s.id)) || [];
        
      // Get progress
      const progress = progressMap.get(card.id);
      
      return {
        ...card,
        collections: cardCollections,
        subjects: cardSubjects,
        is_mastered: progress ? progress.is_mastered : false,
        progress
      };
    });
    
    return {
      cards: processedCards,
      subjects: subjects || [],
      collections: collections || [],
      examTypes: examTypes || []
    };
  } catch (err) {
    console.error('Error loading unified study data:', err);
    throw err;
  }
} 