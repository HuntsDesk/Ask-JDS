import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { Sidebar } from '@/components/chat/Sidebar'; 
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { hasActiveSubscription } from '@/lib/subscription';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useThreads } from '@/hooks/use-threads';
import { SelectedThreadContext, SidebarContext } from '@/App';
import { FlashcardPaywall } from '@/components/FlashcardPaywall';
import { NavbarProvider } from '@/contexts/NavbarContext';

// Import pages
import Home from './pages/Home';
import FlashcardCollections from './FlashcardCollections';
import StudyMode from './pages/StudyMode';
import CreateSet from './pages/CreateSet';
import AllFlashcards from './pages/AllFlashcards';
import SearchResults from './pages/SearchResults';
// Additional pages will be implemented progressively
import EditCollection from './pages/EditCollection';
import AddCard from './pages/AddCard';
import EditCard from './pages/EditCard';
import ManageCards from './pages/ManageCards';
import ManageSubjects from './FlashcardSubjects';
import SubjectStudy from './pages/SubjectStudy';
import EditSubject from './pages/EditSubject';
import CreateSubject from './pages/CreateSubject';
import CreateFlashcardSelect from './pages/CreateFlashcardSelect';
import CreateFlashcard from './pages/CreateFlashcard';
import UnifiedStudyMode from './pages/UnifiedStudyMode';

