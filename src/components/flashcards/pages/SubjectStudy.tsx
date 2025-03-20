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
  created_by: string;
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
  const { id } = useParams<{ id: string }>();
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isOfficialContent, setIsOfficialContent] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [toggleLoading, setToggleLoading] = useState(false);

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

  // Effect to load data when id or showMastered changes
  useEffect(() => {
    if (id) {
      // Reset index and show answer state when toggling mastered cards
      setCurrentIndex(0);
      setShowAnswer(false);
      loadData().catch(err => {
        console.error("Failed to load data:", err);
        setError(`Failed to load data: ${err.message || "Unknown error"}`);
        setLoading(false);
      });
    } else {
      setError("Missing subject ID");
      setLoading(false);
    }
  }, [id, showMastered, retryCount]);
  
  // Effect to recheck subscription status periodically
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (user) {
        try {
          console.log("SubjectStudy: Rechecking subscription status");
          const hasAccess = await hasActiveSubscription(user.id);
          console.log("SubjectStudy: Updated subscription status:", hasAccess);
          setHasSubscription(hasAccess);
        } catch (err) {
          console.error("Error rechecking subscription:", err);
          // On error, default to true to allow access
          setHasSubscription(true);
        }
      }
    };
    
    // Check immediately when component mounts
    checkSubscriptionStatus();
    
    // Set up interval to check every 30 seconds
    const intervalId = setInterval(checkSubscriptionStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, [user]);

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
      const { data: collectionSubjects, error: collectionSubjectsError } = await supabase
        .from('collection_subjects')
        .select('collection_id')
        .eq('subject_id', id);

      if (collectionSubjectsError) {
        console.error("SubjectStudy: Error fetching collection_subjects:", collectionSubjectsError);
        throw new Error(collectionSubjectsError.message);
      }

      if (!collectionSubjects || collectionSubjects.length === 0) {
        console.log("SubjectStudy: No collections found for subject");
        setCollections([]);
        setCards([]);
        setLoading(false);
        return;
      }

      const collectionIds = collectionSubjects.map(cs => cs.collection_id);

      // Fetch the actual collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('*')
        .in('id', collectionIds)
        .order('created_at', { ascending: false });

      if (collectionsError) {
        console.error("SubjectStudy: Error fetching collections:", collectionsError);
        throw new Error(collectionsError.message);
      }

      console.log("SubjectStudy: Found", collectionsData?.length || 0, "collections");
      setCollections(collectionsData || []);

      if (collectionsData && collectionsData.length > 0) {
        // Get flashcard IDs from the flashcard_collections junction table
        const { data: flashcardCollections, error: flashcardCollectionsError } = await supabase
          .from('flashcard_collections_junction')
          .select('flashcard_id, collection_id')
          .in('collection_id', collectionIds);

        if (flashcardCollectionsError) {
          console.error("SubjectStudy: Error fetching flashcard_collections_junction:", flashcardCollectionsError);
          throw new Error(flashcardCollectionsError.message);
        }

        if (!flashcardCollections || flashcardCollections.length === 0) {
          console.log("SubjectStudy: No flashcards found for collections");
          setCards([]);
          setLoading(false);
          return;
        }

        const flashcardIds = flashcardCollections.map(fc => fc.flashcard_id);

        // Get flashcard progress if user is logged in
        let progressMap = new Map();
        if (user) {
          const { data: progressData, error: progressError } = await supabase
            .from('flashcard_progress')
            .select('flashcard_id, is_mastered')
            .eq('user_id', user.id)
            .in('flashcard_id', flashcardIds);

          if (progressError) {
            console.error("SubjectStudy: Error fetching flashcard progress:", progressError);
            // Continue without progress data
          } else if (progressData) {
            // Create a map of flashcard_id to progress
            progressMap = new Map(progressData.map(p => [p.flashcard_id, p]));
          }
        }

        // Fetch the actual flashcards
        let query = supabase
          .from('flashcards')
          .select('*')
          .in('id', flashcardIds);

        const { data: cardsData, error: cardsError } = await query;

        if (cardsError) {
          console.error("SubjectStudy: Error fetching flashcards:", cardsError);
          throw new Error(cardsError.message);
        }

        console.log("SubjectStudy: Found", cardsData?.length || 0, "flashcards");
        
        // Transform cards to include collection title and mastery status
        const transformedCards = cardsData.map((card: any) => {
          // Find which collection this card belongs to
          const flashcardCollection = flashcardCollections.find(fc => fc.flashcard_id === card.id);
          const collectionId = flashcardCollection ? flashcardCollection.collection_id : null;
          const collection = collectionsData.find(c => c.id === collectionId);
          
          // Get mastery status from progress
          const progress = progressMap.get(card.id);
          const isMastered = progress ? progress.is_mastered : false;
          
          // Skip mastered cards if showMastered is false
          if (!showMastered && isMastered) {
            return null;
          }
          
          return {
            ...card,
            collection_id: collectionId,
            collection_title: collection ? collection.title : 'Unknown Collection',
            is_mastered: isMastered
          };
        }).filter(Boolean); // Remove null entries (mastered cards when not showing them)

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
    if (!cards.length || currentIndex < 0 || !user) return;
    
    const currentCard = cards[currentIndex];
    console.log("Marking card as mastered:", currentCard.id);
    setToggleLoading(true);
    
    try {
      // First check if a progress record exists
      const { data: existingProgress, error: checkError } = await supabase
        .from('flashcard_progress')
        .select('*')
        .eq('flashcard_id', currentCard.id)
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      let updateResult;
      
      if (existingProgress) {
        // Update existing progress
        updateResult = await supabase
          .from('flashcard_progress')
          .update({ is_mastered: true })
          .eq('flashcard_id', currentCard.id)
          .eq('user_id', user.id);
      } else {
        // Create new progress record
        updateResult = await supabase
          .from('flashcard_progress')
          .insert({
            flashcard_id: currentCard.id,
            user_id: user.id,
            is_mastered: true
          });
      }
      
      if (updateResult.error) throw updateResult.error;
      
      // Update local state
      const updatedCards = [...cards];
      updatedCards[currentIndex] = {
        ...updatedCards[currentIndex],
        is_mastered: true
      };
      
      setCards(updatedCards);
      showToast('Card marked as mastered!', 'success');
      
      // Go to next card automatically if this was the last card
      if (!showMastered && currentIndex === cards.length - 1) {
        setTimeout(() => {
          loadData();
        }, 1000);
      } else if (!showMastered) {
        // If we're not showing mastered cards, remove this card and adjust the index
        const filteredCards = cards.filter((_, i) => i !== currentIndex);
        setCards(filteredCards);
        
        // Adjust current index if necessary
        if (currentIndex >= filteredCards.length) {
          setCurrentIndex(Math.max(0, filteredCards.length - 1));
        }
        
        showToast('Card marked as mastered and removed from view!', 'success');
      }
    } catch (err: any) {
      console.error("Error marking card as mastered:", err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setToggleLoading(false);
    }
  };

  const unmarkAsMastered = async () => {
    if (!cards.length || currentIndex < 0 || !user) return;
    
    const currentCard = cards[currentIndex];
    console.log("Unmarking card as mastered:", currentCard.id);
    setToggleLoading(true);
    
    try {
      // First check if a progress record exists
      const { data: existingProgress, error: checkError } = await supabase
        .from('flashcard_progress')
        .select('*')
        .eq('flashcard_id', currentCard.id)
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingProgress) {
        // Update existing progress
        const { error: updateError } = await supabase
          .from('flashcard_progress')
          .update({ is_mastered: false })
          .eq('flashcard_id', currentCard.id)
          .eq('user_id', user.id);
        
        if (updateError) throw updateError;
      } else {
        // Create new progress record
        const { error: insertError } = await supabase
          .from('flashcard_progress')
          .insert({
            flashcard_id: currentCard.id,
            user_id: user.id,
            is_mastered: false
          });
        
        if (insertError) throw insertError;
      }
      
      // Update local state
      const updatedCards = [...cards];
      updatedCards[currentIndex] = {
        ...updatedCards[currentIndex],
        is_mastered: false
      };
      
      setCards(updatedCards);
      showToast('Card unmarked as mastered!', 'success');
    } catch (err: any) {
      console.error("Error unmarking card as mastered:", err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleClosePaywall = () => {
    setShowPaywall(false);
    navigate('/flashcards/subjects');
  };

  // Function to show toast messages
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
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
  const isUserCard = currentCard && user && currentCard.created_by === user.id;
  const isPremiumBlurred = (currentCard && currentCard.is_official && !hasSubscription && !isUserCard) || forcePremiumTest;
  
  console.log("SubjectStudy render - isPremiumBlurred:", isPremiumBlurred, 
    "isOfficialContent:", isOfficialContent, 
    "hasSubscription:", hasSubscription,
    "card.is_official:", currentCard?.is_official,
    "isUserCard:", isUserCard,
    "localStorage.forceSubscription:", localStorage.getItem('forceSubscription'));

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
          <Tooltip text={showMastered ? "Hide mastered cards" : "Show all cards"} position="top">
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
          <Tooltip text="Shuffle cards" position="top">
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
                <div className="premium-content-placeholder mt-6">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-6 rounded-lg">
                    <div className="flex flex-col items-center gap-4">
                      <Lock className="h-12 w-12 text-orange-500 dark:text-orange-400" />
                      <h2 className="text-2xl font-semibold text-orange-800 dark:text-orange-300">Premium Flashcard</h2>
                      <p className="text-orange-700 dark:text-orange-300 max-w-md mx-auto">
                        The answer is only available to premium subscribers.
                      </p>
                      <div className="mt-2">
                        <button
                          onClick={() => setShowPaywall(true)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          Upgrade to Premium
                        </button>
                      </div>
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
    </div>
  );
} 