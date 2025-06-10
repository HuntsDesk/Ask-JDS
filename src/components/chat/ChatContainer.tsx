import { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useThreads, useThreadsRealtime } from '@/hooks/use-query-threads';
import { useMessages } from '@/hooks/use-messages';
// ChatInterface import removed - using extracted components instead
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { SelectedThreadContext, SidebarContext } from '@/App';
import { useTheme } from '@/lib/theme-provider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { usePersistedState } from '@/hooks/use-persisted-state';
import useMediaQuery from '@/hooks/useMediaQuery';
import { useCreateThread, useUpdateThread, useDeleteThread } from '@/hooks/use-query-threads';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import PageContainer from '@/components/layout/PageContainer';
import ChatLayoutContainer from '@/components/layout/ChatLayoutContainer';
import { ChatMessagesArea } from './ChatMessagesArea';
import { ChatInputArea } from './ChatInputArea';
import { ChatMobileHeader } from './ChatMobileHeader';
import type { Thread } from '@/types';
import { useChatFSM } from '@/hooks/use-chat-fsm';
import { cn } from '@/lib/utils';
import type { LayoutMetrics } from '@/components/layout/ChatLayoutContainer';
import { useSubscription } from '@/hooks/useSubscription';

export function ChatContainer() {
  // =========== HOOKS - All called unconditionally at the top ===========
  
  // Router and URL params
  const { threadId: urlThreadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Context
  const { user, signOut, isAuthResolved } = useAuth();
  const { selectedThreadId, setSelectedThreadId } = useContext(SelectedThreadContext);
  const { isExpanded, setIsExpanded, isMobile } = useContext(SidebarContext);
  const { theme } = useTheme();
  const { toast, dismiss } = useToast();
  
  // Media queries
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Chat FSM for state management
  const chatFSM = useChatFSM();
  
  // Use the subscription hook to get tier information
  const { tierName } = useSubscription();
  
  // Determine if user has premium access (Premium or Unlimited tier)
  const hasPaidSubscription = tierName === 'Premium' || tierName === 'Unlimited';
  
  // Refs for state tracking
  const chatRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const lastInitializedThreadIdRef = useRef<string | null>(null);
  const isNavigatingFromSidebar = useRef(false);
  // Reference to focus function that will be set by ChatInterface
  const focusInputRef = useRef<() => void>(() => {});
  // New refs for chat layout
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  
  // Layout metrics state
  const [layoutMetrics, setLayoutMetrics] = useState<LayoutMetrics | null>(null);
  const [showRetryButton, setShowRetryButton] = useState(false);
  
  // State variables
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [activeThreadTitle, setActiveThreadTitle] = useState<string>('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [preservedMessage, setPreservedMessage] = usePersistedState<string>('preserved-message', '');
  
  // Data fetching and mutations
  const threadQuery = useThreads();
  
  // Add realtime subscription to thread updates
  useThreadsRealtime();
  
  const originalThreads = threadQuery.data || [];
  const originalThreadsLoading = threadQuery.isLoading || threadQuery.isFetching;
  
  const createThreadMutation = useCreateThread();
  const updateThreadMutation = useUpdateThread();
  const deleteThreadMutation = useDeleteThread();

  // =========== CALLBACKS - Define all callbacks before using them in hooks ===========
  
  // Define callbacks that will be passed to hooks
  const handleFirstMessage = useCallback((message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[ChatContainer] First message sent:', message);
    }
    // No-op for now, but defining it ensures consistent hook order
  }, []);
  
  const handleThreadTitleUpdate = useCallback(async (title: string) => {
    try {
      // Use urlThreadId as the primary source of truth
      // This is more reliable as it comes from the URL, not component state
      const threadIdToUpdate = urlThreadId;
      
      if (threadIdToUpdate) {
        console.log(`[ChatContainer] Updating thread title for ${threadIdToUpdate} to "${title}"`);
        
        // If activeThread doesn't match urlThreadId, update it for consistency
        if (activeThread !== threadIdToUpdate) {
          console.debug(`[ChatContainer] Fixing activeThread mismatch: current=${activeThread}, should be=${threadIdToUpdate}`);
          setActiveThread(threadIdToUpdate);
        }
        
        await updateThreadMutation.mutateAsync({ 
          id: threadIdToUpdate, 
          title 
        });
        console.log(`[ChatContainer] Thread title update completed for ${threadIdToUpdate}`);
      } else {
        console.error('[ChatContainer] Cannot update thread title: No URL thread ID');
      }
    } catch (error) {
      console.error('[ChatContainer] Failed to update thread title:', error);
    }
  }, [activeThread, urlThreadId, updateThreadMutation, setActiveThread]);

  // =========== Thread ID and messaging logic ===========
  
  // Compute stable thread ID
  const stableThreadId = useMemo(() => {
    // Give priority to URL parameter when switching threads
    const id = urlThreadId || activeThread;
    if (process.env.NODE_ENV === 'development') {
      console.debug('[ChatContainer] Computing stable thread ID:', {
        activeThreadId: activeThread,
        urlThreadId: urlThreadId,
        result: id
      });
    }
    return id;
  }, [activeThread, urlThreadId]);

  // Set debounced thread ID to avoid rapid changes
  const debouncedThreadId = useDebouncedValue(stableThreadId, 300);

  // Pass the URL thread ID directly to useMessages
  const messagesResult = useMessages(
    urlThreadId,
    handleFirstMessage,
    handleThreadTitleUpdate
  );
  
  const { 
    messages: threadMessages,
    loading: messagesLoading,
    isGenerating,
    messageCount,
    messageLimit,
    showPaywall,
    sendMessage: handleSendMessage,
    refreshMessages: handleRefreshMessages,
    handleClosePaywall: handlePaywallClose,
    preservedMessage: messagePreserved,
    isSubscribed
  } = messagesResult || {
    messages: [],
    loading: false,
    isGenerating: false,
    messageCount: 0,
    messageLimit: 0,
    showPaywall: false,
    sendMessage: async (_content: string) => null,
    refreshMessages: async () => {},
    handleClosePaywall: () => {},
    preservedMessage: null,
    isSubscribed: false
  };

  // =========== Event handlers ===========
  
  // Set active thread with FSM state tracking
  const handleSetActiveThread = useCallback((threadId: string) => {
    if (threadId && originalThreads.some(t => t.id === threadId)) {
      // Update the FSM state to loading for thread change
      chatFSM.startLoading('threads');
      
      setActiveThread(threadId);
      setSelectedThreadId(threadId);
    }
  }, [originalThreads, setSelectedThreadId, chatFSM]);

  // Create a function to set the focus reference from ChatInterface
  const setFocusInputRef = useCallback((focusFn: () => void) => {
    focusInputRef.current = focusFn;
  }, []);
  
  // Handle layout metrics changes
  const handleLayoutMetricsChange = useCallback((metrics: LayoutMetrics) => {
    setLayoutMetrics(metrics);
  }, []);

  // Create new thread - properly manage dependencies
  const handleNewChat = useCallback(async () => {
    try {
      sessionStorage.removeItem('attemptingThreadCreation');
      
      // Update FSM state for thread creation
      chatFSM.startLoading('threads');
      
      toast({
        title: "Creating new conversation",
        description: "This might take a moment due to slow database response times.",
        variant: "default",
      });
      
      const thread = await createThreadMutation.mutateAsync('New Conversation');
      if (thread) {
        setActiveThread(thread.id);
        setSelectedThreadId(thread.id);
        navigate(`/chat/${thread.id}`, { replace: true });
        
        // Focus the textarea using the ref function after a short delay
        setTimeout(() => {
          focusInputRef.current();
        }, 100);
      } else {
        toast({
          title: "Error creating conversation",
          description: "We couldn't create a new conversation. Please try again.",
          variant: "destructive",
        });
        
        // Update FSM state for error
        chatFSM.setError(new Error("Failed to create conversation"), 'threads');
      }
    } catch (error) {
      toast({
        title: "Error creating conversation",
        description: "We couldn't create a new conversation. Please try again.",
        variant: "destructive",
      });
      
      // Update FSM state for error
      if (error instanceof Error) {
        chatFSM.setError(error, 'threads');
      } else {
        chatFSM.setError(new Error("Failed to create conversation"), 'threads');
      }
    }
  }, [createThreadMutation, navigate, setSelectedThreadId, toast, chatFSM]);

  // =========== Effects ===========
  
  // Show retry button after delay
  useEffect(() => {
    if (messagesLoading) {
      const timeoutId = setTimeout(() => {
        setShowRetryButton(true);
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    } else {
      setShowRetryButton(false);
    }
  }, [messagesLoading]);
  
  // Initialize FSM state based on auth status - optimized to reduce flashing
  // Skip auth loading since ProtectedRoute already handles authentication
  useEffect(() => {
    // Only log in development to reduce console noise
    if (process.env.NODE_ENV === 'development') {
      console.log('ChatContainer: Auth state update', { isAuthResolved, user: !!user });
    }
    
    // Since we're inside ProtectedRoute, auth is already resolved
    // Jump directly to threads loading
    if (isAuthResolved && user && chatFSM.state.status === 'idle') {
      chatFSM.startLoading('threads');
    } else if (isAuthResolved && !user) {
      // No user after auth resolution means we should redirect
      // (handled by ProtectedRoute)
      chatFSM.reset();
    }
  }, [isAuthResolved, user]); // Remove chatFSM from deps to prevent loops
  
  // Track thread loading and update FSM state - optimized to reduce transitions
  useEffect(() => {
    if (!isAuthResolved || !user) {
      return; // Silently skip when auth not ready
    }
    
    console.log('[ChatContainer] Thread loading effect:', {
      originalThreadsLoading,
      fsmStatus: chatFSM.state.status,
      fsmPhase: chatFSM.state.phase,
      threadsCount: originalThreads.length,
      hasError: threadQuery.isError,
      error: threadQuery.error
    });
    
    if (originalThreadsLoading && chatFSM.state.status !== 'loading') {
      console.log('[ChatContainer] Starting FSM loading for threads');
      chatFSM.startLoading('threads');
    } else if (!originalThreadsLoading && chatFSM.state.status === 'loading' && chatFSM.state.phase === 'threads') {
      // If we have threads or this is a different page (no thread ID expected)
      if (originalThreads.length > 0 || !urlThreadId) {
        // Smart loading decision: only load messages if the thread likely has content
        if (urlThreadId) {
          const foundThread = originalThreads.find(t => t.id === urlThreadId);
          if (foundThread) {
            // Existing thread in cache - only start message loading if we don't already have messages
            if (threadMessages.length === 0 && messagesLoading) {
              chatFSM.startLoading('messages');
            } else {
              // Thread exists and we either have messages or they're not loading - go straight to ready
              chatFSM.setReady(threadMessages.length === 0, urlThreadId);
            }
          } else {
            // New thread not in cache yet - skip message loading, go straight to ready  
            // New threads have no messages by definition
            chatFSM.setReady(true, urlThreadId);
          }
        } else {
          // No thread ID means we're on the welcome page
          chatFSM.setReady(originalThreads.length === 0, null);
        }
      }
    }
  }, [isAuthResolved, user, originalThreadsLoading, originalThreads, urlThreadId, threadMessages.length, messagesLoading, chatFSM, threadQuery.isError, threadQuery.error]); // Added threadMessages and messagesLoading deps
  
  // Redirect to most recent thread if at /chat root
  useEffect(() => {
    // Only proceed if we have auth and threads loaded
    if (isAuthResolved && user && !originalThreadsLoading && originalThreads.length > 0 && !urlThreadId) {
      // Get most recent thread (they're already sorted by created_at desc)
      const mostRecentThread = originalThreads[0];
      if (mostRecentThread && mostRecentThread.id && location.pathname === '/chat') {
        console.log('ChatContainer: Redirecting to most recent thread:', mostRecentThread.id);
        
        // Set the active thread and selected thread ID before navigation
        setActiveThread(mostRecentThread.id);
        setSelectedThreadId(mostRecentThread.id);
        
        // Use navigate with replace to avoid creating a history entry
        navigate(`/chat/${mostRecentThread.id}`, { 
          replace: true,
          state: {} // Clear any state to ensure clean navigation
        });
      }
    }
  }, [isAuthResolved, user, originalThreadsLoading, originalThreads, urlThreadId, navigate, location.pathname, setSelectedThreadId]);
  
  // Track message loading and update FSM state - optimized to reduce flashing
  useEffect(() => {
    if (!isAuthResolved || !user || !urlThreadId) {
      return; // Silently skip when prerequisites not met
    }
    
    // Only show loading state for existing threads that actually need to load messages
    if (messagesLoading && threadMessages.length === 0) {
      // Check if this thread exists in cache (meaning it's an existing thread with potential content)
      const foundThread = originalThreads.find(t => t.id === urlThreadId);
      if (foundThread && chatFSM.state.status !== 'loading') {
        // Add a small delay before showing loading to allow fast loads to complete
        const timer = setTimeout(() => {
          if (messagesLoading && threadMessages.length === 0) {
            chatFSM.startLoading('messages');
          }
        }, 300); // 300ms delay before showing loading (increased from 200ms)
        
        return () => clearTimeout(timer);
      }
    } else if (!messagesLoading && !isGenerating && chatFSM.state.status === 'loading' && chatFSM.state.phase === 'messages') {
      // Messages loaded, can transition to ready
      chatFSM.setReady(threadMessages.length === 0, urlThreadId);
    }
  }, [isAuthResolved, user, urlThreadId, messagesLoading, isGenerating, threadMessages.length, chatFSM, originalThreads]); // Added originalThreads dep
  


  // Ensure dark mode is applied correctly
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    
    // Set up listener for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (theme === 'system') {
        if (event.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Check for navigation from sidebar
  useEffect(() => {
    const fromSidebar = location.state && (location.state as any).fromSidebar === true;
    
    if (fromSidebar) {
      isNavigatingFromSidebar.current = true;
      
      // Clear the state so future navigations are handled correctly
      navigate(location.pathname, { replace: true, state: {} });
      
      // Reset after a short delay
      const timeoutId = setTimeout(() => {
        isNavigatingFromSidebar.current = false;
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [location, navigate]);

  // Synchronize activeThread with urlThreadId to ensure title updates work correctly
  useEffect(() => {
    if (!urlThreadId) return;
    
    if (!activeThread || activeThread !== urlThreadId) {
      console.debug(`[ChatContainer] Syncing activeThread state to match URL thread ID: ${urlThreadId}`);
      
      // Check if threads are loaded
      if (originalThreadsLoading) {
        console.debug('[ChatContainer] Waiting for threads to load before syncing activeThread');
        return;
      }
      
      // Find the thread in our loaded threads
      const foundThread = originalThreads.find(t => t.id === urlThreadId);
      
      if (foundThread) {
        console.debug(`[ChatContainer] Found matching thread in loaded threads: ${foundThread.id}, title: "${foundThread.title}"`);
        setActiveThread(foundThread.id);
        // IMPORTANT: Also update the selectedThreadId context for sidebar highlighting
        setSelectedThreadId(foundThread.id);
      } else if (!originalThreadsLoading && originalThreads.length > 0) {
        // If threads are loaded but we didn't find a match, set it anyway
        // This handles cases where the thread might be new and not in our cache yet
        console.debug(`[ChatContainer] Thread not found in loaded threads, setting activeThread to URL ID: ${urlThreadId}`);
        setActiveThread(urlThreadId);
        // IMPORTANT: Also update the selectedThreadId context for sidebar highlighting
        setSelectedThreadId(urlThreadId);
      }
    }
  }, [urlThreadId, activeThread, originalThreads, originalThreadsLoading, setSelectedThreadId]);

  // =========== Render logic based on FSM state ===========
  
  // FSM visualizer in development
  const devTools = null; // No longer showing debug UI
  
  // Consolidated loading state - only show if actually needed
  // Skip auth loading since ProtectedRoute already handled it
  // Only show loading for slow operations that actually need user feedback
  if (chatFSM.state.status === 'loading' && chatFSM.state.phase !== 'auth') {
    // Use generic loading message to avoid too many specific states
    const loadingMessage = "Loading...";
    
    return (
      <PageContainer bare>
        <div className="flex-1 flex flex-col justify-center items-center h-full py-8">
          <LoadingSpinner className="w-10 h-10 text-jdblue mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-center">
            {loadingMessage}
          </p>
        </div>
        {devTools}
      </PageContainer>
    );
  }
  
  // Welcome state - no thread selected
  if (chatFSM.state.status === 'ready' && !urlThreadId) {
    return (
      <PageContainer bare>
        {/* Add mobile header with hamburger menu for mobile users */}
        {isMobile && (
          <header className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex items-center justify-between">
            <button
              onClick={() => {
                console.log('Welcome screen: Hamburger menu clicked');
                setIsExpanded(!isExpanded);
              }}
              className="p-2 rounded-md bg-[#f37022] text-white hover:bg-[#e36012] flex items-center justify-center"
              aria-label="Open sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Ask JDS</h1>
            <div className="w-9"></div> {/* Spacer for alignment */}
          </header>
        )}
        <div className={cn(
          "flex-1 flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-4 text-center",
          // Add padding-top when mobile header is shown
          isMobile && "pt-16"
        )}>
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Welcome to AskJDS</h1>
          <p className="text-lg mb-8 text-gray-600 dark:text-gray-300">
            Ask any law school or bar exam related questions. Start a new chat to begin the conversation.
          </p>
        </div>
        {devTools}
      </PageContainer>
    );
  }
  
  // Error state
  if (chatFSM.state.status === 'error') {
    return (
      <PageContainer bare>
        <div className="flex-1 flex flex-col justify-center items-center h-full py-8">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg max-w-md text-center">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Error Loading Chat</h3>
            <p className="text-red-700 dark:text-red-400 mb-4">
              {chatFSM.state.error.message || "Something went wrong loading the chat."}
            </p>
            <button
              onClick={() => chatFSM.retry()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
        {devTools}
      </PageContainer>
    );
  }
  
  // Main chat interface - ready state
  return (
    <>
      {/* Mobile header */}
      {!isDesktop && (
        <ChatMobileHeader 
          onToggleSidebar={() => {
            console.log('ChatContainer: Toggle sidebar from hamburger');
            setIsExpanded(!isExpanded);
          }}
        />
      )}
      
      <ChatLayoutContainer
        footer={
          <ChatInputArea
            threadId={urlThreadId}
            onSend={handleSendMessage}
            messageCount={messageCount}
            messageLimit={messageLimit}
            preservedMessage={preservedMessage}
            isGenerating={isGenerating}
            isLoading={messagesLoading}
            setFocusInputRef={setFocusInputRef}
            isSubscribed={hasPaidSubscription}
          />
        }
        scrollContainerRef={messagesScrollRef}
        onLayoutChange={handleLayoutMetricsChange}
        className="chat-interface-root"
      >
        <ChatMessagesArea
          messages={threadMessages}
          loading={messagesLoading}
          showRetryButton={showRetryButton}
          isGenerating={isGenerating}
          onRefresh={handleRefreshMessages}
          scrollContainerRef={messagesScrollRef}
          threadId={urlThreadId}
        />
      </ChatLayoutContainer>
      
      {devTools}
      
      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Message Limit Reached</h3>
            <p className="mb-4">You've reached your free message limit. Upgrade to continue chatting with unlimited messages.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/pricing')}
                className="px-4 py-2 bg-[#F37022] text-white rounded hover:bg-[#E36012]"
              >
                Upgrade Now
              </button>
              <button 
                onClick={handlePaywallClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatContainer; 