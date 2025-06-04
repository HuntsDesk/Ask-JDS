/**
 * Centralized cache configuration for flashcard system
 * 
 * This file provides a single source of truth for all cache durations
 * used throughout the flashcard module. Changes here will affect all
 * flashcard-related queries.
 */

export const CACHE_DURATIONS = {
  /**
   * Official content (subjects, collections, official flashcards)
   * 72 hours - Static content that rarely changes
   */
  OFFICIAL_CONTENT: 72 * 60 * 60 * 1000, // 72 hours

  /**
   * User-generated content (user flashcards, user collections)
   * 1 hour - Dynamic content with occasional updates
   */
  USER_CONTENT: 60 * 60 * 1000, // 1 hour

  /**
   * User progress and mastery status
   * 5 minutes - Frequently changing user state
   */
  USER_PROGRESS: 5 * 60 * 1000, // 5 minutes

  /**
   * Relationships and junction table data
   * 72 hours - Structural data that changes infrequently
   */
  RELATIONSHIPS: 72 * 60 * 60 * 1000, // 72 hours

  /**
   * Search results and filtered queries
   * 1 hour - Dynamic queries that should refresh periodically
   */
  SEARCH_RESULTS: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Helper function to get cache duration based on content type
 */
export const getCacheDuration = (type: keyof typeof CACHE_DURATIONS): number => {
  return CACHE_DURATIONS[type];
};

/**
 * Type-safe cache duration access
 */
export type CacheDurationType = keyof typeof CACHE_DURATIONS; 