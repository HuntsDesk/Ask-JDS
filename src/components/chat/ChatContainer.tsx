import { useEffect, useState, useRef, useContext } from 'react';
import { useAuth } from '@/lib/auth';
import { useThreads } from '@/hooks/use-threads';
import { useMessages } from '@/hooks/use-messages';
import { ChatInterface } from './ChatInterface';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SelectedThreadContext, SidebarContext } from '@/App';
import { useTheme } from '@/lib/theme-provider';

export function ChatContainer() {
  // Move all the chat-specific logic from ChatLayout to here
  const { user, signOut } = useAuth();
  const { selectedThreadId, setSelectedThreadId } = useContext(SelectedThreadContext);
  const { isExpanded, setIsExpanded, isMobile } = useContext(SidebarContext);
  const { theme } = useTheme(); // Add theme context
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [activeThreadTitle, setActiveThreadTitle] = useState<string>('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);  // Start with loading state to avoid flashing content
  const [contentReady, setContentReady] = useState(false); // New state to track when content is fully ready
  const [sending, setSending] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isThreadDeletion, setIsThreadDeletion] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isPinnedSidebar, setIsPinnedSidebar] = useState(false);
  
  const navigate = useNavigate();
  const params = useParams<{ threadId?: string }>();
  const [searchParams] = useSearchParams();
  
  const threadId = params.threadId || null;
  const initialTitle = threadId ? searchParams.get('title') || 'New Chat' : 'New Chat';

  // Ensure dark mode class is applied to root based on theme
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
  }, [theme]);

  const {
    threads: originalThreads,
    loading: originalThreadsLoading,
    createThread,
    updateThread,
    deleteThread,
    refetchThreads
  } = useThreads();

  const { toast, dismiss } = useToast();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const messagesTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const isDesktop = !isMobile;

  // Create a callback for updating thread titles
  const handleThreadTitleGenerated = async (title: string) => {
    if (activeThread) {
      console.log(`Updating thread title to "${title}" after 2 messages`);
      await updateThread(activeThread, { title });
    }
  };

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

  // MESSAGES HANDLING LOGIC - Must be defined before it's used in the loading state effect!
  const messagesResult = useMessages(
    activeThread, 
    undefined, 
    handleThreadTitleGenerated
  );
  const threadMessages = messagesResult?.messages || [];
  const messagesLoading = messagesResult?.loading || false;
  const isGenerating = messagesResult?.isGenerating || false;
  const showPaywall = messagesResult?.showPaywall || false;
  const handleClosePaywall = messagesResult?.handleClosePaywall;
  const messageCount = messagesResult?.messageCount || 0;
  const messageLimit = messagesResult?.messageLimit || 0;
  const preservedMessage = messagesResult?.preservedMessage;
  
  // Track when content is fully ready to display
  useEffect(() => {
    // First, check if we're still in any loading state
    const isStillLoading = 
      originalThreadsLoading || 
      (activeThread && messagesLoading) ||
      isGenerating;
      
    // Next, check if we have an active thread selected
    const hasActiveThread = !!activeThread;
    
    // Finally, check if we have messages or if this is a new thread (which might legitimately have no messages)
    const hasValidContent = threadMessages.length > 0 || (hasActiveThread && !messagesLoading);
    
    // Only set content as ready when everything is loaded and we have valid content to show
    if (!isStillLoading && hasActiveThread && hasValidContent) {
      console.log('ChatContainer: Content is fully ready to display');
      
      // Set content ready immediately without delay
      setContentReady(true);
      setLoading(false);
    } else {
      // If we're not fully ready, make sure loading is true and contentReady is false
      setLoading(true);
      setContentReady(false);
    }
  }, [originalThreadsLoading, activeThread, messagesLoading, isGenerating, threadMessages.length]);
  
  // Initialize the thread from URL or global state when component mounts
  useEffect(() => {
    // Make sure we have threads loaded
    if (originalThreads.length === 0 || originalThreadsLoading) {
      console.log('ChatContainer: Threads not loaded yet, waiting');
      return;
    }
    
    console.log('ChatContainer: Initializing thread selection with priorities:');
    console.log('1. URL Param:', threadId);
    console.log('2. Global Context:', selectedThreadId);
    console.log('3. Current Active:', activeThread);
    
    // PRIORITY 1: URL parameter (highest priority)
    if (threadId) {
      const threadExists = originalThreads.some(t => t.id === threadId);
      if (threadExists) {
        console.log('ChatContainer: Using thread ID from URL:', threadId);
        setActiveThread(threadId);
        // Also update global context
        if (selectedThreadId !== threadId) {
          setSelectedThreadId(threadId);
        }
        return;
      } else {
        console.warn('ChatContainer: Thread from URL not found:', threadId);
      }
    } else if (selectedThreadId) {
      // SPECIAL CASE: No threadId in URL, but we have a selectedThreadId
      // This happens when "New Chat" is created but we're on /chat without ID
      console.log('ChatContainer: No thread ID in URL but we have selected thread:', selectedThreadId);
      const threadExists = originalThreads.some(t => t.id === selectedThreadId);
      if (threadExists) {
        console.log('ChatContainer: Found thread in list, navigating and setting active');
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
        console.log('ChatContainer: Using thread ID from global context:', selectedThreadId);
        setActiveThread(selectedThreadId);
        
        // Update URL if needed
        if (threadId !== selectedThreadId) {
          console.log('ChatContainer: Updating URL to match global context:', selectedThreadId);
          navigate(`/chat/${selectedThreadId}`, { replace: true });
        }
        return;
      } else {
        console.warn('ChatContainer: Thread from global context not found:', selectedThreadId);
      }
    }
    
    // PRIORITY 3: Current active thread state
    if (activeThread) {
      const threadExists = originalThreads.some(t => t.id === activeThread);
      if (threadExists) {
        console.log('ChatContainer: Keeping current active thread:', activeThread);
        
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
      console.log('ChatContainer: Nothing selected, defaulting to first thread:', firstThreadId);
      setActiveThread(firstThreadId);
      setSelectedThreadId(firstThreadId);
      navigate(`/chat/${firstThreadId}`, { replace: true });
    }
  }, [originalThreads, originalThreadsLoading, threadId, selectedThreadId, activeThread, navigate, setSelectedThreadId]);

  // Change active thread when a new thread is selected
  const handleSetActiveThread = (threadId: string) => {
    console.log('ChatContainer: handleSetActiveThread called with thread ID:', threadId);
    if (threadId && originalThreads.some(t => t.id === threadId)) {
      // When changing threads, reset the loading states
      setContentReady(false);
      setLoading(true);
      setActiveThread(threadId);
      setSelectedThreadId(threadId);
    } else {
      console.log('ChatContainer: Attempted to set invalid thread ID:', threadId);
    }
  };

  // Create a new thread
  const handleNewChat = async () => {
    try {
      console.log('ChatContainer: Creating new thread');
      
      // Clear any stale creation flags
      sessionStorage.removeItem('attemptingThreadCreation');
      
      // Reset loading states for new thread creation
      setContentReady(false);
      setLoading(true);
      
      toast({
        title: "Creating new conversation",
        description: "This might take a moment due to slow database response times.",
        variant: "default",
      });
      
      // Create the thread
      const thread = await createThread();
      if (thread) {
        console.log('ChatContainer: Thread created successfully:', thread.id);
        setActiveThread(thread.id);
        setSelectedThreadId(thread.id);
        navigate(`/chat/${thread.id}`, { replace: true });
      } else {
        console.error('ChatContainer: Thread creation returned null');
        toast({
          title: "Error creating conversation",
          description: "We couldn't create a new conversation. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to create new thread:', error);
      toast({
        title: "Error creating conversation",
        description: "We couldn't create a new conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  // Handle thread deletion
  const handleDeleteThread = async (threadId: string) => {
    try {
      console.log('ChatContainer: Deleting thread:', threadId);
      setIsThreadDeletion(true);
      
      // Get the index of the thread to delete
      const threadIndex = originalThreads.findIndex(t => t.id === threadId);
      const isActiveThread = activeThread === threadId;
      
      // Delete the thread
      await deleteThread(threadId);
      
      // If we deleted the active thread, navigate to another thread
      if (isActiveThread) {
        // Reset loading states when navigating away from deleted thread
        setContentReady(false);
        setLoading(true);
        
        if (originalThreads.length > 1) {
          // Find the next thread to navigate to
          // Use the thread before if available, otherwise use the thread after
          const nextThreadIndex = threadIndex > 0 ? threadIndex - 1 : (threadIndex < originalThreads.length - 1 ? threadIndex + 1 : -1);
          
          if (nextThreadIndex >= 0) {
            const nextThreadId = originalThreads[nextThreadIndex].id;
            console.log('ChatContainer: Navigating to next thread after deletion:', nextThreadId);
            setActiveThread(nextThreadId);
            setSelectedThreadId(nextThreadId);
            navigate(`/chat/${nextThreadId}`, { replace: true });
          } else {
            // If there are no more threads, navigate to the chat page without a thread
            console.log('ChatContainer: No more threads after deletion, navigating to /chat');
            setActiveThread(null);
            setSelectedThreadId(null);
            navigate('/chat', { replace: true });
          }
        } else {
          // If there are no more threads, create a new one
          console.log('ChatContainer: No more threads after deletion, creating a new one');
          handleNewChat();
        }
      }
      
      setIsThreadDeletion(false);
    } catch (error) {
      console.error('Failed to delete thread:', error);
      setIsThreadDeletion(false);
    }
  };

  // Handle thread renaming
  const handleRenameThread = async (threadId: string, newTitle: string) => {
    try {
      console.log(`Renaming thread ${threadId} to "${newTitle}"`);
      await updateThread(threadId, { title: newTitle });
    } catch (error) {
      console.error('Failed to rename thread:', error);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Return the chat interface component
  return (
    <ChatInterface 
      threadId={activeThread}
      messages={contentReady ? threadMessages : []}  // Only show messages when fully ready
      loading={loading}
      loadingTimeout={messagesTimeoutIdRef.current !== null && messagesLoading}
      onSend={messagesResult?.sendMessage}
      onRefresh={handleRefresh}
      messageCount={messageCount}
      messageLimit={messageLimit}
      preservedMessage={preservedMessage}
      showPaywall={showPaywall}
      onToggleSidebar={() => setIsExpanded(true)}
      isSidebarOpen={isExpanded}
      isDesktop={isDesktop}
      isGenerating={isGenerating}
    />
  );
} 