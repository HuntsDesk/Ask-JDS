import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { 
  getUserMessageCount, 
  getLifetimeMessageCount, 
  hasActiveSubscription 
} from '@/lib/subscription';
import { useAuth } from '@/lib/auth';

/**
 * Hook for fetching the user's daily message count
 */
export function useUserMessageCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.user.messageCount,
    queryFn: getUserMessageCount,
    staleTime: 60 * 1000, // 1 minute
    enabled: !!user,
  });
}

/**
 * Hook for fetching the user's lifetime message count
 */
export function useUserLifetimeMessageCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user', 'lifetimeMessageCount'],
    queryFn: getLifetimeMessageCount,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user,
  });
}

/**
 * Hook for checking if the user has an active subscription
 */
export function useUserSubscription() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.user.subscription,
    queryFn: hasActiveSubscription,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user,
    // Important: subscriptions rarely change during a session, so we can cache this
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
} 