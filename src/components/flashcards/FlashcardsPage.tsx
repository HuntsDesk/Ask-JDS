import { logger } from '@/lib/logger';
import React, { useState, useEffect, useContext, useRef, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SelectedThreadContext, SidebarContext } from '@/App';
import { FlashcardPaywall } from '@/components/FlashcardPaywall';
import { NavbarProvider } from '@/contexts/NavbarContext';
import { StudyProvider } from '@/contexts/StudyContext';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { useNavbar } from '@/contexts/NavbarContext';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, GraduationCap, Filter, Search } from 'lucide-react';
import { useSubscriptionWithTier } from '@/hooks/useSubscription';
import ScrollToTop from './ScrollToTop';

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

// Add a Suspense wrapped component for each major page
const SuspenseAllFlashcards = () => (
  <Suspense fallback={<div className="w-full py-8 flex justify-center"><LoadingSpinner className="w-8 h-8 text-jdblue" /></div>}>
    <AllFlashcards />
  </Suspense>
);

const SuspenseFlashcardCollections = () => (
  <Suspense fallback={<div className="w-full py-8 flex justify-center"><LoadingSpinner className="w-8 h-8 text-jdblue" /></div>}>
    <FlashcardCollections />
  </Suspense>
);

const SuspenseManageSubjects = () => (
  <Suspense fallback={<div className="w-full py-8 flex justify-center"><LoadingSpinner className="w-8 h-8 text-jdblue" /></div>}>
    <ManageSubjects />
  </Suspense>
);

