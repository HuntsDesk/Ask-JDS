import { CheckCircleIcon, XCircleIcon, BookmarkIcon } from '@heroicons/react/24/solid';

interface StudyProgressProps {
  currentIndex: number;
  total: number;
  correct: number;
  incorrect: number;
  mastered: number;
}

export function StudyProgress({
  currentIndex,
  total,
  correct,
  incorrect,
  mastered,
}: StudyProgressProps) {
  // Calculate progress percentage
  const progressPercentage = Math.floor((currentIndex / total) * 100);

  return (
    <div className="flex flex-col gap-2">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="flex h-2 bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {currentIndex} / {total}
        </div>
      </div>

      {/* Stats counters */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1">
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <span>Correct: {correct}</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircleIcon className="h-4 w-4 text-red-500" />
          <span>Incorrect: {incorrect}</span>
        </div>
        <div className="flex items-center gap-1">
          <BookmarkIcon className="h-4 w-4 text-purple-500" />
          <span>Mastered: {mastered}</span>
        </div>
      </div>
    </div>
  );
} 