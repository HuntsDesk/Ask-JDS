import { useState, useEffect, useRef, useContext, lazy, Suspense } from 'react';
import { useAuth } from '@/lib/auth';
import { useThreads } from '@/hooks/use-threads';
import { useMessages } from '@/hooks/use-messages';
import { Sidebar } from './Sidebar';
import { ChatInterface } from './ChatInterface';
import { Loader2 } from 'lucide-react';
// Lazy load the Paywall which is only needed in certain circumstances
const Paywall = lazy(() => import('@/components/Paywall').then(module => ({ default: module.Paywall })));
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SelectedThreadContext, SidebarContext } from '@/App';
import useMediaQuery from '@/hooks/useMediaQuery';
import { X } from 'lucide-react';

// Export as default for lazy loading
const ChatLayout = () => {
  const { user, signOut } = useAuth();
  const { isExpanded, setIsExpanded } = useContext(SidebarContext);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [activeThreadTitle, setActiveThreadTitle] = useState<string>('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isThreadDeletion, setIsThreadDeletion] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const navigate = useNavigate();
  const params = useParams<{ threadId?: string }>();
  const [searchParams] = useSearchParams();
  
  const threadId = params.threadId || null;
  const initialTitle = threadId ? searchParams.get('title') || 'New Chat' : 'New Chat';

  const {
    threads: originalThreads,
    loading: originalThreadsLoading,
    createThread,
    updateThread,
    deleteThread,
    refetchThreads
  } = useThreads();

  const { toast, dismiss } = useToast();
  const { selectedThreadId, setSelectedThreadId } = useContext(SelectedThreadContext);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const messagesTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // A helper function to log thread details
  const logThreadInfo = () => {
    console.log('----------- Thread Debug Info -----------');
    console.log('ThreadID from URL:', threadId);
    console.log('Global selectedThreadId:', selectedThreadId);
    console.log('Component activeThread:', activeThread);
    console.log('Available Threads:', originalThreads.map(t => ({id: t.id, title: t.title})));
    console.log('Thread loading:', originalThreadsLoading);
    console.log('----------------------------------------');
  };

  // Log thread info on important state changes
  useEffect(() => {
    logThreadInfo();
  }, [threadId, activeThread, originalThreads, originalThreadsLoading, selectedThreadId]);

  // Initialize the thread from URL or global state when component mounts
  useEffect(() => {
    // Make sure we have threads loaded
    if (originalThreads.length === 0 || originalThreadsLoading) {
      console.log('ChatLayout: Threads not loaded yet, waiting');
      return;
    }
    
    console.log('ChatLayout: Initializing thread selection with priorities:');
    console.log('1. URL Param:', threadId);
    console.log('2. Global Context:', selectedThreadId);
    console.log('3. Current Active:', activeThread);
    
    // PRIORITY 1: URL parameter (highest priority)
    if (threadId) {
      const threadExists = originalThreads.some(t => t.id === threadId);
      if (threadExists) {
        console.log('ChatLayout: Using thread ID from URL:', threadId);
        setActiveThread(threadId);
        // Also update global context
        if (selectedThreadId !== threadId) {
          setSelectedThreadId(threadId);
        }
        return;
      } else {
        console.warn('ChatLayout: Thread from URL not found:', threadId);
      }
    } else if (selectedThreadId) {
      // SPECIAL CASE: No threadId in URL, but we have a selectedThreadId
      // This happens when "New Chat" is created but we're on /chat without ID
      console.log('ChatLayout: No thread ID in URL but we have selected thread:', selectedThreadId);
      const threadExists = originalThreads.some(t => t.id === selectedThreadId);
      if (threadExists) {
        console.log('ChatLayout: Found thread in list, navigating and setting active');
        setActiveThread(selectedThreadId);
        // Force navigation to the thread URL
        navigate(`/chat/${selectedThreadId}`, { replace: true });
        return;
      }
    }
    
    // PRIORITY 2: Global context state
    if (selectedThreadId) {
      const threadExists = originalThreads.some(t => t.id === selectedThreadId);
      if (threadExists) {
        console.log('ChatLayout: Using thread ID from global context:', selectedThreadId);
        setActiveThread(selectedThreadId);
        
        // Update URL if needed
        if (threadId !== selectedThreadId) {
          console.log('ChatLayout: Updating URL to match global context:', selectedThreadId);
          navigate(`/chat/${selectedThreadId}`, { replace: true });
        }
        return;
      } else {
        console.warn('ChatLayout: Thread from global context not found:', selectedThreadId);
      }
    }
    
    // PRIORITY 3: Current active thread state
    if (activeThread) {
      const threadExists = originalThreads.some(t => t.id === activeThread);
      if (threadExists) {
        console.log('ChatLayout: Keeping current active thread:', activeThread);
        
        // Update URL and global context if needed
        if (threadId !== activeThread) {
          navigate(`/chat/${activeThread}`, { replace: true });
        }
        if (selectedThreadId !== activeThread) {
          setSelectedThreadId(activeThread);
        }
        return;
      }
    }
    
    // PRIORITY 4: Default to first thread if nothing else is selected
    if (originalThreads.length > 0) {
      const firstThreadId = originalThreads[0].id;
      console.log('ChatLayout: Nothing selected, defaulting to first thread:', firstThreadId);
      setActiveThread(firstThreadId);
      setSelectedThreadId(firstThreadId);
      navigate(`/chat/${firstThreadId}`, { replace: true });
    }
  }, [originalThreads, originalThreadsLoading, threadId, selectedThreadId, activeThread, navigate]);

  // Change active thread when a new thread is selected
  const handleSetActiveThread = (threadId: string) => {
    console.log('ChatLayout: handleSetActiveThread called with thread ID:', threadId);
    if (threadId && originalThreads.some(t => t.id === threadId)) {
      setActiveThread(threadId);
      setSelectedThreadId(threadId);
    } else {
      console.log('ChatLayout: Attempted to set invalid thread ID:', threadId);
    }
  };

  // Check if user has active subscription
  useEffect(() => {
    if (user) {
      const checkSubscription = async () => {
        const result = await import('@/lib/subscription').then(
          module => module.hasActiveSubscription(user.id)
        );
        console.log(`User subscription active: ${result}`);
      };
      
      checkSubscription();
    }
  }, [user]);

  // Add a safety timeout to prevent getting stuck in loading state
  useEffect(() => {
    if (originalThreadsLoading && !loadingTimeout && !timeoutIdRef.current) {
      console.log('ChatLayout: Setting threads loading safety timeout (20 seconds)');
      timeoutIdRef.current = setTimeout(() => {
        console.log('ChatLayout: Threads loading safety timeout triggered');
        setLoadingTimeout(true);
        toast({
          title: "Taking longer than expected",
          description: "We're having trouble loading your conversations. We'll keep trying in the background.",
          variant: "warning",
        });
        timeoutIdRef.current = null;
      }, 20000); // 20 seconds
    }
    
    return () => {
      if (timeoutIdRef.current) {
        console.log('ChatLayout: Clearing threads loading safety timeout');
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [originalThreadsLoading, loadingTimeout, toast]);

  // Create a callback for updating thread titles
  const handleThreadTitleGenerated = async (title: string) => {
    if (activeThread) {
      console.log(`Updating thread title to "${title}" after 3 messages`);
      await updateThread(activeThread, { title });
    }
  };

  const messagesResult = useMessages(
    activeThread, 
    undefined, // onFirstMessage callback (not needed here)
    handleThreadTitleGenerated // Pass the title update callback
  );
  const threadMessages = messagesResult?.messages || [];
  const messagesLoading = messagesResult?.loading || false;
  const isGenerating = messagesResult?.isGenerating || false;
  const showPaywall = messagesResult?.showPaywall || false;
  const handleClosePaywall = messagesResult?.handleClosePaywall;
  const messageCount = messagesResult?.messageCount || 0;
  const messageLimit = messagesResult?.messageLimit || 0;
  const preservedMessage = messagesResult?.preservedMessage;

  // Handle paywall related logic and toast dismissal
  useEffect(() => {
    // When paywall appears, we should dismiss any toasts
    if (showPaywall) {
      // Dismiss any active toasts to prevent them from appearing alongside the paywall
      dismiss();
      
      // Also set a small timeout to make sure all toasts are cleared
      const timeoutId = setTimeout(() => {
        dismiss();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [showPaywall, dismiss]);

  // Add a safety timeout for messages loading
  useEffect(() => {
    // Set timeout when messages are loading
    if (messagesLoading && !messagesTimeoutIdRef.current) {
      console.log('ChatLayout: Setting messages loading safety timeout (15 seconds)');
      messagesTimeoutIdRef.current = setTimeout(() => {
        console.log('ChatLayout: Messages loading safety timeout triggered');
        toast({
          title: "Loading messages taking longer than expected",
          description: "We're having trouble loading your messages. The database might be slow to respond.",
          variant: "warning",
        });
      }, 15000); // 15 seconds
    } 
    // Clear timeout when messages are no longer loading
    else if (!messagesLoading && messagesTimeoutIdRef.current) {
      console.log('ChatLayout: Clearing messages loading safety timeout');
      clearTimeout(messagesTimeoutIdRef.current);
      messagesTimeoutIdRef.current = null;
    }
    
    // Cleanup on unmount
    return () => {
      if (messagesTimeoutIdRef.current) {
        clearTimeout(messagesTimeoutIdRef.current);
        messagesTimeoutIdRef.current = null;
      }
    };
  }, [messagesLoading, toast]);

  // Set active thread to most recent thread on initial load
  // or create a default thread for new users
  useEffect(() => {
    // Create a mounted flag to handle async state updates
    let isMounted = true;
    
    console.log('ChatLayout: Thread state update', { 
      threadsCount: originalThreads.length, 
      threadsLoading, 
      activeThread,
      hasUser: !!user
    });
    
    // Only proceed if we're done loading or if the loading has timed out
    if ((!originalThreadsLoading || loadingTimeout) && isMounted) {
      if (originalThreads.length > 0) {
        // If user has threads, set the most recent one as active
        if (!activeThread && isMounted) {
          console.log('ChatLayout: Setting active thread to most recent', originalThreads[0].id);
          setActiveThread(originalThreads[0].id);
        }
      } else if (user) {
        // If user has no threads, create a default thread
        // Only attempt thread creation if we haven't timed out and user is authenticated
        const hasCreatedDefaultThread = localStorage.getItem('hasCreatedDefaultThread');
        const attemptingThread = sessionStorage.getItem('attemptingThreadCreation');
        
        if (!hasCreatedDefaultThread && !loadingTimeout && !attemptingThread && isMounted) {
          console.log('Creating default thread for new user');
          
          // Set a flag in both session and local storage to prevent duplicates
          sessionStorage.setItem('attemptingThreadCreation', 'true');
          
          // Show toast notification to inform user
          toast({
            title: "Creating your first conversation",
            description: "This might take a moment due to slow database response times.",
            variant: "default",
          });
          
          // Delay thread creation slightly to avoid race conditions with auth
          setTimeout(() => {
            if (!isMounted) return;
            
            createThread()
              .then(thread => {
                if (!isMounted) return;
                
                if (thread) {
                  console.log('ChatLayout: Created default thread', thread.id);
                  localStorage.setItem('hasCreatedDefaultThread', 'true');
                  setActiveThread(thread.id);
                  toast({
                    title: "Conversation created",
                    description: "You can now start chatting.",
                    variant: "default",
                  });
                } else {
                  console.error('ChatLayout: Thread creation returned null');
                  toast({
                    title: "Error creating conversation",
                    description: "We couldn't create a new conversation. You can try clicking 'New Chat' button.",
                    variant: "destructive",
                  });
                }
                sessionStorage.removeItem('attemptingThreadCreation');
              })
              .catch(error => {
                if (!isMounted) return;
                
                console.error('Failed to create default thread:', error);
                toast({
                  title: "Error creating conversation",
                  description: "Database communication problem. Please try clicking 'New Chat' button or refreshing the page.",
                  variant: "destructive",
                });
                sessionStorage.removeItem('attemptingThreadCreation');
              });
          }, 500);
        } else if (loadingTimeout && isMounted) {
          // If the loading timed out, encourage the user to try manual creation
          console.log('ChatLayout: Skipping default thread creation due to database timeout');
          toast({
            title: "Database connection slow",
            description: "Try clicking 'New Chat' or refresh the page to create a new conversation.",
            variant: "default",
          });
        }
      }
    }
    
    return () => {
      isMounted = false;
      sessionStorage.removeItem('attemptingThreadCreation');
    };
  }, [originalThreads, activeThread, originalThreadsLoading, loadingTimeout, user, createThread, toast]);

  const handleNewChat = async () => {
    try {
      console.log('ChatLayout: Creating new thread');
      
      // Clear any stale creation flags
      sessionStorage.removeItem('attemptingThreadCreation');
      
      toast({
        title: "Creating new conversation",
        description: "This might take a moment due to slow database response times.",
        variant: "default",
      });
      
      // Log threads before creation
      console.log('Threads BEFORE creation:', originalThreads.map(t => ({
        id: t.id,
        title: t.title,
        created_at: t.created_at
      })));
      
      // Set a timeout for thread creation
      const threadPromise = createThread();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Thread creation timed out')), 10000); // Increased timeout
      });
      
      // Race the thread creation against the timeout
      const thread = await Promise.race([threadPromise, timeoutPromise]);
      
      if (thread) {
        console.log('ChatLayout: New thread created successfully', thread.id, thread);
        
        // FORCE immediate refetch of threads to ensure we have the latest order
        await refetchThreads();
        
        console.log('ChatLayout: Threads refreshed, now preparing navigation');
        
        // Set the newly created thread as the active thread FIRST
        setActiveThread(thread.id);
        setSelectedThreadId(thread.id);
        console.log('ChatLayout: Set activeThread and selectedThreadId to:', thread.id);
        
        // Force direct navigation to the new thread with replace to avoid history stack issues
        console.log('ChatLayout: Navigating to new thread:', thread.id);
        navigate(`/chat/${thread.id}`, { replace: true });
        
        toast({
          title: "Conversation created",
          description: "You can now start chatting.",
          variant: "default",
        });
      } else {
        console.error('ChatLayout: Thread creation returned null');
        toast({
          title: "Error creating conversation",
          description: "We couldn't create a new conversation. Please try again or refresh the page.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to create new chat:', error);
      
      // Check if this was a timeout error
      const errorMessage = error instanceof Error && error.message === 'Thread creation timed out'
        ? "Database is responding slowly. Please try again in a moment."
        : "We couldn't create a new conversation. Please try again or refresh the page.";
      
      toast({
        title: "Error creating conversation",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      // Set thread deletion flag to prevent showing full loading spinner
      setIsThreadDeletion(true);
      
      // Get the thread title before deletion for the toast
      const threadToDelete = originalThreads.find(t => t.id === threadId);
      const threadTitle = threadToDelete?.title || 'Conversation';
      
      // Delete the thread (this has optimistic updates)
      const success = await deleteThread(threadId);
      
      if (success) {
        // Show a toast confirming deletion
        toast({
          title: "Thread deleted",
          description: `"${threadTitle}" has been removed.`,
          variant: "default",
        });
      } else {
        console.error('Thread deletion failed on the server');
      }
      
      // Navigation is now handled by the Sidebar component
    } catch (error) {
      console.error('Failed to delete thread:', error);
      
      // Show error toast
      toast({
        title: "Error deleting thread",
        description: "There was a problem deleting the conversation.",
        variant: "destructive",
      });
    } finally {
      // Reset thread deletion flag
      setIsThreadDeletion(false);
    }
  };

  const handleRenameThread = async (threadId: string, newTitle: string) => {
    try {
      await updateThread(threadId, { title: newTitle });
    } catch (error) {
      console.error('Failed to rename thread:', error);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Check for mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add an effect to delay showing "No conversation selected" message
  useEffect(() => {
    if (!originalThreadsLoading && !messagesLoading) {
      // Delay setting initialLoadComplete to prevent flash of "No conversation selected"
      const timer = setTimeout(() => {
        setInitialLoadComplete(true);
      }, 300); // Small delay to allow thread selection to complete
      
      return () => clearTimeout(timer);
    }
  }, [originalThreadsLoading, messagesLoading]);

  // Use a dedicated function for rendering paywall
  const renderPaywall = () => {
    return (
      <Suspense fallback={<div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}>
        <Paywall
          title="Message Limit Reached"
          message="You've reached your free message limit. Upgrade to our premium plan for unlimited access."
          buttonText="Upgrade Now"
          onClose={() => setActiveThread(null)}
        />
      </Suspense>
    );
  };

  // Close sidebar when switching to mobile view
  useEffect(() => {
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  }, [isDesktop]);

  if (originalThreadsLoading && !loadingTimeout && !isThreadDeletion) {
    console.log('ChatLayout: Showing loading spinner for threads');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your conversations...</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-[#F37022] hover:bg-[#E36012] text-white rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  console.log('ChatLayout: Rendering main interface', { 
    threadsCount: originalThreads.length, 
    activeThread, 
    messagesCount: threadMessages.length 
  });

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black/30 z-20"
          onClick={() => setIsSidebarOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 text-white" 
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Sidebar - conditionally shown based on state for mobile */}
      <div 
        className={`${
          isSidebarOpen || isDesktop ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDesktop ? 'relative' : 'fixed'
        } w-64 h-full transition-transform duration-300 ease-in-out z-30 md:z-10`}
      >
        <Sidebar
          setActiveTab={handleSetActiveThread}
          isDesktopExpanded={isExpanded}
          onDesktopExpandedChange={setIsExpanded}
          onNewChat={handleNewChat}
          onSignOut={handleSignOut}
          onDeleteThread={handleDeleteThread}
          onRenameThread={handleRenameThread}
          sessions={originalThreads.map(thread => ({
            id: thread.id,
            title: thread.title,
            created_at: thread.created_at
          }))}
          currentSession={activeThread}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatInterface 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen}
          isDesktop={isDesktop}
        />
      </div>
    </div>
  );
};

// Export both as default and named export for compatibility
export { ChatLayout };
export default ChatLayout;