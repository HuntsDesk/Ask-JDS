import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Trash2, PlusCircle, Edit, FileText, CheckCircle, Lock, Layers } from 'lucide-react';
import Tooltip from './Tooltip';

interface CardProps {
  title: string;
  description?: string;
  tag?: string;
  count: number;
  masteredCount: number;
  link: string;
  onDelete?: () => void;
  collectionId?: string;
  isOfficial?: boolean;
  subjectId?: string;
}

export default function Card({
  title,
  description,
  tag,
  count,
  masteredCount = 0,
  link,
  onDelete,
  collectionId,
  isOfficial = false,
  subjectId
}: CardProps) {
  // Calculate mastery percentage
  const masteryPercentage = count > 0 ? Math.round((masteredCount / count) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 md:p-6 flex-grow">
        <div className="flex items-start gap-2 mb-3">
          <Layers className="h-5 w-5 flex-shrink-0 mt-1 text-[#F37022]" />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white break-words hyphens-auto">
              {title}
            </h3>
          </div>
        </div>
        
        {description && (
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="mb-4">
          <div className="flex flex-col space-y-2">
            {tag && subjectId && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 flex-shrink-0 text-[#F37022]" />
                <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                  <Link 
                    to={`/flashcards/study/${subjectId}?type=subject`}
                    className="font-medium text-[#F37022] hover:text-[#E36012] hover:underline"
                  >
                    {tag}
                  </Link>
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 flex-shrink-0 text-blue-500" />
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{count}</span> cards
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{masteredCount}</span> mastered
                {count > 0 && <span className="text-xs ml-1 text-gray-500 dark:text-gray-500">({masteryPercentage}%)</span>}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 md:p-6 pt-3 pb-3 mt-auto bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex gap-1 md:gap-2 items-center">
            <Tooltip text="Add Card" position="top">
              <Link
                to={`/flashcards/add-card/${collectionId}`}
                className="text-gray-600 dark:text-gray-400 hover:text-[#F37022]"
              >
                <PlusCircle className="h-4 md:h-5 w-4 md:w-5" />
              </Link>
            </Tooltip>
            {!isOfficial && (
              <>
                <Tooltip text="Edit Collection" position="top">
                  <Link
                    to={`/flashcards/edit/${collectionId}`}
                    className="text-gray-600 dark:text-gray-400 hover:text-[#F37022]"
                  >
                    <Edit className="h-4 md:h-5 w-4 md:w-5" />
                  </Link>
                </Tooltip>
                {onDelete && (
                  <Tooltip text="Delete Collection" position="top">
                    <button
                      onClick={onDelete}
                      className="text-gray-600 dark:text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 md:h-5 w-4 md:w-5" />
                    </button>
                  </Tooltip>
                )}
              </>
            )}
            
            {isOfficial && (
              <Tooltip text="Official Collection" position="top">
                <div className="flex-shrink-0 text-[#F37022]">
                  <Lock className="h-4 md:h-5 w-4 md:w-5" />
                </div>
              </Tooltip>
            )}
          </div>
          
          <Link
            to={link}
            className="bg-[#F37022]/10 text-[#F37022] px-3 py-1 md:px-4 md:py-2 text-sm rounded-md hover:bg-[#F37022]/20 dark:bg-[#F37022]/20 dark:hover:bg-[#F37022]/30"
          >
            Study Now
          </Link>
        </div>
      </div>
    </div>
  );
} 