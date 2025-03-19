import React, { useState } from 'react';
import { Check, FileEdit, Trash2, BookOpen, Layers, Award, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Tooltip from './Tooltip';
import { formatDate } from '@/lib/utils';

// Create a custom Premium "P" icon component
const PremiumIcon = () => (
  <div className="h-4 w-4 flex items-center justify-center rounded-full bg-[#F37022] text-white font-bold text-[10px]">
    P
  </div>
);

interface EnhancedFlashcardItemProps {
  flashcard: any;
  onToggleMastered: (flashcard: any) => void;
  onEdit: (flashcard: any) => void;
  onDelete: (flashcard: any) => void;
  onView?: (flashcard: any) => void;
  onStudySubject?: (subject: any) => void;
  onStudyCollection?: (collection: any) => void;
  isPremium?: boolean;
  showIcons?: boolean;
  hasSubscription?: boolean;
  onShowPaywall?: () => void;
}

const EnhancedFlashcardItem: React.FC<EnhancedFlashcardItemProps> = React.memo(({
  flashcard,
  onToggleMastered,
  onEdit,
  onDelete,
  onView,
  onStudySubject,
  onStudyCollection,
  isPremium = false,
  showIcons = true,
  hasSubscription = false,
  onShowPaywall
}) => {
  // Force premium content to be non-editable - Double check with the collection
  const isOfficialCollection = flashcard.collection?.is_official === true;
  const isDefinitelyPremium = isPremium || isOfficialCollection || flashcard.is_official === true;
  
  // Get relationships data safely with fallbacks
  console.log("DEBUG: Flashcard data:", { 
    id: flashcard.id,
    isPremium: isDefinitelyPremium,
    relationships: flashcard.relationships,
    hasCollections: !!flashcard.relationships?.collections,
    hasSubjects: !!flashcard.relationships?.subjects
  });
  
  // Use optional chaining with fallback empty arrays to prevent errors
  const collections = flashcard.relationships?.collections || [];
  const subjects = flashcard.relationships?.subjects || [];
  
  if (process.env.NODE_ENV === 'development' && flashcard.is_official) {
    console.log(`Raw collections for ${flashcard.id.substring(0, 8)}:`, collections);
  }
  
  // Determine collections/subjects to show
  const primarySubject = flashcard.collection?.subject;
  const directCollection = flashcard.collection;
  
  // Build arrays of what to display
  const subjectsToShow = subjects.length > 0 ? subjects : 
                       (primarySubject ? [primarySubject] : []);
  
  // For collections, ensure we don't show collections without titles
  const collectionsToShow = collections.length > 0 
    ? collections // Show all collections without filtering
    : (directCollection && directCollection.title ? [directCollection] : []);
  
  // For debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.log("CARD DEBUGGING:", {
      id: flashcard.id.substring(0, 8),
      question: flashcard.question.substring(0, 20) + "...",
      isPremium: isDefinitelyPremium,
      relationshipsObj: !!flashcard.relationships,
      subjectsCount: subjectsToShow.length,
      collectionsCount: collectionsToShow.length,
      subjects: subjectsToShow.map(s => s?.name || 'unnamed'),
      collections: collectionsToShow.map(c => c?.title || 'untitled'),
      originalCollections: collections.map(c => c?.title || 'untitled')
    });
  }
  
  // Premium content rules - Force protection based on our double-check
  const shouldHideAnswer = isDefinitelyPremium && !hasSubscription;
  const shouldHideEditDelete = isDefinitelyPremium;
  
  return (
    <div 
      className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full ${flashcard.is_mastered ? "border-l-4 border-green-500" : ""} ${onView ? "cursor-pointer" : ""}`}
      onClick={() => {
        if (!onView) return;
        if (shouldHideAnswer && onShowPaywall) {
          onShowPaywall();
        } else {
          onView(flashcard);
        }
      }}
    >
      {/* Green border for mastered */}
      {!flashcard.is_mastered && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent"></div>
      )}
      
      {/* Premium content banner - only show if no subscription */}
      {isDefinitelyPremium && !hasSubscription && (
        <div className="bg-[#F37022] text-white px-4 py-1 text-xs md:text-sm font-medium">
          PREMIUM CONTENT
        </div>
      )}
      
      {/* Main content */}
      <div className="p-4 md:p-6 flex-grow">
        <div className="mb-3">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white break-words hyphens-auto">
            {flashcard.question}
          </h3>
        </div>
        
        {shouldHideAnswer ? (
          <div className="text-gray-700 dark:text-gray-300 mb-3 md:mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowPaywall && onShowPaywall();
              }}
              className="bg-[#F37022] text-white px-2 py-1 md:px-3 md:py-1 rounded-md text-xs md:text-sm hover:bg-[#E36012]"
            >
              Upgrade for access
            </button>
          </div>
        ) : (
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3 md:mb-4 break-words">
            {flashcard.answer}
          </p>
        )}
        
        {/* Bottom metadata */}
        <div className="space-y-2 text-xs md:text-sm">
          {/* Subject tags */}
          {subjectsToShow.length > 0 && (
            <div className="flex items-start">
              <BookOpen className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
              <div className="w-full">
                <div className="text-xs text-gray-500 mb-0.5">Subject:</div>
                <div className="text-gray-700 dark:text-gray-300 flex flex-wrap">
                  {subjectsToShow.map((subject, idx) => (
                    <span key={subject?.id || `subject-${idx}`} className="mr-1">
                      {subject?.id ? (
                        <Link 
                          to={`/flashcards/subjects/${subject.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="text-[#F37022] hover:underline font-medium"
                        >
                          {subject.name}
                        </Link>
                      ) : (
                        <span className="text-[#F37022] dark:text-[#F37022] font-medium">
                          {subject?.name || '(No Subject)'}
                        </span>
                      )}
                      {idx < subjectsToShow.length - 1 && <span className="ml-0.5 mr-1.5">,</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Collection tags */}
          {collectionsToShow.length > 0 && (
            <div className="flex items-start">
              <Layers className="h-4 w-4 text-indigo-500 mr-2 shrink-0 mt-0.5" />
              <div className="w-full">
                <div className="text-xs text-gray-500 mb-0.5">Collections:</div>
                <div className="text-gray-700 dark:text-gray-300 flex flex-wrap">
                  {collectionsToShow.map((collection, idx) => (
                    <span key={collection?.id || `collection-${idx}`} className="mr-1">
                      {collection?.id?.startsWith("00000000-0000-0000-0000-") ? (
                        <span className="text-[#F37022] dark:text-[#F37022] font-medium">
                          {collection.title || '(Untitled)'}
                        </span>
                      ) : (
                        <Link 
                          to={`/flashcards/study/${collection.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onStudyCollection) {
                              e.preventDefault();
                              onStudyCollection(collection);
                            }
                          }}
                          className="text-[#F37022] hover:underline bg-transparent border-none p-0 cursor-pointer font-medium"
                        >
                          {collection.title || '(Untitled)'}
                        </Link>
                      )}
                      {idx < collectionsToShow.length - 1 && <span className="ml-0.5 mr-1.5">,</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Actions footer */}
      <div className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 mt-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 md:gap-2">
            <Tooltip text={flashcard.is_mastered ? "Unmark as mastered" : "Mark as mastered"} position="top">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMastered && onToggleMastered(flashcard);
                }}
                className={`${flashcard.is_mastered ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-green-500'}`}
              >
                <Check className="h-4 md:h-5 w-4 md:w-5" />
              </button>
            </Tooltip>
            
            {!flashcard.is_official && onEdit && (
              <Tooltip text="Edit Card" position="top">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(flashcard);
                  }}
                  className="text-gray-400 hover:text-blue-500"
                >
                  <FileEdit className="h-4 md:h-5 w-4 md:w-5" />
                </button>
              </Tooltip>
            )}
            
            {!flashcard.is_official && onDelete && (
              <Tooltip text="Delete Card" position="top">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(flashcard);
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 md:h-5 w-4 md:w-5" />
                </button>
              </Tooltip>
            )}
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isDefinitelyPremium ? (
              <Tooltip text="Premium Content" position="top">
                <div className="flex-shrink-0 text-[#F37022]">
                  <PremiumIcon />
                </div>
              </Tooltip>
            ) : (
              formatDate(flashcard.created_at)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.flashcard.id === nextProps.flashcard.id &&
    prevProps.isPremium === nextProps.isPremium &&
    prevProps.hasSubscription === nextProps.hasSubscription &&
    prevProps.flashcard.is_mastered === nextProps.flashcard.is_mastered &&
    prevProps.onStudySubject === nextProps.onStudySubject &&
    prevProps.onStudyCollection === nextProps.onStudyCollection
  );
});

export default EnhancedFlashcardItem; 