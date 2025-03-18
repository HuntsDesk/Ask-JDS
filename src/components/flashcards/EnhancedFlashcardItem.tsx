import React, { useState } from 'react';
import { Check, FileEdit, Trash2, Tag, Layers, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import Tooltip from './Tooltip';

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
        <div className="bg-[#F37022] text-white px-4 py-1 text-sm font-medium">
          PREMIUM CONTENT
        </div>
      )}
      
      {/* Main content */}
      <div className="p-6 flex-grow flex flex-col min-h-[12rem]">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {flashcard.question}
        </h3>
        
        {shouldHideAnswer ? (
          <div className="mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowPaywall && onShowPaywall();
              }}
              className="bg-[#F37022] text-white px-3 py-1 rounded-md text-sm hover:bg-[#E36012]"
            >
              Upgrade for access
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 break-words">
              {flashcard.answer}
            </p>
          </div>
        )}
        
        {/* Spacer to push collections/subjects to bottom when answer is short */}
        <div className="flex-grow"></div>
        
        {/* Always display subject and collection info regardless of premium status */}
        <div className="mt-4">
          {subjectsToShow.length > 0 && (
            <div className="flex items-start mb-1">
              <Tag className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
              <div className="text-sm w-full">
                <div className="text-xs text-gray-500 mb-0.5">Subjects:</div>
                <div className="text-gray-700 dark:text-gray-300 flex flex-wrap">
                  {subjectsToShow.map((subject, idx) => (
                    <span key={subject?.id || `subject-${idx}`} className="mr-1">
                      {subject?.id?.startsWith("00000000-0000-0000-0000-") ? (
                        // For placeholder subjects (those with IDs starting with zeros), just show the name without click functionality
                        <span className="text-[#F37022] dark:text-[#F37022] font-medium">
                          {subject.name || '(Unnamed Subject)'}
                        </span>
                      ) : (
                        // For real subjects, allow navigation
                        <Link 
                          to={`/flashcards/subjects/${subject.id}?type=subject`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onStudySubject) {
                              e.preventDefault();
                              onStudySubject(subject);
                            }
                          }}
                          className="text-[#F37022] hover:underline bg-transparent border-none p-0 cursor-pointer font-medium"
                        >
                          {subject.name || '(Unnamed Subject)'}
                        </Link>
                      )}
                      {idx < subjectsToShow.length - 1 && <span className="ml-0.5 mr-1.5">,</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {collectionsToShow.length > 0 && (
            <div className="flex items-start">
              <Layers className="h-4 w-4 text-indigo-500 mr-2 shrink-0 mt-0.5" />
              <div className="text-sm w-full">
                <div className="text-xs text-gray-500 mb-0.5">Collections:</div>
                <div className="text-gray-700 dark:text-gray-300 flex flex-wrap">
                  {collectionsToShow.map((collection, idx) => (
                    <span key={collection?.id || `collection-${idx}`} className="mr-1">
                      {collection?.id?.startsWith("00000000-0000-0000-0000-") ? (
                        // For placeholder collections (those with IDs starting with zeros), just show the title without click functionality
                        <span className="text-[#F37022] dark:text-[#F37022] font-medium">
                          {collection.title || '(Untitled)'}
                        </span>
                      ) : (
                        // For real collections, allow navigation
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
      
      {/* Footer - Icons */}
      <div className="px-6 pb-6 mt-auto">
        <div className="flex justify-between items-center">
          {/* Left side icons */}
          <div className="flex gap-2">
            {!shouldHideEditDelete && (
              <>
                <Tooltip text="Edit card" position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(flashcard);
                    }}
                    className="text-gray-600 dark:text-gray-400 hover:text-[#F37022] dark:hover:text-[#F37022]"
                  >
                    <FileEdit className="h-5 w-5" />
                  </button>
                </Tooltip>
                <Tooltip text="Delete card" position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(flashcard);
                    }}
                    className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </Tooltip>
              </>
            )}
            <Tooltip text={flashcard.is_mastered ? "Mark as not mastered" : "Mark as mastered"} position="top">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMastered(flashcard);
                }}
                className={`text-gray-600 dark:text-gray-400 ${flashcard.is_mastered 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'hover:text-[#F37022] dark:hover:text-[#F37022]'}`}
              >
                <Check className="h-5 w-5" />
              </button>
            </Tooltip>
            
            {/* Premium indicator for subscribed users */}
            {isPremium && hasSubscription && (
              <div className="relative group">
                <span className="text-[#F37022] font-semibold text-xs bg-[#F37022]/10 px-2 py-1 rounded-full flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  P
                </span>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Premium Content
                </div>
              </div>
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