import React, { useState } from 'react';
import { Check, Eye, EyeOff, FileEdit, Trash2, BookOpen, Tag, Award, Lock, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FlashcardItemProps {
  flashcard: any;
  onToggleMastered: (flashcard: any) => void;
  onEdit: (flashcard: any) => void;
  onDelete: (flashcard: any) => void;
  onView?: (flashcard: any) => void;
  isPremium?: boolean;
  showIcons?: boolean;
  hasSubscription?: boolean;
  onShowPaywall?: () => void;
  isMastering?: boolean;
}

const FlashcardItem: React.FC<FlashcardItemProps> = React.memo(({
  flashcard,
  onToggleMastered,
  onEdit,
  onDelete,
  onView,
  isPremium = false,
  showIcons = true,
  hasSubscription = false,
  onShowPaywall,
  isMastering = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine which relationships to show
  const collections = flashcard.relationships?.collections || [];
  const subjects = flashcard.relationships?.subjects || [];
  const examTypes = flashcard.relationships?.examTypes || [];
  
  // Get primary collection & subject for display if relationships aren't available
  const primaryCollection = flashcard.collection || { title: 'No Collection' };
  const primarySubject = primaryCollection.subject || { name: 'Uncategorized' };
  
  // Limit the number of tags shown
  const MAX_TAGS_PER_CATEGORY = 2;
  const hasMoreCollections = collections.length > MAX_TAGS_PER_CATEGORY;
  const hasMoreSubjects = subjects.length > MAX_TAGS_PER_CATEGORY;
  const hasMoreExamTypes = examTypes.length > MAX_TAGS_PER_CATEGORY;

  // Determine if answer should be hidden (premium content + no subscription)
  const shouldHideAnswer = isPremium && !hasSubscription;
  
  // Determine if edit/delete buttons should be hidden
  const shouldHideEditDelete = flashcard.collection?.is_official === true || flashcard.is_official === true;
  
  // Debug logging for edit/delete visibility
  if (process.env.NODE_ENV === 'development') {
    console.log('FlashcardItem Debug:', {
      id: flashcard.id,
      question: flashcard.question,
      is_official: flashcard.is_official,
      collection_is_official: flashcard.collection?.is_official,
      shouldHideEditDelete,
      onEdit: !!onEdit,
      onDelete: !!onDelete
    });
  }
  
  // Generate subject and collection data to display if available
  // Need to handle both the relationships data structure and the collection.subject format
  const subjectsToShow = subjects.length > 0 ? subjects : 
                         (primarySubject && primarySubject.name !== 'Uncategorized' ? [primarySubject] : []);
  
  // Debug output - only log occasionally to reduce console spam
  if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
    console.log('RENDERING FLASHCARD', {
      id: flashcard.id,
      question: flashcard.question.substring(0, 20) + '...',
      isPremium,
      shouldHideEditDelete
    });
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full ${flashcard.is_mastered ? "border-l-4 border-green-500" : ""}`}>
      {/* Premium banner - show only if user doesn't have subscription */}
      {isPremium && !hasSubscription && (
        <div className="bg-[#F37022] text-white px-4 py-1 text-sm font-medium">
          PREMIUM CONTENT
        </div>
      )}
      
      {/* Debug indicator - only in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`absolute top-0 right-0 w-6 h-6 rounded-full ${isPremium ? 'bg-red-500' : 'bg-green-500'}`} 
           title={`Debug: isPremium=${isPremium}, shouldHideEditDelete=${shouldHideEditDelete}`}>
        </div>
      )}
      
      <div className="p-6 flex-grow">
        <div className="mb-3">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-1">
            {flashcard.question}
          </h3>
        </div>
        
        {shouldHideAnswer ? (
          <div className="text-gray-700 dark:text-gray-300 mb-4">
            <button
              onClick={() => onShowPaywall && onShowPaywall()}
              className="bg-[#F37022] text-white px-3 py-1 rounded-md text-sm hover:bg-[#E36012]"
            >
              Upgrade for access
            </button>
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300 mb-4 break-words">
            {flashcard.answer}
          </p>
        )}
        
        {/* Subjects and Collections - show on ALL cards */}
        <div className="mb-4">
          <div className="flex flex-col space-y-2">
            {subjectsToShow.length > 0 && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 flex-shrink-0 text-[#F37022]" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {subjectsToShow.slice(0, MAX_TAGS_PER_CATEGORY).map((subject, index) => (
                    <React.Fragment key={subject.id || `subject-${index}`}>
                      {index > 0 && ', '}
                      <Link 
                        to={`/flashcards/subjects/${subject.id}`}
                        className="font-medium text-[#F37022] hover:text-[#E36012] hover:underline"
                      >
                        {subject.name}
                      </Link>
                    </React.Fragment>
                  ))}
                  {hasMoreSubjects && `, +${subjects.length - MAX_TAGS_PER_CATEGORY} more`}
                </span>
              </div>
            )}
            
            {collections.length > 0 && (
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 flex-shrink-0 text-indigo-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {collections.slice(0, MAX_TAGS_PER_CATEGORY).map((collection, index) => (
                    <React.Fragment key={collection.id}>
                      {index > 0 && ', '}
                      <Link 
                        to={`/flashcards/collections/${collection.id}`}
                        className="font-medium text-[#F37022] hover:text-[#E36012] hover:underline"
                      >
                        {collection.title}
                      </Link>
                    </React.Fragment>
                  ))}
                  {hasMoreCollections && `, +${collections.length - MAX_TAGS_PER_CATEGORY} more`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer with icons and Study Now button - moved to bottom */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 mt-auto">
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-y-3">
          {/* Left side icons */}
          <div className="flex gap-4">
            {!shouldHideEditDelete && (
              <>
                {onEdit && (
                  <button
                    onClick={() => onEdit(flashcard)}
                    className="text-gray-600 dark:text-gray-400 hover:text-[#F37022] dark:hover:text-[#F37022]"
                    title="Edit card"
                  >
                    <FileEdit className="h-5 w-5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(flashcard)}
                    className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Delete card"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => onToggleMastered(flashcard)}
              className={`flex items-center justify-center p-2 text-sm font-medium ${
                flashcard.is_mastered 
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 focus:ring-green-500' 
                  : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 focus:ring-gray-400'
              } border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 w-10 h-10 ${
                isMastering ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={flashcard.is_mastered ? "Mark as not mastered" : "Mark as mastered"}
              disabled={isMastering}
            >
              {isMastering ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Check className="h-5 w-5" />
              )}
            </button>
            
            {/* Premium indicator for subscribed users */}
            {isPremium && hasSubscription && (
              <div className="relative group ml-2">
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
          
          {/* Right side Study Now button */}
          <button
            onClick={() => {
              if (shouldHideAnswer && onShowPaywall) {
                onShowPaywall();
              } else if (onView) {
                onView(flashcard);
              }
            }}
            className="bg-[#F37022]/10 text-[#F37022] px-4 py-2 rounded-md hover:bg-[#F37022]/20 dark:bg-[#F37022]/20 dark:hover:bg-[#F37022]/30 sm:ml-4 whitespace-nowrap"
          >
            Study
          </button>
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
    prevProps.isMastering === nextProps.isMastering
  );
});

export default FlashcardItem; 