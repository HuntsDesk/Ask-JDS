import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Star, BookOpen, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEMO_FLASHCARDS, type DemoFlashcard, getRandomDemoFlashcards } from '@/data/demoFlashcards';
import { Link } from 'react-router-dom';

interface HomepageFlashcardDemoProps {
  /**
   * Number of cards to show in the demo
   */
  cardCount?: number;
  /**
   * Whether to show the call-to-action section
   */
  showCTA?: boolean;
  /**
   * Custom className for styling
   */
  className?: string;
}

export const HomepageFlashcardDemo: React.FC<HomepageFlashcardDemoProps> = ({
  cardCount = 5,
  showCTA = true,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [demoCards, setDemoCards] = useState<DemoFlashcard[]>([]);

  // Initialize demo cards on component mount
  useEffect(() => {
    const cards = getRandomDemoFlashcards(cardCount);
    setDemoCards(cards);
  }, [cardCount]);

  // Reset flip state when changing cards
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const currentCard = demoCards[currentIndex];

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % demoCards.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + demoCards.length) % demoCards.length);
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const shuffleCards = () => {
    setDemoCards(getRandomDemoFlashcards(cardCount));
    setCurrentIndex(0);
  };

  const showAnswer = () => {
    setIsFlipped(true);
  };

  if (!currentCard) {
    return (
      <div className={`pt-16 pb-4 ${className}`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-80 h-48 mx-auto bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pt-16 pb-4 ${className}`}>
      <div className="max-w-4xl mx-auto px-4">

        {/* Demo Container */}
        <div className="max-w-2xl mx-auto">
          {/* Flashcard */}
          <div className="relative mb-6">
            <div className="perspective-1000">
              <div
                className={`relative w-full h-[26rem] transition-transform duration-500 transform-style-preserve-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front of card (Question) */}
                <div className="absolute inset-0 w-full h-full backface-hidden">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary"
                            className="text-xs"
                          >
                            {currentCard.subject}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="flex flex-1 flex-col overflow-auto px-6 py-8">
                      <div className="flex min-h-32 flex-1 items-center justify-center">
                        <div className="prose prose-slate mx-auto text-center">
                          <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-0">
                            {currentCard.question}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Show Answer Button - positioned at bottom */}
                      <div className="flex justify-center pt-4 flex-shrink-0">
                        <Button
                          onClick={showAnswer}
                          className="bg-[#F37022] hover:bg-[#E35D10] text-white flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Show Answer
                        </Button>
                      </div>
                    </div>

                    {/* Bottom Navigation Bar */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
                      <div className="flex justify-between items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={prevCard}
                          className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={shuffleCards}
                          className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Shuffle
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={nextCard}
                          className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back of card (Answer) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                  <div className="bg-[#F37022] text-white rounded-xl shadow-lg h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-orange-400 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary"
                            className="bg-white/20 text-white border-none text-xs"
                          >
                            {currentCard.subject}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Answer Content */}
                    <div className="flex flex-1 flex-col overflow-auto px-6 py-8">
                      <div className="flex min-h-32 flex-1 items-center justify-center">
                        <div className="prose prose-slate mx-auto text-center">
                          <p className="text-base md:text-lg leading-relaxed text-white mb-0">
                            {currentCard.answer}
                          </p>
                        </div>
                      </div>
                      
                      {/* Back to Question Button - positioned at bottom */}
                      <div className="flex justify-center pt-4 flex-shrink-0">
                        <Button
                          onClick={toggleFlip}
                          className="bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Back to Question
                        </Button>
                      </div>
                    </div>

                    {/* Bottom Navigation Bar */}
                    <div className="p-4 border-t border-orange-400 bg-orange-600 rounded-b-xl flex-shrink-0">
                      <div className="flex justify-between items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={prevCard}
                          className="flex items-center gap-1 text-orange-200 hover:text-white"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={shuffleCards}
                          className="flex items-center gap-1 text-orange-200 hover:text-white"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Shuffle
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={nextCard}
                          className="flex items-center gap-1 text-orange-200 hover:text-white"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles for 3D flip effect */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};