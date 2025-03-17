import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, EyeOff, Eye, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import useAuth from '@/hooks/useFlashcardAuth';
import useToast from '@/hooks/useFlashcardToast';
import LoadingSpinner from '../LoadingSpinner';
import Toast from '../Toast';
import EmptyState from '../EmptyState';
import DeleteConfirmation from '../DeleteConfirmation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hasActiveSubscription } from '@/lib/subscription';
import { FlashcardPaywall } from '../../FlashcardPaywall';
import EnhancedFlashcardItem from '../EnhancedFlashcardItem';

// Types
interface Subject {
  id: string;
  name: string;
}

interface Collection {
  id: string;
  title: string;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  is_mastered?: boolean;
  created_by?: string;
  collection?: {
    id: string;
    title: string;
    is_official: boolean;
    user_id: string;
    subject?: {
      name: string;
      id: string;
    }
  };
}

export default function AllFlashcards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Core state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  
  // UI state
  const [filter, setFilter] = useState<'all' | 'official' | 'my'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterCollection, setFilterCollection] = useState('all');
  const [showMastered, setShowMastered] = useState(true);
  const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Initialize filter from URL params
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && ['all', 'official', 'my'].includes(filterParam)) {
      setFilter(filterParam as 'all' | 'official' | 'my');
    }
    
    // Load subjects and collections for filters
    loadSubjects();
    loadCollections();
    
    // Check subscription status
    checkSubscription();
  }, []);

  // Load data when filter changes
  useEffect(() => {
    if (user) {
      loadFlashcards();
    }
  }, [filter, user]);

  // Check subscription status
  const checkSubscription = async () => {
    if (user) {
      try {
        const hasAccess = await hasActiveSubscription(user.id);
        setHasSubscription(hasAccess);
        console.log("Subscription status:", hasAccess);
        
        // Also debug the flashcard-collection junction table
        try {
          const { data: junctionData, error: junctionError } = await supabase
            .from('flashcard_collections_junction')
            .select('*')
            .limit(10);
            
          if (junctionError) {
            console.error("Error fetching from junction table:", junctionError);
          } else {
            console.log("Sample from junction table:", junctionData);
          }
          
          // Check if any flashcards have direct is_official=true
          const { data: officialData, error: officialError } = await supabase
            .from('flashcards')
            .select('id, question')
            .eq('is_official', true)
            .limit(10);
            
          if (officialError) {
            console.error("Error checking official flashcards:", officialError);
          } else {
            console.log("Sample official flashcards by is_official=true:", officialData);
          }
          
        } catch (e) {
          console.error("Error in debug queries:", e);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasSubscription(false);
      }
    } else {
      setHasSubscription(false);
    }
  };

  // Load subjects for filter dropdown
  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setSubjects(data || []);
    } catch (err: any) {
      console.error("Error loading subjects:", err.message);
    }
  };

  // Load collections for filter dropdown
  const loadCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('id, title')
        .order('title');
      
      if (error) throw error;
      setCollections(data || []);
    } catch (err: any) {
      console.error("Error loading collections:", err.message);
    }
  };

  // Main function to load flashcards based on current filter
  const loadFlashcards = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let flashcardsData: Flashcard[] = [];
      
      if (filter === 'all') {
        // Get all flashcards with their collections
        const { data, error } = await supabase
          .from('flashcards')
          .select('*, collection:collections(*)')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        flashcardsData = data || [];
        console.log(`Loaded ${flashcardsData.length} total flashcards`);
      } 
      else if (filter === 'official') {
        console.log("Loading official flashcards...");
        
        // Simply get flashcards that have is_official=true directly
        const { data, error } = await supabase
          .from('flashcards')
          .select('*, collection:collections(*)')
          .eq('is_official', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching official flashcards:", error);
          throw error;
        }
        
        flashcardsData = data || [];
        console.log(`Loaded ${flashcardsData.length} official flashcards`);
      } 
      else if (filter === 'my') {
        // Get flashcards created by the user
        const { data, error } = await supabase
          .from('flashcards')
          .select('*, collection:collections(*)')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        flashcardsData = data || [];
        console.log(`Loaded ${flashcardsData.length} user-created flashcards`);
      }
      
      // Load mastery status for these cards
      if (flashcardsData.length > 0) {
        const { data: progress, error: progressError } = await supabase
          .from('flashcard_progress')
          .select('flashcard_id, is_mastered')
          .eq('user_id', user.id)
          .in('flashcard_id', flashcardsData.map(c => c.id));
        
        if (!progressError && progress) {
          // Create a map of mastery status
          const masteryMap = new Map();
          progress.forEach(p => masteryMap.set(p.flashcard_id, p.is_mastered));
          
          // Update flashcards with mastery status
          flashcardsData = flashcardsData.map(card => ({
            ...card,
            is_mastered: masteryMap.has(card.id) ? masteryMap.get(card.id) : false
          }));
        }
      }
      
      setFlashcards(flashcardsData);
    } catch (err: any) {
      console.error(`Error loading ${filter} flashcards:`, err.message);
      setError(`Failed to load flashcards: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handler for toggling mastery status
  const toggleMastered = async (card: Flashcard) => {
    if (!user) return;
    
    const newStatus = !card.is_mastered;
    
    // Update state optimistically
    setFlashcards(cards => 
      cards.map(c => c.id === card.id ? {...c, is_mastered: newStatus} : c)
    );
    
    try {
      // Update in database
      const { error } = await supabase
        .from('flashcard_progress')
        .upsert({
          flashcard_id: card.id,
          user_id: user.id,
          is_mastered: newStatus,
          last_reviewed: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (err: any) {
      // Revert optimistic update on error
      setFlashcards(cards => 
        cards.map(c => c.id === card.id ? {...c, is_mastered: !newStatus} : c)
      );
      
      showToast('Failed to update mastery status', 'error');
      console.error('Error updating mastery status:', err.message);
    }
  };

  // Handler for editing a card
  const handleEditCard = (card: Flashcard) => {
    navigate(`/flashcards/edit-card/${card.id}`);
  };

  // Handler for viewing/studying a card
  const handleViewCard = (card: Flashcard) => {
    if (card.collection?.id) {
      navigate(`/flashcards/study/${card.collection.id}`);
    } else {
      showToast('Cannot study this card - no collection found', 'error');
    }
  };

  // Delete a card
  const deleteCard = async () => {
    if (!cardToDelete) return;
    
    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardToDelete.id);
      
      if (error) throw error;
      
      // Update local state
      setFlashcards(cards => cards.filter(c => c.id !== cardToDelete.id));
      showToast('Card deleted successfully', 'success');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setCardToDelete(null);
    }
  };

  // Handle tab filter change
  const handleFilterChange = (value: string) => {
    const newFilter = value as 'all' | 'official' | 'my';
    
    // Don't do anything if we're already on this tab
    if (filter === newFilter) return;
    
    // Update filter and URL
    setFilter(newFilter);
    searchParams.set('filter', newFilter);
    setSearchParams(searchParams);
    
    // Clear cards and show loading
    setFlashcards([]);
    setLoading(true);
  };

  // Handle paywall
  const handleShowPaywall = () => setShowPaywall(true);
  const handleClosePaywall = () => setShowPaywall(false);
  
  // Toggle mastered filter
  const handleToggleMastered = () => setShowMastered(!showMastered);

  // Apply filters to cards
  const filteredCards = useMemo(() => {
    if (!flashcards.length) return [];
    
    return flashcards.filter(card => {
      // Skip mastered cards if filter is enabled
      if (!showMastered && card.is_mastered) return false;
      
      // Subject filter
      if (filterSubject !== 'all' && card.collection?.subject?.id !== filterSubject) {
        return false;
      }
      
      // Collection filter
      if (filterCollection !== 'all' && card.collection?.id !== filterCollection) {
        return false;
      }
      
      return true;
    });
  }, [flashcards, showMastered, filterSubject, filterCollection]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {cardToDelete && (
        <DeleteConfirmation
          isOpen={!!cardToDelete}
          onClose={() => setCardToDelete(null)}
          onConfirm={deleteCard}
          title="Delete Flashcard"
          message="Are you sure you want to delete this flashcard? This action cannot be undone."
          itemName={cardToDelete?.question}
        />
      )}
      
      {/* Paywall Modal */}
      {showPaywall && (
        <FlashcardPaywall onCancel={handleClosePaywall} />
      )}
      
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
              <p className="text-gray-600 dark:text-gray-400 flashcard-count">
                {filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'} {!showMastered ? 'to study' : ''}
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-3 ml-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Filter className="h-5 w-5" />
                Filters
              </button>
              
              <button
                onClick={handleToggleMastered}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                aria-label={showMastered ? "Hide mastered cards" : "Show all cards"}
              >
                {showMastered ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                {showMastered ? "Hide Mastered" : "Show All"}
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div>
            <Tabs value={filter} onValueChange={handleFilterChange}>
              <TabsList className="grid grid-cols-3" style={{ backgroundColor: 'var(--background)' }}>
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="official"
                  className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white"
                >
                  Premium
                </TabsTrigger>
                <TabsTrigger 
                  value="my"
                  className="data-[state=active]:bg-[#F37022] data-[state=active]:text-white"
                >
                  My Cards
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 dark:border dark:border-gray-700">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Subject
                </label>
                <select
                  id="subject-filter"
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="collection-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Collection
                </label>
                <select
                  id="collection-filter"
                  value={filterCollection}
                  onChange={(e) => setFilterCollection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md focus:outline-none focus:ring-[#F37022] focus:border-[#F37022]"
                >
                  <option value="all">All Collections</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              {filter === 'my' ? (
                <EmptyState 
                  icon={<FileText size={48} />}
                  title="No Flashcards Found" 
                  description="You haven't created any flashcards yet or they're being filtered out. Try creating your first flashcard or checking your filter settings."
                  actionText="Create a Flashcard"
                  actionLink="/flashcards/create-flashcard-select"
                />
              ) : filter === 'official' ? (
                <EmptyState 
                  icon={<FileText size={48} />}
                  title="No Premium Flashcards Found" 
                  description="There are no premium flashcards matching your current filters."
                  actionText={!hasSubscription ? "Get Premium Access" : "Explore All Flashcards"}
                  actionLink={!hasSubscription ? undefined : "/flashcards/flashcards?filter=all"}
                  onActionClick={!hasSubscription ? handleShowPaywall : undefined}
                />
              ) : (
                <EmptyState 
                  icon={<FileText size={48} />}
                  title="No Flashcards Found" 
                  description="No flashcards match your current filters. Try adjusting your filter settings."
                  actionText="Create a Flashcard"
                  actionLink="/flashcards/create-flashcard-select"
                />
              )}
            </div>
          ) : (
            <>
              {filteredCards.map((card) => {
                // Check if this card is a premium/official card (official = premium)
                const isPremium = card.is_official === true;
                
                // Determine if the user can edit/delete this card
                // Only allow editing/deleting if:
                // 1. It's not a premium card (premium cards can never be edited)
                // 2. It's the user's own card
                const isUserOwned = user && (card.created_by === user.id);
                
                const canModify = !isPremium && isUserOwned;
                
                return (
                  <EnhancedFlashcardItem
                    key={`${filter}-${card.id}`}
                    flashcard={card}
                    onToggleMastered={toggleMastered}
                    onEdit={canModify ? handleEditCard : undefined}
                    onDelete={canModify ? setCardToDelete : undefined}
                    onView={handleViewCard}
                    isPremium={isPremium}
                    hasSubscription={hasSubscription}
                    onShowPaywall={handleShowPaywall}
                  />
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 