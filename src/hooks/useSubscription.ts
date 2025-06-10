import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase'; // Assuming supabase client is exported from here
import { useAuth } from '@/lib/auth'; // Assuming useAuth hook provides user context
import { hasActiveSubscription, getUserSubscription, type Subscription } from '@/lib/subscription';

export interface SubscriptionDetails {
  isActive: boolean;
  tierName: string | null;
  stripe_price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  // Add other fields returned by the Edge Function as needed
}

const fetchSubscriptionStatus = async (): Promise<SubscriptionDetails | null> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      // User not logged in, return free tier
      return {
          isActive: false,
          tierName: 'Free',
          stripe_price_id: null,
          current_period_end: null,
          cancel_at_period_end: null,
      };
    }

    // Use supabase.functions.invoke instead of fetch for better CORS and auth handling
    const { data, error } = await supabase.functions.invoke(
      'get-user-subscription',
      {
        method: 'GET',
      }
    );

    if (error) {
      console.warn(`Subscription API error:`, error);
      // Return free tier on error
      return {
          isActive: false,
          tierName: 'Free',
          stripe_price_id: null,
          current_period_end: null,
          cancel_at_period_end: null,
      };
    }

    return data;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    // Return free tier on any error
    return {
        isActive: false,
        tierName: 'Free',
        stripe_price_id: null,
        current_period_end: null,
        cancel_at_period_end: null,
    };
  }
};

export function useSubscription() {
  const { user, isAuthResolved } = useAuth();
  
  return useQuery<boolean>({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return false;
      }
      return hasActiveSubscription(user.id);
    },
    // Critical: Only enable when auth is resolved and we have a user
    enabled: isAuthResolved && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Use placeholderData to prevent flashing
    placeholderData: false,
  });
}

export function useSubscriptionDetails() {
  const { user, isAuthResolved } = useAuth();
  
  return useQuery<Subscription | null>({
    queryKey: ['subscription-details', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      return getUserSubscription(user.id);
    },
    // Critical: Only enable when auth is resolved and we have a user
    enabled: isAuthResolved && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Use placeholderData to prevent flashing
    placeholderData: null,
  });
}

export function useInvalidateSubscription() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['subscription', user.id] });
      queryClient.invalidateQueries({ queryKey: ['subscription-details', user.id] });
    }
  };
}

export const useSubscriptionDetailsOld = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['subscriptionStatus', user?.id];

  // React Query v5 requires object parameter syntax
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey,
    queryFn: fetchSubscriptionStatus,
    enabled: !!user && !isAuthLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true
  });

  // Function to manually invalidate and refetch subscription
  const refreshSubscription = () => {
    queryClient.invalidateQueries(queryKey);
  };

  return {
    subscription: data,
    isLoading: isLoading || isAuthLoading,
    isError,
    error,
    refreshSubscription,
    // Expose specific details for convenience, defaulting if data is null/undefined
    isActive: data?.isActive ?? false,
    tierName: data?.tierName ?? 'Free',
    current_period_end: data?.current_period_end,
    cancel_at_period_end: data?.cancel_at_period_end,
    stripe_price_id: data?.stripe_price_id,
  };
}; 