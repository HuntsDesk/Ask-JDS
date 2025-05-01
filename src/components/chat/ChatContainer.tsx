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

export function ChatContainer() {
  // =========== HOOKS - All called unconditionally at the top ===========
  
  // Router and URL params
  const { threadId: urlThreadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Context
  const { user, signOut } = useAuth();
  const { selectedThreadId, setSelectedThreadId } = useContext(SelectedThreadContext);
  const { isExpanded, setIsExpanded, isMobile } = useContext(SidebarContext);
  const { theme } = useTheme();
  const { toast, dismiss } = useToast();
  
  // Media queries
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Refs for hook consistency and state tracking
  const chatRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const lastInitializedThreadIdRef = useRef<string | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const messagesTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const prevLoadingRef = useRef<boolean>(false);
  const prevContentReadyRef = useRef<boolean>(false);
  
  // State variables - all at the top level
  const [isLoading, setIsLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [activeThreadTitle, setActiveThreadTitle] = useState<string>('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isThreadDeletion, setIsThreadDeletion] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isPinnedSidebar, setIsPinnedSidebar] = useState(false);
  const [isNavigatingFromSidebar, setIsNavigatingFromSidebar] = useState(false);
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
  
  // Set active thread - fixed with proper deps
  const handleSetActiveThread = useCallback((threadId: string) => {
    if (threadId && originalThreads.some(t => t.id === threadId)) {
      setContentReady(false);
      setLoading(true);
      setActiveThread(threadId);
      setSelectedThreadId(threadId);
    }
  }, [originalThreads, setSelectedThreadId]);

  // Create new thread - properly manage dependencies
  const handleNewChat = useCallback(async () => {
    try {
      sessionStorage.removeItem('attemptingThreadCreation');
      setContentReady(false);
      setLoading(true);
      
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
      } else {
        toast({
          title: "Error creating conversation",
          description: "We couldn't create a new conversation. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error creating conversation",
        description: "We couldn't create a new conversation. Please try again.",
        variant: "destructive",
      });
    }
  }, [createThreadMutation, navigate, setSelectedThreadId, toast]);

  // Sign out - properly manage dependencies
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('[ChatContainer] Failed to sign out:', error);
    }
  }, [signOut, navigate]);

  // Delete thread - fixed dependency array
  const handleDeleteThread = useCallback(async (threadId: string) => {
    try {
      setIsThreadDeletion(true);
      
      const threadIndex = originalThreads.findIndex(t => t.id === threadId);
      const isActiveThread = activeThread === threadId;
      
      await deleteThreadMutation.mutateAsync(threadId);
      
      if (isActiveThread) {
        setContentReady(false);
        setLoading(true);
        
        if (originalThreads.length > 1) {
          const nextThreadIndex = threadIndex > 0 ? threadIndex - 1 : (threadIndex < originalThreads.length - 1 ? threadIndex + 1 : -1);
          
          if (nextThreadIndex >= 0) {
            const nextThreadId = originalThreads[nextThreadIndex].id;
            setActiveThread(nextThreadId);
            setSelectedThreadId(nextThreadId);
            navigate(`/chat/${nextThreadId}`, { replace: true });
          } else {
            setActiveThread(null);
            setSelectedThreadId(null);
            navigate('/chat', { replace: true });
          }
        } else {
          handleNewChat();
        }
      }
      
      setIsThreadDeletion(false);
    } catch (error) {
      setIsThreadDeletion(false);
      console.error('[ChatContainer] Error deleting thread:', error);
    }
  }, [activeThread, deleteThreadMutation, handleNewChat, navigate, originalThreads, setSelectedThreadId]);

  // Rename thread - properly manage dependencies
  const handleRenameThread = useCallback(async (threadId: string, newTitle: string) => {
    try {
      await updateThreadMutation.mutateAsync({ id: threadId, title: newTitle });
    } catch (error) {
      console.error('[ChatContainer] Failed to rename thread:', error);
    }
  }, [updateThreadMutation]);

  // Refresh messages - stability improvement
  const handleRefresh = useCallback(() => {
    if (handleRefreshMessages) {
      handleRefreshMessages();
    }
  }, [handleRefreshMessages]);

  // =========== Effects ===========
  
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

  // Initial loading state - ensure cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Check for navigation from sidebar
  useEffect(() => {
    const fromSidebar = location.state && (location.state as any).fromSidebar === true;
    
    if (fromSidebar) {
      setIsNavigatingFromSidebar(fromSidebar);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Initialize active thread when threads load or URL changes
  useEffect(() => {
    // Skip if still loading
    if (originalThreadsLoading) {
      return;
    }
    
    // Skip if no threads available
    if (originalThreads.length === 0) {
      if (activeThread) {
        setActiveThread(null);
      }
      return;
    }
    
    // Skip if already initialized
    if (hasInitializedRef.current && lastInitializedThreadIdRef.current === urlThreadId) {
      return;
    }
    
    // Skip if navigation is from sidebar to the same thread
    if (isNavigatingFromSidebar && activeThread && urlThreadId === activeThread && contentReady) {
      setLoading(false);
      return;
    }
    
    // Helper to check if thread exists
    const threadExists = (id: string | null | undefined) => 
      id && originalThreads.some(t => t.id === id);
    
    // Set active thread based on priority
    let newActiveThread: string | null = null;
    
    // Priority 1: URL parameter
    if (urlThreadId && threadExists(urlThreadId)) {
      newActiveThread = urlThreadId;
    }
    // Priority 2: Global context
    else if (selectedThreadId && threadExists(selectedThreadId)) {
      newActiveThread = selectedThreadId;
      // Update URL if different
      if (urlThreadId !== selectedThreadId) {
        navigate(`/chat/${selectedThreadId}`, { replace: true });
      }
    }
    // Priority 3: Current active thread
    else if (activeThread && threadExists(activeThread)) {
      newActiveThread = activeThread;
      // Update URL if different
      if (urlThreadId !== activeThread) {
        navigate(`/chat/${activeThread}`, { replace: true });
      }
    }
    // Priority 4: Default to first thread
    else if (originalThreads.length > 0) {
      newActiveThread = originalThreads[0].id;
      // Update URL if different
      if (urlThreadId !== newActiveThread) {
        navigate(`/chat/${newActiveThread}`, { replace: true });
      }
    }
    
    // Update active thread if different
    if (newActiveThread !== activeThread) {
      setActiveThread(newActiveThread);
    }
    
    // Update selected thread context if different
    if (newActiveThread !== selectedThreadId) {
      setSelectedThreadId(newActiveThread);
    }
    
    // Mark as initialized
    hasInitializedRef.current = true;
    lastInitializedThreadIdRef.current = urlThreadId;
  }, [originalThreads, originalThreadsLoading, urlThreadId, selectedThreadId, activeThread, navigate, setSelectedThreadId, isNavigatingFromSidebar, contentReady]);

  // Track loading state transitions using refs
  useEffect(() => {
    // Only trigger when loading transitions from true to false
    if (prevLoadingRef.current && !loading) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[ChatContainer] Loading state transitioned from true → false');
      }
      // Place any post-load actions here if needed
    }
    prevLoadingRef.current = loading;
  }, [loading]);

  // Track contentReady state transitions using refs
  useEffect(() => {
    // Only trigger when contentReady transitions from false to true
    if (!prevContentReadyRef.current && contentReady) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[ChatContainer] Content ready state transitioned from false → true');
      }
      // Place any post-content-ready actions here if needed
    }
    prevContentReadyRef.current = contentReady;
  }, [contentReady]);

  // Track content readiness - fixed dependencies
  useEffect(() => {
    const isStillLoading = 
      originalThreadsLoading || 
      messagesLoading ||
      isGenerating;
      
    const hasActiveThread = !!urlThreadId;
    const hasValidContent = threadMessages.length > 0 || (hasActiveThread && !messagesLoading);
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('[ChatContainer] Content ready check:', {
        isStillLoading,
        hasActiveThread,
        hasValidContent,
        threadMessages: threadMessages.length,
        originalThreadsLoading,
        messagesLoading,
        isGenerating,
        urlThreadId
      });
    }
    
    if (!isStillLoading && hasActiveThread && hasValidContent) {
      if (!contentReady) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[ChatContainer] Setting content as ready');
        }
        setContentReady(true);
        setLoading(false);
      }
    } else if (contentReady || !loading) {
      if (contentReady) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[ChatContainer] Setting content as NOT ready');
        }
        setContentReady(false);
      }
      if (!loading) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[ChatContainer] Setting loading to true');
        }
        setLoading(true);
      }
    }
  }, [
    originalThreadsLoading, 
    urlThreadId, 
    messagesLoading, 
    isGenerating, 
    threadMessages, 
    contentReady, 
    loading
  ]);

  // Update threads state when originalThreads changes
  useEffect(() => {
    if (!originalThreadsLoading) {
      setThreads(originalThreads);
      setThreadsLoading(false);
    }
  }, [originalThreads, originalThreadsLoading]);

  // Update active thread when URL changes
  useEffect(() => {
    if (urlThreadId && urlThreadId !== activeThread) {
      // If URL thread ID is different from active thread, update active thread
      console.log(`[ChatContainer] URL thread ID changed to ${urlThreadId}, updating active thread`);
      
      setContentReady(false);
      setLoading(true);
      setActiveThread(urlThreadId);
      setSelectedThreadId(urlThreadId);
      
      // We don't need to call refreshMessages here as the useMessages hook 
      // will handle the refresh when threadId changes
    }
  }, [urlThreadId, activeThread, setSelectedThreadId]);

  // =========== Render logic ===========
  
  // Loading state
  if (isLoading || originalThreadsLoading) {
    return (
      <PageContainer bare>
        <div className="flex-1 flex justify-center items-center h-full py-8">
          <LoadingSpinner className="w-10 h-10 text-jdblue" />
        </div>
      </PageContainer>
    );
  }
  
  // Welcome state - no thread selected
  if (!urlThreadId && !selectedThreadId) {
    return (
      <PageContainer bare>
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-6 text-jdblue">Welcome to AskJDS</h1>
          <p className="text-lg mb-8 text-gray-600 dark:text-gray-300">
            Ask any law school or bar exam related questions. Start a new chat to begin the conversation.
          </p>
        </div>
      </PageContainer>
    );
  }
  
  // Main chat interface
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
          loading={loading || !contentReady}
          loadingTimeout={loadingTimeout}
          onSend={handleSendMessage}
          onRefresh={handleRefresh}
          messageCount={messageCount}
          messageLimit={messageLimit}
          preservedMessage={preservedMessage}
          showPaywall={showPaywall}
          onToggleSidebar={() => {}}
          isSidebarOpen={true}
          isDesktop={isDesktop}
          isGenerating={isGenerating}
          onClosePaywall={handlePaywallClose}
        />
      </div>
    </PageContainer>
  );
}

export default ChatContainer; 