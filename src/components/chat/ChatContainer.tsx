import { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useThreads, useThread, useCreateThread, useUpdateThread, useDeleteThread } from '@/hooks/use-query-threads';
import { useQueryMessages } from '@/hooks/use-query-messages';
import { ChatInterface } from './ChatInterface';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { SelectedThreadContext, SidebarContext } from '@/App';
import { useTheme } from '@/lib/theme-provider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { usePersistedState } from '@/hooks/use-persisted-state';
import useMediaQuery from '@/hooks/useMediaQuery';
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
  
  // Local state variables - now much fewer since React Query manages loading states
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [preservedMessage, setPreservedMessage] = usePersistedState<string>('preserved-message', '');
  const [isThreadDeletion, setIsThreadDeletion] = useState(false);
  
  // React Query data fetching
  const threadQuery = useThreads();
  const threads = threadQuery.data || [];
  const threadsLoading = threadQuery.isLoading || threadQuery.isFetching;
  
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
  
  // React Query hooks for specific thread and its messages
  const threadResult = useThread(stableThreadId);
  const currentThread = threadResult.data;
  const threadLoading = threadResult.isLoading;
  
  // Messages from React Query
  const messagesResult = useQueryMessages(stableThreadId);
  const {
    messages,
    isLoading: messagesLoading,
    isFetching: messagesFetching,
    isGenerating,
    messageCount,
    messageLimit,
    showPaywall,
    sendMessage: handleSendMessage,
    refreshMessages: handleRefreshMessages,
    handleClosePaywall,
    preservedMessage: messagePreserved
  } = messagesResult;
  
  // Mutations
  const createThreadMutation = useCreateThread();
  const updateThreadMutation = useUpdateThread();
  const deleteThreadMutation = useDeleteThread();
  
  // Computed loading state - only use isLoading, not isFetching
  // This prevents flickering during background refreshes
  const loading = threadsLoading || threadLoading || messagesLoading;
  
  // =========== EVENT HANDLERS ===========
  
  // Set active thread
  const handleSetActiveThread = useCallback((threadId: string) => {
    if (threadId && threads.some(t => t.id === threadId)) {
      setActiveThread(threadId);
      setSelectedThreadId(threadId);
    }
  }, [threads, setSelectedThreadId]);

  // Create new thread with extra protection against duplicate creation
  const handleNewChat = useCallback(async () => {
    // Check if we've recently tried to create a thread
    const attemptingCreation = sessionStorage.getItem('attemptingThreadCreation');
    if (attemptingCreation) {
      console.debug('[ChatContainer] Skipping thread creation - already attempting');
      return;
    }

    try {
      // Set a flag to prevent duplicate creation
      sessionStorage.setItem('attemptingThreadCreation', 'true');
      
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
    } finally {
      // Clear the creation flag after a delay to prevent immediate recreation
      setTimeout(() => {
        sessionStorage.removeItem('attemptingThreadCreation');
      }, 2000);
    }
  }, [createThreadMutation, navigate, setSelectedThreadId, toast]);

  // Sign out
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('[ChatContainer] Failed to sign out:', error);
    }
  }, [signOut, navigate]);

  // Delete thread
  const handleDeleteThread = useCallback(async (threadId: string) => {
    try {
      setIsThreadDeletion(true);
      
      const threadIndex = threads.findIndex(t => t.id === threadId);
      const isActiveThread = activeThread === threadId;
      
      await deleteThreadMutation.mutateAsync(threadId);
      
      if (isActiveThread) {
        if (threads.length > 1) {
          const nextThreadIndex = threadIndex > 0 ? threadIndex - 1 : (threadIndex < threads.length - 1 ? threadIndex + 1 : -1);
          
          if (nextThreadIndex >= 0) {
            const nextThreadId = threads[nextThreadIndex].id;
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
  }, [activeThread, deleteThreadMutation, handleNewChat, navigate, threads, setSelectedThreadId]);

  // Rename thread
  const handleRenameThread = useCallback(async (threadId: string, newTitle: string) => {
    try {
      await updateThreadMutation.mutateAsync({ id: threadId, title: newTitle });
    } catch (error) {
      console.error('[ChatContainer] Failed to rename thread:', error);
    }
  }, [updateThreadMutation]);

  // Refresh messages
  const handleRefresh = useCallback(() => {
    handleRefreshMessages();
  }, [handleRefreshMessages]);

  // =========== EFFECTS ===========
  
  // Handle URL thread ID changes
  useEffect(() => {
    if (urlThreadId && urlThreadId !== activeThread) {
      console.debug(`[ChatContainer] URL thread ID changed to ${urlThreadId}`);
      
      // Check if this thread exists
      if (threads.some(t => t.id === urlThreadId)) {
        setActiveThread(urlThreadId);
        setSelectedThreadId(urlThreadId);
      } else {
        console.debug(`[ChatContainer] Thread ${urlThreadId} not found, redirecting`);
        
        // If thread doesn't exist but we have other threads, go to first thread
        if (threads.length > 0) {
          const firstThread = threads[0];
          navigate(`/chat/${firstThread.id}`, { replace: true });
        } else {
          // Otherwise create a new thread
          handleNewChat();
        }
      }
    }
  }, [urlThreadId, threads, activeThread, navigate, setSelectedThreadId, handleNewChat]);
  
  // Set up initial thread with stronger protection
  useEffect(() => {
    // Create a reference to track if this effect has initiated thread creation
    const effectId = Math.random().toString(36).substring(7);
    
    const ensureActiveThread = async () => {
      // Skip if we're already handling a thread or another instance is creating
      if (activeThread || urlThreadId || hasInitializedRef.current || isThreadDeletion) {
        return;
      }
      
      // Skip if threads are still loading
      if (threadsLoading) {
        return;
      }
      
      // Double-check if threads have been loaded and we've initialized
      if (hasInitializedRef.current) {
        return;
      }
      
      console.debug(`[ChatContainer:${effectId}] Ensuring active thread`);
      
      // Mark initialization early to prevent race conditions
      hasInitializedRef.current = true;
      
      // If we have threads, set the first one as active
      if (threads.length > 0) {
        const firstThread = threads[0];
        console.debug(`[ChatContainer:${effectId}] Setting first thread as active: ${firstThread.id}`);
        
        setActiveThread(firstThread.id);
        setSelectedThreadId(firstThread.id);
        navigate(`/chat/${firstThread.id}`, { replace: true });
      } else {
        // If no threads, create one with protection against duplicates
        console.debug(`[ChatContainer:${effectId}] No threads found, creating new thread`);
        
        // Set a flag in sessionStorage to prevent duplicate creation attempts
        if (!sessionStorage.getItem('attemptingThreadCreation')) {
          sessionStorage.setItem('attemptingThreadCreation', 'true');
          await handleNewChat();
        } else {
          console.debug(`[ChatContainer:${effectId}] Skipping thread creation - already in progress`);
        }
      }
    };
    
    ensureActiveThread();
    
    return () => {
      // Cleanup function - can be used to cancel operations if needed
    };
  }, [activeThread, urlThreadId, threads, threadsLoading, navigate, setSelectedThreadId, handleNewChat, isThreadDeletion]);
  
  // =========== RENDER ===========
  
  // Handle empty state or loading
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Final rendering of chat interface
  return (
    <PageContainer>
      <ChatInterface
        threadId={stableThreadId}
        messages={messages}
        loading={loading}
        loadingTimeout={false}
        onSend={handleSendMessage}
        onRefresh={handleRefresh}
        messageCount={messageCount}
        messageLimit={messageLimit}
        preservedMessage={messagePreserved || preservedMessage}
        showPaywall={showPaywall}
        onToggleSidebar={() => setIsExpanded(!isExpanded)}
        isSidebarOpen={isExpanded}
        isDesktop={isDesktop}
        isGenerating={isGenerating}
        onClosePaywall={handleClosePaywall}
      />
    </PageContainer>
  );
}

// Default export for lazy loading
export default ChatContainer; 