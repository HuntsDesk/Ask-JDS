import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Thread } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useThreads() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const initialLoadRef = useRef(true);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef(false);

  // Extract fetchThreads as a function at the hook level so it can be reused
  const fetchThreads = async () => {
    if (!user) {
      logger.debug('useThreads: No user, clearing threads');
      setThreads([]);
      setLoading(false);
      return;
    }

    // Prevent multiple concurrent fetches
    if (fetchingRef.current) {
      logger.debug('useThreads: Fetch already in progress, skipping');
      return;
    }

    fetchingRef.current = true;

    try {
      logger.debug('useThreads: Fetching threads for user', user.email);
      setLoading(true);
      
      let fetchTimeoutId: NodeJS.Timeout | null = null;
      let hasReceivedResponse = false;
      
      // Add a timeout promise to prevent hanging
      const fetchPromise = supabase
        .from('threads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      // Create a timeout promise that resolves with empty data
      const timeoutPromise = new Promise<{data: Thread[], error: null}>((resolve) => {
        fetchTimeoutId = setTimeout(() => {
          if (!hasReceivedResponse) {
            logger.warn('useThreads: Database fetch timed out after 10 seconds, returning empty threads');
            resolve({data: [], error: null});
          }
        }, 10000); // 10 seconds timeout
      });
      
      // Race the fetch against the timeout
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      hasReceivedResponse = true;
      if (fetchTimeoutId) clearTimeout(fetchTimeoutId);

      if (error) {
        logger.error('useThreads: Error fetching threads:', error);
        logger.error('Error details:', JSON.stringify(error));
        setError(error);
        
        // Show an error toast for a better user experience
        // Only show toast after a delay on initial load
        if (initialLoadRef.current) {
          // Clear any existing timeout
          if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
          }
          
          // Set a new timeout to show the toast after 2 seconds
          toastTimeoutRef.current = setTimeout(() => {
            toast({
              title: "Error loading conversations",
              description: "We encountered an error loading your conversations. Please try again.",
              variant: "destructive",
            });
            toastTimeoutRef.current = null;
          }, 2000);
        } else {
          toast({
            title: "Error loading conversations",
            description: "We encountered an error loading your conversations. Please try again.",
            variant: "destructive",
          });
        }
        
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      logger.debug('useThreads: Fetched', data?.length ?? 0, 'threads');
      
      if (data && Array.isArray(data)) {
        setThreads(data);
        
        // Clear safety timeout when data is successfully fetched
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
          safetyTimeoutRef.current = null;
        }
      } else {
        logger.warn('useThreads: Received non-array data from thread fetch:', data);
        setThreads([]);
      }
      
      setLoading(false);
      fetchingRef.current = false;
    } catch (err) {
      logger.error('useThreads: Error in fetchThreads:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
      fetchingRef.current = false;
      
      // Show an error toast (with delay on initial load)
      if (initialLoadRef.current) {
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        
        toastTimeoutRef.current = setTimeout(() => {
          toast({
            title: "Error loading conversations",
            description: "We encountered an error loading your conversations. Please try again.",
            variant: "destructive",
          });
          toastTimeoutRef.current = null;
        }, 2000);
      } else {
        toast({
          title: "Error loading conversations",
          description: "We encountered an error loading your conversations. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    logger.debug('useThreads: Initializing with user', user?.email);
    
    if (!user) {
      logger.debug('useThreads: No user, clearing threads');
      setThreads([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    // Safety timeout to prevent getting stuck in loading state
    safetyTimeoutRef.current = setTimeout(() => {
      if (isMounted && loading) {
        logger.warn('useThreads: Safety timeout triggered after 20 seconds');
        setLoading(false);
        setError(new Error('Loading conversations timed out. The conversations list will be refreshed automatically when connectivity improves.'));
        
        // Only show toast after a delay on initial load
        if (initialLoadRef.current) {
          // Clear any existing timeout
          if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
          }
          
          // Set a new timeout to show the toast after 2 seconds
          toastTimeoutRef.current = setTimeout(() => {
            toast({
              title: "Taking longer than expected",
              description: "We're having trouble loading your conversations. We'll keep trying in the background.",
              variant: "warning",
            });
            toastTimeoutRef.current = null;
          }, 2000);
        } else {
          toast({
            title: "Taking longer than expected", 
            description: "We're having trouble loading your conversations. We'll keep trying in the background.",
            variant: "warning",
          });
        }
        
        // Set up automatic retry after a delay
        setTimeout(() => {
          if (isMounted) {
            logger.debug('useThreads: Attempting to retry loading threads after timeout');
            fetchThreads();
          }
        }, 10000); // Retry after 10 seconds
      }
    }, 20000); // 20 seconds

    // Fetch threads initially
    fetchThreads();
    
    // After the first load, set initialLoadRef to false
    initialLoadRef.current = false;

    // Note: Realtime subscription is handled by useThreadsRealtime() in use-query-threads.ts
    // to avoid channel conflicts. This hook focuses on CRUD operations.

    return () => {
      logger.debug('useThreads: Cleaning up');
      isMounted = false;
      
      // Clear the safety timeout when component unmounts
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, [user, toast]); // Removed loading from dependency array

  const createThread = async () => {
    try {
      logger.debug('useThreads: Creating new thread');
      
      if (!user) {
        logger.error('useThreads: Cannot create thread without user');
        return null;
      }

      // Log user id for debugging
      logger.debug('useThreads: Creating thread for user', user.id);

      // Create a timeout promise that resolves to null
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          logger.warn('useThreads: Thread creation timed out after 8 seconds');
          resolve(null);
        }, 8000); // 8 second timeout
      });

      // Attempt to ensure profile exists first to address RLS issues
      try {
        logger.debug('useThreads: Ensuring profile exists');
        // Check if profile exists
        const profileCheck = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
          
        if (profileCheck.error) {
          logger.debug('useThreads: Profile not found, creating one');
          // Create a profile if it doesn't exist
          const profileResult = await supabase
            .from('profiles')
            .insert([{ id: user.id }])
            .select();
            
          logger.debug('useThreads: Profile creation result', profileResult);
        } else {
          logger.debug('useThreads: Profile exists, proceeding with thread creation');
        }
      } catch (err) {
        logger.error('useThreads: Error checking/creating profile:', err);
        // Continue anyway, the trigger we created should handle this
      }

      // Create the actual thread
      const threadPromise = supabase
        .from('threads')
        .insert([
          { 
            user_id: user.id,
            title: 'New Conversation'
          }
        ])
        .select()
        .single();

      // Race the thread creation against the timeout
      const result = await Promise.race([threadPromise, timeoutPromise]);
      
      // If result is null, it means the timeout won
      if (result === null) {
        toast({
          title: "Thread creation timeout",
          description: "Creating a new conversation is taking longer than expected. Please try again.",
          variant: "destructive",
        });
        return null;
      }
      
      const { data, error } = result;

      if (error) {
        logger.error('useThreads: Error creating thread:', error);
        
        // If we get an RLS error, try one more time after a delay
        if (error.message?.includes('row-level security') || error.code === '42501') {
          logger.debug('useThreads: Got RLS error, trying again after delay');
          toast({
            title: "Authentication sync issue",
            description: "We're fixing a sync issue. Trying again...",
            variant: "default",
          });
          
          // Wait 2 seconds and try again
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const retryResult = await supabase
            .from('threads')
            .insert([
              { 
                user_id: user.id,
                title: 'New Conversation'
              }
            ])
            .select()
            .single();
            
          if (retryResult.error) {
            logger.error('useThreads: Retry also failed:', retryResult.error);
            toast({
              title: "Error creating thread",
              description: "There was a problem with permissions. Please try signing out and back in.",
              variant: "destructive",
            });
            throw retryResult.error;
          }
          
          logger.debug('useThreads: Retry succeeded', retryResult.data);
          return retryResult.data as Thread;
        }
        
        toast({
          title: "Error creating thread",
          description: "There was a problem creating a new conversation. Please try again.",
          variant: "destructive",
        });
        throw error;
      }

      logger.debug('useThreads: Thread created successfully', data);
      return data as Thread;
    } catch (error) {
      logger.error('useThreads: Exception creating thread:', error);
      return null;
    }
  };

  const updateThread = async (id: string, updates: Partial<Thread>) => {
    try {
      logger.debug(`useThreads: Updating thread ${id}`, updates);
      
      if (!user) {
        logger.error('useThreads: Cannot update thread without user');
        return false;
      }

      // Create a timeout promise that resolves to a failure result
      const timeoutPromise = new Promise<{error: Error}>((resolve) => {
        setTimeout(() => {
          logger.warn(`useThreads: Thread update timed out after 6 seconds for thread ${id}`);
          resolve({error: new Error('Update timed out')});
        }, 6000); // 6 second timeout
      });

      // Update the thread
      const updatePromise = supabase
        .from('threads')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      // Race the update against the timeout
      const result = await Promise.race([updatePromise, timeoutPromise]);
      
      if ('error' in result && result.error) {
        // Check if this is our timeout error
        if (result.error instanceof Error && result.error.message === 'Update timed out') {
          logger.error('useThreads: Thread update timed out');
          toast({
            title: "Thread update timeout",
            description: "Updating the conversation is taking longer than expected.",
            variant: "warning",
          });
          return false;
        }
        
        // This is a regular database error
        logger.error('useThreads: Error updating thread:', result.error);
        toast({
          title: "Error updating thread",
          description: "There was a problem updating the conversation.",
          variant: "destructive",
        });
        return false;
      }

      logger.debug(`useThreads: Thread ${id} updated successfully`);
      return true;
    } catch (error) {
      logger.error('useThreads: Exception updating thread:', error);
      return false;
    }
  };

  const deleteThread = async (id: string) => {
    try {
      logger.debug(`useThreads: Deleting thread ${id}`);
      
      if (!user) {
        logger.error('useThreads: Cannot delete thread without user');
        return false;
      }

      // Create a timeout promise that resolves to a failure result
      const timeoutPromise = new Promise<{error: Error}>((resolve) => {
        setTimeout(() => {
          logger.warn(`useThreads: Thread deletion timed out after 6 seconds for thread ${id}`);
          resolve({error: new Error('Deletion timed out')});
        }, 6000); // 6 second timeout
      });

      // Save the current threads for potential rollback
      const previousThreads = [...threads];
      
      // Optimistically update the local state immediately
      setThreads(currentThreads => currentThreads.filter(thread => thread.id !== id));

      // Delete the thread - we don't need to set loading true here since we're using optimistic updates
      const deletePromise = supabase
        .from('threads')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      // Race the deletion against the timeout
      const result = await Promise.race([deletePromise, timeoutPromise]);
      
      if ('error' in result && result.error) {
        // Check if this is our timeout error
        if (result.error instanceof Error && result.error.message === 'Deletion timed out') {
          logger.error('useThreads: Thread deletion timed out');
          toast({
            title: "Thread deletion timeout",
            description: "Deleting the conversation is taking longer than expected, but we've updated the UI.",
            variant: "warning",
          });
          // Continue with optimistic UI update despite timeout
          return true;
        }
        
        // This is a regular database error
        logger.error('useThreads: Error deleting thread:', result.error);
        toast({
          title: "Error deleting thread",
          description: "There was a problem deleting the conversation.",
          variant: "destructive",
        });
        
        // Revert the optimistic update if there was a database error
        setThreads(previousThreads);
        return false;
      }

      logger.debug(`useThreads: Thread ${id} deleted successfully`);
      return true;
    } catch (error) {
      logger.error('useThreads: Exception deleting thread:', error);
      
      // If we have the previous threads state, restore it
      if (threads.some(thread => thread.id === id)) {
        // Thread still exists in our state, no need to restore
      } else {
        // Attempt to refetch threads without showing loading indicator
        fetchThreads();
      }
      
      return false;
    }
  };

  // Add a dedicated function to refetch threads
  const refetchThreads = async () => {
    logger.debug('useThreads: Manually refetching threads');
    await fetchThreads();
    return threads;
  };

  return {
    threads,
    loading,
    error,
    createThread,
    updateThread,
    deleteThread,
    refetchThreads
  };
}