import React, { useEffect, useState } from 'react';
import { Check, FileEdit, Trash2, BookOpen, Award, Lock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FlashcardItemProps {
  id: string;
  question: string;
  answer: string;
  collectionTitle: string;
  isPremium: boolean;
  isLocked: boolean;
  isReadOnly: boolean;
  isMastered: boolean;
  isToggling: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleMastered: () => void;
  onUnlock: () => void;
}

const FlashcardItem = React.memo(({
  id,
  question,
  answer,
  collectionTitle,
  isPremium,
  isLocked,
  isReadOnly,
  isMastered,
  isToggling,
  onView,
  onEdit,
  onDelete,
  onToggleMastered,
  onUnlock
}: FlashcardItemProps) => {
  // Check for development forced subscription
  const [devForceSubscription, setDevForceSubscription] = useState(false);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const forceSubscription = localStorage.getItem('forceSubscription');
      if (forceSubscription === 'true') {
        console.log('DEV OVERRIDE: Forcing subscription in FlashcardItem');
        setDevForceSubscription(true);
      }
      
      // Listen for changes to localStorage
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'forceSubscription') {
          setDevForceSubscription(e.newValue === 'true');
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);
  
  // Determine if answer should be hidden (premium content + locked)
  // In development with forceSubscription, never hide the answer
  const shouldHideAnswer = isLocked && !devForceSubscription;
  
  // In development with forceSubscription, we unlock premium content, but official cards
  // should still be read-only (no edit/delete) regardless of subscription status
  const shouldShowEditDelete = !isReadOnly && (!isLocked || devForceSubscription);
  
  // Debug mastered status
  console.log(`Card ${id} - isMastered:`, isMastered);
  
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Mastered indicator - absolute positioned div instead of border */}
      {isMastered && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500"></div>
      )}
      
      {/* Premium content banner - show for all premium/official content */}
      {(isPremium || isReadOnly) && !devForceSubscription && (
        <div className="bg-[#F37022] text-white px-4 py-1 text-sm font-medium">
          PREMIUM CONTENT
        </div>
      )}
      
      <div className="p-6 flex-grow">
        <div className="mb-3">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-1">
            {question}
          </h3>
        </div>
        
        {shouldHideAnswer ? (
          <div className="text-gray-700 dark:text-gray-300 mb-4">
            <button
              onClick={onUnlock}
              className="bg-[#F37022] text-white px-3 py-1 rounded-md text-sm hover:bg-[#E36012]"
            >
              Upgrade for access
            </button>
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300 mb-4 break-words">
            {answer}
          </p>
        )}
        
        {/* Collection info */}
        <div className="mb-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 flex-shrink-0 text-[#F37022]" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {collectionTitle}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with icons and Study button */}
      <div className="p-4 md:p-6 pt-3 pb-3 mt-auto bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex gap-1 md:gap-2 items-center">
            {/* Only show edit/delete buttons for non-premium content or unlocked premium content */}
            {shouldShowEditDelete && (
              <>
                <button
                  onClick={onEdit}
                  className="text-gray-600 dark:text-gray-400 hover:text-[#F37022] dark:hover:text-[#F37022]"
                  title="Edit card"
                >
                  <FileEdit className="h-4 md:h-5 w-4 md:w-5" />
                </button>
                <button
                  onClick={onDelete}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Delete card"
                >
                  <Trash2 className="h-4 md:h-5 w-4 md:w-5" />
                </button>
              </>
            )}
            <button
              onClick={onToggleMastered}
              className={`flex items-center justify-center ${
                isMastered 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-[#F37022] dark:hover:text-[#F37022]'
              } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isMastered ? "Mark as not mastered" : "Mark as mastered"}
              disabled={isToggling}
            >
              {isToggling ? (
                <Loader2 className="h-4 md:h-5 w-4 md:w-5 animate-spin" />
              ) : (
                <Check className="h-4 md:h-5 w-4 md:w-5" />
              )}
            </button>
            
            {/* Premium indicator for premium content */}
            {isPremium && !isLocked && !devForceSubscription && (
              <div className="text-[#F37022]">
                <Lock className="h-4 md:h-5 w-4 md:w-5" />
              </div>
            )}
            
            {/* Lock indicator for locked content */}
            {isLocked && !devForceSubscription && (
              <div className="text-[#F37022]">
                <Lock className="h-4 md:h-5 w-4 md:w-5" />
              </div>
            )}
          </div>
          
          {/* Right side Study Now button */}
          <button
            onClick={isLocked && !devForceSubscription ? onUnlock : onView}
            className="bg-[#F37022]/10 text-[#F37022] px-3 py-1 md:px-4 md:py-2 text-sm rounded-md hover:bg-[#F37022]/20 dark:bg-[#F37022]/20 dark:hover:bg-[#F37022]/30"
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
    prevProps.id === nextProps.id &&
    prevProps.isPremium === nextProps.isPremium &&
    prevProps.isLocked === nextProps.isLocked &&
    prevProps.isMastered === nextProps.isMastered &&
    prevProps.isToggling === nextProps.isToggling
  );
});

export default FlashcardItem; 