export default function FlashcardsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Use the threads hook to fetch actual threads
  const { threads, loading: threadsLoading, deleteThread, updateThread, createThread } = useThreads();
  const { setSelectedThreadId } = useContext(SelectedThreadContext);
  const { isExpanded, setIsExpanded } = useContext(SidebarContext);
  
  // Check for mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const isMobileSize = window.innerWidth < 768;
      const isTabletSize = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      setIsMobile(isMobileSize);
      
      // For tablet sizes, ensure the sidebar response to expansion properly
      if (isTabletSize) {
        // Make sure the sidebar contextual state matches the global state
        if (isExpanded !== isExpanded) {
          setIsExpanded(isExpanded);
        }
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isExpanded, setIsExpanded]);
  
  // Sync sidebar expanded state between components
  useEffect(() => {
    // This ensures changes to the isExpanded state are properly reflected in the UI
    const sidebarElement = document.querySelector('.sidebar-container');
    if (sidebarElement) {
      if (isExpanded) {
        sidebarElement.classList.add('expanded');
        sidebarElement.classList.remove('collapsed');
      } else {
        sidebarElement.classList.add('collapsed');
        sidebarElement.classList.remove('expanded');
      }
    }
  }, [isExpanded]);

  useEffect(() => {
    const checkSubscription = async () => {
      if (user) {
        try {
          setLoading(true);
          console.log("Checking subscription status...")
          const hasAccess = await hasActiveSubscription(user.id);
          console.log("Subscription status:", hasAccess);
          setHasSubscription(hasAccess);
          // Don't show paywall by default - only show it when accessing premium content
          setShowPaywall(false);
        } catch (error) {
          console.error("Error checking subscription:", error);
          setHasSubscription(true);
          setShowPaywall(false);
        } finally {
          setLoading(false);
        }
      } else {
        console.log("No user logged in, setting hasSubscription to false");
        setHasSubscription(false);
        setShowPaywall(false);
        setLoading(false);
      }
    };
    
    checkSubscription();
  }, [user]);

  // Function to check if a collection is a user collection or premium one
  const checkAccessToCollection = async (collectionId: string) => {
    try {
      console.log("Checking access to collection:", collectionId);
      
      // Modified to always allow access to collections
      // Premium content will be controlled at the flashcard level
      console.log("Bypassing collection-level premium check as requested");
      return true;
      
      // Set up a timeout to prevent hanging
      const checkPromise = (async () => {
        try {
          // Query to check if collection is premium content
          const { data, error } = await supabase
            .from('collections')
            .select('is_official')
            .eq('id', collectionId)
            .single();
          
          if (error) {
            console.error("Error checking collection access:", error);
            // On error, default to allowing access
            return true;
          }
          
          // Allow access regardless of premium status
          // Premium content will be handled at the flashcard level
          console.log("Allowing access to collection regardless of premium status");
          return true;
        } catch (error) {
          console.error("Error in checkPromise:", error);
          return true; // Default to allowing access on error
        }
      })();
      
      // Create a timeout promise
      const timeoutPromise = new Promise<boolean>(resolve => {
        setTimeout(() => {
          console.warn("Collection access check timed out after 5 seconds, defaulting to allow access");
          resolve(true);
        }, 5000);
      });
      
      // Race the check against the timeout
      return await Promise.race([checkPromise, timeoutPromise]);
    } catch (error) {
      console.error("Error checking collection access:", error);
      return true; // Default to allowing access on error
    }
  };
  
  const handleClosePaywall = () => {
    setShowPaywall(false);
    // Navigate back to the previous page or to subjects if no previous path
    if (currentPath) {
      // Extract the base path without the ID
      const basePath = currentPath.split('/').slice(0, -1).join('/');
      navigate(basePath || '/flashcards/subjects');
    } else {
      navigate('/flashcards/subjects');
    }
  };
  
  // Mock functions for sidebar - they don't need full implementation for flashcards page
  const handleNewChat = () => {
    // Instead of just navigating to chat, first create a new thread
    createThread()
      .then(thread => {
        if (thread) {
          console.log('FlashcardsPage: Created new thread', thread.id);
          // Set the selected thread ID in the context first
          setSelectedThreadId(thread.id);
          // Then navigate to the new thread
          navigate(`/chat/${thread.id}`);
        } else {
          console.error('FlashcardsPage: Failed to create new thread');
          navigate('/chat'); // Fallback to chat home if creation fails
        }
      })
      .catch(error => {
        console.error('FlashcardsPage: Error creating new thread:', error);
        navigate('/chat'); // Fallback to chat home if error occurs
      });
  };
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  const handleDeleteThread = async (id: string) => {
    await deleteThread(id);
  };
  
  const handleRenameThread = async (id: string, newTitle: string) => {
    await updateThread(id, { title: newTitle });
  };
  
  // Handle thread selection from sidebar
  const handleThreadSelect = (threadId: string) => {
    // First set the global selected thread ID
    console.log('FlashcardsPage: handleThreadSelect called with thread ID:', threadId);
    setSelectedThreadId(threadId);
    
    // Debug log
    console.log('FlashcardsPage: Set global thread ID, now preparing navigation');
    
    // Use setTimeout to ensure context update happens before navigation
    setTimeout(() => {
      // Then navigate to the chat page with the selected thread ID
      console.log('FlashcardsPage: Now navigating to thread:', threadId);
      navigate(`/chat/${threadId}`);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900 pt-6">
        <LoadingSpinner size="lg" />
        <p className="ml-2 dark:text-gray-300">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Chat Sidebar */}
      <Sidebar
        setActiveTab={handleThreadSelect}
        isDesktopExpanded={isExpanded}
        onDesktopExpandedChange={setIsExpanded}
        onNewChat={handleNewChat}
        onSignOut={handleSignOut}
        onDeleteThread={handleDeleteThread}
        onRenameThread={handleRenameThread}
        sessions={threads}
        currentSession={null}
      />
      
      {/* Main content */}
      <div className={cn(
        "flex-1 overflow-auto",
        isExpanded ? 'md:ml-64' : 'md:ml-20'
      )}>
        <NavbarProvider>
          <Navbar />
          <div className="container mx-auto px-4 pt-6">
            <Routes>
              <Route path="/" element={<Navigate to="/flashcards/subjects" replace />} />
              <Route path="/subjects" element={<ManageSubjects />} />
              <Route path="/subjects/:id" element={<SubjectStudy />} />
              <Route path="/collections" element={<FlashcardCollections />} />
              <Route path="/flashcards" element={<AllFlashcards />} />
              <Route path="/study/:id" element={
                <ProtectedResource 
                  checkAccess={checkAccessToCollection}
                  component={StudyMode} 
                />
              } />
              <Route path="/study" element={<UnifiedStudyMode />} />
              <Route index element={<Navigate to="/flashcards/study" replace />} />
              <Route path="/create-collection" element={<CreateSet />} />
              <Route path="/create" element={<Navigate to="/flashcards/create-collection" replace />} />
              <Route path="/edit/:id" element={<EditCollection />} />
              <Route path="/cards/:id" element={<ManageCards />} />
              <Route path="/add-card/:id" element={<AddCard />} />
              <Route path="/edit-card/:cardId" element={<EditCard />} />
              <Route path="/all-flashcards" element={<AllFlashcards />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/edit-subject/:id" element={<EditSubject />} />
              <Route path="/create-subject" element={<CreateSubject />} />
              <Route path="/create-flashcard-select" element={<CreateFlashcardSelect />} />
              <Route path="/create-flashcard" element={<CreateFlashcard />} />
              {/* Add a catch-all route to redirect to subjects */}
              <Route path="*" element={<Navigate to="/flashcards/subjects" replace />} />
            </Routes>
            {showPaywall && (
              <FlashcardPaywall
                isOpen={showPaywall}
                onClose={handleClosePaywall}
              />
            )}
          </div>
        </NavbarProvider>
      </div>
    </div>
  );
}

// Component to wrap protected resources that require subscription verification
function ProtectedResource({ checkAccess, component: Component, ...rest }: any) {
  const { id } = rest.params || { id: null };
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function verifyAccess() {
      console.log("ProtectedResource: Verifying access for resource with ID:", id);
      
      // Safety timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn("ProtectedResource: Access check timed out after 8 seconds, defaulting to allow access");
        setCanAccess(true);
        setLoading(false);
      }, 8000);
      
      try {
        if (id) {
          const hasAccess = await checkAccess(id);
          console.log("ProtectedResource: Access result:", hasAccess);
          // Only update state if the timeout hasn't fired yet
          setCanAccess(hasAccess);
        } else {
          console.log("ProtectedResource: No ID provided, defaulting to allowed");
          setCanAccess(true);
        }
      } catch (error) {
        console.error("ProtectedResource: Error checking access:", error);
        // Default to allowing access on error
        setCanAccess(true);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }
    
    verifyAccess();
  }, [id, checkAccess]);
  
  console.log("ProtectedResource: Current state - loading:", loading, "canAccess:", canAccess);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 mt-6">
        <LoadingSpinner size="lg" />
        <p className="ml-2">Checking access...</p>
      </div>
    );
  }
  
  // If access is not granted, this will trigger the paywall in the parent component
  if (!canAccess) {
    console.log("ProtectedResource: Access denied, returning null");
    return null;
  }
  
  console.log("ProtectedResource: Access granted, rendering component");
  return <Component {...rest} />;
} 