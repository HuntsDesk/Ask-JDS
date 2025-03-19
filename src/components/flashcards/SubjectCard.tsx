import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Lock, PlusCircle, Edit, Trash2, CheckCircle2, Layers, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Tooltip from './Tooltip';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface SubjectCardProps {
  id: string;
  name: string;
  description: string;
  isOfficial: boolean;
  collectionCount: number;
  onStudy: () => void;
  onDelete?: () => void;
  showDeleteButton: boolean;
}

interface CardStats {
  total: number;
  mastered: number;
}

// Custom hook to fetch card statistics
function useCardStats(subjectId: string): {
  stats: CardStats;
  loading: boolean;
  error: Error | null;
} {
  const [stats, setStats] = useState<CardStats>({ total: 0, mastered: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip the effect if we don't have a valid subject ID
    if (!subjectId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First get all collections for this subject using the junction table
        const { data: collectionSubjects, error: collectionError } = await supabase
          .from('collection_subjects')
          .select('collection_id')
          .eq('subject_id', subjectId);
          
        if (collectionError) throw collectionError;
        
        // If there are no collections, we can return early with zeros
        if (!collectionSubjects || collectionSubjects.length === 0) {
          if (isMounted) {
            setStats({ total: 0, mastered: 0 });
            setLoading(false);
          }
          return;
        }
        
        const collectionIds = collectionSubjects.map(cs => cs.collection_id);
        
        // Use the flashcard_collections junction table to get the flashcard IDs
        const { data: flashcardCollections, error: flashcardsError } = await supabase
          .from('flashcard_collections_junction')
          .select('flashcard_id')
          .in('collection_id', collectionIds);
          
        if (flashcardsError) throw flashcardsError;
        
        // If there are no flashcards, return zeros
        if (!flashcardCollections || flashcardCollections.length === 0) {
          if (isMounted) {
            setStats({ total: 0, mastered: 0 });
            setLoading(false);
          }
          return;
        }
        
        const flashcardIds = flashcardCollections.map(fc => fc.flashcard_id);
        
        // Use a single batched query to get both total and mastered counts
        const [totalResult, masteredResult] = await Promise.all([
          // Total is just the length of flashcardIds
          Promise.resolve({ count: flashcardIds.length }),
          
          // Get mastered card count from progress table
          supabase
            .from('flashcard_progress')
            .select('*', { count: 'exact', head: true })
            .in('flashcard_id', flashcardIds)
            .eq('is_mastered', true)
        ]);
        
        if (masteredResult.error) throw masteredResult.error;
        
        if (isMounted) {
          setStats({
            total: totalResult.count || 0,
            mastered: masteredResult.count || 0
          });
        }
      } catch (err) {
        console.error('Error loading card stats:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load card statistics'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchStats();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [subjectId]);

  return { stats, loading, error };
}

export default function SubjectCard({
  id,
  name,
  description,
  isOfficial,
  collectionCount,
  onStudy,
  onDelete,
  showDeleteButton
}: SubjectCardProps) {
  const { stats, loading, error } = useCardStats(id);
  
  // Memoize the percentage calculation to avoid recalculating on every render
  const masteryPercentage = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.mastered / stats.total) * 100);
  }, [stats.mastered, stats.total]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 md:p-6 flex-grow">
        <div className="flex items-start gap-2 mb-3">
          <BookOpen className="h-5 w-5 flex-shrink-0 mt-1 text-[#F37022]" />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 break-words hyphens-auto">
              {name}
            </h3>
          </div>
        </div>
        
        {/* Only show description if it exists */}
        {description && (
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="mb-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 flex-shrink-0 text-indigo-500" />
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{collectionCount}</span> {collectionCount === 1 ? 'collection' : 'collections'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 flex-shrink-0 text-blue-500" />
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {loading ? (
                  <span className="text-gray-400 dark:text-gray-500">Loading card data...</span>
                ) : (
                  <>
                    <span className="font-medium">{stats.total}</span> cards
                  </>
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {loading ? (
                  <span className="text-gray-400 dark:text-gray-500">Loading...</span>
                ) : (
                  <>
                    <span className="font-medium">{stats.mastered}</span> mastered
                    {stats.total > 0 && <span className="text-xs ml-1 text-gray-500 dark:text-gray-500">({masteryPercentage}%)</span>}
                  </>
                )}
              </span>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs mt-1">
                <span>Failed to load statistics. Please try again later.</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 md:p-6 pt-3 pb-3 mt-auto bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex gap-1 md:gap-2 items-center">
            <Tooltip text="Create Flashcard Collection" position="top">
              <Link
                to={`/flashcards/create-collection?subject=${id}`}
                className="text-gray-600 dark:text-gray-400 hover:text-[#F37022] dark:hover:text-[#F37022]"
              >
                <PlusCircle className="h-4 md:h-5 w-4 md:w-5" />
              </Link>
            </Tooltip>
            {!isOfficial && (
              <>
                <Tooltip text="Edit Subject" position="top">
                  <Link
                    to={`/flashcards/edit-subject/${id}`}
                    className="text-gray-600 dark:text-gray-400 hover:text-[#F37022] dark:hover:text-[#F37022]"
                  >
                    <Edit className="h-4 md:h-5 w-4 md:w-5" />
                  </Link>
                </Tooltip>
                {showDeleteButton && onDelete && (
                  <Tooltip text="Delete Subject" position="top">
                    <button
                      onClick={onDelete}
                      className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 md:h-5 w-4 md:w-5" />
                    </button>
                  </Tooltip>
                )}
              </>
            )}
            
            {isOfficial && (
              <Tooltip text="Official Subject" position="top">
                <div className="flex-shrink-0 text-[#F37022]">
                  <Lock className="h-4 md:h-5 w-4 md:w-5" />
                </div>
              </Tooltip>
            )}
          </div>
          
          <button
            onClick={onStudy}
            className="bg-[#F37022]/10 text-[#F37022] px-3 py-1 md:px-4 md:py-2 text-sm rounded-md hover:bg-[#F37022]/20 dark:bg-[#F37022]/20 dark:hover:bg-[#F37022]/30"
          >
            Study Now
          </button>
        </div>
      </div>
    </div>
  );
} 