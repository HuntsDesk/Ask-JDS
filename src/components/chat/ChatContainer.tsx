import { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useThreads } from '@/hooks/use-query-threads';
import { useMessages } from '@/hooks/use-messages';
import { ChatInterface } from './ChatInterface';
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
import type { Thread } from '@/types';
import { useChatFSM, ChatFSMVisualizer } from '@/hooks/use-chat-fsm';
import { cn } from '@/lib/utils';

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
  
  // Refs for state tracking
  const chatRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const lastInitializedThreadIdRef = useRef<string | null>(null);
  const isNavigatingFromSidebar = useRef(false);
  // Reference to focus function that will be set by ChatInterface
  const focusInputRef = useRef<() => void>(() => {});
  
  // State variables
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [activeThreadTitle, setActiveThreadTitle] = useState<string>('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [preservedMessage, setPreservedMessage] = usePersistedState<string>('preserved-message', '');
  
  // Data fetching and mutations
  const threadQuery = useThreads();
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
      if (activeThread) {
        await updateThreadMutation.mutateAsync({ 
          id: activeThread, 
          title 
        });
      }
    } catch (error) {
      console.error('[ChatContainer] Failed to update thread title:', error);
    }
  }, [activeThread, updateThreadMutation]);

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
    preservedMessage: messagePreserved
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
    preservedMessage: null
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
  
  // Initialize FSM state based on auth status
  useEffect(() => {
    console.log('ChatContainer: Auth state update', { isAuthResolved, user: !!user });
    
    if (!isAuthResolved && chatFSM.state.status !== 'loading') {
      console.log('ChatContainer: Auth not resolved, FSM in auth loading state');
      chatFSM.startLoading('auth');
    } else if (isAuthResolved && !user && chatFSM.state.status !== 'idle') {
      // No user after auth resolution means we should redirect
      // (handled by ProtectedRoute)
      console.log('ChatContainer: Auth resolved, no user, FSM resetting');
      chatFSM.reset();
    } else if (isAuthResolved && user) {
      // Auth is resolved and we have a user, FSM can proceed to next phase
      console.log('ChatContainer: Auth resolved with user, proceeding to next FSM phase');
      if (chatFSM.state.status === 'loading' && chatFSM.state.phase === 'auth') {
        console.log('ChatContainer: Starting threads loading phase');
        chatFSM.startLoading('threads');
      }
    }
  }, [isAuthResolved, user, chatFSM]);
  
  // Track thread loading and update FSM state
  useEffect(() => {
    if (!isAuthResolved || !user) {
      console.log('ChatContainer: Skipping thread loading, auth not ready');
      return;
    }
    
    if (originalThreadsLoading && chatFSM.state.status !== 'loading') {
      console.log('ChatContainer: Threads loading in progress');
      chatFSM.startLoading('threads');
    } else if (!originalThreadsLoading && chatFSM.state.status === 'loading' && chatFSM.state.phase === 'threads') {
      // If we have threads or this is a different page (no thread ID expected)
      console.log('ChatContainer: Threads loaded, threads count:', originalThreads.length);
      
      if (originalThreads.length > 0 || !urlThreadId) {
        // Check if we need message loading or can go straight to ready state
        if (urlThreadId) {
          console.log('ChatContainer: Thread ID present, starting messages loading', urlThreadId);
          chatFSM.startLoading('messages');
        } else {
          // No thread ID means we're on the welcome page
          console.log('ChatContainer: No thread ID, setting FSM to ready state');
          chatFSM.setReady(originalThreads.length === 0, null);
        }
      }
    }
  }, [isAuthResolved, user, originalThreadsLoading, originalThreads, urlThreadId, chatFSM]);
  
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
  
  // Track message loading and update FSM state
  useEffect(() => {
    if (!isAuthResolved || !user || !urlThreadId) {
      console.log('ChatContainer: Skipping message loading, prerequisites not met');
      return;
    }
    
    if ((messagesLoading || isGenerating) && (chatFSM.state.status !== 'loading' || chatFSM.state.phase !== 'messages')) {
      console.log('ChatContainer: Messages loading or generating in progress');
      
      // Only trigger full loading state for initial load, not during message generation
      if (messagesLoading && threadMessages.length === 0) {
        chatFSM.startLoading('messages');
      }
    } else if (!messagesLoading && !isGenerating && chatFSM.state.status === 'loading' && chatFSM.state.phase === 'messages') {
      // Messages loaded, can transition to ready
      console.log('ChatContainer: Messages loaded, setting FSM to ready state');
      chatFSM.setReady(threadMessages.length === 0, urlThreadId);
    }
  }, [isAuthResolved, user, urlThreadId, messagesLoading, isGenerating, threadMessages, chatFSM]);

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

  // =========== Render logic based on FSM state ===========
  
  // FSM visualizer in development
  const devTools = process.env.NODE_ENV === 'development' ? <ChatFSMVisualizer /> : null;
  
  // Auth loading state
  if (chatFSM.state.status === 'loading' && chatFSM.state.phase === 'auth') {
    return (
      <PageContainer bare>
        <div className="flex-1 flex flex-col justify-center items-center h-full py-8">
          <LoadingSpinner className="w-10 h-10 text-jdblue mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Initializing...
          </p>
        </div>
        {devTools}
      </PageContainer>
    );
  }
  
  // Thread loading state
  if (chatFSM.state.status === 'loading' && chatFSM.state.phase === 'threads') {
    return (
      <PageContainer bare>
        <div className="flex-1 flex flex-col justify-center items-center h-full py-8">
          <LoadingSpinner className="w-10 h-10 text-jdblue mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Loading conversations...
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
              onClick={() => setIsExpanded(true)}
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
  
  // Messages loading state
  if (chatFSM.state.status === 'loading' && chatFSM.state.phase === 'messages') {
    return (
      <PageContainer bare>
        <div className="flex-1 flex flex-col justify-center items-center h-full py-8">
          <LoadingSpinner className="w-10 h-10 text-jdblue mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Loading messages...
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
    <PageContainer bare className="chat-layout-container">
      {/* 
        Chat interface needs complete layout control due to its unique scrolling behavior
        and fixed-position elements. The bare prop removes all layout constraints.
      */}
      <div className="flex flex-col h-screen w-full overflow-hidden" ref={chatRef}>
        <ChatInterface 
          threadId={urlThreadId || activeThread}
          messages={threadMessages}
          // Only pass loading=true for initial message loading, not during message generation
          loading={chatFSM.state.status === 'loading' && threadMessages.length === 0}
          loadingTimeout={chatFSM.state.status === 'loading' && chatFSM.state.previousStatus === 'ready'}
          onSend={handleSendMessage}
          onRefresh={handleRefreshMessages}
          messageCount={messageCount}
          messageLimit={messageLimit}
          preservedMessage={preservedMessage}
          showPaywall={showPaywall}
          onToggleSidebar={() => {}}
          isSidebarOpen={true}
          isDesktop={isDesktop}
          isGenerating={isGenerating}
          onClosePaywall={handlePaywallClose}
          setFocusInputRef={setFocusInputRef}
        />
      </div>
      {devTools}
    </PageContainer>
  );
}

export default ChatContainer; 