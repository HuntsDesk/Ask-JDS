import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase, logError } from '@/lib/supabase';
import { Message } from '@/types';
import { createAIProvider } from '@/lib/ai/provider-factory';
import { useCloseContext } from '@/contexts/close-context';
import { validateSessionToken, handleSessionExpiration } from '@/lib/auth';
import {
  getUserMessageCount,
  incrementUserMessageCount,
  getLifetimeMessageCount,
  hasActiveSubscription
} from '@/lib/subscription';
import { useSettings } from './use-settings';
import { usePaywall } from '@/contexts/paywall-context';
import { useAuth } from '@/lib/auth';
import { AIProvider } from '@/types/ai';

// Free tier message limit
export const FREE_MESSAGE_LIMIT = 20;

// Default return object to ensure consistent hook return shape
const defaultUseMessagesReturn = {
  messages: [] as Message[],
  loading: false,
  loadingTimeout: null as NodeJS.Timeout | null,
  isGenerating: false,
  sendMessage: async (_content: string) => null,
  refreshMessages: async () => {},
  showPaywall: false,
  handleClosePaywall: () => {},
  messageCount: 0,
  lifetimeMessageCount: 0,
  messageLimit: FREE_MESSAGE_LIMIT,
  isSubscribed: false,
  preservedMessage: null as string | null
};

