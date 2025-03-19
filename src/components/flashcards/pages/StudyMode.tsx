import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Rotate3D as Rotate, BookOpen, Shuffle, Check, Edit, EyeOff, Eye, FileEdit, FolderCog, ChevronLeft, Settings, PlusCircle, FileText, Lock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import useFlashcardAuth from '@/hooks/useFlashcardAuth';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import Toast from '../Toast';
import useToast from '@/hooks/useFlashcardToast';
import Tooltip from '../Tooltip';
import { hasActiveSubscription } from '@/lib/subscription';
import { FlashcardPaywall } from '@/components/FlashcardPaywall';
import { useAuth } from '@/lib/auth';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  is_mastered: boolean;
  created_by: string;
}

interface FlashcardCollection {
  id: string;
  title: string;
  description: string;
  subject: {
    name: string;
    id: string;
  };
}

export default function StudyMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [collection, setCollection] = useState<FlashcardCollection | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMastered, setShowMastered] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isOfficialContent, setIsOfficialContent] = useState(false);
  const [nonExistentCollection, setNonExistentCollection] = useState(false);
  
  // Extract the type parameter from URL (subject or collection)
  const location = window.location;
  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get('type') || 'collection';
  const isSubjectMode = type === 'subject';

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("StudyMode: Starting to load data...");
        setLoading(true);
        
        // Check if the ID is a valid UUID format (unless it's 'official')
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (id !== 'official' && !uuidRegex.test(id || '')) {
          console.error(`StudyMode: Invalid ${isSubjectMode ? 'subject' : 'collection'} ID format: ${id}`);
          setNonExistentCollection(true);
          throw new Error(`Invalid ${isSubjectMode ? 'subject' : 'collection'} ID format: ${id}`);
        }
        
        // Also reject placeholder IDs that should be handled in AllFlashcards
        if (id && id.startsWith('00000000-0000-0000-0000-')) {
          console.error(`StudyMode: Placeholder ${isSubjectMode ? 'subject' : 'collection'} ID used directly: ${id}`);
          setNonExistentCollection(true);
          throw new Error(`Placeholder ${isSubjectMode ? 'subject' : 'collection'} IDs should not be accessed directly`);
        }
        
        // Check subscription status
        if (user) {
          console.log("StudyMode: User is logged in, checking subscription status...");
          try {
            const hasAccess = await hasActiveSubscription(user.id);
            console.log("StudyMode: User subscription status:", hasAccess);
            setHasSubscription(hasAccess);
          } catch (subscriptionError) {
            console.error("StudyMode: Error checking subscription:", subscriptionError);
            // Default to allowing access if there's an error with subscription check
            setHasSubscription(true);
          }
        } else {
          console.log("StudyMode: No user logged in, setting hasSubscription to false");
          setHasSubscription(false);
        }
        
        // Load data based on type (subject or collection)
        console.log(`StudyMode: Loading ${isSubjectMode ? 'subject' : 'collection'} mode with ID:`, id);
        
        // Special handling for official premium cards
        if (id === 'official') {
          console.log("StudyMode: Loading official premium flashcards");
          
          // Load official flashcards
          const { data: flashcardsData, error: flashcardsError } = await supabase
            .from('flashcards')
            .select(`
              id, 
              question, 
              answer, 
              is_official
            `)
            .eq('is_official', true)
            .order('created_at', { ascending: false })
            .limit(200);
            
          if (flashcardsError) {
            console.error("StudyMode: Error loading official flashcards:", flashcardsError);
            throw flashcardsError;
          }
          
          // Create a virtual collection for official cards
          const officialCollection = {
            id: 'official',
            title: 'Premium Flashcards',
            description: 'Study premium flashcards from our curated collection.'
          };
          
          setCollection(officialCollection);
          
          // Add mastered status to flashcards if available
          if (user && flashcardsData?.length > 0) {
            const { data: progress, error: progressError } = await supabase
              .from('flashcard_progress')
              .select('flashcard_id, is_mastered')
              .eq('user_id', user.id)
              .in('flashcard_id', flashcardsData.map(c => c.id));
              
            if (!progressError && progress) {
              const masteryMap = new Map();
              progress.forEach(p => masteryMap.set(p.flashcard_id, p.is_mastered));
              
              setCards(flashcardsData.map(card => ({
                ...card,
                is_mastered: masteryMap.has(card.id) ? masteryMap.get(card.id) : false
              })));
            } else {
              setCards(flashcardsData.map(card => ({
                ...card,
                is_mastered: false
              })));
            }
          } else {
            setCards(flashcardsData?.map(card => ({
              ...card,
              is_mastered: false
            })) || []);
          }
          
        } else if (isSubjectMode) {
          // Handle subject mode - load subject data first
          try {
            const { data: subjectData, error: subjectError } = await supabase
              .from('subjects')
              .select('*')
              .eq('id', id);
            
            if (subjectError) {
              console.error("StudyMode: Error loading subject:", subjectError);
              throw subjectError;
            }
            
            if (!subjectData || subjectData.length === 0) {
              console.error(`StudyMode: No subject found with ID: ${id}`);
              setNonExistentCollection(true);
              throw new Error(`Subject not found: ${id}`);
            }
            
            // Create a virtual collection from the subject
            const subjectBasedCollection = {
              id: subjectData[0].id,
              title: `${subjectData[0].name} Flashcards`,
              description: `Study flashcards related to ${subjectData[0].name}`,
              subject: subjectData[0]
            };
            
            console.log("StudyMode: Created virtual collection from subject:", subjectBasedCollection);
            setCollection(subjectBasedCollection);
            
            // Load flashcards for this subject using the subject_flashcards junction
            const { data: flashcardsJunction, error: junctionError } = await supabase
              .from('flashcard_subjects')
              .select(`
                flashcard_id,
                flashcards:flashcard_id (
                  id, 
                  question, 
                  answer, 
                  is_official, 
                  created_by
                )
              `)
              .eq('subject_id', id);
              
            if (junctionError) {
              console.error("StudyMode: Error loading subject flashcards:", junctionError);
              throw junctionError;
            }
            
            // Extract flashcards from junction data
            const extractedFlashcards = flashcardsJunction
              ?.map(item => item.flashcards)
              .filter(Boolean) || [];
              
            console.log(`StudyMode: Loaded ${extractedFlashcards.length} flashcards for subject`);
            
            // Add mastery status if user is logged in
            if (user && extractedFlashcards.length > 0) {
              const flashcardIds = extractedFlashcards.map(card => card.id);
              
              const { data: progress, error: progressError } = await supabase
                .from('flashcard_progress')
                .select('flashcard_id, is_mastered')
                .eq('user_id', user.id)
                .in('flashcard_id', flashcardIds);
                
              if (!progressError && progress) {
                const masteryMap = new Map();
                progress.forEach(p => masteryMap.set(p.flashcard_id, p.is_mastered));
                
                setCards(extractedFlashcards.map(card => ({
                  ...card,
                  is_mastered: masteryMap.has(card.id) ? masteryMap.get(card.id) : false
                })));
              } else {
                setCards(extractedFlashcards.map(card => ({
                  ...card,
                  is_mastered: false
                })));
              }
            } else {
              setCards(extractedFlashcards.map(card => ({
                ...card,
                is_mastered: false
              })));
            }
            
            // Check for premium content
            const hasPremiumContent = extractedFlashcards.some(card => card.is_official === true);
            setIsOfficialContent(hasPremiumContent);
            
            if (hasPremiumContent === true && hasSubscription === false) {
              // Some content is premium and user is not subscribed
              console.log("StudyMode: Subject contains premium content, but continuing with restrictions");
            }
          } catch (err) {
            console.error("StudyMode: Error loading subject data:", err);
            throw err;
          }
        } else {
          // First, get the collection itself
          try {
            const { data: collectionData, error: collectionError } = await supabase
              .from('collections')
              .select('*')
              .eq('id', id);
            
            if (collectionError) {
              console.error("StudyMode: Error loading collection:", collectionError);
              throw collectionError;
            }
            
            if (!collectionData || collectionData.length === 0) {
              console.error(`StudyMode: No collection found with ID: ${id}`);
              setNonExistentCollection(true);
              throw new Error(`Collection not found: ${id}`);
            }
            
            // Use the first result since we're querying by primary key (should only be one)
            if (collectionData && collectionData.length > 0) {
              // Store collection data locally for immediate use
              const loadedCollection = collectionData[0];
              console.log("StudyMode: Loaded collection:", loadedCollection);
              
              // Set the state for future renders
              setCollection(loadedCollection);
              
              // Then get the subject information from the collection_subjects junction table
              let subjectData = null;
              try {
                const { data, error } = await supabase
                  .from('collection_subjects')
                  .select(`
                    subject_id,
                    subjects:subject_id(id, name)
                  `)
                  .eq('collection_id', id);
                
                if (error) {
                  console.error("StudyMode: Error loading subjects:", error);
                } else if (data && data.length > 0) {
                  // Just use the first subject if there are multiple
                  subjectData = data[0];
                  console.log("StudyMode: Loaded subject for collection:", data[0]);
                } else {
                  console.log("StudyMode: No subjects found for this collection");
                }
              } catch (err) {
                console.error("StudyMode: Error in subject query:", err);
                // Continue without subject data
              }
              
              // Combine the data - using our local variable, not the state
              const completeCollectionData = {
                ...loadedCollection,
                subject: subjectData?.subjects || { id: '', name: 'No Subject' }
              };
              
              console.log("StudyMode: Collection data loaded successfully");
              // Now update the state with the complete data
              setCollection(completeCollectionData);
              
              // Check if this is premium content
              const isOfficial = loadedCollection.is_official || false;
              console.log("StudyMode: Collection is_official:", isOfficial);
              setIsOfficialContent(isOfficial);
              
              // If access to premium content is denied, show paywall
              if (isOfficial === true && hasSubscription === false) {
                // Access is denied to premium content
                console.log("StudyMode: Access denied to premium content, showing paywall");
                setShowPaywall(true);
              }
              
              // No longer automatically show paywall for official content
              // Users will be able to see the content with restrictions at the flashcard level
              console.log("StudyMode: Not showing paywall for premium collection as per requirement");
              
              // Load flashcards
              console.log("StudyMode: Loading flashcards for collection ID:", id);
              
              // Fetch the flashcards that belong to this collection through the junction table
              // First get all flashcard IDs associated with this collection
              console.log(`StudyMode: Querying flashcard_collections_junction for collection_id: ${loadedCollection.id}`);
              const { data: junctionData, error: junctionError } = await supabase
                .from('flashcard_collections_junction')
                .select('flashcard_id, collection_id')
                .eq('collection_id', loadedCollection.id);
                
              if (junctionError) {
                console.error("StudyMode: Error loading collection-flashcard junctions:", junctionError);
                throw junctionError;
              }
              
              if (!junctionData || junctionData.length === 0) {
                console.log("StudyMode: No flashcards associated with this collection in junction table");
                setCards([]);
                setLoading(false);
                return;
              }
              
              // Extract the flashcard IDs
              const flashcardIds = junctionData.map(item => item.flashcard_id);
              console.log(`StudyMode: Found ${flashcardIds.length} flashcard IDs in junction table:`, flashcardIds);
              
              // Now fetch the actual flashcards
              const { data: flashcardsData, error: flashcardsError } = await supabase
                .from('flashcards')
                .select('id, question, answer, is_official, created_by')
                .in('id', flashcardIds)
                .order('created_at', { ascending: false });
                
              if (flashcardsError) {
                console.error("StudyMode: Error loading flashcards:", flashcardsError);
                throw flashcardsError;
              }
              
              console.log(`StudyMode: Loaded ${flashcardsData?.length || 0} flashcards`);
              
              // If no cards, show empty state
              if (!flashcardsData || flashcardsData.length === 0) {
                setCards([]);
                setLoading(false);
                return;
              }
              
              // Add mastery status to flashcards if available
              if (user) {
                // Extract the flashcard IDs
                const flashcardIds = flashcardsData.map(card => card.id);
                
                const { data: progress, error: progressError } = await supabase
                  .from('flashcard_progress')
                  .select('flashcard_id, is_mastered')
                  .eq('user_id', user.id)
                  .in('flashcard_id', flashcardIds);
                  
                if (!progressError && progress) {
                  // Create a map of mastery status
                  const masteryMap = new Map();
                  progress.forEach(p => masteryMap.set(p.flashcard_id, p.is_mastered));
                  
                  // Update the flashcards with mastery status
                  setCards(flashcardsData.map(card => ({
                    ...card,
                    is_mastered: masteryMap.has(card.id) ? masteryMap.get(card.id) : false
                  })));
                } else {
                  setCards(flashcardsData.map(card => ({
                    ...card,
                    is_mastered: false
                  })));
                }
              } else {
                // No user, all cards are not mastered
                setCards(flashcardsData.map(card => ({
                  ...card,
                  is_mastered: false
                })));
              }
            } else {
              console.error(`StudyMode: No valid collection data returned for ID: ${id}`);
              throw new Error(`Collection not found or empty: ${id}`);
            }
          } catch (err) {
            console.error("StudyMode: Error loading collection:", err);
            throw err;
          }
        }
        
      } catch (err: any) {
        console.error('StudyMode: Error loading study data:', err);
        setError(err.message);
      } finally {
        console.log("StudyMode: Finished loading data, setting loading to false");
        setLoading(false);
      }
    };
    
    console.log("StudyMode: Running effect to load data");
    loadData();
  }, [id, user, showMastered]);

  // Recheck subscription status periodically
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (user) {
        try {
          console.log("StudyMode: Rechecking subscription status");
          const hasAccess = await hasActiveSubscription(user.id);
          console.log("StudyMode: Updated subscription status:", hasAccess);
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

  const shuffleCards = () => {
    const shuffled = [...cards]
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
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
    console.log("markAsMastered function called");
    if (!user) {
      showToast('Please sign in to mark cards as mastered', 'error');
      return;
    }
    
    if (cards.length === 0 || currentIndex >= cards.length) {
      console.log("No cards available to mark as mastered");
      return;
    }
    
    const currentCard = cards[currentIndex];
    
    if (currentCard.is_mastered) {
      console.log("Card is already mastered");
      return;
    }
    
    console.log("Marking card as mastered:", currentCard.id);
    
    try {
      // Update Supabase
      const { error } = await supabase
        .from('flashcards')
        .update({ is_mastered: true })
        .eq('id', currentCard.id);

      if (error) {
        console.error("Error updating card in Supabase:", error);
        throw error;
      }
      
      console.log("Card successfully marked as mastered in Supabase");
      
      // Show toast notification
      showToast('Card marked as mastered', 'success');
      
      // Update local state
      console.log("Updating local state. Show mastered:", showMastered);
      
      if (!showMastered) {
        // If not showing mastered cards, remove it from the list
        const newCards = cards.filter((_, i) => i !== currentIndex);
        console.log("Removing card from list, new card count:", newCards.length);
        setCards(newCards);
        
        // Adjust current index if needed
        if (currentIndex >= newCards.length) {
          console.log("Adjusting current index from", currentIndex, "to", Math.max(0, newCards.length - 1));
          setCurrentIndex(Math.max(0, newCards.length - 1));
        }
      } else {
        // Just update the card in the array
        const newCards = [...cards];
        newCards[currentIndex] = { ...currentCard, is_mastered: true };
        console.log("Updating card in list");
        setCards(newCards);
      }
    } catch (err) {
      console.error("Error in markAsMastered:", err);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const unmarkAsMastered = async () => {
    console.log("unmarkAsMastered function called");
    if (!user) {
      showToast('Please sign in to change card status', 'error');
      return;
    }
    
    if (cards.length === 0 || currentIndex >= cards.length) {
      console.log("No cards available to update");
      return;
    }
    
    const currentCard = cards[currentIndex];
    
    if (!currentCard.is_mastered) {
      console.log("Card is not mastered, cannot unmark");
      return;
    }
    
    console.log("Unmarking card as mastered:", currentCard.id);
    
    try {
      // Update Supabase
      const { error } = await supabase
        .from('flashcards')
        .update({ is_mastered: false })
        .eq('id', currentCard.id);

      if (error) {
        console.error("Error updating card in Supabase:", error);
        throw error;
      }
      
      console.log("Card successfully unmarked as mastered in Supabase");
      
      // Show toast notification
      showToast('Card unmarked as mastered', 'success');
      
      // Update local state
      const newCards = [...cards];
      newCards[currentIndex] = { ...currentCard, is_mastered: false };
      console.log("Updating card in list");
      setCards(newCards);
    } catch (err) {
      console.error("Error in unmarkAsMastered:", err);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleShowPaywall = () => {
    setShowPaywall(true);
  };
  
  const handleClosePaywall = () => {
    setShowPaywall(false);
    navigate('/flashcards/collections');
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading flashcards...</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a moment</p>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {nonExistentCollection 
              ? isSubjectMode ? 'Subject Not Found' : 'Collection Not Found' 
              : error ? 'Error' : isSubjectMode ? 'Subject Not Found' : 'Collection Not Found'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {nonExistentCollection 
              ? isSubjectMode
                ? 'The subject you are looking for does not exist or has been deleted.'
                : 'The collection you are looking for does not exist or has been deleted.'
              : error || (isSubjectMode ? 'Unable to load the subject. It may have been deleted.' : 'Unable to load the collection. It may have been deleted.')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={isSubjectMode ? "/flashcards/subjects" : "/flashcards/collections"}
              className="bg-[#F37022] text-white px-4 py-2 rounded-md hover:bg-[#E36012]"
            >
              {isSubjectMode ? 'Return to Subjects' : 'Return to Collections'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/flashcards/collections" className="text-[#F37022] hover:text-[#E36012] flex items-center mb-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1">Back to Collections</span>
          </Link>
          <div className="flex items-center gap-2 mt-4 mb-2">
            <BookOpen className="h-5 w-5 text-[#F37022]" />
            <span className="text-sm font-medium text-[#F37022]">{collection.subject.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{collection.title}</h1>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {showMastered 
              ? 'No flashcards in this collection yet' 
              : 'All cards mastered!'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {showMastered 
              ? 'Add some cards to start studying' 
              : 'You have mastered all the cards in this collection.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!showMastered && (
              <button
                onClick={() => setShowMastered(true)}
                className="bg-[#F37022] text-white px-4 py-2 rounded-md hover:bg-[#E36012]"
              >
                Show Mastered Cards
              </button>
            )}
            
            {user ? (
              id === 'official' ? (
                // Don't show "Add More Cards" for official premium flashcards
                <button 
                  onClick={shuffleCards}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Shuffle Cards
                </button>
              ) : (
              <Link
                to={`/flashcards/add-card/${id}`}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Add More Cards
              </Link>
              )
            ) : (
              <Link
                to="/auth"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Sign In to Add Cards
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  
  // Determine if the current card should be premium blurred:
  // 1. Card is official/premium
  // 2. User doesn't have subscription
  // 3. Card was NOT created by the current user (user-created cards should always be visible to that user)
  const isUserCard = currentCard && user && currentCard.created_by === user.id;
  console.log("StudyMode render - isUserCard:", isUserCard, "userID:", user?.id, "cardCreatedBy:", currentCard?.created_by);
  
  const isPremiumBlurred = currentCard && currentCard.is_official === true && hasSubscription === false && !isUserCard;
  
  console.log("StudyMode render - isPremiumBlurred:", isPremiumBlurred, 
    "isOfficialContent:", isOfficialContent, 
    "hasSubscription:", hasSubscription,
    "card.is_official:", currentCard?.is_official,
    "isUserCard:", isUserCard,
    "localStorage.forceSubscription:", localStorage.getItem('forceSubscription'));

  return (
    <div className="max-w-3xl mx-auto">
      {/* Toast notification */}
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
          <Link to="/flashcards/collections" className="text-[#F37022] hover:text-[#E36012] flex items-center mb-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1">Back to Collections</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white hover:text-[#F37022] dark:hover:text-[#F37022] transition-colors">
            {id === 'official' ? 'Premium Flashcards' : collection.title}
          </h1>
          {(id === 'official' || collection.description) && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {id === 'official' 
                ? 'Study premium flashcards from our curated collection'
                : collection.description}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'} • 
            {currentIndex + 1} of {cards.length}
          </p>
        </div>
        
        <div className="text-right">
          {id !== 'official' && collection.subject?.id && (
          <Link to={`/flashcards/subjects/${collection.subject.id}`} className="text-[#F37022] font-medium mb-2 hover:underline block">
              Subject: {collection.subject.name}
          </Link>
          )}
          
          <div className="flex items-center gap-3 justify-end">
            {user && (
              <Tooltip text="Edit Collection" position="top">
                <Link 
                  to={`/flashcards/edit/${id}`} 
                  className="text-gray-600 dark:text-gray-400 hover:text-[#F37022] dark:hover:text-[#F37022]"
                >
                  <FolderCog className="h-5 w-5" />
                </Link>
              </Tooltip>
            )}
            {user && (
              <Tooltip text="Edit Cards" position="top">
                <Link 
                  to={`/flashcards/manage-cards/${id}`} 
                  className="text-gray-600 dark:text-gray-400 hover:text-[#F37022] dark:hover:text-[#F37022]"
                >
                  <FileEdit className="h-5 w-5" />
                </Link>
              </Tooltip>
            )}
            <Tooltip text={showMastered ? "Hide mastered cards" : "Show all cards"} position="top">
              <button
                onClick={() => {
                  console.log("Toggling showMastered from", showMastered, "to", !showMastered);
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
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden relative" style={{ isolation: 'isolate' }}>
        {isPremiumBlurred && (
          <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-5 font-bold">
            PREMIUM CONTENT - SUBSCRIPTION REQUIRED
          </div>
        )}
        
        <div className="p-8 flex flex-col">
          <div
            className="min-h-[250px] flex items-center justify-center cursor-pointer"
            onClick={toggleAnswer}
            style={{ zIndex: 5 }}
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
                      {!hasSubscription && (
                        <Link 
                          to="/pricing" 
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Upgrade Now
                        </Link>
                      )}
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
              disabled={false}
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

          <div className="flex items-center gap-3" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 50 }}>
            {!currentCard.is_mastered && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Mark Mastered button clicked");
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
                  console.log("Undo Mastered button clicked");
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