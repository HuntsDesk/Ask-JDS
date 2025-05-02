import React from 'react';
import { Check, FileEdit, Trash2, BookOpen, Award, Lock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FlashcardItemProps {
  id: string;
  question: string;
  answer: string;
  collectionTitle: string;
  isPremium: boolean;
  isLocked: boolean;
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
  isMastered,
  isToggling,
  onView,
  onEdit,
  onDelete,
  onToggleMastered,
  onUnlock
}: FlashcardItemProps) => {
  // Determine if answer should be hidden (premium content + locked)
  const shouldHideAnswer = isLocked;
  
  // Debug mastered status
  console.log(`Card ${id} - isMastered:`, isMastered);
  
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Mastered indicator - absolute positioned div instead of border */}
      {isMastered && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500"></div>
      )}
      
      {/* Premium banner - show for all premium content */}
      {isPremium && (
        <div className="bg-[#F37022] text-white px-4 py-1 text-sm font-medium">
          PREMIUM CONTENT
        </div>
      )}
      
      <div className="p-6 flex-grow">
        <div className="mb-3">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-1">
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
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 mt-auto">
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-y-3">
          {/* Left side icons */}
          <div className="flex gap-4">
            {/* Only show edit/delete buttons for non-premium content or unlocked premium content */}
            {!isLocked && (
              <>
                <button
                  onClick={onEdit}
                  className="text-gray-600 dark:text-gray-400 hover:text-[#F37022] dark:hover:text-[#F37022]"
                  title="Edit card"
                >
                  <FileEdit className="h-5 w-5" />
                </button>
                <button
                  onClick={onDelete}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Delete card"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            )}
            <button
              onClick={onToggleMastered}
              className={`flex items-center justify-center p-2 text-sm font-medium ${
                isMastered 
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 focus:ring-green-500' 
                  : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 focus:ring-gray-400'
              } border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 w-10 h-10 ${
                isToggling ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={isMastered ? "Mark as not mastered" : "Mark as mastered"}
              disabled={isToggling}
            >
              {isToggling ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
            </button>
            
            {/* Premium indicator for premium content */}
            {isPremium && !isLocked && (
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
            
            {/* Lock indicator for locked content */}
            {isLocked && (
              <div className="relative group ml-2">
                <span className="flex items-center justify-center p-2 text-[#F37022] font-medium bg-[#F37022]/10 dark:bg-[#F37022]/20 border border-[#F37022]/30 dark:border-[#F37022]/30 rounded-md focus:outline-none w-10 h-10">
                  <Lock className="h-5 w-5" />
                </span>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Locked Content
                </div>
              </div>
            )}
          </div>
          
          {/* Right side Study Now button */}
          <button
            onClick={isLocked ? onUnlock : onView}
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
    prevProps.id === nextProps.id &&
    prevProps.isPremium === nextProps.isPremium &&
    prevProps.isLocked === nextProps.isLocked &&
    prevProps.isMastered === nextProps.isMastered &&
    prevProps.isToggling === nextProps.isToggling
  );
});

export default FlashcardItem; 