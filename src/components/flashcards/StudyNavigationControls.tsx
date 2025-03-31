import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  ArrowPathIcon,
  BookmarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { Button } from "../ui/button";

interface StudyNavigationControlsProps {
  showAnswer: boolean;
  onShowAnswer: () => void;
  onCorrect: () => void;
  onIncorrect: () => void;
  onNext: () => void;
  onPrev: () => void;
  onShuffle: () => void;
  onToggleMastered: () => void;
  isMastered: boolean;
  hasNext: boolean;
  hasPrev: boolean;
}

export function StudyNavigationControls({
  showAnswer,
  onShowAnswer,
  onCorrect,
  onIncorrect,
  onNext,
  onPrev,
  onShuffle,
  onToggleMastered,
  isMastered,
  hasNext,
  hasPrev,
}: StudyNavigationControlsProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      {/* Primary controls */}
      <div className="flex w-full flex-row justify-between gap-2">
        {/* Previous button */}
        <Button
          onClick={onPrev}
          disabled={!hasPrev}
          intent="secondary"
          className="flex w-16 items-center justify-center"
        >
          <ArrowLeftCircleIcon className="h-5 w-5" />
        </Button>

        {/* Center controls */}
        <div className="flex flex-1 flex-row justify-center gap-2">
          {showAnswer ? (
            <>
              <Button
                onClick={() => {
                  onCorrect();
                  onNext();
                }}
                intent="success"
                className="flex flex-1 items-center justify-center gap-1 sm:flex-initial"
              >
                <CheckCircleIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Correct</span>
              </Button>

              <Button
                onClick={() => {
                  onIncorrect();
                  onNext();
                }}
                intent="danger"
                className="flex flex-1 items-center justify-center gap-1 sm:flex-initial"
              >
                <XCircleIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Incorrect</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={onShowAnswer}
              intent="primary"
              className="flex flex-1 items-center justify-center gap-1 sm:flex-initial"
            >
              <EyeIcon className="h-5 w-5" />
              <span>Show Answer</span>
            </Button>
          )}
        </div>

        {/* Next button */}
        <Button
          onClick={onNext}
          disabled={!hasNext}
          intent="secondary"
          className="flex w-16 items-center justify-center"
        >
          <ArrowRightCircleIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Secondary controls */}
      <div className="flex w-full flex-row justify-between">
        <Button
          onClick={onShuffle}
          intent="ghost"
          size="small"
          className="flex items-center gap-1 text-xs"
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>Shuffle</span>
        </Button>

        <Button
          onClick={onToggleMastered}
          intent="ghost"
          size="small"
          className={`flex items-center gap-1 text-xs ${
            isMastered ? "text-purple-500" : ""
          }`}
        >
          {isMastered ? (
            <BookmarkSolidIcon className="h-4 w-4" />
          ) : (
            <BookmarkIcon className="h-4 w-4" />
          )}
          <span>{isMastered ? "Unmark Mastered" : "Mark Mastered"}</span>
        </Button>
      </div>
    </div>
  );
} 