export default function FlashcardsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { setSelectedThreadId } = useContext(SelectedThreadContext);
  const [loading, setLoading] = useState(false); // Start with not loading
  const [initialLoad, setInitialLoad] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const { isMobile, isExpanded, setIsExpanded } = useContext(SidebarContext);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { setNavbarTitle, updateCount, setShowBackButton, hideBackButton } = useNavbar();
    
  // Use the new subscription hook with tier-based access
  const { tierName, isLoading: subscriptionLoading } = useSubscriptionWithTier();
  
  // Determine if user has premium access (Premium or Unlimited tier)
  const hasPremiumAccess = tierName === 'Premium' || tierName === 'Unlimited';

  // DEV ONLY: Check for forced subscription override
  const [devHasPremiumAccess, setDevHasPremiumAccess] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const forceSubscription = localStorage.getItem('forceSubscription');
      if (forceSubscription === 'true') {
        logger.debug('DEV OVERRIDE: Forcing premium access to true in FlashcardsPage component');
        setDevHasPremiumAccess(true);
      } else {
        setDevHasPremiumAccess(false);
      }
    }
  }, []);

  // Final premium access determination (dev override or actual premium access)
  const hasSubscription = process.env.NODE_ENV === 'development' ? (devHasPremiumAccess || hasPremiumAccess) : hasPremiumAccess;
    
  // Function to check if a collection is a user collection or premium one
  const checkAccessToCollection = async (collectionId: string) => {
    try {
      logger.debug("Checking access to collection:", collectionId);
      
      // Modified to always allow access to collections
      // Premium content will be controlled at the flashcard level
      logger.debug("Bypassing collection-level premium check as requested");
      return true;
    } catch (error) {
      logger.error("Error checking collection access:", error);
      return true; // Default to allowing access on error
    }
  };
  
  // Set up flashcard routes
  const flashcardRoutes = [
    { path: 'collections', component: SuspenseFlashcardCollections },
    { path: 'collections/:id', component: SuspenseFlashcardCollections, protected: true, checkAccess: checkAccessToCollection },
    { path: 'view/:id', component: SuspenseFlashcardCollections, protected: true, checkAccess: checkAccessToCollection },
    { path: 'create-card/:collectionId?', component: AddCard },
    { path: 'edit-card/:id', component: EditCard },
    { path: 'create-collection', component: CreateSet },
    { path: 'study/:collectionId', component: FlashcardStudy, protected: true, checkAccess: checkAccessToCollection },
    { path: 'flashcards', component: SuspenseAllFlashcards },
    { path: 'all', component: SuspenseAllFlashcards },
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
      const hasAccess = await hasSubscription;
      setLoading(false);
    } catch (error) {
      logger.error('Error checking subscription:', error);
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
    logger.debug('FlashcardsPage: handleThreadSelect called with thread ID:', threadId);
    setSelectedThreadId(threadId);
    
    // Debug log
    logger.debug('FlashcardsPage: Set global thread ID, now preparing navigation');
    
    // Navigate to the chat page with the selected thread ID
    navigate(`/chat/${threadId}`, { state: { fromSidebar: true } });
  };

  // Loading state handling
  if (initialLoad) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <StudyProvider>
          <Navbar />
          <PageContainer noOverflow>
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSpinner className="w-8 h-8 text-jdblue" />
            </div>
          </PageContainer>
        </StudyProvider>
      </div>
    );
  }
  
  // Paywall handling
  if (showPaywall) {
    return <FlashcardPaywall onClose={handleClosePaywall} />;
  }

  return (
    <div className="flex flex-col h-screen md:h-full">
      {/* Use the NavbarProvider to control the navbar state */}
      <StudyProvider>
        {/* Navbar at the top */}
        <Navbar />
        
        {/* Main content with proper constraints for mobile */}
        <div className="flex-1 overflow-hidden w-full pt-16 md:pt-0">
          <div className="h-full overflow-auto pb-16 md:pb-0">
            <ScrollToTop />
            <PageContainer disablePadding={false} className="pt-6 pb-6 md:pb-12 mx-auto px-4" maxWidth="6xl">
            <Routes>
              {routeElements}
              
              {/* Additional routes */}
              <Route path="edit-collection/:id" element={<EditCollection />} />
              <Route path="manage-cards/:collectionId" element={<ManageCards />} />
              <Route path="subjects" element={<SuspenseManageSubjects />} />
              <Route path="edit-subject/:id" element={<EditSubject />} />
              <Route path="create-subject" element={<CreateSubject />} />
              <Route path="create-flashcard-select" element={<CreateFlashcardSelect />} />
              <Route path="create-flashcard/:subjectId?" element={<CreateFlashcard />} />
              <Route path="search" element={<SearchResults />} />
              
              {/* Study routes */}
              <Route path="study" element={<UnifiedStudyMode />} />
              <Route path="*" element={<Navigate to="/flashcards/collections" />} />
            </Routes>
          </PageContainer>
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
  
  // Add test functions for toggling subscription state
  const toggleTestSubscription = () => {
    if (process.env.NODE_ENV === 'development') {
      const current = localStorage.getItem('forceSubscription');
      const newValue = current === 'true' ? 'false' : 'true';
      localStorage.setItem('forceSubscription', newValue);
      logger.debug(`DEV: Test subscription set to ${newValue}`);
      
      // Force a reload to apply the change
      window.location.reload();
    }
  };
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let longLoadingTimeoutId: NodeJS.Timeout | null = null;
    
    async function verifyAccess() {
      logger.debug("ProtectedResource: Verifying access for resource with ID:", id);
      
      // Only show loading indicator if the check takes longer than 300ms
      timeoutId = setTimeout(() => {
        setLoading(true);
      }, 300);
      
      // Set loading timeout after 10 seconds
      longLoadingTimeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
      
      try {
        const hasAccess = await checkAccess(id);
        setCanAccess(hasAccess);
        logger.debug("ProtectedResource: Access check result:", hasAccess);
        
      } catch (error) {
        logger.error("ProtectedResource: Error during access check:", error);
        // Default to no access on error for better security
        setCanAccess(false);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (longLoadingTimeoutId) {
          clearTimeout(longLoadingTimeoutId);
        }
        setLoading(false);
      }
    }
    
    verifyAccess();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (longLoadingTimeoutId) {
        clearTimeout(longLoadingTimeoutId);
      }
    };
  }, [id, checkAccess]);
  
  // If loading or no decision yet, show loading state
  if (loading || canAccess === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner className="w-10 h-10 text-jdblue" />
        {loadingTimeout && (
          <div className="text-center mt-4">
            <p className="text-gray-600 dark:text-gray-300">This is taking longer than expected...</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Our servers might be experiencing high traffic.
            </p>
          </div>
        )}
      </div>
    );
  }

  // If access is denied, show the subscription required page
  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Premium Content</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            This content is only available to premium members.
          </p>
          
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Premium Benefits</h2>
              <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-300 text-left list-disc pl-5">
                <li>Access to all premium flashcards</li>
                <li>Enhanced study materials</li>
                <li>Exclusive practice questions</li>
                <li>Advanced tracking features</li>
              </ul>
            </div>
            
            <Link 
              to="/subscription" 
              className="inline-block bg-jdblue hover:bg-jdblue-dark text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Upgrade to Premium
            </Link>
          </div>
          
          {/* Development-only subscription toggle */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Developer Controls</p>
              <button 
                onClick={toggleTestSubscription}
                className="text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded"
              >
                Toggle Test Subscription
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If access is granted, render the requested component
  return <Component {...rest} />;
} 