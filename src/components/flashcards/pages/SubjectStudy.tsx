import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import useFlashcardAuth from '@/hooks/useFlashcardAuth';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import Toast from '../Toast';
import { FlashcardPaywall } from '@/components/FlashcardPaywall';
import { hasActiveSubscription } from '@/lib/subscription';
import Tooltip from '../Tooltip';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Edit, 
  Eye, 
  EyeOff, 
  FileEdit, 
  PlusCircle, 
  Rotate3D as Rotate, 
  Shuffle, 
  ChevronLeft, 
  Plus,
  Lock
} from 'lucide-react';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  collection_id: string;
  collection_title: string;
  is_mastered: boolean;
}

interface Subject {
  id: string;
  name: string;
  description: string;
  created_at: string;
  user_id: string;
  is_official?: boolean;
}

export default function SubjectStudy() {
  const { subject: id } = useParams<{ subject: string }>();
  const { user } = useFlashcardAuth();
  const navigate = useNavigate();
  
  console.log("SubjectStudy: Initial render with id:", id, "user:", user ? user.id : "not authenticated");
  
  // Validate subject ID
  useEffect(() => {
    if (!id) {
      console.error("SubjectStudy: Missing subject ID in URL parameters");
      setError("Missing subject ID. Please return to subjects page and try again.");
      return;
    }
    
    if (id.length < 10) {
      console.error("SubjectStudy: Invalid subject ID format:", id);
      setError("Invalid subject ID format. Please return to subjects page and try again.");
      return;
    }
  }, [id]);
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showMastered, setShowMastered] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isOfficialContent, setIsOfficialContent] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Function to handle manual retry
  const handleRetry = () => {
    console.log("SubjectStudy: Manual retry requested");
    setError(null);
    setLoading(true);
    setRetryCount(prev => prev + 1);
    loadData().catch(err => {
      console.error("Retry failed:", err);
      setError(`Retry failed: ${err.message || "Unknown error"}`);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (id) {
      console.log("SubjectStudy: Component mounted with id:", id, "retryCount:", retryCount);
      
      // Check network status first
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.error("SubjectStudy: Network appears to be offline");
        setLoading(false);
        setError("Network connection unavailable. Please check your internet connection and try again.");
        return;
      }
      
      // Add timeout protection to ensure loading state doesn't get stuck
      const timeoutId = setTimeout(() => {
        console.error("SubjectStudy component loading timeout - forcing loading to complete");
        setLoading(false);
        setError("Loading timed out. Please try again.");
      }, 15000); // 15 second timeout for the entire component
      
      // Call loadData and ensure loading state is properly reset
      loadData().catch(err => {
        console.error("Unhandled error in loadData:", err);
        setError(err.message || "Failed to load subject data");
        setLoading(false);
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }, [id, showMastered, retryCount]);

  const hideToast = () => {
    setToast(null);
  };

  const loadData = async () => {
    console.log("SubjectStudy: Starting loadData function with id:", id);
    setLoading(true);
    setError(null); // Reset any previous errors
    
    // Add timeout protection to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error("SubjectStudy loadData timeout - operation took too long");
      setLoading(false);
      setError("Loading timed out. Please try again later.");
    }, 10000); // 10 second timeout
    
    try {
      // Check subscription status first
      if (user) {
        try {
          console.log("SubjectStudy: Checking subscription status for user:", user.id);
          const hasAccess = await hasActiveSubscription(user.id);
          console.log("SubjectStudy: User subscription status:", hasAccess);
          setHasSubscription(hasAccess);
        } catch (subErr) {
          console.error("Error checking subscription status:", subErr);
          // Continue with hasSubscription as false if check fails
          setHasSubscription(false);
        }
      } else {
        console.log("SubjectStudy: No user logged in, setting hasSubscription to false");
        setHasSubscription(false);
      }
      
      // Fetch subject details
      console.log("SubjectStudy: Fetching subject details for id:", id);
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .single();

      if (subjectError) {
        console.error("SubjectStudy: Error fetching subject:", subjectError);
        throw new Error(subjectError.message);
      }

      if (!subjectData) {
        console.error("SubjectStudy: Subject not found for id:", id);
        throw new Error('Subject not found');
      }

      console.log("SubjectStudy: Subject data loaded:", subjectData);
      setSubject(subjectData);
      
      // Check if this is premium content
      const isOfficial = subjectData.is_official || false;
      console.log("SubjectStudy: Subject is_official:", isOfficial);
      setIsOfficialContent(isOfficial);
      
      // Remove the immediate paywall for premium subjects
      // Premium content will be restricted at the flashcard level
      console.log("Bypassing subject-level premium check as requested");
      
      // Fetch collections for this subject
      console.log("SubjectStudy: Fetching collections for subject:", id);
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('flashcard_collections')
        .select('*')
        .eq('subject_id', id)
        .order('created_at', { ascending: false });

      if (collectionsError) {
        console.error("SubjectStudy: Error fetching collections:", collectionsError);
        throw new Error(collectionsError.message);
      }

      console.log("SubjectStudy: Found", collectionsData?.length || 0, "collections");
      setCollections(collectionsData || []);

      if (collectionsData && collectionsData.length > 0) {
        // Get all collection IDs
        const collectionIds = collectionsData.map(c => c.id);
        console.log("SubjectStudy: Collection IDs:", collectionIds);

        // Build query for flashcards
        console.log("SubjectStudy: Fetching flashcards for collections, showMastered:", showMastered);
        let query = supabase
          .from('flashcards')
          .select('*')
          .in('collection_id', collectionIds);

        // If not showing mastered cards, filter them out
        if (!showMastered) {
          query = query.eq('is_mastered', false);
        }

        const { data: cardsData, error: cardsError } = await query;

        if (cardsError) {
          console.error("SubjectStudy: Error fetching flashcards:", cardsError);
          throw new Error(cardsError.message);
        }

        console.log("SubjectStudy: Found", cardsData?.length || 0, "flashcards");
        
        // Transform cards to include collection title
        const transformedCards = cardsData.map((card: any) => {
          const collection = collectionsData.find(c => c.id === card.collection_id);
          return {
            ...card,
            collection_title: collection ? collection.title : 'Unknown Collection'
          };
        });

        console.log("SubjectStudy: Setting", transformedCards.length, "cards to state");
        setCards(transformedCards || []);
        setCurrentIndex(0);
        setShowAnswer(false);
      } else {
        console.log("SubjectStudy: No collections found, setting empty cards array");
        setCards([]);
      }
    } catch (err: any) {
      console.error("Error in SubjectStudy loadData:", err);
      setError(err.message || "An unknown error occurred while loading data");
    } finally {
      clearTimeout(timeoutId); // Clear the timeout when done
      console.log("SubjectStudy: loadData complete, setting loading to false");
      setLoading(false);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const goToNextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const goToPreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const markAsMastered = async () => {
    console.log("SubjectStudy markAsMastered function called");
    
    if (!user) {
      console.log("SubjectStudy: User not logged in");
      setToast({
        message: 'You need to be signed in to mark cards as mastered',
        type: 'error'
      });
      return;
    }

    if (cards.length === 0 || currentIndex >= cards.length) {
      console.log("SubjectStudy: No cards available to mark as mastered");
      return;
    }
    
    const currentCard = cards[currentIndex];
    
    if (currentCard.is_mastered) {
      console.log("SubjectStudy: Card is already mastered");
      return;
    }
    
    console.log("SubjectStudy: Marking card as mastered:", currentCard.id);
    
    try {
      // Update Supabase
      const { error } = await supabase
        .from('flashcards')
        .update({ is_mastered: true })
        .eq('id', currentCard.id);

      if (error) {
        console.error("SubjectStudy: Error updating card in Supabase:", error);
        throw new Error(error.message);
      }
      
      console.log("SubjectStudy: Card successfully marked as mastered in Supabase");

      setToast({
        message: 'Card marked as mastered!',
        type: 'success'
      });

      // Update local state
      console.log("SubjectStudy: Updating local state. Show mastered:", showMastered);
      
      if (!showMastered) {
        // If not showing mastered cards, remove this card from the array
        const updatedCards = cards.filter((_, index) => index !== currentIndex);
        console.log("SubjectStudy: Removing card from list, new card count:", updatedCards.length);
        setCards(updatedCards);
        
        // Adjust current index if needed
        if (currentIndex >= updatedCards.length) {
          console.log("SubjectStudy: Adjusting current index from", currentIndex, "to", Math.max(0, updatedCards.length - 1));
          setCurrentIndex(Math.max(0, updatedCards.length - 1));
        }
      } else {
        // Just update the card in the array
        const updatedCards = [...cards];
        updatedCards[currentIndex] = {
          ...currentCard,
          is_mastered: true
        };
        console.log("SubjectStudy: Updating card in list");
        setCards(updatedCards);
      }
    } catch (err: any) {
      console.error("SubjectStudy: Error in markAsMastered:", err);
      setToast({
        message: `Error: ${err.message}`,
        type: 'error'
      });
    }
  };

  const unmarkAsMastered = async () => {
    console.log("SubjectStudy unmarkAsMastered function called");
    
    if (!user) {
      console.log("SubjectStudy: User not logged in");
      setToast({
        message: 'You need to be signed in to change card status',
        type: 'error'
      });
      return;
    }

    if (cards.length === 0 || currentIndex >= cards.length) {
      console.log("SubjectStudy: No cards available to update");
      return;
    }
    
    const currentCard = cards[currentIndex];
    
    if (!currentCard.is_mastered) {
      console.log("SubjectStudy: Card is not mastered, cannot unmark");
      return;
    }
    
    console.log("SubjectStudy: Unmarking card as mastered:", currentCard.id);
    
    try {
      // Update Supabase
      const { error } = await supabase
        .from('flashcards')
        .update({ is_mastered: false })
        .eq('id', currentCard.id);

      if (error) {
        console.error("SubjectStudy: Error updating card in Supabase:", error);
        throw new Error(error.message);
      }
      
      console.log("SubjectStudy: Card successfully unmarked as mastered in Supabase");

      setToast({
        message: 'Card status updated',
        type: 'success'
      });

      // Update local state
      const updatedCards = [...cards];
      updatedCards[currentIndex] = {
        ...currentCard,
        is_mastered: false
      };
      console.log("SubjectStudy: Updating card in list");
      setCards(updatedCards);
    } catch (err: any) {
      console.error("SubjectStudy: Error in unmarkAsMastered:", err);
      setToast({
        message: `Error: ${err.message}`,
        type: 'error'
      });
    }
  };

  const handleClosePaywall = () => {
    setShowPaywall(false);
    navigate('/flashcards/subjects');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Loading Subject</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We're preparing your flashcards...
          </p>
          <LoadingSpinner />
          
          {/* Add a way to recover from a potentially broken state after 8 seconds */}
          <div 
            className="mt-8 invisible opacity-0 transition-all duration-500" 
            id="retry-section" 
            style={{animation: 'fadeIn 0.5s 8s forwards'}}
          >
            <p className="text-red-600 dark:text-red-400 mb-2">
              This is taking longer than expected. Would you like to try again?
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md mt-2"
            >
              Retry Loading
            </button>
            <style>{`
              @keyframes fadeIn {
                to {
                  visibility: visible;
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error Loading Subject</h2>
          <p className="text-gray-800 dark:text-gray-300 mb-6">
            {error}
          </p>
          <div className="flex flex-col gap-4 items-center">
            <button
              onClick={handleRetry}
              className="bg-[#F37022] text-white px-6 py-2 rounded-md hover:bg-[#E36012]"
            >
              Try Again
            </button>
            <Link
              to="/flashcards/subjects"
              className="text-[#F37022] hover:text-[#E36012]"
            >
              Return to Subjects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!subject) {
    return <ErrorMessage message="Subject not found" />;
  }

  // If no cards found for this subject
  if (cards.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">No cards found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            There are no cards associated with this subject yet.
          </p>
          <Link 
            to="/flashcards/create-collection" 
            className="inline-flex items-center gap-2 bg-[#F37022] text-white px-4 py-2 rounded-md hover:bg-[#E36012]"
          >
            <Plus className="h-5 w-5" />
            Create a Collection
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  
  // Force premium content blurring for testing
  const forcePremiumTest = false; // Set to false to disable premium testing
  const isPremiumBlurred = (isOfficialContent && !hasSubscription) || forcePremiumTest;
  
  console.log("SubjectStudy render - isPremiumBlurred:", isPremiumBlurred, "isOfficialContent:", isOfficialContent, "hasSubscription:", hasSubscription);

  return (
    <div className="max-w-3xl mx-auto">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}

      {showPaywall && (
        <FlashcardPaywall onCancel={handleClosePaywall} />
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/flashcards/subjects" className="text-[#F37022] hover:text-[#E36012] flex items-center mb-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1">Back to Subjects</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{subject.name}</h1>
          {subject.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{subject.description}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'} • 
            {currentIndex + 1} of {cards.length}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Tooltip text={showMastered ? "Hide mastered cards" : "Show all cards"}>
            <button
              onClick={() => {
                console.log("SubjectStudy: Toggling showMastered from", showMastered, "to", !showMastered);
                setShowMastered(!showMastered);
                // Reset to first card when toggling to avoid out-of-range errors
                setCurrentIndex(0);
              }}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {showMastered ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </Tooltip>
          <Tooltip text="Shuffle cards">
            <button
              onClick={shuffleCards}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Shuffle className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden relative" style={{ isolation: 'isolate' }}>
        {isPremiumBlurred && (
          <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-10 font-bold">
            PREMIUM CONTENT - SUBSCRIPTION REQUIRED
          </div>
        )}
        
        <div className="p-8">
          <div
            className="min-h-[250px] flex items-center justify-center cursor-pointer"
            onClick={toggleAnswer}
          >
            <div className="text-center w-full">
              {isPremiumBlurred && showAnswer ? (
                <div className="premium-content-placeholder">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-6 rounded-lg">
                    <div className="flex flex-col items-center gap-4">
                      <Lock className="h-12 w-12 text-orange-500 dark:text-orange-400" />
                      <h2 className="text-2xl font-semibold text-orange-800 dark:text-orange-300">Premium Flashcard</h2>
                      <p className="text-orange-700 dark:text-orange-300 max-w-md mx-auto">
                        The answer is only available to premium subscribers. 
                        Upgrade your account to access our curated library of expert flashcards.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {showAnswer ? currentCard.answer : currentCard.question}
                </h2>
              )}
            </div>
          </div>
          
          <div className="text-center mt-4">
            <button
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-2 mx-auto"
              onClick={toggleAnswer}
            >
              <Rotate className="h-5 w-5" />
              {showAnswer ? 'Show Question' : 'Show Answer'}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 px-8 py-4 flex justify-between items-center relative" style={{ isolation: 'isolate', zIndex: 1 }}>
          <button
            onClick={goToPreviousCard}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          >
            <ArrowLeft className="h-5 w-5" />
            Previous
          </button>

          <div className="flex items-center gap-3" style={{ pointerEvents: 'auto' }}>
            {!currentCard.is_mastered && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Subject Study - Mark Mastered button clicked");
                  markAsMastered();
                }}
                type="button"
                className="bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-700 cursor-pointer flex items-center gap-1 px-3 py-1 rounded-md font-medium"
              >
                <Check className="h-4 w-4" />
                Mark Mastered
              </button>
            )}
            
            {currentCard.is_mastered && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Subject Study - Undo Mastered button clicked");
                  unmarkAsMastered();
                }}
                type="button"
                className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 cursor-pointer flex items-center gap-1 px-3 py-1 rounded-md"
              >
                <Check className="h-4 w-4" />
                Undo Mastered
              </button>
            )}
          </div>

          <button
            onClick={goToNextCard}
            disabled={currentIndex === cards.length - 1}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          >
            Next
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isPremiumBlurred && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowPaywall(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Upgrade to Premium for Full Access
          </button>
        </div>
      )}
    </div>
  );
} 