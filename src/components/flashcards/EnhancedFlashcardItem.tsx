import React, { useState } from 'react';
import { Check, FileEdit, Trash2, Tag, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EnhancedFlashcardItemProps {
  flashcard: any;
  onToggleMastered: (flashcard: any) => void;
  onEdit: (flashcard: any) => void;
  onDelete: (flashcard: any) => void;
  onView?: (flashcard: any) => void;
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
  isPremium = false,
  showIcons = true,
  hasSubscription = false,
  onShowPaywall
}) => {
  // Force premium content to be non-editable - Double check with the collection
  const isOfficialCollection = flashcard.collection?.is_official === true;
  const isDefinitelyPremium = isPremium || isOfficialCollection;
  
  // Removing excessive logging that causes performance issues
  // Only log in development mode and with a sample rate to reduce volume
  if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
    console.log(`CARD RENDER ${flashcard.id}: isPremium=${isPremium}, is_official=${isOfficialCollection}`);
  }
  
  // Get relationships data
  const collections = flashcard.relationships?.collections || [];
  const subjects = flashcard.relationships?.subjects || [];
  
  // Determine subject display
  const primarySubject = flashcard.collection?.subject || { name: '' };
  const subjectsToShow = subjects.length > 0 ? subjects : 
                       (primarySubject.name ? [primarySubject] : []);
  
  // Premium content rules - Force protection based on our double-check
  const shouldHideAnswer = isDefinitelyPremium && !hasSubscription;
  const shouldHideEditDelete = isDefinitelyPremium;
  
  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full ${flashcard.is_mastered ? "border-l-4 border-green-500" : ""}`}>
      {/* Green border for mastered */}
      {!flashcard.is_mastered && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent"></div>
      )}
      
      {/* Premium content banner */}
      {isDefinitelyPremium && (
        <div className="bg-[#F37022] text-white px-4 py-1 text-sm font-medium">
          PREMIUM CONTENT
        </div>
      )}
      
      {/* Main content */}
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {flashcard.question}
        </h3>
        
        {shouldHideAnswer ? (
          <div className="mb-4">
            <button
              onClick={() => onShowPaywall && onShowPaywall()}
              className="bg-[#F37022] text-white px-3 py-1 rounded-md text-sm hover:bg-[#E36012]"
            >
              Upgrade for access
            </button>
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {flashcard.answer}
          </p>
        )}
        
        {/* Collections and Subjects */}
        <div className="mb-4">
          {collections.length > 0 && (
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-indigo-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {collections.slice(0, 2).map((collection, index) => (
                  <React.Fragment key={collection.id || `collection-${index}`}>
                    {index > 0 && ', '}
                    <Link 
                      to={`/flashcards/collections/${collection.id}`}
                      className="font-medium text-[#F37022] hover:text-[#E36012] hover:underline"
                    >
                      {collection.title}
                    </Link>
                  </React.Fragment>
                ))}
                {collections.length > 2 && `, +${collections.length - 2} more`}
              </span>
            </div>
          )}
          
          {subjectsToShow.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {subjectsToShow.slice(0, 2).map((subject, index) => (
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
                {subjectsToShow.length > 2 && `, +${subjectsToShow.length - 2} more`}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer - Icons and Study Now button */}
      <div className="px-6 pb-6 mt-auto">
        <div className="flex justify-between items-center">
          {/* Left side icons */}
          <div className="flex gap-2">
            {!shouldHideEditDelete && (
              <>
                <button
                  onClick={() => onEdit(flashcard)}
                  className="text-gray-600 dark:text-gray-400 hover:text-[#F37022] dark:hover:text-[#F37022]"
                  title="Edit card"
                >
                  <FileEdit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDelete(flashcard)}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Delete card"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            )}
            <button
              onClick={() => onToggleMastered(flashcard)}
              className={`text-gray-600 dark:text-gray-400 ${flashcard.is_mastered 
                ? 'text-green-600 dark:text-green-400' 
                : 'hover:text-[#F37022] dark:hover:text-[#F37022]'}`}
              title={flashcard.is_mastered ? "Mark as not mastered" : "Mark as mastered"}
            >
              <Check className="h-5 w-5" />
            </button>
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
            className="bg-[#F37022]/10 text-[#F37022] px-4 py-2 rounded-md hover:bg-[#F37022]/20 dark:bg-[#F37022]/20 dark:hover:bg-[#F37022]/30"
          >
            Study Now
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
    prevProps.flashcard.is_mastered === nextProps.flashcard.is_mastered
  );
});

export default EnhancedFlashcardItem; 