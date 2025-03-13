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
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({
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
  
  // Determine if edit/delete buttons should be hidden (premium content)
  const shouldHideEditDelete = isPremium && !hasSubscription;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-[#F37022]" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-1">
            {flashcard.question}
            {isPremium && <Lock className="h-4 w-4 text-[#F37022] ml-1" />}
          </h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {shouldHideAnswer ? 'Upgrade to view this premium content.' : flashcard.answer}
        </p>
        
        <div className="mb-5">
          <div className="flex flex-col space-y-2">
            {collections.length > 0 && (
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {collections.map((collection, index) => (
                    <React.Fragment key={collection.id}>
                      {index > 0 && ', '}
                      <Link 
                        to={`/flashcards/study/${collection.id}`}
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
            {subjects.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {subjects.map((subject, index) => (
                    <React.Fragment key={subject.id}>
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
          </div>
        </div>
        
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
};

export default FlashcardItem; 