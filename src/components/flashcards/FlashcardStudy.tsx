import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ArrowRight, Check, X, RotateCcw, BookOpen, Lock } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import ErrorMessage from './ErrorMessage';
import useToast from '@/hooks/useFlashcardToast';
import Toast from './Toast';
import { useAuth } from '@/lib/auth';
import { hasActiveSubscription } from '@/lib/subscription';
import { useIsTablet, useIsMobile } from '@/hooks/useResponsive';
import { useResponsiveClasses, ResponsiveWrapper } from '@/lib/responsive-utils';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  is_mastered?: boolean;
  is_official?: boolean;
  created_by?: string;
  progress?: {
    id: string;
    is_mastered: boolean;
    last_reviewed: string;
  } | null;
}

interface FlashcardCollection {
  id: string;
  title: string;
  description: string;
  is_official?: boolean;
  user_id?: string;
  subject: {
    id: string;
    name: string;
  };
}

export default function FlashcardStudy() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();
  
  // Add responsive hooks
  const isTablet = useIsTablet();
  const isMobile = useIsMobile();
  
  const [collection, setCollection] = useState<FlashcardCollection | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyComplete, setStudyComplete] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isPremiumContent, setIsPremiumContent] = useState(false);
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    remaining: 0,
    mastered: 0
  });

  // Get responsive class combinations for different elements
  const statsGridClasses = useResponsiveClasses(
    'grid-cols-2 gap-2',  // Mobile
    'grid-cols-4 gap-2',  // Tablet
    'grid-cols-4 gap-4'   // Desktop
  );
  
  const cardPaddingClasses = useResponsiveClasses(
    'p-4',               // Mobile
    'p-5',               // Tablet
    'p-8'                // Desktop
  );
  
  const cardHeightClasses = useResponsiveClasses(
    'min-h-[250px]',     // Mobile
    'min-h-[300px]',     // Tablet
    'min-h-[300px]'      // Desktop
  );
  
  const buttonSizeClasses = useResponsiveClasses(
    'h-10 w-10',         // Mobile
    'h-12 w-12',         // Tablet
    'h-14 w-14'          // Desktop
  );

  // Create a memoized shuffle function
  const shuffleCards = useCallback((cards) => {
    return [...cards].sort(() => Math.random() - 0.5);
  }, []);

  // Memoize the calculation of mastered cards
  const masteredCount = useMemo(() => {
    return flashcards.filter(card => 
      card.progress?.is_mastered || card.is_mastered
    ).length;
  }, [flashcards]);

  useEffect(() => {
    const checkSubscription = async () => {
      if (user) {
        try {
          const hasAccess = await hasActiveSubscription(user.id);
          setHasSubscription(hasAccess);
        } catch (err) {
          console.error('Error checking subscription:', err);
          // Default to no subscription on error
          setHasSubscription(false);
        }
      } else {
        setHasSubscription(false);
      }
    };

    checkSubscription();
  }, [user]);

  useEffect(() => {
    if (collectionId && user) {
      loadFlashcards();
    }
  }, [collectionId, user]);

  useEffect(() => {
    if (flashcards.length > 0) {
      updateStats();
    }
  }, [flashcards, currentIndex]);

  async function loadFlashcards() {
    try {
      setLoading(true);
      
      // Get collection details
      const { data: collectionData, error: collectionError } = await supabase
        .from('flashcard_collections')
        .select(`
          id,
          title,
          description,
          is_official,
          user_id,
          subject:subject_id (
            id,
            name
          )
        `)
        .eq('id', collectionId)
        .single();
      
      if (collectionError) throw collectionError;
      
      // Set premium content flag
      const isOfficial = collectionData.is_official || false;
      setIsPremiumContent(isOfficial);
      
      // Get flashcards for this collection
      const { data: cardsData, error: cardsError } = await supabase
        .from('flashcards')
        .select(`
          *,
          collection:collection_id (
            id,
            title,
            is_official,
            user_id
          )
        `)
        .eq('collection_id', collectionId)
        .order('created_at');
      
      if (cardsError) throw cardsError;
      
      if (!cardsData || cardsData.length === 0) {
        setFlashcards([]);
      } else {
        // Get user progress for these cards
        if (user) {
          const { data: progressData, error: progressError } = await supabase
            .from('flashcard_progress')
            .select('*')
            .eq('user_id', user.id)
            .in('flashcard_id', cardsData.map(c => c.id));

          if (progressError) {
            console.error('Error fetching flashcard progress:', progressError);
          } else {
            // Create a map of progress by flashcard ID
            const progressMap = (progressData || []).reduce((map, p) => {
              map[p.flashcard_id] = p;
              return map;
            }, {});
            
            // Merge progress into card data
            cardsData.forEach(card => {
              card.progress = progressMap[card.id] || null;
            });
          }
        }
        
        // Use the memoized shuffle function
        setFlashcards(shuffleCards(cardsData));
      }
      
      setCollection(collectionData);
    } catch (err: any) {
      console.error('Error loading flashcards:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateStats() {
    // Use the memoized mastered count
    const remaining = flashcards.length - currentIndex;
    
    setStats({
      ...stats,
      remaining,
      mastered: masteredCount
    });
  }

  function handleFlip() {
    setShowAnswer(!showAnswer);
  }

  function handleNext() {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      setStudyComplete(true);
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  }

  async function handleMarkCorrect() {
    if (!showAnswer) {
      setShowAnswer(true);
      return;
    }
    
    if (!user) {
      showToast('You must be logged in to track progress', 'error');
      return;
    }
    
    try {
      const currentCard = flashcards[currentIndex];
      
      // Update or create progress in the flashcard_progress table
      const progressData = {
        user_id: user.id,
        flashcard_id: currentCard.id,
        is_mastered: true,
        last_reviewed: new Date().toISOString()
      };

      if (currentCard.progress?.id) {
        // Update existing progress
        const { error } = await supabase
          .from('flashcard_progress')
          .update({
            is_mastered: true,
            last_reviewed: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', currentCard.progress.id);
        
        if (error) throw error;
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('flashcard_progress')
          .insert(progressData);
        
        if (error) throw error;
      }
      
      // Update local state
      const updatedCards = [...flashcards];
      updatedCards[currentIndex] = {
        ...currentCard,
        progress: {
          ...currentCard.progress,
          is_mastered: true,
          last_reviewed: new Date().toISOString()
        }
      };
      setFlashcards(updatedCards);
      
      setStats({
        ...stats,
        correct: stats.correct + 1,
        mastered: stats.mastered + (!currentCard.progress?.is_mastered ? 1 : 0)
      });
      
      handleNext();
    } catch (err: any) {
      console.error('Error marking card as correct:', err);
      showToast('Failed to update card status', 'error');
    }
  }

  async function handleMarkIncorrect() {
    if (!showAnswer) {
      setShowAnswer(true);
      return;
    }
    
    if (!user) {
      showToast('You must be logged in to track progress', 'error');
      return;
    }
    
    try {
      const currentCard = flashcards[currentIndex];
      
      // Update or create progress in the flashcard_progress table
      const progressData = {
        user_id: user.id,
        flashcard_id: currentCard.id,
        is_mastered: false,
        last_reviewed: new Date().toISOString()
      };

      if (currentCard.progress?.id) {
        // Update existing progress
        const { error } = await supabase
          .from('flashcard_progress')
          .update({
            is_mastered: false,
            last_reviewed: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', currentCard.progress.id);
        
        if (error) throw error;
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('flashcard_progress')
          .insert(progressData);
        
        if (error) throw error;
      }
      
      // Update local state
      const updatedCards = [...flashcards];
      updatedCards[currentIndex] = {
        ...currentCard,
        progress: {
          ...currentCard.progress,
          is_mastered: false,
          last_reviewed: new Date().toISOString()
        }
      };
      setFlashcards(updatedCards);
      
      setStats({
        ...stats,
        incorrect: stats.incorrect + 1,
        mastered: stats.mastered - (currentCard.progress?.is_mastered ? 1 : 0)
      });
      
      handleNext();
    } catch (err: any) {
      console.error('Error marking card as incorrect:', err);
      showToast('Failed to update card status', 'error');
    }
  }

  function handleRestartStudy() {
    // Use the memoized shuffle function
    setFlashcards(shuffleCards(flashcards));
    setCurrentIndex(0);
    setShowAnswer(false);
    setStudyComplete(false);
    setStats({
      correct: 0,
      incorrect: 0,
      remaining: flashcards.length,
      mastered: masteredCount
    });
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!collection || flashcards.length === 0) {
    return (
      <EmptyState
        title="No flashcards found"
        description="This collection doesn't have any flashcards yet."
        icon={<BookOpen className="h-12 w-12 text-gray-400" />}
        actionText="Go Back"
        actionLink="/flashcards/collections"
      />
    );
  }

  if (studyComplete) {
    const totalAnswered = stats.correct + stats.incorrect;
    const score = totalAnswered > 0 ? Math.round((stats.correct / totalAnswered) * 100) : 0;
    
    return (
      <div className="max-w-4xl mx-auto">
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={hideToast} 
          />
        )}
        
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="inline-flex justify-center items-center p-6 bg-green-100 rounded-full mb-6">
            <Check className="h-12 w-12 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Study Session Complete!</h2>
          <p className="text-gray-600 mb-8">You've completed studying all flashcards in this collection.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{totalAnswered}</p>
              <p className="text-sm text-blue-600">Cards Studied</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{stats.correct}</p>
              <p className="text-sm text-green-600">Correct</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{stats.incorrect}</p>
              <p className="text-sm text-red-600">Incorrect</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-[#F37022]">{score}%</p>
              <p className="text-sm text-[#F37022]">Score</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={handleRestartStudy}
              className="flex items-center justify-center gap-2 bg-[#F37022] text-white px-6 py-3 rounded-md hover:bg-[#E36012]"
            >
              <RotateCcw className="h-5 w-5" />
              Study Again
            </button>
            <button
              onClick={() => navigate('/flashcards/collections')}
              className="flex items-center justify-center gap-2 bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Collections
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex] || null;
  const isCurrentCardPremium = currentCard?.is_official || currentCard?.collection?.is_official || isPremiumContent;
  const isCardCreator = user && currentCard?.created_by === user.id;
  const hasCardAccess = !isCurrentCardPremium || hasSubscription || isCardCreator;
  const shouldBlurAnswer = showAnswer && isCurrentCardPremium && !hasCardAccess;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      {studyComplete ? (
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Study Session Complete!</h2>
          <div className="max-w-md mx-auto mb-6">
            <p className="text-gray-600 mb-4">You've completed all the flashcards in this collection.</p>
            
            <div className={`grid ${statsGridClasses} mb-6`}>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-500">Correct</p>
                <p className="text-xl font-bold text-green-700">{stats.correct}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-500">Incorrect</p>
                <p className="text-xl font-bold text-red-700">{stats.incorrect}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-blue-700">{flashcards.length}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-500">Mastered</p>
                <p className="text-xl font-bold text-[#F37022]">{masteredCount}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={handleRestartStudy}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4" />
              Restart Study Session
            </button>
            <button
              onClick={() => navigate('/flashcards')}
              className="flex items-center justify-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Collections
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={() => navigate('/flashcards')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{collection?.title}</h1>
            <div className="w-20"></div> {/* Spacer for alignment */}
          </div>
          
          <ResponsiveWrapper
            mobileStyles="grid grid-cols-2 gap-2 mb-4"
            tabletStyles="grid grid-cols-4 gap-2 mb-6"
            desktopStyles="grid grid-cols-4 gap-4 mb-6"
          >
            <div className="bg-blue-50 p-2 md:p-3 rounded-lg text-center">
              <p className="text-xs md:text-sm text-gray-500">Cards</p>
              <p className="text-lg md:text-xl font-bold text-blue-700">{flashcards.length}</p>
            </div>
            <div className="bg-green-50 p-2 md:p-3 rounded-lg text-center">
              <p className="text-xs md:text-sm text-gray-500">Correct</p>
              <p className="text-lg md:text-xl font-bold text-green-700">{stats.correct}</p>
            </div>
            <div className="bg-red-50 p-2 md:p-3 rounded-lg text-center">
              <p className="text-xs md:text-sm text-gray-500">Incorrect</p>
              <p className="text-lg md:text-xl font-bold text-red-700">{stats.incorrect}</p>
            </div>
            <div className="bg-orange-50 p-2 md:p-3 rounded-lg text-center">
              <p className="text-xs md:text-sm text-gray-500">Mastered</p>
              <p className="text-lg md:text-xl font-bold text-[#F37022]">{stats.mastered}</p>
            </div>
          </ResponsiveWrapper>
          
          <div
            className={`bg-white rounded-xl shadow-md ${cardPaddingClasses} mb-6 ${cardHeightClasses} flex items-center justify-center cursor-pointer transition-all duration-300 ${
              showAnswer ? 'bg-gray-50' : ''
            }`}
            onClick={handleFlip}
          >
            <div className="text-center w-full px-2 md:px-4">
              <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-2">
                {showAnswer ? "Answer" : "Question"}
              </h3>
              <p className="text-gray-700">{showAnswer ? currentCard.answer : currentCard.question}</p>
              {!showAnswer && (
                <div className="mt-4 text-sm text-gray-500">
                  (Click to flip)
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-orange-100 p-4 md:p-6 rounded-lg mt-4 md:mt-8">
            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={`${buttonSizeClasses} flex items-center justify-center rounded-full bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 border border-gray-200`}
              >
                <ArrowLeft className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
              </button>
              
              <button
                onClick={handleMarkIncorrect}
                className={`${buttonSizeClasses} flex items-center justify-center rounded-full bg-white text-red-500 border border-red-200 hover:bg-red-50`}
              >
                <X className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
              </button>
              
              <button
                onClick={handleFlip}
                className={`${isTablet ? 'h-14 w-24' : isMobile ? 'h-12 w-20' : 'h-16 w-28'} flex items-center justify-center rounded-full bg-white text-blue-600 border border-blue-200 hover:bg-blue-50`}
              >
                <span>Flip</span>
              </button>
              
              <button
                onClick={handleMarkCorrect}
                className={`${buttonSizeClasses} flex items-center justify-center rounded-full bg-white text-green-500 border border-green-200 hover:bg-green-50`}
              >
                <Check className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
              </button>
              
              <button
                onClick={handleNext}
                disabled={currentIndex === flashcards.length - 1}
                className={`${buttonSizeClasses} flex items-center justify-center rounded-full bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 border border-gray-200`}
              >
                <ArrowRight className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
              </button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-gray-500 text-sm">
                Card {currentIndex + 1} of {flashcards.length}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 