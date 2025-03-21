import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const [showDefinition, setShowDefinition] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [difficultyRatingVisible, setDifficultyRatingVisible] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [studyStats, setStudyStats] = useState<StudyStats>(initialStudyStats);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isTablet, setIsTablet] = useState(false);
  
  // Reference to the card element for flip animation
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Check if on tablet/iPad
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width <= 1024);
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

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

  // Function to flip the card
  const flipCard = () => {
    // For tablets, use simplified animations without transforms
    if (isTablet) {
      setShowDefinition(!showDefinition);
    } else {
      // For desktop/non-tablets, use the regular animation
      if (cardRef.current) {
        cardRef.current.classList.toggle('flipped');
      }
      setShowDefinition(!showDefinition);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
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
    <div className="max-w-4xl mx-auto">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
      
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{collection?.title}</h1>
        <p className="text-gray-600 mt-2">{collection?.description}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {collection?.subject.name}
          </span>
          <span className="text-sm text-gray-500">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          {isPremiumContent && !hasSubscription && (
            <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded flex items-center">
              <Lock className="h-3 w-3 mr-1" /> Premium Content
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 mb-6">
        <div className="bg-blue-50 p-2 md:p-3 rounded-lg text-center">
          <p className="text-lg md:text-xl font-bold text-blue-700">{flashcards.length}</p>
          <p className="text-xs text-blue-600">Total</p>
        </div>
        <div className="bg-green-50 p-2 md:p-3 rounded-lg text-center">
          <p className="text-lg md:text-xl font-bold text-green-700">{stats.correct}</p>
          <p className="text-xs text-green-600">Correct</p>
        </div>
        <div className="bg-red-50 p-2 md:p-3 rounded-lg text-center">
          <p className="text-lg md:text-xl font-bold text-red-700">{stats.incorrect}</p>
          <p className="text-xs text-red-600">Incorrect</p>
        </div>
        <div className="bg-orange-50 p-2 md:p-3 rounded-lg text-center">
          <p className="text-lg md:text-xl font-bold text-[#F37022]">{stats.mastered}</p>
          <p className="text-xs text-[#F37022]">Mastered</p>
        </div>
      </div>
      
      <div 
        className={`bg-white rounded-xl shadow-md p-4 md:p-8 mb-6 min-h-[250px] md:min-h-[300px] flex items-center justify-center cursor-pointer transition-all duration-300 ${
          showAnswer ? 'bg-blue-50' : ''
        } ${shouldBlurAnswer ? 'relative' : ''}`}
        onClick={flipCard}
      >
        <div className="text-center w-full px-2 md:px-4">
          <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-2">
            {showAnswer ? 'Answer:' : 'Question:'}
          </h3>
          
          {shouldBlurAnswer ? (
            <div className="bg-orange-100 p-4 md:p-6 rounded-lg mt-4 md:mt-8">
              <div className="flex flex-col items-center gap-3 md:gap-4">
                <Lock className="h-8 md:h-12 w-8 md:w-12 text-orange-500" />
                <h2 className="text-xl md:text-2xl font-semibold text-orange-800">Premium Flashcard</h2>
                <p className="text-sm md:text-base text-orange-700 max-w-md mx-auto">
                  The answer is only available to premium subscribers. 
                  Upgrade your account to access our curated library of expert flashcards.
                </p>
                <button 
                  className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/settings/subscription');
                  }}
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xl md:text-2xl font-bold break-words">
              {showAnswer ? currentCard?.answer : currentCard?.question}
            </p>
          )}
          
          {!showAnswer && (
            <p className="text-gray-500 mt-4 text-xs md:text-sm">Click to reveal answer</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            currentIndex === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
          Previous
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={handleMarkIncorrect}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              showAnswer && !shouldBlurAnswer
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <X className="h-5 w-5" />
            {showAnswer && !shouldBlurAnswer ? 'Incorrect' : 'Show Answer'}
          </button>
          
          <button
            onClick={handleMarkCorrect}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              showAnswer && !shouldBlurAnswer
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <Check className="h-5 w-5" />
            {showAnswer && !shouldBlurAnswer ? 'Correct' : 'Show Answer'}
          </button>
        </div>
        
        <button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            currentIndex === flashcards.length - 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Next
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
} 