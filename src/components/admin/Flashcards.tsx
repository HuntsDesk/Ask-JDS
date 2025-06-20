import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Sparkles, FileEdit, Trash2, Check, X, AlertCircle, Download, MoveRight, RefreshCw } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CreateFlashcard from './CreateFlashcard';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  is_official: boolean;
  created_at: string;
  created_by?: string;
  is_mastered?: boolean;
  difficulty_level?: string;
  is_common_pitfall?: boolean;
  is_public_sample?: boolean;
  subjects?: {
    id: string;
    name: string;
  }[];
  collections?: {
    id: string;
    title: string;
  }[];
  flashcard_collections_junction?: any[];
  flashcard_subjects?: any[];
}

interface Subject {
  id: string;
  name: string;
  is_official: boolean;
}

interface Collection {
  id: string;
  title: string;
  is_official: boolean;
}

interface FlashcardStats {
  total: number;
  official: number;
  user: number;
  pitfalls: number;
  samples: number;
}

export const AdminFlashcards = () => {
  const { toast } = useToast();
  
  // State for data
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>([]);
  
  // State for editing
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    is_official: false,
    difficulty_level: '',
    is_common_pitfall: false,
    is_public_sample: false
  });
  
  // Loading and error states
  const [loading, setLoading] = useState({
    flashcards: true,
    subjects: true,
    collections: true,
    edit: false
  });
  const [error, setError] = useState({
    flashcards: null as string | null,
    subjects: null as string | null,
    collections: null as string | null,
    edit: null as string | null
  });
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'official', 'user'
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showPitfalls, setShowPitfalls] = useState<boolean | undefined>(undefined);
  const [showSamples, setShowSamples] = useState<boolean | undefined>(undefined);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const cardsPerPage = 25;
  
  // Stats
  const [stats, setStats] = useState<FlashcardStats>({
    total: 0,
    official: 0,
    user: 0,
    pitfalls: 0,
    samples: 0
  });

  // Add state for delete confirmation
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [
    searchQuery, 
    selectedCollection, 
    selectedSubject, 
    selectedDifficulty,
    showPitfalls,
    showSamples,
    currentPage,
    filterType
  ]);

  const loadData = async () => {
    try {
      logger.debug('Loading flashcard data...');
      setLoading(prev => ({ ...prev, flashcards: true }));
      setError(prev => ({ ...prev, flashcards: null }));
      
      // Load collections and subjects (only once)
      if (collections.length === 0) {
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('collections')
          .select('id, title, is_official')
          .order('title');

        if (collectionsError) throw collectionsError;
        setCollections(collectionsData || []);
        setLoading(prev => ({ ...prev, collections: false }));
        logger.debug('Loaded collections:', collectionsData?.length || 0);
      } else {
        setLoading(prev => ({ ...prev, collections: false }));
      }
      
      if (subjects.length === 0) {
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name, is_official')
          .order('name');
          
        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);
        setLoading(prev => ({ ...prev, subjects: false }));
        logger.debug('Loaded subjects:', subjectsData?.length || 0);
      } else {
        setLoading(prev => ({ ...prev, subjects: false }));
      }
      
      // Build query for flashcards
      let query = supabase
        .from('flashcards')
        .select(`
          id, 
          question, 
          answer, 
          is_official, 
          is_common_pitfall, 
          is_public_sample, 
          difficulty_level,
          created_at,
          flashcard_collections_junction (
            collection:collections(id, title)
          ),
          flashcard_subjects (
            subject:subjects(id, name)
          )
        `);
      
      // Apply filters
      
      // Type filters (official, user)
      if (filterType === 'official') {
        query = query.eq('is_official', true);
      } else if (filterType === 'user') {
        query = query.eq('is_official', false);
      }
      
      // Pitfalls filter
      if (showPitfalls !== undefined) {
        query = query.eq('is_common_pitfall', true);
      }
      
      // Samples filter
      if (showSamples !== undefined) {
        query = query.eq('is_public_sample', true);
      }
      
      // Collection filter (needs separate handling for junction tables)
      if (selectedCollection) {
        // We'll handle this post-query filtering
      }
      
      // Subject filter (needs separate handling for junction tables)
      if (selectedSubject) {
        // We'll handle this post-query filtering
      }
      
      // Difficulty filter
      if (selectedDifficulty) {
        query = query.eq('difficulty_level', selectedDifficulty);
      }
      
      // Search query
      if (searchQuery) {
        query = query.or(`question.ilike.%${searchQuery}%,answer.ilike.%${searchQuery}%`);
      }
      
      // Get paginated results first before counting
      const from = (currentPage - 1) * cardsPerPage;
      const to = from + cardsPerPage - 1;
      
      logger.debug('Fetching flashcards with pagination:', { from, to });
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      logger.debug('Received flashcards data:', data?.length || 0);
      
      // Process results
      const processedFlashcards = [];
      
      if (data && data.length > 0) {
        for (const flashcard of data) {
          try {
            // Extract collections and subjects from nested structure with safety checks
            const collections = (flashcard.flashcard_collections_junction || [])
              .filter(junction => junction && junction.collection)
              .map(junction => junction.collection);
            
            const subjects = (flashcard.flashcard_subjects || [])
              .filter(item => item && item.subject)
              .map(item => item.subject);
            
            // Apply post-query filtering for collections and subjects
            if (selectedCollection && !collections.some(c => c && c.id === selectedCollection)) {
              continue; // Skip this flashcard
            }
            
            if (selectedSubject && !subjects.some(s => s && s.id === selectedSubject)) {
              continue; // Skip this flashcard
            }
            
            // Return restructured flashcard
            processedFlashcards.push({
              id: flashcard.id,
              question: flashcard.question,
              answer: flashcard.answer,
              is_official: flashcard.is_official,
              is_common_pitfall: flashcard.is_common_pitfall,
              is_public_sample: flashcard.is_public_sample,
              difficulty_level: flashcard.difficulty_level,
              created_at: flashcard.created_at,
              collections,
              subjects
            });
          } catch (err) {
            logger.error('Error processing flashcard:', err, flashcard);
          }
        }
      }
      
      logger.debug('Processed flashcards:', processedFlashcards.length);
      
      // Count total
      try {
        const { count, error: countError } = await supabase
          .from('flashcards')
          .select('id', { count: 'exact', head: true });
          
        if (countError) throw countError;
        
        const totalPages = Math.max(1, Math.ceil((count || 0) / cardsPerPage));
        logger.debug('Total pages:', totalPages, 'from count:', count);
        setTotalPages(totalPages);
      } catch (countErr) {
        logger.error('Error counting flashcards:', countErr);
        setTotalPages(1);
      }
      
      // Update state with processed flashcards
      setFlashcards(processedFlashcards);
      setFilteredCards(processedFlashcards);
      
      // Get stats
      try {
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_flashcard_stats');
          
        if (statsError) throw statsError;
        if (statsData) {
          logger.debug('Stats data received');
          setStats(statsData);
        }
      } catch (statsErr) {
        logger.error('Error fetching stats:', statsErr);
      }
      
    } catch (err) {
      logger.error('Error in loadData:', err);
      setError(prev => ({ ...prev, flashcards: err.message }));
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: err.message,
      });
    } finally {
      logger.debug('Finished loading flashcard data');
      setLoading(prev => ({ ...prev, flashcards: false }));
    }
  };

  // Handle edit dialog open
  const handleEditCard = (card: Flashcard) => {
    setSelectedCard(card);
    setEditData({
      is_official: card.is_official,
      difficulty_level: card.difficulty_level || '',
      is_common_pitfall: card.is_common_pitfall || false,
      is_public_sample: card.is_public_sample || false
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle save changes
  const handleSaveChanges = async () => {
    if (!selectedCard) return;
    
    setLoading(prev => ({ ...prev, edit: true }));
    setError(prev => ({ ...prev, edit: null }));
    
    try {
      const { error } = await supabase
        .from('flashcards')
        .update({
          is_official: editData.is_official,
          difficulty_level: editData.difficulty_level || null,
          is_common_pitfall: editData.is_common_pitfall,
          is_public_sample: editData.is_public_sample
        })
        .eq('id', selectedCard.id);
      
      if (error) throw new Error(`Error updating flashcard: ${error.message}`);
      
      // Update local state
      setFlashcards(prev => prev.map(card => 
        card.id === selectedCard.id
          ? { ...card, 
              is_official: editData.is_official,
              difficulty_level: editData.difficulty_level || null,
              is_common_pitfall: editData.is_common_pitfall,
              is_public_sample: editData.is_public_sample
            }
          : card
      ));
      
      // Recalculate stats
      const updatedCards = flashcards.map(card => 
        card.id === selectedCard.id
          ? { ...card, 
              is_official: editData.is_official,
              difficulty_level: editData.difficulty_level || null,
              is_common_pitfall: editData.is_common_pitfall,
              is_public_sample: editData.is_public_sample
            }
          : card
      );
      
      const officialCount = updatedCards.filter(c => c.is_official).length;
      const userCount = updatedCards.filter(c => !c.is_official).length;
      const pitfallsCount = updatedCards.filter(c => c.is_common_pitfall).length;
      const samplesCount = updatedCards.filter(c => c.is_public_sample).length;
      
      setStats({
        total: updatedCards.length,
        official: officialCount,
        user: userCount,
        pitfalls: pitfallsCount,
        samples: samplesCount
      });
      
      toast({
        title: "Flashcard updated",
        description: "The flashcard has been successfully updated.",
        duration: 3000,
      });
      
      setIsEditDialogOpen(false);
    } catch (err: any) {
      logger.error('Error updating flashcard:', err);
      setError(prev => ({ ...prev, edit: err.message }));
      
      toast({
        title: "Error",
        description: `Failed to update flashcard: ${err.message}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(prev => ({ ...prev, edit: false }));
    }
  };
  
  // Handle export to CSV
  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['ID', 'Question', 'Answer', 'Created', 'Creator', 'Official', 'Difficulty', 'Pitfall', 'Sample', 'Subjects', 'Collections'];
    const rows = filteredCards.map(card => [
      card.id,
      `"${card.question.replace(/"/g, '""')}"`, // Escape quotes
      `"${card.answer.replace(/"/g, '""')}"`,
      card.created_at,
      card.created_by,
      card.is_official ? 'Yes' : 'No',
      card.difficulty_level || '',
      card.is_common_pitfall ? 'Yes' : 'No',
      card.is_public_sample ? 'Yes' : 'No',
      card.subjects?.map(s => s.name).join(', ') || '',
      card.collections?.map(c => c.title).join(', ') || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `flashcards-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle delete card
  const handleDeleteCard = (card: Flashcard) => {
    setDeleteCardId(card.id);
    setDeletingCard(card);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteCardId) return;
    
    setDeleteLoading(true);
    
    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', deleteCardId);
      
      if (error) throw new Error(`Error deleting flashcard: ${error.message}`);
      
      // Update local state
      setFlashcards(prev => prev.filter(card => card.id !== deleteCardId));
      
      // Recalculate stats
      const updatedCards = flashcards.filter(card => card.id !== deleteCardId);
      const officialCount = updatedCards.filter(c => c.is_official).length;
      const userCount = updatedCards.filter(c => !c.is_official).length;
      const pitfallsCount = updatedCards.filter(c => c.is_common_pitfall).length;
      const samplesCount = updatedCards.filter(c => c.is_public_sample).length;
      
      setStats({
        total: updatedCards.length,
        official: officialCount,
        user: userCount,
        pitfalls: pitfallsCount,
        samples: samplesCount
      });
      
      toast({
        title: "Flashcard deleted",
        description: "The flashcard has been successfully deleted.",
        duration: 3000,
      });
      
      setIsDeleteDialogOpen(false);
      setDeleteCardId(null);
      setDeletingCard(null);
    } catch (err: any) {
      logger.error('Error deleting flashcard:', err);
      
      toast({
        title: "Error",
        description: `Failed to delete flashcard: ${err.message}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    loadData();
    toast({
      title: "Success",
      description: "Flashcard created successfully",
    });
  };

  // Render loading state
  if (loading.flashcards || loading.subjects || loading.collections) {
    return (
      <AdminLayout title="Flashcard Management">
        <div className="flex flex-col items-center justify-center h-64">
          <LoadingSpinner className="h-12 w-12 mb-4" />
          <p className="text-muted-foreground">Loading flashcard data...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Flashcard Management">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Flashcards
              </CardTitle>
              <span className="h-4 w-4 text-muted-foreground">{stats.total}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Total count
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Official Cards
              </CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.official}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.official / stats.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                User Cards
              </CardTitle>
              <span className="h-4 w-4 text-muted-foreground">{stats.user}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.user}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.user / stats.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Common Pitfalls
              </CardTitle>
              <span className="h-4 w-4 text-muted-foreground">{stats.pitfalls}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pitfalls}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.pitfalls / stats.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Public Samples
              </CardTitle>
              <span className="h-4 w-4 text-muted-foreground">{stats.samples}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.samples}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.samples / stats.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search questions and answers..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleExportCSV}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        
        {/* Filters */}
        {isFiltersOpen && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filterType">Card Type</Label>
                <Select 
                  value={filterType} 
                  onValueChange={setFilterType}
                >
                  <SelectTrigger id="filterType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cards</SelectItem>
                    <SelectItem value="official">Official Only</SelectItem>
                    <SelectItem value="user">User-Generated Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={selectedSubject} 
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Subjects</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} {subject.is_official ? '(Official)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="collection">Collection</Label>
                <Select 
                  value={selectedCollection} 
                  onValueChange={setSelectedCollection}
                >
                  <SelectTrigger id="collection">
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Collections</SelectItem>
                    {collections.map(collection => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.title} {collection.is_official ? '(Official)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={selectedDifficulty} 
                  onValueChange={setSelectedDifficulty}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pitfalls">Common Pitfalls</Label>
                <Select 
                  value={showPitfalls === undefined ? '' : showPitfalls ? 'yes' : 'no'} 
                  onValueChange={(val) => setShowPitfalls(val === '' ? undefined : val === 'yes')}
                >
                  <SelectTrigger id="pitfalls">
                    <SelectValue placeholder="Select filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Cards</SelectItem>
                    <SelectItem value="yes">Pitfalls Only</SelectItem>
                    <SelectItem value="no">Non-Pitfalls Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="samples">Public Samples</Label>
                <Select 
                  value={showSamples === undefined ? '' : showSamples ? 'yes' : 'no'} 
                  onValueChange={(val) => setShowSamples(val === '' ? undefined : val === 'yes')}
                >
                  <SelectTrigger id="samples">
                    <SelectValue placeholder="Select filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Cards</SelectItem>
                    <SelectItem value="yes">Samples Only</SelectItem>
                    <SelectItem value="no">Non-Samples Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterType('all');
                  setSelectedSubject('');
                  setSelectedCollection('');
                  setSelectedDifficulty('');
                  setShowPitfalls(undefined);
                  setShowSamples(undefined);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </Card>
        )}
        
        <Separator />

        {/* Flashcards Table */}
        {error.flashcards ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error.flashcards}</p>
            </div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No flashcards found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery || isFiltersOpen ? "Try adjusting your search or filters." : "There are no flashcards in the database."}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className="w-[300px]">Question</TableHead>
                    <TableHead className="w-[300px]">Answer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Info</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card, index) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">
                        {(currentPage - 1) * cardsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium line-clamp-2">{card.question}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground line-clamp-2">{card.answer}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Badge variant={card.is_official ? "default" : "outline"}>
                            {card.is_official ? 'Official' : 'User-Generated'}
                          </Badge>
                          {card.is_common_pitfall && (
                            <Badge variant="destructive">Common Pitfall</Badge>
                          )}
                          {card.is_public_sample && (
                            <Badge variant="secondary">Public Sample</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {card.difficulty_level && (
                            <div className="mb-1">
                              <span className="font-medium">Difficulty:</span> {card.difficulty_level}
                            </div>
                          )}
                          {card.subjects && card.subjects.length > 0 && (
                            <div className="mb-1">
                              <span className="font-medium">Subjects:</span> {card.subjects.map(s => s.name).join(', ')}
                            </div>
                          )}
                          {card.collections && card.collections.length > 0 && (
                            <div>
                              <span className="font-medium">Collections:</span> {card.collections.map(c => c.title).join(', ')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(card.created_at), 'yyyy-MM-dd')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCard(card)}
                          >
                            <FileEdit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCard(card)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-4 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Edit Sheet */}
      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Flashcard</SheetTitle>
          </SheetHeader>
          
          {error.edit && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mt-4">
              {error.edit}
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="question" className="font-medium">Question</Label>
              <div className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
                {selectedCard?.question}
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="answer" className="font-medium">Answer</Label>
              <div className="p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
                {selectedCard?.answer}
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_official"
                checked={editData.is_official}
                onCheckedChange={(checked) => 
                  setEditData(prev => ({ ...prev, is_official: checked === true }))
                }
              />
              <Label htmlFor="is_official">Official Flashcard</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="difficulty_level">Difficulty Level</Label>
              <Select 
                value={editData.difficulty_level} 
                onValueChange={(value) => setEditData(prev => ({ ...prev, difficulty_level: value }))}
              >
                <SelectTrigger id="difficulty_level">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_common_pitfall"
                checked={editData.is_common_pitfall}
                onCheckedChange={(checked) => 
                  setEditData(prev => ({ ...prev, is_common_pitfall: checked === true }))
                }
              />
              <Label htmlFor="is_common_pitfall">Common Pitfall</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public_sample"
                checked={editData.is_public_sample}
                onCheckedChange={(checked) => 
                  setEditData(prev => ({ ...prev, is_public_sample: checked === true }))
                }
              />
              <Label htmlFor="is_public_sample">Public Sample</Label>
            </div>
          </div>
          
          <SheetFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges}
              disabled={loading.edit}
            >
              {loading.edit ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flashcard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this flashcard?
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                <p className="font-medium">Question: {deletingCard?.question}</p>
              </div>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" /> 
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Flashcard Component */}
      <CreateFlashcard
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        initialCollectionId={selectedCollection}
      />
    </AdminLayout>
  );
};

export default AdminFlashcards; 