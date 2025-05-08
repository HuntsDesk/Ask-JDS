import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase'; // Assuming supabase client is exported from here
import { useAuth } from '@/lib/auth'; // Assuming useAuth hook provides user context

export interface SubscriptionDetails {
  isActive: boolean;
  tierName: string | null;
  stripe_price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  // Add other fields returned by the Edge Function as needed
}

const fetchSubscriptionStatus = async (): Promise<SubscriptionDetails | null> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    // console.error('No active session for fetching subscription status', sessionError);
    // Return a state indicating no active subscription or user not logged in
    return {
        isActive: false,
        tierName: 'Free',
        stripe_price_id: null,
        current_period_end: null,
        cancel_at_period_end: null,
    };
  }

  const { data, error } = await supabase.functions.invoke('get-user-subscription', {
    method: 'GET', // Ensure this matches the Edge Function if it expects GET (or POST if it expects body)
  });

  if (error) {
    console.error('Error fetching subscription status:', error);
    // Decide how to handle errors, e.g., throw or return a specific error state
    // For now, returning a 'Free' tier status on error might be safest for UI
    return {
        isActive: false,
        tierName: 'Free',
        stripe_price_id: null,
        current_period_end: null,
        cancel_at_period_end: null,
    };
  }
  return data as SubscriptionDetails;
};

export const useSubscription = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['subscriptionStatus', user?.id];

  const { data, isLoading, isError, error, refetch } = useQuery<SubscriptionDetails | null, Error>(
    queryKey,
    fetchSubscriptionStatus,
    {
      enabled: !!user && !isAuthLoading, // Only run query if user is loaded and authenticated
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
    }
  );

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