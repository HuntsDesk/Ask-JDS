import React, { useState, useEffect, useContext, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { hasActiveSubscription } from '@/lib/subscription';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SelectedThreadContext, SidebarContext } from '@/App';
import { FlashcardPaywall } from '@/components/FlashcardPaywall';
import { NavbarProvider } from '@/contexts/NavbarContext';
import { StudyProvider } from '@/contexts/StudyContext';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { useNavbar } from '@/contexts/NavbarContext';

// Import pages
import Home from './pages/Home';
import FlashcardCollections from './FlashcardCollections';
import CreateSet from './pages/CreateSet';
import AllFlashcards from './pages/AllFlashcards';
import SearchResults from './pages/SearchResults';
// Additional pages will be implemented progressively
import EditCollection from './pages/EditCollection';
import AddCard from './pages/AddCard';
import EditCard from './pages/EditCard';
import ManageCards from './pages/ManageCards';
import ManageSubjects from './FlashcardSubjects';
import EditSubject from './pages/EditSubject';
import CreateSubject from './pages/CreateSubject';
import CreateFlashcardSelect from './pages/CreateFlashcardSelect';
import CreateFlashcard from './pages/CreateFlashcard';
import UnifiedStudyMode from './pages/UnifiedStudyMode';
import FlashcardStudy from './FlashcardStudy';

export default function FlashcardsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { setSelectedThreadId } = useContext(SelectedThreadContext);
  const [loading, setLoading] = useState(false); // Start with not loading
  const [initialLoad, setInitialLoad] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const { isMobile, isExpanded, setIsExpanded } = useContext(SidebarContext);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { setNavbarTitle, updateCount, setShowBackButton, hideBackButton } = useNavbar();
    
  // Function to check if a collection is a user collection or premium one
  const checkAccessToCollection = async (collectionId: string) => {
    try {
      console.log("Checking access to collection:", collectionId);
      
      // Modified to always allow access to collections
      // Premium content will be controlled at the flashcard level
      console.log("Bypassing collection-level premium check as requested");
      return true;
    } catch (error) {
      console.error("Error checking collection access:", error);
      return true; // Default to allowing access on error
    }
  };
  
  // Set up flashcard routes
  const flashcardRoutes = [
    { path: 'collections', component: FlashcardCollections },
    { path: 'collections/:id', component: FlashcardCollections, protected: true, checkAccess: checkAccessToCollection },
    { path: 'view/:id', component: FlashcardCollections, protected: true, checkAccess: checkAccessToCollection },
    { path: 'create-card/:collectionId?', component: AddCard },
    { path: 'edit-card/:id', component: EditCard },
    { path: 'create-collection', component: CreateSet },
    { path: 'study/:collectionId', component: FlashcardStudy, protected: true, checkAccess: checkAccessToCollection },
    { path: 'all', component: AllFlashcards },
    { path: '/', component: () => <Navigate to="/flashcards/collections" /> },
  ];

  // Set up the routes
  const routeElements = flashcardRoutes.map(route => {
    if (route.protected) {
      return (
        <Route 
          key={route.path}
          path={route.path}
          element={
            <ProtectedResource 
              component={route.component}
              checkAccess={route.checkAccess}
            />
          }
        />
      );
    }
    return <Route key={route.path} path={route.path} element={<route.component />} />;
  });

  useEffect(() => {
    // Skip any loading screen if we're not doing access checks
    setInitialLoad(false);
    
    // Check user's subscription status once on mount
    if (user) {
      checkUserSubscription();
    } else {
      // If no user, they definitely don't have a subscription
      setHasSubscription(false);
      setLoading(false);
    }
    
    return () => {
      // Reset to default navbar state
      setNavbarTitle && setNavbarTitle('');
      hideBackButton && hideBackButton();
    };
  }, [user]);

  const checkUserSubscription = async () => {
    try {
      // No need to show loading state for background subscription check
      const hasAccess = await hasActiveSubscription(user?.id);
      setHasSubscription(hasAccess);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasSubscription(false);
    } finally {
      setLoading(false);
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
  
  // Handler for navigating to chat
  const handleThreadSelect = (threadId: string) => {
    // First set the global selected thread ID
    console.log('FlashcardsPage: handleThreadSelect called with thread ID:', threadId);
    setSelectedThreadId(threadId);
    
    // Debug log
    console.log('FlashcardsPage: Set global thread ID, now preparing navigation');
    
    // Navigate to the chat page with the selected thread ID
    navigate(`/chat/${threadId}`, { state: { fromSidebar: true } });
  };

  // Loading state handling
  if (initialLoad) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8 text-jdblue" />
      </div>
    );
  }
  
  // Paywall handling
  if (showPaywall) {
    return <FlashcardPaywall onClose={handleClosePaywall} />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Use the NavbarProvider to control the navbar state */}
      <StudyProvider>
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Navbar */}
          <Navbar />
          
          {/* Main content */}
          <div className="flex-1 overflow-auto">
            <Routes>
              {routeElements}
              
              {/* Additional routes */}
              <Route path="edit-collection/:id" element={<EditCollection />} />
              <Route path="manage-cards/:collectionId" element={<ManageCards />} />
              <Route path="subjects" element={<ManageSubjects />} />
              <Route path="edit-subject/:id" element={<EditSubject />} />
              <Route path="create-subject" element={<CreateSubject />} />
              <Route path="create-flashcard-select" element={<CreateFlashcardSelect />} />
              <Route path="create-flashcard/:subjectId?" element={<CreateFlashcard />} />
              <Route path="search" element={<SearchResults />} />
              
              {/* Study routes */}
              <Route path="study" element={<UnifiedStudyMode />} />
              <Route path="*" element={<Navigate to="/flashcards/collections" />} />
            </Routes>
          </div>
        </div>
      </StudyProvider>
    </div>
  );
}

// Component to wrap protected resources that require subscription verification
function ProtectedResource({ checkAccess, component: Component, ...rest }: any) {
  const { id } = rest.params || { id: null };
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false); // Start with not loading
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let longLoadingTimeoutId: NodeJS.Timeout | null = null;
    
    async function verifyAccess() {
      console.log("ProtectedResource: Verifying access for resource with ID:", id);
      
      // Only show loading indicator if the check takes longer than 300ms
      timeoutId = setTimeout(() => {
        setLoading(true);
      }, 300);
      
      // Safety timeout to prevent infinite loading
      longLoadingTimeoutId = setTimeout(() => {
        console.warn("ProtectedResource: Access check timed out after 8 seconds, defaulting to allow access");
        setCanAccess(true);
        setLoading(false);
        setLoadingTimeout(false);
      }, 8000);
      
      try {
        if (id) {
          const hasAccess = await checkAccess(id);
          console.log("ProtectedResource: Access result:", hasAccess);
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
        if (timeoutId) clearTimeout(timeoutId);
        if (longLoadingTimeoutId) clearTimeout(longLoadingTimeoutId);
        setLoading(false);
      }
    }
    
    verifyAccess();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (longLoadingTimeoutId) clearTimeout(longLoadingTimeoutId);
    };
  }, [id, checkAccess]);
  
  console.log("ProtectedResource: Current state - loading:", loading, "canAccess:", canAccess);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 mt-6">
        <LoadingSpinner size="lg" />
        <p className="ml-2 text-gray-700 dark:text-gray-300">Checking access...</p>
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