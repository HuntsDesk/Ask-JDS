import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Trash2, PlusCircle, Edit, BookText, CheckCircle, Lock, Layers } from 'lucide-react';
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-[#F37022]" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-1">
            {title}
            {isOfficial && <Lock className="h-4 w-4 text-[#F37022] ml-1" />}
          </h3>
        </div>
        
        {description && (
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {description}
          </p>
        )}
        
        <div className="mb-5">
          <div className="flex flex-col space-y-2">
            {tag && subjectId && (
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <Link 
                    to={`/flashcards/subjects/${subjectId}`}
                    className="font-medium text-[#F37022] hover:text-[#E36012] hover:underline"
                  >
                    {tag}
                  </Link>
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <BookText className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{count}</span> cards
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{masteredCount}</span> mastered
                {count > 0 && <span className="text-xs ml-1 text-gray-500 dark:text-gray-500">({masteryPercentage}%)</span>}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Tooltip text="Add Card">
              <Link
                to={`/flashcards/add-card/${collectionId}`}
                className="text-gray-600 dark:text-gray-400 hover:text-[#F37022]"
              >
                <PlusCircle className="h-5 w-5" />
              </Link>
            </Tooltip>
            {!isOfficial && (
              <>
                <Tooltip text="Edit Collection">
                  <Link
                    to={`/flashcards/edit/${collectionId}`}
                    className="text-gray-600 dark:text-gray-400 hover:text-[#F37022]"
                  >
                    <Edit className="h-5 w-5" />
                  </Link>
                </Tooltip>
                {onDelete && (
                  <Tooltip text="Delete Collection">
                    <button
                      onClick={onDelete}
                      className="text-gray-600 dark:text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </Tooltip>
                )}
              </>
            )}
          </div>
          
          <Link
            to={link}
            className="bg-[#F37022]/10 text-[#F37022] px-4 py-2 rounded-md hover:bg-[#F37022]/20 dark:bg-[#F37022]/20 dark:hover:bg-[#F37022]/30"
          >
            Study Now
          </Link>
        </div>
      </div>
    </div>
  );
} 