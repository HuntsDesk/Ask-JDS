import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Thread, Message } from '@/types';
import { useAuth } from '@/lib/auth';

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
      const { data, error } = await supabase
        .from('threads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Thread;
    },
    // When mutation succeeds, update the thread in the cache
    onSuccess: (updatedThread) => {
      // Update in the threads list
      const previousThreads = queryClient.getQueryData<Thread[]>(threadKeys.all) || [];
        queryClient.setQueryData(
        threadKeys.all, 
        previousThreads.map(thread => 
          thread.id === updatedThread.id ? updatedThread : thread
        )
      );
      
      // Update the individual thread cache
      queryClient.setQueryData(threadKeys.thread(updatedThread.id), updatedThread);
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