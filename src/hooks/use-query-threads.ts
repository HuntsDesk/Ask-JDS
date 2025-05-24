import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Thread, Message } from '@/types';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';

// Query keys for better cache management
export const threadKeys = {
  all: ['threads'] as const,
  thread: (id: string) => [...threadKeys.all, id] as const,
  messages: (threadId: string) => [...threadKeys.thread(threadId), 'messages'] as const,
};

// Hook to fetch all threads
export function useThreads() {
  const { user } = useAuth();
  const userId = user?.id;
  
  return useQuery<Thread[]>({
    queryKey: threadKeys.all,
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Thread[];
    },
      // Only fetch if we have a user
      enabled: !!userId,
    // Use placeholderData instead of keepPreviousData in v5
    placeholderData: keepData => keepData as Thread[] | undefined,
      // Cache for 2 minutes
      staleTime: 2 * 60 * 1000,
    // Important: Don't refetch on window focus to prevent flashing
    refetchOnWindowFocus: false,
    // Reduce unnecessary network requests
    refetchOnMount: false
  });
}

// Hook to fetch a specific thread with its messages
export function useThread(id: string | null) {
  return useQuery<Thread | null>({
    queryKey: threadKeys.thread(id || 'null'),
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Thread;
    },
      // Don't fetch if no ID is provided
      enabled: !!id,
    // Use placeholderData instead of keepPreviousData in v5
    placeholderData: keepData => keepData as Thread | null | undefined,
    // Cache for 2 minutes
    staleTime: 2 * 60 * 1000
  });
}

// Hook to fetch messages for a thread
export function useMessages(threadId: string | null) {
  return useQuery<Message[]>({
    queryKey: threadKeys.messages(threadId || 'null'),
    queryFn: async () => {
      if (!threadId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
      // Don't fetch if no thread ID is provided
      enabled: !!threadId,
      // Refetch messages periodically 
      refetchInterval: 10000, // Every 10 seconds
    // Use placeholderData instead of keepPreviousData in v5
    placeholderData: keepData => keepData as Message[] | undefined,
  });
}

// Mutation to create a new thread - updated to match original API
export function useCreateThread() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation<Thread, Error, string | undefined>({
    mutationFn: async (title: string = 'New Conversation') => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('threads')
        .insert([
          { 
            title, 
            user_id: user.id 
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data as Thread;
    },
      // When mutation succeeds, update the threads list
      onSuccess: (newThread) => {
        // Get the current threads from the cache
        const previousThreads = queryClient.getQueryData<Thread[]>(threadKeys.all) || [];
        
        // Update the cache with the new thread
        queryClient.setQueryData(threadKeys.all, [newThread, ...previousThreads]);
      },
  });
}

// Mutation to update a thread - adapted to match original API
export function useUpdateThread() {
  const queryClient = useQueryClient();
  
  return useMutation<Thread, Error, { id: string } & Partial<Thread>>({
    mutationFn: async ({ id, ...updates }) => {
      console.log(`[useUpdateThread] Mutation started for thread ${id}:`, updates);
      const { data, error } = await supabase
        .from('threads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`[useUpdateThread] Error updating thread ${id}:`, error);
        throw error;
      }
      console.log(`[useUpdateThread] Mutation successful for thread ${id}:`, data);
      return data as Thread;
    },
    // When mutation succeeds, update the thread in the cache
    onSuccess: (updatedThread) => {
      console.log(`[useUpdateThread] Updating cache for thread ${updatedThread.id}`);
      // Update in the threads list
      const previousThreads = queryClient.getQueryData<Thread[]>(threadKeys.all) || [];
      console.log(`[useUpdateThread] Previous threads count: ${previousThreads.length}`);
      
      queryClient.setQueryData(
        threadKeys.all, 
        previousThreads.map(thread => 
          thread.id === updatedThread.id ? updatedThread : thread
        )
      );
      
      // Update the individual thread cache
      queryClient.setQueryData(threadKeys.thread(updatedThread.id), updatedThread);
      console.log(`[useUpdateThread] Cache updated for thread ${updatedThread.id}`);
    },
  });
}

// Mutation to delete a thread - adapted to match original API
export function useDeleteThread() {
  const queryClient = useQueryClient();
  
  return useMutation<string, Error, string>({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    // When mutation succeeds, remove the thread from the cache
    onSuccess: (deletedId) => {
      // Remove from threads list
      const previousThreads = queryClient.getQueryData<Thread[]>(threadKeys.all) || [];
      queryClient.setQueryData(
        threadKeys.all, 
        previousThreads.filter(thread => thread.id !== deletedId)
      );
      
      // Invalidate the individual thread
      queryClient.removeQueries({ queryKey: threadKeys.thread(deletedId) });
      
      // Invalidate messages for this thread
      queryClient.removeQueries({ queryKey: threadKeys.messages(deletedId) });
      },
  });
}

// Hook to add realtime subscriptions to threads
export function useThreadsRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    console.log('[useThreadsRealtime] Setting up realtime subscription for threads');
    
    const channel = supabase
      .channel('threads-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'threads',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('[useThreadsRealtime] Received realtime update:', payload.eventType, payload);
        
        if (payload.eventType === 'INSERT') {
          console.log('[useThreadsRealtime] Invalidating threads query due to INSERT');
          queryClient.invalidateQueries({ queryKey: threadKeys.all });
        } else if (payload.eventType === 'DELETE') {
          console.log('[useThreadsRealtime] Invalidating threads query due to DELETE');
          queryClient.invalidateQueries({ queryKey: threadKeys.all });
          queryClient.invalidateQueries({ queryKey: threadKeys.thread(payload.old.id) });
        } else if (payload.eventType === 'UPDATE') {
          console.log('[useThreadsRealtime] Thread UPDATE received:', payload.new);
          
          // Update the thread in the cache directly
          const previousThreads = queryClient.getQueryData<Thread[]>(threadKeys.all) || [];
          
          if (previousThreads.length > 0) {
            // Update threads list
            queryClient.setQueryData(
              threadKeys.all,
              previousThreads.map(thread => 
                thread.id === payload.new.id ? payload.new as Thread : thread
              )
            );
            
            // Update individual thread if it exists in the cache
            if (queryClient.getQueryData(threadKeys.thread(payload.new.id))) {
              queryClient.setQueryData(threadKeys.thread(payload.new.id), payload.new);
            }
            
            console.log('[useThreadsRealtime] Thread cache updated for:', payload.new.id);
          } else {
            console.log('[useThreadsRealtime] No threads in cache, invalidating queries');
            queryClient.invalidateQueries({ queryKey: threadKeys.all });
          }
        }
      })
      .subscribe((status) => {
        console.log('[useThreadsRealtime] Subscription status:', status);
      });
      
    return () => {
      console.log('[useThreadsRealtime] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
} 