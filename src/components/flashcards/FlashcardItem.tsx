import React, { useEffect, useState } from 'react';
import { Check, FileEdit, Trash2, BookOpen, Loader2, Layers, Award, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Tooltip from './Tooltip';
import { formatDate } from '@/lib/utils';
import { isFlashcardReadOnly } from '@/utils/flashcard-utils';
import { useSubscriptionWithTier } from '@/hooks/useSubscription';
import useAuth from '@/hooks/useFlashcardAuth';

interface FlashcardItemProps {
  id: string;
  question: string;
  answer: string;
  collectionTitle: string;
  isPremium?: boolean;
  isLocked?: boolean;
  isReadOnly?: boolean;
  isMastered?: boolean;
  isToggling?: boolean;
  onToggleMastered?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onUnlock?: () => void;
}

const FlashcardItem = React.memo(({
  id,
  question,
  answer,
  collectionTitle,
  isPremium = false,
  isLocked = false,
  isReadOnly = false,
  isMastered = false,
  isToggling = false,
  onToggleMastered,
  onEdit,
  onDelete,
  onView,
  onUnlock
}: FlashcardItemProps) => {
  const { user } = useAuth();
  
  // Use the new subscription hook with tier-based access
  const { tierName } = useSubscriptionWithTier();
  
  // Determine if user has premium access (Premium or Unlimited tier)
  const hasPremiumAccess = tierName === 'Premium' || tierName === 'Unlimited';

  // DEV ONLY: Check for forced subscription override
  const [devHasPremiumAccess, setDevHasPremiumAccess] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const forceSubscription = localStorage.getItem('forceSubscription');
      if (forceSubscription === 'true') {
        console.log('DEV OVERRIDE: Forcing premium access to true in FlashcardItem component');
        setDevHasPremiumAccess(true);
      } else {
        setDevHasPremiumAccess(false);
      }
    }
  }, []);
  
  // Final premium access determination (dev override or actual premium access)
  const hasSubscription = process.env.NODE_ENV === 'development' ? (devHasPremiumAccess || hasPremiumAccess) : hasPremiumAccess;

  // Determine if content should be blurred/locked
  const shouldBlurContent = isPremium && !hasSubscription;

  // Truncate text function
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };
  
  // Debug mastered status
  console.log(`Card ${id} - isMastered:`, isMastered);
  
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Mastered indicator - absolute positioned div instead of border */}
      {isMastered && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500"></div>
      )}
      
      {/* Premium content banner - show for all premium/official content */}
      {(isPremium || isReadOnly) && !hasSubscription && (
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
        
        {shouldBlurContent ? (
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
              <span className={`text-sm ${
                collectionTitle === "Uncategorized" 
                  ? "text-gray-500 dark:text-gray-500 italic" 
                  : "text-gray-600 dark:text-gray-400"
              }`}>
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
            {!isReadOnly && !shouldBlurContent && (
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
            
            {/* Premium indicator with JD Simplified favicon */}
            {(isPremium || isReadOnly) && (
              <Tooltip text="Premium Content" position="top">
                <div className="text-[#F37022]">
                  <img 
                    src="/images/JD Simplified Favicon.svg" 
                    alt="Premium" 
                    className="h-5 w-5"
                    style={{ filter: "brightness(0) saturate(100%) invert(57%) sepia(85%) saturate(1661%) hue-rotate(347deg) brightness(98%) contrast(98%)" }}
                  />
                </div>
              </Tooltip>
            )}
          </div>
          
          {/* Right side Study Now button */}
          <button
            onClick={shouldBlurContent ? onUnlock : onView}
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