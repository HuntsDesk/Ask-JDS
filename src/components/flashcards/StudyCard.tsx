import { Flashcard } from '@/lib/studyDataLoader';
import { BookmarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface StudyCardProps {
  card: Flashcard;
  showAnswer: boolean;
  isMastered: boolean;
  onToggleMastered: () => void;
}

export function StudyCard({ card, showAnswer, isMastered, onToggleMastered }: StudyCardProps) {
  return (
    <div className="relative flex h-[26rem] w-full flex-col rounded-xl bg-white shadow-lg transition-all dark:bg-slate-800">
      {/* Card difficulty indicator */}
      {card.difficulty_level && (
        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
          <span>
            {card.difficulty_level === 'easy' && 'Easy'}
            {card.difficulty_level === 'medium' && 'Medium'}
            {card.difficulty_level === 'hard' && 'Hard'}
          </span>
        </div>
      )}

      {/* Mastery status */}
      <button
        className="absolute right-4 top-4 z-10 rounded-full bg-slate-100 p-1 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMastered();
        }}
      >
        {isMastered ? (
          <BookmarkSolidIcon className="h-5 w-5 text-purple-500 dark:text-purple-400" />
        ) : (
          <BookmarkIcon className="h-5 w-5" />
        )}
      </button>

      {/* Card content */}
      <div 
        className={cn(
          'flex flex-1 flex-col items-center overflow-auto px-6 py-12',
          showAnswer ? 'animate-flip-out' : 'animate-flip-in'
        )}
      >
        <div className="flex min-h-32 flex-1 items-center justify-center">
          <div className={showAnswer ? 'hidden' : 'block w-full'}>
            <ReactMarkdown 
              className="prose prose-slate mx-auto dark:prose-invert"
              remarkPlugins={[remarkGfm]}
            >
              {card.question}
            </ReactMarkdown>
          </div>
          
          <div className={showAnswer ? 'block w-full' : 'hidden'}>
            <ReactMarkdown 
              className="prose prose-slate mx-auto dark:prose-invert"
              remarkPlugins={[remarkGfm]}
            >
              {card.answer}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        {/* Collection info */}
        <div className="truncate">
          {card.collection?.title && (
            <span>Collection: {card.collection.title}</span>
          )}
        </div>
        
        {/* Click to flip hint */}
        <div className="flex items-center gap-1">
          <span>{showAnswer ? 'Answer' : 'Question'}</span>
          <span className="text-slate-400 dark:text-slate-500">
            (Click to flip)
          </span>
        </div>
      </div>
    </div>
  );
} 