import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, logError } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Message } from '@/types';
import { queryKeys } from '@/lib/query-keys';
import { createAIProvider } from '@/lib/ai/provider-factory';
import { validateSessionToken } from '@/lib/auth';
import {
  getUserMessageCount,
  incrementUserMessageCount,
  hasActiveSubscription
} from '@/lib/subscription';
import { useSettings } from './use-settings';
import { useRef, useState, useCallback } from 'react';
import { usePaywall } from '@/contexts/paywall-context';
import { AIProvider } from '@/types/ai';

// Free tier message limit
export const FREE_MESSAGE_LIMIT = 20;

/**
 * Hook for fetching messages for a thread using React Query
 */
export function useQueryMessages(threadId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { setPaywallActive } = usePaywall();
  const queryClient = useQueryClient();
  
  // State
  const [showPaywall, setShowPaywall] = useState(false);
  const [preservedMessage, setPreservedMessage] = useState<string | null>(null);
  
  // Refs
  const aiProvider = useRef<AIProvider>(createAIProvider(settings));
  
  // Update the AI provider when settings change
  if (settings) {
    aiProvider.current = createAIProvider(settings);
  }
  
  // Query for messages
  const messagesQuery = useQuery<Message[]>({
    queryKey: queryKeys.threads.messages(threadId || 'null'),
    queryFn: async () => {
      if (!threadId) return [];
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data as Message[];
      } catch (error) {
        console.error('Error fetching messages:', error);
        await logError(error, 'Load Messages');
        throw error;
      }
    },
    enabled: !!threadId && !!user,
    // Disable automatic polling - rely on explicit invalidation instead
    refetchInterval: false,
    // Keep previous data to prevent UI flicker
    placeholderData: keepData => keepData as Message[] | undefined,
    // Prevent refetching on window focus to reduce unnecessary requests
    refetchOnWindowFocus: false,
    // Don't refetch on mount if we already have data
    refetchOnMount: false,
    onError: (error) => {
      console.error('Error loading messages:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to load messages. Please try refreshing.',
        variant: 'destructive',
      });
    }
  });
  
  // Query for user message count
  const messageCountQuery = useQuery({
    queryKey: queryKeys.user.messageCount,
    queryFn: getUserMessageCount,
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Query for subscription status
  const subscriptionQuery = useQuery({
    queryKey: queryKeys.user.subscription,
    queryFn: hasActiveSubscription,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Function to generate a thread title
  const generateThreadTitle = async (message: string): Promise<string> => {
    try {
      if (!aiProvider.current) return 'New Chat';
      
      const title = await aiProvider.current.generateThreadTitle(message);
      return title || 'New Chat';
    } catch (error) {
      console.error('Error generating thread title:', error);
      return 'New Chat';
    }
  };
  
  // Mutation for sending a message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!threadId || !user) {
        throw new Error('Cannot send message: Missing thread ID or user');
      }
      
      // Check for session validity
      const sessionValid = await validateSessionToken();
      if (!sessionValid) {
        throw new Error('Session expired');
      }
      
      // Check message limit
      const messageCount = await getUserMessageCount();
      const hasSubscription = await hasActiveSubscription();
      
      if (!hasSubscription && messageCount >= FREE_MESSAGE_LIMIT) {
        // Store message for after paywall
        setPreservedMessage(content);
        setPaywallActive(true);
        setShowPaywall(true);
        
        throw new Error('Message limit reached');
      }
      
      // Create user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        thread_id: threadId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      
      // Insert message to database
      const { error } = await supabase
        .from('messages')
        .insert(userMessage);
      
      if (error) throw error;
      
      // Increment message count
      await incrementUserMessageCount();
      
      // Get current messages to check if this is the first message
      const currentMessages = messagesQuery.data || [];
      const isFirstMessage = currentMessages.filter(m => m.role === 'user').length === 0;
      
      // Generate thread title if this is the first message
      let threadTitle = null;
      if (isFirstMessage) {
        threadTitle = await generateThreadTitle(content);
      }
      
      // Generate AI response
      const aiResponse = await aiProvider.current.generateResponse(content, currentMessages);
      
      // Insert AI response to database
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        thread_id: threadId,
        role: 'assistant',
        content: aiResponse,
        created_at: new Date().toISOString(),
      };
      
      const { error: aiError } = await supabase
        .from('messages')
        .insert(aiMessage);
      
      if (aiError) throw aiError;
      
      return { 
        userMessage, 
        aiMessage, 
        threadTitle,
        isFirstMessage 
      };
    },
    onMutate: async (content) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.threads.messages(threadId || 'null'),
      });
      
      // Get current messages
      const previousMessages = queryClient.getQueryData<Message[]>(
        queryKeys.threads.messages(threadId || 'null')
      ) || [];
      
      // Create optimistic user message
      const optimisticUserMessage: Message = {
        id: `temp-${Date.now()}`,
        thread_id: threadId!,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      
      // Add optimistic message to cache
      queryClient.setQueryData(
        queryKeys.threads.messages(threadId || 'null'),
        [...previousMessages, optimisticUserMessage]
      );
      
      // Return context
      return { previousMessages };
    },
    onError: (error, variables, context) => {
      console.error('Error sending message:', error);
      
      // Revert to previous messages on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.threads.messages(threadId || 'null'),
          context.previousMessages
        );
      }
      
      // Show error toast if it's not a message limit error
      if (error.message !== 'Message limit reached') {
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive',
        });
      }
    },
    onSuccess: async (data, variables, context) => {
      // Update thread title if this is the first message
      if (data.isFirstMessage && data.threadTitle) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.threads.thread(threadId || 'null'),
        });
        
        // Update thread in list
        const threads = queryClient.getQueryData(queryKeys.threads.all) || [];
        if (Array.isArray(threads)) {
          queryClient.setQueryData(
            queryKeys.threads.all,
            threads.map(thread => 
              thread.id === threadId ? { ...thread, title: data.threadTitle } : thread
            )
          );
        }
      }
      
      // Update message count
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.messageCount,
      });
      
      // Refetch messages to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: queryKeys.threads.messages(threadId || 'null'),
      });
    },
  });
  
  // Function to handle closing the paywall
  const handleClosePaywall = useCallback(() => {
    setShowPaywall(false);
    setPaywallActive(false);
  }, [setPaywallActive]);
  
  return {
    // Data
    messages: messagesQuery.data || [],
    messageCount: messageCountQuery.data || 0,
    messageLimit: FREE_MESSAGE_LIMIT,
    isSubscribed: subscriptionQuery.data || false,
    
    // Loading states
    isLoading: messagesQuery.isLoading,
    isFetching: messagesQuery.isFetching,
    isGenerating: sendMessageMutation.isPending,
    
    // Paywall
    showPaywall,
    preservedMessage,
    handleClosePaywall,
    
    // Actions
    sendMessage: sendMessageMutation.mutate,
    refreshMessages: () => {
      console.log('Manually refreshing messages');
      return queryClient.fetchQuery({
        queryKey: queryKeys.threads.messages(threadId || 'null'),
      });
    },
  };
} 