export function useMessages(threadId: string | null, onFirstMessage?: (message: string) => void, onThreadTitleGenerated?: (title: string) => Promise<void>) {
  // Keep track of the last valid threadId to avoid hook order issues
  const lastValidThreadIdRef = useRef<string | null>(null);
  
  // Track the last fetched threadId to prevent infinite refreshes
  const lastFetchedThreadId = useRef<string | null>(null);
  
  // Create a ref to keep track of message IDs we've already added
  const addedMessageIds = useRef(new Set<string>());
  
  // Create a ref to keep track of if we need to generate a thread title
  const isFirstMessageRef = useRef(true);
  
  // Create a ref to count user messages
  const userMessageCountRef = useRef(0);
  
  // General state 
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [lifetimeMessageCount, setLifetimeMessageCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Create refs for the AI provider and toast timeout
  const aiProvider = useRef<AIProvider>(createAIProvider());
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // For managing paywall visibility
  const [showPaywall, setShowPaywall] = useState(false);
  const [preservedMessage, setPreservedMessage] = useState<string | null>(null);
  
  // Get the toast function
  const { toast, dismiss } = useToast();
  
  // Access close context for handling session expiration
  const { setOnClose } = useCloseContext();
  
  // Access the paywall context to control global paywall active flag
  const { setPaywallActive } = usePaywall();
  
  // Get the settings
  const { settings } = useSettings();
  
  // Get the auth context
  const { signOut, user } = useAuth();

  // Update the last valid threadId ref
  useEffect(() => {
    if (threadId) {
      lastValidThreadIdRef.current = threadId;
    }
  }, [threadId]);

  // Update the AI provider when settings change
  useEffect(() => {
    if (settings) {
      aiProvider.current = createAIProvider(settings);
    }
  }, [settings]);

  // Load user data (message count and subscription status) on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const count = await getUserMessageCount();
        setMessageCount(count);
        
        const lifetimeCount = await getLifetimeMessageCount();
        setLifetimeMessageCount(lifetimeCount);
        
        const subscription = await hasActiveSubscription();
        setIsSubscribed(subscription);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Function to generate a thread title based on user messages
  const generateThreadTitle = async (userMessages: Message[]): Promise<string> => {
    if (!aiProvider.current || userMessages.length === 0) {
      return 'New Chat';
    }
    
    try {
      const firstUserMessage = userMessages[0]?.content || '';
      const title = await aiProvider.current.generateThreadTitle(firstUserMessage);
      return title || 'New Chat';
    } catch (error) {
      console.error('Error generating thread title:', error);
      return 'New Chat';
    }
  };

  // Check if the user has reached their message limit
  const checkMessageLimit = useCallback(async (content: string) => {
    if (!user) return false;
    
    try {
      const count = await getUserMessageCount(user.id);
      const hasReachedLimit = count >= FREE_MESSAGE_LIMIT;
      
      if (hasReachedLimit) {
        console.log(`User has reached message limit (${count}/${FREE_MESSAGE_LIMIT})`);
        
        // Check if user has an active subscription - using user.id directly
        const hasSubscription = await hasActiveSubscription(user.id);
        
        if (!hasSubscription) {
          console.log('User has reached message limit');
          // Save the message they were trying to send
          setPreservedMessage(content);
          setShowPaywall(true);
          return true;
        }
        
        // User has subscription, bypassing message limit
        console.log('User has subscription, bypassing message limit');
        return false;
      }
      
      return false;
    } catch (err) {
      console.error('Error checking message limit:', err);
      return false;
    }
  }, [user]);

  // Function to refresh messages - defining with stable identity
  const refreshMessages = useCallback(async () => {
    // Don't refresh if no thread ID
    if (!threadId) {
      if (process.env.NODE_ENV === 'development') {
        console.debug("[useMessages] No thread ID, skipping refresh");
      }
      return;
    }

    // Force a refresh when threadId changes from last fetched thread ID
    const forceRefresh = lastFetchedThreadId.current !== threadId;
    
    // Start loading state
    setLoading(true);
    
    // Update the last fetched threadId
    const previousThreadId = lastFetchedThreadId.current;
    lastFetchedThreadId.current = threadId;
    
    // Use a local reference to prevent race conditions
    const currentThreadId = threadId;
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[useMessages] ${forceRefresh ? 'Force refreshing' : 'Refreshing'} messages for thread: ${currentThreadId} (previous: ${previousThreadId})`);
    }

    try {
      // Fetch messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', currentThreadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check if we're still on the same thread before updating state
      if (threadId === currentThreadId) {
        // Set messages
        if (data) {
          // Update the set of message IDs we've seen
          data.forEach(msg => addedMessageIds.current.add(msg.id));
          
          // Update the user message counter for thread title generation
          userMessageCountRef.current = data.filter(msg => msg.role === 'user').length;
          
          // If we haven't sent any messages yet and there are no messages, flag for thread title generation
          isFirstMessageRef.current = userMessageCountRef.current === 0;
          
          setMessages(data);
          if (process.env.NODE_ENV === 'development') {
            console.debug(`[useMessages] Loaded ${data.length} messages for thread ${currentThreadId}`);
          }
        } else {
          // Set empty array if no data
          setMessages([]);
          if (process.env.NODE_ENV === 'development') {
            console.debug(`[useMessages] No messages found for thread ${currentThreadId}`);
          }
        }
      } else {
        console.debug(`[useMessages] Thread changed during fetch, discarding results for ${currentThreadId}, current thread is ${threadId}`);
      }
    } catch (error) {
      console.error('[useMessages] Error loading messages:', error);
      await logError(error, 'Load Messages');
      
      toast({
        title: 'Error',
        description: 'Failed to load messages. Please try refreshing the page.',
        variant: 'destructive',
      });
    } finally {
      // Only set loading to false if the thread ID hasn't changed
      if (threadId === currentThreadId) {
        setLoading(false);
      } else {
        console.debug(`[useMessages] Thread changed during fetch, not updating loading state`);
      }
    }
  }, [threadId, toast]);

  // Reset messages when threadId changes to prevent stale data showing
  useEffect(() => {
    if (threadId && threadId !== lastFetchedThreadId.current) {
      console.debug(`[useMessages] Thread ID changed from ${lastFetchedThreadId.current} to ${threadId}, forcing full refresh`);
      
      // Clear messages immediately when switching threads
      setMessages([]);
      
      // Make sure we're in loading state
      setLoading(true);
      
      // Reset the added message IDs set
      addedMessageIds.current.clear();
      
      // Immediately update the last fetched thread ID to prevent duplicate refreshes
      lastFetchedThreadId.current = threadId;
      
      // Force a refresh of messages with a slight delay to ensure state updates have completed
      setTimeout(() => {
        refreshMessages();
      }, 50);
    }
  }, [threadId, refreshMessages]);

  // Prevent infinite message refresh by ensuring we only reload if threadId changes.
  // This guards against infinite loops and unnecessary network requests.
  useEffect(() => {
    // Always refresh messages when threadId changes
    refreshMessages();
  }, [threadId, refreshMessages]);

  // Set up and clean up real-time Supabase subscription for messages on threadId change
  useEffect(() => {
    if (!threadId) return;
    
    // Subscribe to real-time message inserts for this thread
    // Use a generic 'any' type to avoid TypeScript errors with RealtimeChannel
    let channel: any = null;
    
    try {
      channel = supabase
        .channel(`messages:thread_id=eq.${threadId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `thread_id=eq.${threadId}`
          },
          async (payload) => {
            const newMessage = payload.new as Message;
            if (process.env.NODE_ENV === 'development') {
              console.debug('[useMessages] Real-time message received:', newMessage.id);
            }
            
            // Only process if we haven't seen this message ID before
            if (!addedMessageIds.current.has(newMessage.id)) {
              // Add to our tracking set immediately to prevent duplicate processing
              addedMessageIds.current.add(newMessage.id);
              
              // Update the user message counter for title generation
              if (newMessage.role === 'user') {
                userMessageCountRef.current++;
              }
              
              // Use a more robust update logic that preserves optimistic messages until replaced
              setMessages(currentMessages => {
                // 1. Find any optimistic message that this server message might be replacing
                // Use a time window to ensure we're matching the correct message
                const matchingOptimistic = currentMessages.find(msg => 
                  msg.id.startsWith('optimistic-') && 
                  msg.role === newMessage.role &&
                  msg.content === newMessage.content &&
                  // Add a 10-second window to match created_at times
                  Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 10000
                );
                
                // 2. Remove any messages with the same server ID (deduplication)
                const withoutDuplicates = currentMessages.filter(msg => msg.id !== newMessage.id);
                
                // 3. If we found a matching optimistic message, remove it
                let withoutOptimistic = withoutDuplicates;
                if (matchingOptimistic) {
                  withoutOptimistic = withoutDuplicates.filter(msg => msg.id !== matchingOptimistic.id);
                }
                
                // 4. Add the server message and ensure proper time-based ordering
                const updatedMessages = [...withoutOptimistic, newMessage];
                return updatedMessages.sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              });
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('[useMessages] Error setting up real-time subscription:', error);
    }
    
    // Cleanup on threadId change or unmount
    return () => {
      if (channel) {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.debug('[useMessages] Unsubscribing from real-time messages');
          }
          // Use supabase.removeChannel for proper cleanup
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('[useMessages] Error unsubscribing from real-time subscription:', error);
        }
      }
    };
  }, [threadId]);

  // Show toast after delay if loading takes too long
  useEffect(() => {
    if (loading && threadId) {
      // Clear any existing timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      
      // Set a timeout to show a toast if loading takes too long
      toastTimeoutRef.current = setTimeout(() => {
        toast({
          title: 'Taking longer than expected',
          description: 'Messages are still loading. Please wait a moment...',
        });
      }, 3000);
    } else if (!loading && toastTimeoutRef.current) {
      // Clear the timeout if we're no longer loading
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    
    // Clean up on unmount
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [loading, threadId, toast]);

  // Handle closing the paywall
  const handleClosePaywall = useCallback(() => {
    // Reset the global paywall flag first
    setPaywallActive(false);
    
    // Keep preservedMessage in state so it can be used when the paywall is closed
    // This ensures it's still available for the ChatInterface component
    setShowPaywall(false);
    
    // We don't clear preservedMessage here because we need it to be picked up
    // by the ChatInterface component after the paywall is closed
  }, [setPaywallActive]);

  // Effect to set paywall state
  useEffect(() => {
    // Set the global flag whenever showPaywall changes
    setPaywallActive(showPaywall);
    
    // Clean up on unmount
    return () => {
      if (showPaywall) {
        setPaywallActive(false);
      }
    };
  }, [showPaywall, setPaywallActive]);

  // Moved original sendMessage logic here, to be run in the background
  const _handleMessageProcessingAndAIResponse = useCallback(async (
    content: string, 
    threadId: string, 
    user: any, // Supabase User type
    optimisticUserMessage: Message,
    initialMessagesState: Message[] // Pass messages state at time of send
  ) => {
    try {
      // Send user message to server
      const { data: userMessageData, error: userMessageError } = await supabase
        .from('messages')
        .insert({
          content,
          thread_id: threadId,
          role: 'user',
          user_id: user.id
        })
        .select()
        .single();

      if (userMessageError) throw userMessageError;

      // Update messages with real user message and track its ID
      if (userMessageData) {
        addedMessageIds.current.add(userMessageData.id);
        setMessages(prev => {
          const messagesCopy = [...prev];
          const optimisticIndex = messagesCopy.findIndex(msg => msg.id === optimisticUserMessage.id);
          const serverMessageExists = messagesCopy.some(msg => msg.id === userMessageData.id);

          if (serverMessageExists) {
            return messagesCopy.filter(msg => msg.id !== optimisticUserMessage.id);
          }
          if (optimisticIndex >= 0) {
            messagesCopy[optimisticIndex] = userMessageData;
            return messagesCopy;
          }
          return [...messagesCopy, userMessageData].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }

      // Increment user message count in database and update local state
      console.log('Incrementing message count after sending message');
      try {
        const newCount = await incrementUserMessageCount();
        console.log('Message count updated to:', newCount);
        setMessageCount(newCount);
        try {
          const newLifetimeCount = await getLifetimeMessageCount();
          setLifetimeMessageCount(newLifetimeCount);
        } catch (lifetimeError) {
          console.error('Failed to update lifetime count:', lifetimeError);
        }
      } catch (countError) {
        console.error('Failed to update message count:', countError);
      }
      
      userMessageCountRef.current++;

      // Generate AI response with conversation history (use initialMessagesState + optimistic message for context)
      // Ensure the optimistic message is part of the history for the AI.
      const conversationHistory = initialMessagesState.find(m => m.id === optimisticUserMessage.id) 
        ? initialMessagesState 
        : [...initialMessagesState, optimisticUserMessage];

      const aiResponse = await aiProvider.current.generateResponse(content, conversationHistory);
      
      // Send AI response to server
      const { data: aiMessageData, error: aiMessageError } = await supabase
        .from('messages')
        .insert({
          content: aiResponse,
          thread_id: threadId,
          role: 'assistant',
          user_id: user.id 
        })
        .select()
        .single();

      if (aiMessageError) throw aiMessageError;

      // If this is the first user message, call the onFirstMessage callback
      // Note: isFirstMessageRef might need to be re-evaluated based on initialMessagesState
      const currentIsFirstMessage = initialMessagesState.filter(msg => msg.role === 'user').length === 0;
      if (currentIsFirstMessage && onFirstMessage) {
        onFirstMessage(content);
        // isFirstMessageRef.current = false; // This ref is managed by refreshMessages, avoid direct set here
      }

      // Generate and update thread title after 1 user message
      if (userMessageCountRef.current === 1 && onThreadTitleGenerated) {
        try {
          const userMessagesForTitle = conversationHistory.filter(msg => msg.role === 'user');
          const generatedTitle = await generateThreadTitle(userMessagesForTitle);
          await onThreadTitleGenerated(generatedTitle);
          console.log(`Generated thread title after 1 message: ${generatedTitle}`);
        } catch (error) {
          console.error('Error updating thread title:', error);
        }
      }

      if (aiMessageData) {
        addedMessageIds.current.add(aiMessageData.id);
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === aiMessageData.id);
          if (exists) return prev;
          const newMessages = [...prev, aiMessageData];
          return newMessages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage.id));
      
      console.error('Error in _handleMessageProcessingAndAIResponse:', error);
      await logError(error, 'Background Message Processing');
      
      let errorMessage = 'Failed to process message. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes("Network connection to AI service was lost")) {
          errorMessage = "Network connection to AI service was lost. Please try again.";
        } else if (error.message.includes("Unable to generate AI response")) {
          errorMessage = error.message;
        }
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    toast, 
    dismiss, 
    onFirstMessage, 
    generateThreadTitle, 
    onThreadTitleGenerated, 
    // Removed dependencies that are now passed as arguments: messages (via initialMessagesState)
    // Retained global dependencies or those related to state updates within this hook
    aiProvider, // aiProvider is a ref, its .current might change
    settings, // aiProvider depends on settings
    setPaywallActive // Though not directly used, part of the broader context
  ]);

  const sendMessage = useCallback(async (content: string): Promise<Message | null> => {
    if (content.trim() === '') return null;
      
    // Check message limit before attempting to send
    const hasReachedLimit = await checkMessageLimit(content);
    if (hasReachedLimit) {
      console.log('User has reached message limit');
      return null;
    }
    
    if (!threadId || !aiProvider.current) return null;
    
    dismiss();
    
    try {
      const isValid = await validateSessionToken();
      if (!isValid) {
        console.error('🚫 Session token invalid during message sending');
        toast({
          title: 'Session expired',
          description: 'Your session has expired. Please sign in again.',
          variant: 'default',
        });
        await new Promise(resolve => setTimeout(resolve, 1500));
        handleSessionExpiration(content);
        return null;
      }
    } catch (error) {
      console.error('Error validating session token before sending message:', error);
    }
    
    setPaywallActive(true); // Prevent other toasts
    setMessageCount(await getUserMessageCount());
    setIsSubscribed(await hasActiveSubscription());

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error fetching user or no user found:', userError);
      toast({ title: 'Authentication Error', description: 'Could not verify user. Please sign in again.', variant: 'destructive'});
      // Optionally, trigger session expiration
      // handleSessionExpiration(content); 
      return null;
    }

    const optimisticUserMessage: Message = {
      id: `optimistic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content,
      thread_id: threadId,
      role: 'user',
      user_id: user.id,
      created_at: new Date().toISOString()
    };
      
    addedMessageIds.current.add(optimisticUserMessage.id);
    
    // Capture the current messages state to pass to the background processor
    // This ensures the AI context is fixed at the time of sending.
    let currentMessagesState: Message[] = [];
    setMessages(prev => {
      currentMessagesState = [...prev, optimisticUserMessage];
      return currentMessagesState;
    });
    setIsGenerating(true);

    // Call the background processing function without awaiting it
    _handleMessageProcessingAndAIResponse(
      content, 
      threadId, 
      user, 
      optimisticUserMessage,
      currentMessagesState // Pass the messages array that includes the optimistic one
    ).catch(async (error) => {
      // This catch is for unhandled promise rejections from the background task itself
      // Errors during the process should ideally be handled within _handleMessageProcessingAndAIResponse
      // (e.g., removing optimistic message, showing toast)
      console.error('Unhandled error from background message processing:', error);
      await logError(error, 'Unhandled Background Send Message');
      // Ensure optimistic message is cleared if something went really wrong
      setMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage.id));
      setIsGenerating(false); // Ensure loading state is reset
      toast({
        title: 'Processing Error',
        description: 'An unexpected error occurred while processing your message.',
        variant: 'destructive',
      });
    });

    return optimisticUserMessage; // Return optimistic message quickly
  // The dependencies for sendMessage itself are reduced, as much logic moved to _handleMessageProcessingAndAIResponse
  }, [
    threadId, 
    toast, 
    dismiss, 
    checkMessageLimit, 
    handleSessionExpiration, 
    setPaywallActive,
    _handleMessageProcessingAndAIResponse // Added the new internal function
  ]);

  // If no threadId (and if we've called all hooks), return our default object
  if (!threadId) {
    return defaultUseMessagesReturn;
  }

  // Create the return object with all functionality - ensure consistent keys
  const returnObject = {
    messages,
    // Only show loading for initial load, not during sending
    loading: loading && messages.length === 0,
    loadingTimeout: toastTimeoutRef.current,
    isGenerating,
    sendMessage,
    refreshMessages,
    showPaywall,
    handleClosePaywall,
    messageCount,
    lifetimeMessageCount,
    messageLimit: FREE_MESSAGE_LIMIT,
    isSubscribed,
    preservedMessage
  };

  return returnObject;
}