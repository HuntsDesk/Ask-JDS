import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase, logError } from '@/lib/supabase';
import { Message } from '@/types';
import { createAIProvider } from '@/lib/ai/provider-factory';
import { useCloseContext } from '@/contexts/close-context';
import { validateSessionToken } from '@/lib/auth';
import {
  getUserMessageCount,
  incrementUserMessageCount,
  getLifetimeMessageCount,
  hasActiveSubscription
} from '@/lib/subscription';
import { useSettings } from './use-settings';
import { usePaywall } from '@/contexts/paywall-context';
import { useAuth } from '@/lib/auth';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
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
  const { signOut } = useAuth();

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

  // Handle session expiration during message send
  const handleSessionExpiration = useCallback((messageContent: string) => {
    // Save the user's message to localStorage so it can be restored after login
    if (messageContent && messageContent.trim()) {
      localStorage.setItem('preservedMessage', messageContent);
      
      // Also save the thread ID so we can restore the right conversation
      if (threadId) {
        localStorage.setItem('preservedThreadId', threadId);
      }
    }
    
    // Sign the user out, which will redirect to login
    signOut(true);
  }, [signOut, threadId]);

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

  // Create a function to check if the user has reached the message limit
  const checkMessageLimit = useCallback(async (content: string) => {
    try {
      const count = await getUserMessageCount();
      const hasSubscription = await hasActiveSubscription();
      
      if (!hasSubscription && count >= FREE_MESSAGE_LIMIT) {
        console.log(`User has reached message limit (${count}/${FREE_MESSAGE_LIMIT})`);
        
        // Save the message they were trying to send
        setPreservedMessage(content);
        
        // Show the paywall
        setShowPaywall(true);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking message limit:', error);
      return false;
    }
  }, []);

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
    let subscription: { subscription?: { unsubscribe?: () => void } } | null = null;
    
    try {
      subscription = supabase
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
            
            // Only add the message if we haven't already added it
            if (!addedMessageIds.current.has(newMessage.id)) {
              addedMessageIds.current.add(newMessage.id);
              
              // Update the user message counter for title generation
              if (newMessage.role === 'user') {
                userMessageCountRef.current++;
              }
              
              setMessages(currentMessages => [...currentMessages, newMessage]);
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('[useMessages] Error setting up real-time subscription:', error);
    }
    
    // Cleanup on threadId change or unmount
    return () => {
      if (subscription && subscription.subscription && typeof subscription.subscription.unsubscribe === 'function') {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.debug('[useMessages] Unsubscribing from real-time messages');
          }
          subscription.subscription.unsubscribe();
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

  const sendMessage = useCallback(async (content: string) => {
    if (!threadId || !aiProvider.current) return null;
    
    // We'll track if this is a new conversation with no messages yet
    const isFirstLoadForThread = messages.length === 0;
    
    // Don't set loading to true when sending a message in an existing conversation
    // This prevents the "Loading messages..." indicator from appearing
    
    // First, immediately dismiss any existing toasts before any checks
    dismiss();
    
    // Validate session token before attempting to send message
    try {
      const isValid = await validateSessionToken();
      if (!isValid) {
        console.error('🚫 Session token invalid during message sending');
        
        // Show a brief toast to explain what's happening
        toast({
          title: 'Session expired',
          description: 'Your session has expired. Please sign in again.',
          variant: 'default',
        });
        
        // Wait a short moment for the toast to be visible
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Handle the session expiration (redirects to login), passing the message to preserve
        handleSessionExpiration(content);
        return null;
      }
    } catch (error) {
      console.error('Error validating session token before sending message:', error);
      // Continue with the send attempt, as the API call will handle auth errors
    }
    
    // Check if user has reached message limit
    const hasReachedLimit = await checkMessageLimit(content);
    if (hasReachedLimit) {
      console.log('User has reached message limit');
      return null;
    }
    
    if (!content.trim()) return null;

    // Set the global flag to prevent new toasts
    setPaywallActive(true);

    // Check if user has reached message limit - do this silently to avoid toast flashes
    const count = await getUserMessageCount();
    const hasSubscription = await hasActiveSubscription();
    
    // Immediately check for limit and show paywall if needed
    if (!hasSubscription && count >= FREE_MESSAGE_LIMIT) {
      // We've hit the limit - preserve message and show paywall without error toasts
      setPreservedMessage(content);
      
      // Ensure all toasts are dismissed before showing paywall
      dismiss();
      
      // Keep the paywall active flag on
      setPaywallActive(true);
      
      // Set a tiny timeout to ensure the dismiss operation completes before showing paywall
      setTimeout(() => {
        setShowPaywall(true);
      }, 0);
      
      return null;
    }
    
    // If we reached here, we're not hitting the limit - can allow toasts again
    setPaywallActive(false);
    
    // Update the message count 
    setMessageCount(count);
    setIsSubscribed(hasSubscription);

    let optimisticUserMessage: Message | null = null;

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user');

      // Create optimistic user message
      optimisticUserMessage = {
        id: `temp-${crypto.randomUUID()}`,
        content,
        thread_id: threadId,
        role: 'user',
        user_id: user.id,
        created_at: new Date().toISOString()
      };
      
      // Add optimistic message to UI
      setMessages(prev => [...prev, optimisticUserMessage!]);
      setIsGenerating(true);

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
        // Add the message ID to our tracking set
        addedMessageIds.current.add(userMessageData.id);
        
        // Replace the optimistic message with the real one, or skip if it already exists
        setMessages(prev => {
          // Check if we already have this message (not just the optimistic one)
          const alreadyExists = prev.some(msg => 
            msg.id === userMessageData.id && msg.id !== optimisticUserMessage!.id
          );
          
          if (alreadyExists) {
            // If it exists (not as the optimistic message), remove the optimistic one
            return prev.filter(msg => msg.id !== optimisticUserMessage!.id);
          }
          
          // Otherwise replace the optimistic message with the real one
          return prev.map(msg => 
            msg.id === optimisticUserMessage!.id ? userMessageData : msg
          );
        });
      }

      // Increment user message count in database and update local state
      console.log('Incrementing message count after sending message');
      try {
        // Use the improved incrementUserMessageCount function directly
        // This function uses database RPC functions with elevated privileges
        const newCount = await incrementUserMessageCount();
        console.log('Message count updated to:', newCount);
        setMessageCount(newCount);
        
        // Update lifetime count separately
        try {
          const newLifetimeCount = await getLifetimeMessageCount();
          setLifetimeMessageCount(newLifetimeCount);
        } catch (lifetimeError) {
          console.error('Failed to update lifetime count:', lifetimeError);
        }
      } catch (countError) {
        console.error('Failed to update message count:', countError);
      }
      
      // Increment local thread message counter
      userMessageCountRef.current++;

      // Generate AI response with conversation history
      const aiResponse = await aiProvider.current.generateResponse(content, messages);
      
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
      if (isFirstMessageRef.current && onFirstMessage) {
        onFirstMessage(content);
        isFirstMessageRef.current = false;
      }

      // Generate and update thread title after 1 user message
      if (userMessageCountRef.current === 1 && onThreadTitleGenerated) {
        try {
          // Get all user messages for context
          const userMessages = messages
            .filter(msg => msg.role === 'user')
            .concat(optimisticUserMessage ? [optimisticUserMessage] : []);
          
          // Generate title based on all user messages
          const generatedTitle = await generateThreadTitle(userMessages);
          await onThreadTitleGenerated(generatedTitle);
          console.log(`Generated thread title after 1 message: ${generatedTitle}`);
        } catch (error) {
          console.error('Error updating thread title:', error);
        }
      }

      // Add AI message to UI and track its ID
      if (aiMessageData) {
        // Check if this message is already in the list before adding it
        setMessages(prev => {
          // Check if message with this ID already exists
          const exists = prev.some(msg => msg.id === aiMessageData.id);
          if (exists) {
            return prev; // Don't add it again
          }
          
          // Add the message ID to our tracking set
          addedMessageIds.current.add(aiMessageData.id);
          return [...prev, aiMessageData];
        });
      }

      return userMessageData;
    } catch (error) {
      // Remove optimistic message on error
      if (optimisticUserMessage) {
        setMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage?.id));
      }
      
      console.error('Error sending message:', error);
      await logError(error, 'Send Message');
      
      // Display more specific error messages
      let errorMessage = 'Failed to send message. Please try again.';
      
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
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [threadId, messages, toast, dismiss, onFirstMessage, checkMessageLimit, generateThreadTitle, onThreadTitleGenerated, handleSessionExpiration, setPaywallActive]);

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