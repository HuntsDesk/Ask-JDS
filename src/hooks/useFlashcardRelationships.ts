import { useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useCachedData } from './use-cached-data';

interface Subject {
  id: string;
  name: string;
}

interface Collection {
  id: string;
  title: string;
  is_official: boolean;
  user_id: string;
}

interface FlashcardRelationshipData {
  subjects: Subject[];
  collections: Collection[];
  flashcardCollections: Record<string, string[]>; // flashcardId -> [collectionId]
  flashcardSubjects: Record<string, string[]>; // flashcardId -> [subjectId]
  flashcardExamTypes: Record<string, string[]>; // flashcardId -> [examTypeId]
  collectionSubjects: Record<string, string[]>; // collectionId -> [subjectId]
  subjectMap: Record<string, Subject>; // subjectId -> Subject
  collectionMap: Record<string, Collection>; // collectionId -> Collection
  examTypeMap: Record<string, { id: string; name: string }>; // examTypeId -> ExamType
}

/**
 * Custom hook to efficiently load and cache all flashcard relationship data
 * This greatly reduces API calls when loading the flashcards page
 */
export function useFlashcardRelationships() {
  // Define a stable fetch function that doesn't change on every render
  // Using useCallback with empty dependency array ensures stability
  const fetchRelationshipData = useCallback(async (): Promise<FlashcardRelationshipData> => {
    console.log("Fetching all flashcard relationship data");
    
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
    
    // Step 3: Process data into efficient lookup structures
    // Maps for O(1) lookups
    const subjectMap: Record<string, Subject> = {};
    const collectionMap: Record<string, Collection> = {};
    const examTypeMap: Record<string, { id: string; name: string }> = {};
    
    // Relations as maps of arrays
    const fcMap: Record<string, string[]> = {};
    const fsMap: Record<string, string[]> = {};
    const feMap: Record<string, string[]> = {};
    const csMap: Record<string, string[]> = {};
    
    // Build maps
    subjects.forEach(subject => {
      subjectMap[subject.id] = subject;
    });
    
    collections.forEach(collection => {
      collectionMap[collection.id] = collection;
    });
    
    examTypes.forEach(examType => {
      examTypeMap[examType.id] = examType;
    });
    
    // Build relation maps for flashcard collections
    flashcardCollections.forEach(item => {
      if (!fcMap[item.flashcard_id]) {
        fcMap[item.flashcard_id] = [];
      }
      fcMap[item.flashcard_id].push(item.collection_id);
    });
    
    // Build relation maps for flashcard subjects
    flashcardSubjects.forEach(item => {
      if (!fsMap[item.flashcard_id]) {
        fsMap[item.flashcard_id] = [];
      }
      fsMap[item.flashcard_id].push(item.subject_id);
    });
    
    // Build relation maps for flashcard exam types
    flashcardExamTypes.forEach(item => {
      if (!feMap[item.flashcard_id]) {
        feMap[item.flashcard_id] = [];
      }
      feMap[item.flashcard_id].push(item.exam_type_id);
    });
    
    // Build relation maps for collection subjects
    collectionSubjects.forEach(item => {
      if (!csMap[item.collection_id]) {
        csMap[item.collection_id] = [];
      }
      csMap[item.collection_id].push(item.subject_id);
    });
    
    return {
      subjects,
      collections,
      flashcardCollections: fcMap,
      flashcardSubjects: fsMap,
      flashcardExamTypes: feMap,
      collectionSubjects: csMap,
      subjectMap,
      collectionMap,
      examTypeMap
    };
  }, []); // Empty dependency array ensures stability
  
  // Use the cached data hook to efficiently store and retrieve this data
  const [relationshipData, loading, error, refetch] = useCachedData<FlashcardRelationshipData>(
    'flashcard-relationships',
    fetchRelationshipData,
    { expiration: 10 * 60 * 1000 } // 10 minutes cache
  );
  
  /**
   * Enriches a flashcard with its relationships
   * Using useMemo to create a stable function reference that only changes when relationshipData changes
   */
  const enrichFlashcard = useMemo(() => {
    // Return a function that closes over the current relationshipData
    return (flashcard: any) => {
      if (!relationshipData) return flashcard;
      
      const relationships = {
        collections: [],
        subjects: [],
        examTypes: []
      };
      
      // Add collections
      const collectionIds = relationshipData.flashcardCollections[flashcard.id] || [];
      if (collectionIds.length > 0) {
        relationships.collections = collectionIds
          .map(id => relationshipData.collectionMap[id])
          .filter(Boolean);
      }
      
      // Add subjects
      const subjectIds = relationshipData.flashcardSubjects[flashcard.id] || [];
      if (subjectIds.length > 0) {
        relationships.subjects = subjectIds
          .map(id => relationshipData.subjectMap[id])
          .filter(Boolean);
      }
      
      // Add exam types
      const examTypeIds = relationshipData.flashcardExamTypes[flashcard.id] || [];
      if (examTypeIds.length > 0) {
        relationships.examTypes = examTypeIds
          .map(id => relationshipData.examTypeMap[id])
          .filter(Boolean);
      }
      
      // If there's no direct collection, we still need a default collection property
      if (!flashcard.collection) {
        // Try to find a collection through relationships
        const firstCollection = relationships.collections[0];
        if (firstCollection) {
          const collSubjects = relationshipData.collectionSubjects[firstCollection.id] || [];
          const subject = collSubjects.length > 0 
            ? relationshipData.subjectMap[collSubjects[0]] 
            : { id: '', name: 'Uncategorized' };
            
          flashcard.collection = {
            ...firstCollection,
            subject
          };
        } else {
          flashcard.collection = {
            id: '',
            title: 'No Collection',
            is_official: false,
            user_id: flashcard.created_by || '',
            subject: { name: 'Uncategorized', id: '' }
          };
        }
      }
      
      return {
        ...flashcard,
        relationships
      };
    };
  }, [relationshipData]); // Only depends on relationshipData
  
  return {
    relationshipData,
    loading,
    error,
    refetch,
    enrichFlashcard
  };
} 