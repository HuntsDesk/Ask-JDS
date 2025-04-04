import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getLifetimeMessageCount } from '@/lib/subscription';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, BookOpen, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function UserProfileInfo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [messagesSent, setMessagesSent] = useState<number | null>(null);
  const [messagesReceived, setMessagesReceived] = useState<number | null>(null);
  const [premiumFlashcards, setPremiumFlashcards] = useState<number | null>(null);
  const [createdFlashcards, setCreatedFlashcards] = useState<number | null>(null);
  
  // Add refresh interval to keep statistics updated
  useEffect(() => {
    // Initial fetch
    fetchStatistics();
    
    // Set up refresh interval (every 30 seconds)
    const interval = setInterval(() => {
      if (user) {
        fetchStatistics(true); // silent refresh
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, toast]);
  
  async function fetchStatistics(silent = false) {
    if (!user) return;
    
    if (!silent) {
      setLoading(true);
    }
    
    try {
      // Messages sent count
      const sentCount = await getLifetimeMessageCount(user.id);
      setMessagesSent(sentCount);
      
      // Messages received count (assistant messages)
      const { count: receivedCount, error: receivedError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'assistant')
        .eq('user_id', user.id);
        
      if (receivedError) {
        console.error('Error fetching received messages count:', receivedError);
      } else {
        setMessagesReceived(receivedCount || 0);
      }
      
      // Premium flashcards count
      const { count: premiumCount, error: premiumError } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('is_official', true);
        
      if (premiumError) {
        console.error('Error fetching premium flashcards count:', premiumError);
      } else {
        setPremiumFlashcards(premiumCount || 0);
      }
      
      // User created flashcards count
      const { count: userCreatedCount, error: userCreatedError } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('is_official', false)
        .eq('created_by', user.id);
        
      if (userCreatedError) {
        console.error('Error fetching user created flashcards count:', userCreatedError);
      } else {
        setCreatedFlashcards(userCreatedCount || 0);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      if (!silent) {
        toast({
          title: 'Error',
          description: 'Failed to load account statistics. Please try again later.',
          variant: 'destructive'
        });
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Messages Sent</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{messagesSent !== null ? messagesSent : 'N/A'}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
            <MessageSquare className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Messages Received</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{messagesReceived !== null ? messagesReceived : 'N/A'}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
            <Star className="h-5 w-5 text-amber-500" />
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Premium Flashcards</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{premiumFlashcards !== null ? premiumFlashcards : 'N/A'}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
            <BookOpen className="h-5 w-5 text-purple-500" />
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Created Flashcards</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{createdFlashcards !== null ? createdFlashcards : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 