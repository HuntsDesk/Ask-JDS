import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { realtimeManager } from '@/lib/realtime-manager';
import type { Thread, Message } from '@/types';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { debugLogger } from '@/lib/debug-logger';
import { useAuthTiming } from './use-auth-timing';

// Query keys for better cache management
export const threadKeys = {
  all: ['threads'] as const,
  thread: (id: string) => [...threadKeys.all, id] as const,
  messages: (threadId: string) => [...threadKeys.thread(threadId), 'messages'] as const,
};

// Hook to fetch all threads
export function useThreads() {
  const { session } = useAuth();
  const authTiming = useAuthTiming({ 
    timeout: 1500, 
    debugContext: 'useThreads' 
  });
  
  // Add debugging for session and timing state
  debugLogger.info('api', `useThreads hook state: ${authTiming.timingDebugInfo}, hasSession=${!!session}`);
  
  return useQuery<Thread[]>({
    queryKey: threadKeys.all,
    queryFn: async () => {
      if (!authTiming.userId) return [];
      
      debugLogger.info('api', `Starting threads query for user: ${authTiming.userId} (auth timing: ${authTiming.timingDebugInfo})`);
      
      // Skip redundant session validation - auth timing already ensures we're ready
      // The hanging getSession() call was causing the issue
      
      // Execute the actual query
      debugLogger.info('api', 'Executing threads query');
      
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('user_id', authTiming.userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        debugLogger.error('api', `Error fetching threads: ${error.message}`, {
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      debugLogger.info('api', `Successfully fetched ${data?.length || 0} threads`);
      return data as Thread[];
    },
    // Critical: Use hybrid auth timing approach to prevent race conditions
    enabled: authTiming.isAuthReady,
    // Use placeholderData instead of keepPreviousData in v5
    placeholderData: keepData => keepData as Thread[] | undefined,
    // Cache for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Important: Don't refetch on window focus to prevent flashing
    refetchOnWindowFocus: false,
    // Reduce unnecessary network requests
    refetchOnMount: false,
    // Add retry configuration
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
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
  const { session } = useAuth();
  const authTiming = useAuthTiming({ 
    timeout: 1500, 
    debugContext: 'useMessages' 
  });
  
  return useQuery<Message[]>({
    queryKey: threadKeys.messages(threadId || 'null'),
    queryFn: async () => {
      if (!threadId) return [];
      
      debugLogger.info('api', `Fetching messages for thread: ${threadId} (auth timing: ${authTiming.timingDebugInfo})`);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      
      if (error) {
        debugLogger.error('api', `Error fetching messages: ${error.message}`, error);
        throw error;
      }
      
      debugLogger.info('api', `Successfully fetched ${data?.length || 0} messages`);
      return data as Message[];
    },
      // Don't fetch if no thread ID is provided or auth not ready
      enabled: !!threadId && authTiming.isAuthReady,
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
    
    const unsubscribe = realtimeManager.subscribe(
      'threads-realtime',
      {
        table: 'threads',
        onInsert: (payload) => {
          console.log('[useThreadsRealtime] Invalidating threads query due to INSERT');
          queryClient.invalidateQueries({ queryKey: threadKeys.all });
        },
                          onDelete: (payload) => {
          console.log('[useThreadsRealtime] Invalidating threads query due to DELETE');
          queryClient.invalidateQueries({ queryKey: threadKeys.all });
          const oldRecord = payload.old as any;
          if (oldRecord && oldRecord.id) {
            queryClient.invalidateQueries({ queryKey: threadKeys.thread(oldRecord.id) });
          }
         },
         onUpdate: (payload) => {
          console.log('[useThreadsRealtime] Thread UPDATE received:', payload.new);
          
          const newRecord = payload.new as Thread;
          if (!newRecord || !newRecord.id) return;
          
          // Update the thread in the cache directly
          const previousThreads = queryClient.getQueryData<Thread[]>(threadKeys.all) || [];
          
          if (previousThreads.length > 0) {
            // Update threads list
            queryClient.setQueryData(
              threadKeys.all,
              previousThreads.map(thread => 
                thread.id === newRecord.id ? newRecord : thread
              )
            );
            
            // Update individual thread if it exists in the cache
            if (queryClient.getQueryData(threadKeys.thread(newRecord.id))) {
              queryClient.setQueryData(threadKeys.thread(newRecord.id), newRecord);
            }
            
            console.log('[useThreadsRealtime] Thread cache updated for:', newRecord.id);
          } else {
            console.log('[useThreadsRealtime] No threads in cache, invalidating queries');
            queryClient.invalidateQueries({ queryKey: threadKeys.all });
          }
        }
      },
      user.id
    );
      
    return () => {
      console.log('[useThreadsRealtime] Cleaning up realtime subscription');
      unsubscribe();
    };
  }, [user, queryClient]);
} 