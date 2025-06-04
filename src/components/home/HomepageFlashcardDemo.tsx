import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Star, BookOpen, ArrowRight } from 'lucide-react';
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

  if (!currentCard) {
    return (
      <div className={`py-16 ${className}`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-80 h-48 mx-auto bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-16 ${className}`}>
      <div className="max-w-4xl mx-auto px-4">

        {/* Demo Container */}
        <div className="max-w-2xl mx-auto">
          {/* Card Counter */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <span>{currentIndex + 1} of {demoCards.length}</span>
              <div className="flex gap-1">
                {demoCards.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex 
                        ? 'bg-[#F37022]' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Flashcard */}
          <div className="relative mb-8">
            <div className="perspective-1000">
              <div
                className={`relative w-full h-80 transition-transform duration-500 transform-style-preserve-3d cursor-pointer ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
                onClick={toggleFlip}
              >
                {/* Front of card (Question) */}
                <div className="absolute inset-0 w-full h-full backface-hidden">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary"
                            className="text-xs"
                          >
                            {currentCard.subject}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={`text-xs ${
                              currentCard.difficulty === 'foundational' 
                                ? 'border-green-500 text-green-700'
                              : currentCard.difficulty === 'intermediate'
                                ? 'border-yellow-500 text-yellow-700'
                                : 'border-red-500 text-red-700'
                            }`}
                          >
                            {currentCard.difficulty}
                          </Badge>
                          {currentCard.isPremium && (
                            <Badge className="bg-[#F37022] text-white text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        <BookOpen className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* Question */}
                    <div className="flex-1 p-6 flex items-center justify-center">
                      <div className="text-center">
                        <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                          {currentCard.question}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Click to reveal answer
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back of card (Answer) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                  <div className="bg-[#F37022] text-white rounded-xl shadow-lg h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-orange-400">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary"
                            className="bg-white/20 text-white border-none text-xs"
                          >
                            {currentCard.subject}
                          </Badge>
                          {currentCard.isPremium && (
                            <Badge className="bg-white/20 text-white border-none text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        <BookOpen className="w-5 h-5 text-orange-200" />
                      </div>
                    </div>

                    {/* Answer */}
                    <div className="flex-1 p-6 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-base md:text-lg leading-relaxed">
                          {currentCard.answer}
                        </p>
                        <p className="text-sm text-orange-200 mt-4">
                          Click to see question
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={prevCard}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFlip}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Flip Card
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={nextCard}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={shuffleCards}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Shuffle
            </Button>
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