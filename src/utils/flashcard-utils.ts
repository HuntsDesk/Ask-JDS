/**
 * Utility functions for processing flashcard data
 */

export interface RelationshipData {
  flashcardCollections: Record<string, string[]>;
  flashcardSubjects: Record<string, string[]>;
  flashcardExamTypes: Record<string, string[]>;
  collectionSubjects: Record<string, string[]>;
  subjectMap: Record<string, { id: string; name: string }>;
  collectionMap: Record<string, { 
    id: string; 
    title: string; 
    is_official?: boolean;
    user_id?: string;
  }>;
  examTypeMap: Record<string, { id: string; name: string }>;
}

/**
 * Enriches a flashcard with its relationships
 * 
 * @param flashcard The base flashcard to enrich
 * @param relationshipData The relationship data to use for enrichment
 * @returns The enriched flashcard with relationships
 */
export function enrichFlashcardWithRelationships(
  flashcard: any,
  relationshipData: RelationshipData
) {
  if (!relationshipData || !flashcard) return flashcard;
  
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
}

/**
 * Processes relationship data into efficient lookup structures
 * 
 * @param data Raw relationship data from database queries
 * @returns Structured relationship data for efficient lookups
 */
export function processRelationshipData({
  subjects = [],
  collections = [],
  examTypes = [],
  flashcardCollections = [],
  flashcardSubjects = [],
  flashcardExamTypes = [],
  collectionSubjects = []
}: {
  subjects: any[];
  collections: any[];
  examTypes: any[];
  flashcardCollections: any[];
  flashcardSubjects: any[];
  flashcardExamTypes: any[];
  collectionSubjects: any[];
}): RelationshipData {
  // Maps for O(1) lookups
  const subjectMap: Record<string, any> = {};
  const collectionMap: Record<string, any> = {};
  const examTypeMap: Record<string, any> = {};
  
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
    flashcardCollections: fcMap,
    flashcardSubjects: fsMap,
    flashcardExamTypes: feMap,
    collectionSubjects: csMap,
    subjectMap,
    collectionMap,
    examTypeMap
  };
} 