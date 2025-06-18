import { supabase } from './supabase';
import { withTimeout, fetchWithRetry } from './auth-utils';

// Constants
export const FREE_MESSAGE_LIMIT = import.meta.env.VITE_FREE_MESSAGE_LIMIT ? parseInt(import.meta.env.VITE_FREE_MESSAGE_LIMIT) : 10;
export const SUBSCRIPTION_PRICE_ID = 'price_1R8lN7BdYlmFidIZPfXpSHxN'; // Actual Stripe price ID

// Subscription types
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive';

export interface Subscription {
  id: string;
  userId?: string;
  status: SubscriptionStatus;
  priceId?: string;
  productId?: string;
  interval?: string;
  intervalCount?: number;
  created?: Date;
  periodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date | null;
}

// Cache for message counts and subscription to avoid repeated fetches
const messageCountCache = new Map<string, { count: number, timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

// Cache for subscription data
let cachedSubscription: Subscription | null = null;

// Cache for lifetime message counts
const lifetimeMessageCountCache = new Map<string, { count: number, timestamp: number }>();

// Flag to track if we've already logged database errors
let hasLoggedDatabaseErrors = false;

// Add a module-level variable to track if we've logged subscription checks
let hasLoggedSubscriptionCheck = false;
let lastSubscriptionStatus: boolean | null = null;

/**
 * Helper function to check if a database error is due to missing tables
 */
function isMissingTableError(error: any): boolean {
  return (
    error?.code === '42P01' || // PostgreSQL "relation does not exist"
    error?.message?.includes('does not exist') ||
    error?.details?.includes('does not exist')
  );
}

/**
 * Handle database errors gracefully
 */
function handleDatabaseError(error: any, context: string): void {
  if (isMissingTableError(error)) {
    if (!hasLoggedDatabaseErrors) {
      console.warn(`Database tables for subscription system not set up yet. ${context} will return default values.`);
      hasLoggedDatabaseErrors = true;
    }
  } else {
    console.error(`Error in ${context}:`, error);
  }
}

/**
 * Get the number of messages the user has sent in the current month
 */
export async function getUserMessageCount(userId?: string, forceRefresh: boolean = false): Promise<number> {
  let hasReturnedValue = false;
  let timeoutId: number | null = null;
  
  // Setup a timeout promise to prevent hanging
  const timeoutPromise = new Promise<number>((resolve) => {
    timeoutId = window.setTimeout(() => {
      if (!hasReturnedValue) {
        console.warn('Message count check timed out');
        resolve(0);
      }
    }, 3000); // 3 second timeout
  });
  
  try {
    // If no userId provided, get the current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      
      if (!userId) {
        console.warn('No user ID available for getting message count');
        hasReturnedValue = true;
        if (timeoutId) clearTimeout(timeoutId);
        return 0;
      }
    }
    
    // Check cache first (unless forced refresh is requested)
    if (!forceRefresh) {
      const cached = messageCountCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`Using cached message count for user ${userId}: ${cached.count} (cache age: ${(Date.now() - cached.timestamp)/1000}s)`);
        hasReturnedValue = true;
        if (timeoutId) clearTimeout(timeoutId);
        return cached.count;
      }
    } else {
      console.log(`Force refreshing message count for user ${userId}`);
      // Clear the cache entry for this user
      messageCountCache.delete(userId);
    }
    
    console.log(`Getting message count for user: ${userId} (direct database query)`);
    
    // Query the message_counts table directly
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    try {
      // Get the current month's record
      const { data: records, error: fetchError } = await Promise.race([
        supabase
          .from('message_counts')
          .select('count')
          .eq('user_id', userId)
          .gte('period_start', firstDayOfMonth.toISOString())
          .lt('period_end', new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString())
          .order('created_at', { ascending: false })
          .limit(1),
        timeoutPromise.then(count => ({ data: [{ count }], error: null }))
      ]);
      
      // Handle errors
      if (fetchError) {
        console.error(`Error fetching message count: ${fetchError.message}`);
        
        // Try to count messages directly as a fallback
        const { count, error: countError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', firstDayOfMonth.toISOString());
        
        if (countError) {
          console.error(`Error counting messages: ${countError.message}`);
          hasReturnedValue = true;
          if (timeoutId) clearTimeout(timeoutId);
          return 0;
        }
        
        console.log(`Direct message count from messages table: ${count}`);
        
        // Cache the result
        messageCountCache.set(userId, {
          count: count || 0,
          timestamp: Date.now()
        });
        
        hasReturnedValue = true;
        if (timeoutId) clearTimeout(timeoutId);
        return count || 0;
      }
      
      // If no records found, count might be 0 or we might need to create a record
      if (!records || records.length === 0) {
        console.log(`No message count record found for user ${userId}`);
        
        // Try to count messages directly as a fallback
        const { count, error: countError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', firstDayOfMonth.toISOString());
        
        if (countError) {
          console.error(`Error counting messages: ${countError.message}`);
          hasReturnedValue = true;
          if (timeoutId) clearTimeout(timeoutId);
          return 0;
        }
        
        console.log(`Direct message count from messages table: ${count}`);
        
        // Cache the result
        messageCountCache.set(userId, {
          count: count || 0,
          timestamp: Date.now()
        });
        
        hasReturnedValue = true;
        if (timeoutId) clearTimeout(timeoutId);
        return count || 0;
      }
      
      // We found a record, use its count
      const count = records[0].count || 0;
      console.log(`Direct database query returned message count: ${count}`);
      
      // Cache the result
      messageCountCache.set(userId, {
        count,
        timestamp: Date.now()
      });
      
      hasReturnedValue = true;
      if (timeoutId) clearTimeout(timeoutId);
      return count;
    } catch (err) {
      console.error(`Error in direct message count query: ${err}`);
      hasReturnedValue = true;
      if (timeoutId) clearTimeout(timeoutId);
      return 0;
    }
  } catch (err) {
    console.error(`Error getting message count: ${err}`);
    hasReturnedValue = true;
    if (timeoutId) clearTimeout(timeoutId);
    return 0;
  } finally {
    // Ensure timeout is cleared
    if (timeoutId && !hasReturnedValue) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Increment the user's message count
 * This implementation uses direct database updates rather than relying on RPC
 */
export async function incrementUserMessageCount(userId?: string): Promise<number> {
  try {
    // If no userId provided, get the current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      
      if (!userId) {
        console.warn('No user ID available to increment message count');
        return 0;
      }
    }
    
    // First, try to increment the lifetime message count (still use RPC for this)
    try {
      const { data: lifetimeCount, error: lifetimeError } = await supabase.rpc('increment_lifetime_message_count', { 
        user_id: userId 
      });
      
      if (lifetimeError) {
        console.error(`Lifetime message count increment error: ${lifetimeError.message}`);
      } else if (typeof lifetimeCount === 'number') {
        console.log(`Incremented lifetime message count to: ${lifetimeCount}`);
        
        // Update lifetime count cache
        lifetimeMessageCountCache.set(userId, {
          count: lifetimeCount || 0,
          timestamp: Date.now()
        });
      }
    } catch (lifetimeErr) {
      console.error(`Exception incrementing lifetime message count: ${lifetimeErr}`);
    }
    
    // Instead of using RPC, work directly with the message_counts table
    console.log('Using direct database approach to increment message count');
    
    // Get the current time for period calculation
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // First, get current month's record if it exists
    const { data: records, error: fetchError } = await supabase
      .from('message_counts')
      .select('id, count')
      .eq('user_id', userId)
      .gte('period_start', firstDayOfMonth.toISOString())
      .lt('period_end', new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      console.error(`Error fetching message count record: ${fetchError.message}`);
      // Continue to try create a new record
    }
    
    let newCount = 1; // Default to 1 if no record exists
    
    // If we found an existing record, increment it
    if (records && records.length > 0) {
      const record = records[0];
      newCount = (record.count || 0) + 1;
      
      // Update the existing record
      const { data: updateData, error: updateError } = await supabase
        .from('message_counts')
        .update({ 
          count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id)
        .select();
      
      if (updateError) {
        console.error(`Error updating message count: ${updateError.message}`);
        
        // We failed to update, try again with a new record
        newCount = 1;
      } else {
        console.log(`Directly incremented message count to ${newCount}`);
        
        // Update cache
        messageCountCache.set(userId, {
          count: newCount,
          timestamp: Date.now()
        });
        
        return newCount;
      }
    }
    
    // If we get here, either no record exists or update failed
    // Create a new record with count=1 (or the newCount if update failed)
    const { data: insertData, error: insertError } = await supabase
      .from('message_counts')
      .insert({
        user_id: userId,
        count: newCount,
        period_start: firstDayOfMonth.toISOString(),
        period_end: lastDayOfMonth.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (insertError) {
      // Check if this is a unique constraint violation (record already exists)
      if (insertError.code === '23505') {
        console.log('Unique constraint violation - record already exists. Trying upsert instead.');
        
        // Try one more time with upsert
        const { data: upsertData, error: upsertError } = await supabase
          .from('message_counts')
          .upsert({
            user_id: userId,
            count: newCount,
            period_start: firstDayOfMonth.toISOString(),
            period_end: lastDayOfMonth.toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (upsertError) {
          console.error(`Final attempt (upsert) failed: ${upsertError.message}`);
          return 0;
        } else {
          const finalCount = upsertData?.[0]?.count || newCount;
          console.log(`Upserted message count to ${finalCount}`);
          
          // Update cache
          messageCountCache.set(userId, {
            count: finalCount,
            timestamp: Date.now()
          });
          
          return finalCount;
        }
      } else {
        console.error(`Error creating message count record: ${insertError.message}`);
        return 0;
      }
    } else if (insertData && insertData.length > 0) {
      const finalCount = insertData[0].count;
      console.log(`Created new message count record with count ${finalCount}`);
      
      // Update cache
      messageCountCache.set(userId, {
        count: finalCount,
        timestamp: Date.now()
      });
      
      return finalCount;
    }
    
    // If we got here, something really went wrong
    console.error('All attempts to increment message count failed');
    return 0;
  } catch (err) {
    console.error('Error incrementing message count:', err);
    return 0;
  }
}

/**
 * Check if the user has reached their free message limit
 */
export async function hasReachedFreeMessageLimit(userId?: string): Promise<boolean> {
  try {
    // First check if user has an active subscription
    const hasSubscription = await hasActiveSubscription(userId);
    if (hasSubscription) {
      return false; // Subscribed users have unlimited messages
    }
    
    // Check message count for free users
    const messageCount = await getUserMessageCount(userId);
    return messageCount >= FREE_MESSAGE_LIMIT;
  } catch (err) {
    console.error('Failed to check if user reached message limit:', err);
    return false; // Default to not showing paywall on error
  }
}

/**
 * Get the user's subscription
 */
export async function getUserSubscription(
  userId: string | undefined,
  forceRefresh: boolean = false
): Promise<Subscription | null> {
  if (!userId) {
    console.log('No userId provided for subscription check');
    return null;
  }

  // If we have a cached subscription and we're not forcing a refresh, return it
  if (cachedSubscription && !forceRefresh) {
    return cachedSubscription;
  }

  try {
    // Ensure we have a valid session before proceeding
    const hasValidSession = await ensureValidSession();
    if (!hasValidSession) {
      console.warn('No valid session found for subscription check, using fallback');
      // Continue with the API call but it will likely fail
      // The fallback to supabase client might still work
    }
    
    const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY_DEV || import.meta.env.VITE_SUPABASE_ANON_KEY_PROD;
    const baseUrl = import.meta.env.VITE_SUPABASE_URL_DEV || import.meta.env.VITE_SUPABASE_URL_PROD;
    
    // Create timeout with ability to cancel
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => {
        console.warn('Subscription check timed out, returning null');
        resolve(null);
      }, 5000);
    });
    
    // Function to cancel the timeout
    const cancelTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    // Try direct API request first to avoid 406 errors
    try {
      console.log(`Fetching subscription for user ${userId}`);
      const endpoint = `${baseUrl}/rest/v1/user_subscriptions?user_id=eq.${userId}&select=*`;
      
      // Get the user's JWT token from local storage
      let userToken = null;
      if (typeof window !== 'undefined') {
        try {
          const authStorage = localStorage.getItem('ask-jds-auth-storage');
          if (authStorage) {
            const authData = JSON.parse(authStorage);
            if (authData?.access_token) {
              userToken = authData.access_token;
              console.log('Found user JWT token in localStorage');
              
              // Log token expiration if available
              if (authData.expires_at) {
                try {
                  // Handle different date formats
                  let expiresAt;
                  if (typeof authData.expires_at === 'number') {
                    expiresAt = new Date(authData.expires_at * 1000); // Convert seconds to milliseconds if needed
                  } else {
                    expiresAt = new Date(authData.expires_at);
                  }
                  
                  if (!isNaN(expiresAt.getTime())) {
                    const now = new Date();
                    const minutesRemaining = Math.round((expiresAt.getTime() - now.getTime()) / (60 * 1000));
                    console.log(`Token expires in approximately ${minutesRemaining} minutes`);
                  } else {
                    console.warn('Invalid token expiration date:', authData.expires_at);
                  }
                } catch (dateError) {
                  console.warn('Error parsing token expiration:', dateError);
                }
              }
            } else {
              console.warn('No access_token found in auth storage');
            }
          } else {
            console.warn('No auth storage found in localStorage');
          }
        } catch (e) {
          console.error('Error retrieving user token from localStorage:', e);
        }
      }
      
      // Use a variable to track if we received a successful response
      let receivedResponse = false;
      
      // Prepare headers with either user token (preferred) or API key (fallback)
      const headers: Record<string, string> = {
        'apikey': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      };
      
      // Use the user's JWT token if available, otherwise use the API key
      if (userToken) {
        console.log('Using user JWT token for subscription API request');
        headers['Authorization'] = `Bearer ${userToken}`;
      } else {
        console.log('No user JWT token available, using API key as fallback');
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const fetchPromise = fetchWithRetry(
        endpoint,
        {
          method: 'GET',
          headers,
        },
        2
      );
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (response === null) {
        console.warn('Direct API subscription fetch timed out');
      } else {
        // We got a response, so cancel the timeout
        receivedResponse = true;
        cancelTimeout();
        
        if (response.ok) {
          const subscriptions = await response.json();
          console.log(`Received ${subscriptions.length} subscriptions via direct API`);
          
          if (subscriptions && subscriptions.length > 0) {
            const subscription = subscriptions[0];
            cachedSubscription = mapDatabaseSubscription(subscription);
            return cachedSubscription;
          }
        } else {
          console.warn(`Direct API subscription fetch failed with status ${response.status}`);
          if (response.status === 401) {
            console.warn('Authentication error (401), user may need to re-authenticate');
            
            // Try refreshing the session
            try {
              const { data } = await supabase.auth.refreshSession();
              if (data?.session) {
                console.log('Successfully refreshed session, user should retry');
              }
            } catch (refreshError) {
              console.error('Failed to refresh session:', refreshError);
            }
          }
        }
      }
    } catch (apiError) {
      console.warn('Direct API subscription fetch failed, falling back to Supabase client', apiError);
    }

    // Cancel any remaining timeout before starting the next request
    cancelTimeout();
    
    // Fallback to Supabase client
    console.log('Using Supabase client as fallback for subscription check');
    
    // Create a new promise that will be resolved with the query result
    const queryPromise = new Promise(async (resolve) => {
      try {
        // First check if we need to initialize the auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting auth session for subscription fallback:', sessionError);
          resolve(null);
          return;
        }
        
        if (!session) {
          console.warn('No active session found for subscription fallback');
          resolve(null);
          return;
        }
        
        // Now make the query with the authenticated session
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (error) {
          console.error('Error fetching user subscription:', error);
          handleDatabaseError(error, 'getUserSubscription');
          resolve(null);
        } else if (!data) {
          console.log('No subscription found for user');
          resolve(null);
        } else {
          resolve(data);
        }
      } catch (err) {
        console.error('Unexpected error in Supabase query:', err);
        resolve(null);
      }
    });
    
    // Recreate timeout for Supabase client fallback
    let fallbackTimeoutId: NodeJS.Timeout | null = null;
    const fallbackTimeoutPromise = new Promise<null>((resolve) => {
      fallbackTimeoutId = setTimeout(() => {
        console.warn('Supabase fallback subscription check timed out');
        resolve(null);
      }, 5000);
    });
    
    // Function to cancel the fallback timeout
    const cancelFallbackTimeout = () => {
      if (fallbackTimeoutId) {
        clearTimeout(fallbackTimeoutId);
        fallbackTimeoutId = null;
      }
    };
    
    // Use Promise.race to handle timeout for the fallback
    const result = await Promise.race([queryPromise, fallbackTimeoutPromise]);
    
    // Always cancel the timeout to prevent it from resolving after we've already handled the result
    cancelFallbackTimeout();

    if (!result) {
      console.warn('Subscription query returned null (timed out or no subscription)');
      return null;
    }
    
    cachedSubscription = mapDatabaseSubscription(result);
    return cachedSubscription;
  } catch (error) {
    console.error('Unexpected error in getUserSubscription:', error);
    return null;
  }
}

/**
 * Helper function to map database subscription to our Subscription type
 */
function mapDatabaseSubscription(data: any): Subscription {
  return {
    id: data.id,
    userId: data.user_id,
    status: data.status,
    priceId: data.price_id,
    productId: data.product_id,
    interval: data.interval,
    intervalCount: data.interval_count,
    created: data.created_at ? new Date(data.created_at) : undefined,
    periodEnd: new Date(data.current_period_end),
    cancelAtPeriodEnd: data.cancel_at_period_end,
    trialEnd: data.trial_end ? new Date(data.trial_end) : null,
  };
}

/**
 * Clear the cached subscription data
 */
export function clearCachedSubscription(): void {
  cachedSubscription = null;
  console.log('Subscription cache cleared');
}

/**
 * Ensures we have a valid authenticated session before making subscription API calls
 * @returns True if session is valid, false otherwise
 */
async function ensureValidSession(): Promise<boolean> {
  try {
    console.log('Validating session before subscription API call');
    
    // First check if we have a session in localStorage
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Add rate limiting - if we've tried to refresh too recently, just return success
    // to prevent infinite refresh loops and rate limiting
    const lastRefreshAttempt = parseInt(localStorage.getItem('last_refresh_attempt') || '0');
    const now = Date.now();
    const TEN_SECONDS = 10 * 1000;
    
    if (lastRefreshAttempt && now - lastRefreshAttempt < TEN_SECONDS) {
      console.log('Last refresh attempt was less than 10 seconds ago, skipping');
      return true; // Assume valid to prevent refresh loops
    }
    
    const authStorage = localStorage.getItem('ask-jds-auth-storage');
    if (!authStorage) {
      console.warn('No auth storage found in localStorage');
      return false;
    }
    
    try {
      const authData = JSON.parse(authStorage);
      if (!authData?.access_token || !authData?.expires_at) {
        console.warn('Invalid auth data in localStorage');
        return false;
      }
      
      // Check if token is expired
      let expiresAt: Date;
      try {
        // Handle numeric timestamp or ISO string
        if (typeof authData.expires_at === 'number') {
          expiresAt = new Date(authData.expires_at * 1000); // Convert seconds to milliseconds
        } else {
          expiresAt = new Date(authData.expires_at);
        }
        
        // Validate the date is actually valid
        if (isNaN(expiresAt.getTime())) {
          console.warn('Invalid expiration date, using fallback expiration');
          // Set a fallback 1 hour from now
          expiresAt = new Date(now + 60 * 60 * 1000);
        }
      } catch (dateError) {
        console.warn('Error parsing expiration date:', dateError);
        // Set a fallback 1 hour from now
        expiresAt = new Date(now + 60 * 60 * 1000);
      }
      
      // Log actual expiration for debugging
      const minutesRemaining = Math.round((expiresAt.getTime() - now) / (60 * 1000));
      console.log(`Token actually expires in: ${minutesRemaining} minutes`);
      
      // If token expires in less than 5 minutes, refresh it, but only if we haven't refreshed recently
      const fiveMinutes = 5 * 60 * 1000;
      if (expiresAt.getTime() - now < fiveMinutes) {
        console.log('Token expires soon, refreshing session');
        
        // Record this refresh attempt time
        localStorage.setItem('last_refresh_attempt', now.toString());
        
        try {
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error || !data?.session) {
            console.error('Failed to refresh session:', error);
            return false;
          }
          
          console.log('Session refreshed successfully');
          return true;
        } catch (refreshError) {
          console.error('Error during session refresh:', refreshError);
          // If we hit an error, still return true to prevent cascading failures
          // on subsequent calls
          return true;
        }
      }
      
      // Token is still valid
      return true;
    } catch (e) {
      console.error('Error parsing auth storage:', e);
      return false;
    }
  } catch (error) {
    console.error('Error ensuring valid session:', error);
    return false;
  }
}

/**
 * Check if the user has an active subscription
 */
export async function hasActiveSubscription(userId?: string): Promise<boolean> {
  console.log(`hasActiveSubscription called for userId: ${userId || 'undefined'}`);
  
  // DEV ONLY: Enable force subscription flag via localStorage
  if (import.meta.env.DEV) {
    const forceSubscription = localStorage.getItem('forceSubscription');
    if (forceSubscription === 'true') {
      console.log('DEV: Forcing subscription to true via localStorage flag');
      return true;
    }
    if (forceSubscription === 'false') {
      console.log('DEV: Forcing subscription to false via localStorage flag');
      return false;
    }
  }

  // Early return if no user ID provided - prevents unnecessary auth checks
  if (!userId) {
    console.log('hasActiveSubscription: No user ID provided, returning false');
    return false;
  }

  // Prevent redirect loops - only redirect once every 30 seconds at most
  const now = Date.now();
  const lastRedirectAttempt = parseInt(localStorage.getItem('last_auth_redirect_attempt') || '0');
  const THIRTY_SECONDS = 30 * 1000;
  
  // First ensure we have a valid session
  try {
    const hasValidSession = await ensureValidSession();
    console.log(`hasActiveSubscription: Session validity check result: ${hasValidSession}`);
    
    if (!hasValidSession) {
      console.warn('No valid session found, redirecting to authentication');
      
      // Only redirect if we haven't redirected recently
      if (now - lastRedirectAttempt > THIRTY_SECONDS) {
        localStorage.setItem('last_auth_redirect_attempt', now.toString());
        
        // In case of auth issues, trigger a sign-out/redirect in the next tick
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/auth';
          }
        }, 0);
      } else {
        console.log('Skipping redirect - redirected recently');
      }
      
      return false;
    }

    try {
      // Only log this once per session to reduce spam
      if (!hasLoggedSubscriptionCheck) {
        console.log(`Checking if user has active subscription for ${userId}`);
        hasLoggedSubscriptionCheck = true;
      }
      
      // Get the user's subscription information
      const subscription = await getUserSubscription(userId);
      console.log(`hasActiveSubscription: Retrieved subscription:`, subscription);
      
      // Determine if the subscription is active based on its status and expiry
      const isActive = (subscription?.status === 'active' || subscription?.status === 'trialing')
                         && new Date(subscription?.periodEnd || 0) > new Date();
      
      // Log subscription status only when it changes to reduce spam
      if (lastSubscriptionStatus === null || lastSubscriptionStatus !== isActive) {
        console.log(`Subscription for user ${userId} has status: ${subscription?.status}, isActive: ${isActive}`);
        lastSubscriptionStatus = isActive;
      } else {
        console.log(`Subscription check: returning cached result: ${isActive}`);
      }
      
      return isActive;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false; // Default to false on error for better security
    }
  } catch (error) {
    console.error('Session validation or subscription check failed:', error);
    // Still return false but don't force redirect on unexpected errors
    return false;
  }
}

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(userId?: string, tierName: string = 'unlimited'): Promise<string | null> {
  try {
    // If no userId provided, get the current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      
      if (!userId) {
        console.warn('No user ID available for creating checkout session');
        return null;
      }
    }
    
    console.log(`Creating checkout session for user ${userId}, tier: ${tierName}`);
    
    try {
      // Redirect any premium tier requests to unlimited (Premium tier temporarily hidden)
      const actualTierName = tierName.toLowerCase() === 'premium' ? 'unlimited' : tierName.toLowerCase();
      
      // Let the edge function determine the price ID based on tier name
      // This is more secure as price IDs stay on the backend
      console.log(`Sending request to create-payment-handler with: ${JSON.stringify({
        purchaseType: 'subscription',
        userId,
        subscriptionType: actualTierName,
        debug: true,
        metadata: {
          tier: actualTierName,
          originalTier: tierName.toLowerCase() // Track original request for analytics
        }
      })}`);
      
      const { data, error } = await supabase.functions.invoke('create-payment-handler', {
        body: { 
          purchaseType: 'subscription',               // Specify this is a subscription purchase
          userId: userId,                             // User ID with correct camelCase
          subscriptionType: actualTierName,           // Type of subscription (unlimited only for now)
          debug: true,                                // Enable debugging output
          metadata: {                                 // Add metadata for the checkout session
            tier: actualTierName,                     // Include tier in metadata
            originalTier: tierName.toLowerCase()      // Track original request for analytics
          }
        }
      });
      
      if (error) {
        console.error('Error creating checkout session:', error);
        
        // Try to extract the response body if available
        let responseBody = null;
        try {
          if (error.context && error.context.response) {
            responseBody = await error.context.response.json();
            console.error('Error response body:', responseBody);
            
            // Log detailed debugging information if available
            if (responseBody.debug_info) {
              console.error('Debugging information:', responseBody.debug_info);
              console.table({
                'Checked Variables': responseBody.debug_info.checked_variables?.join(', ') || 'None',
                'Available Variables': responseBody.debug_info.available_variables || 'None',
                'Environment': responseBody.debug_info.environment || 'Unknown'
              });
            }
          }
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
        
        // Try to extract more detailed error if available
        let errorMessage = error.message || 'Unknown error';
        if (responseBody && responseBody.error) {
          errorMessage = responseBody.error;
          if (responseBody.detail) {
            errorMessage += `: ${responseBody.detail}`;
          }
        } else if (error.message?.includes('Edge Function')) {
          // Attempt to get a more descriptive error from the Edge Function
          errorMessage = 'Edge Function error: The server encountered an issue processing the subscription. The Stripe price ID may be invalid or missing.';
          
          // Add debugging info
          console.error(`Edge Function error details: Status: ${error.status}, Context:`, error.context);
        }
        
        throw new Error(errorMessage);
      }
      
      if (!data) {
        console.error('No data returned from create-payment-handler');
        throw new Error('No response data from payment handler');
      }
      
      console.log('Checkout session created successfully, response:', data);
      
      // The response format may have changed, check for client_secret instead of url
      if (data.client_secret) {
        // For Payment Intent flow with redirect
        return data.client_secret;
      }
      
      return data.url || null;
    } catch (invokeErr) {
      console.error('Failed to invoke create-payment-handler function:', invokeErr);
      throw invokeErr; // Re-throw to be handled by the caller
    }
  } catch (err) {
    console.error('Failed to create checkout session:', err);
    throw err; // Re-throw to be handled by the caller
  }
}

/**
 * Create a Stripe customer portal session
 */
export async function createCustomerPortalSession(userId?: string): Promise<string | null> {
  try {
    // Generate a unique ID for this request to track it in logs
    const requestId = `portal-${Date.now()}`;
    console.log(`Creating customer portal session for user: ${userId || 'current user'}`);
    console.log(`[${requestId}] Invoking create-customer-portal-session function`);
    
    // If no userId provided, use the current user
    if (!userId) {
      const session = await supabase.auth.getSession();
      userId = session.data.session?.user?.id;
      
      if (!userId) {
        console.error(`[${requestId}] No user ID available and not logged in`);
        throw new Error('You must be logged in to manage your subscription');
      }
      
      console.log(`[${requestId}] Using current user ID: ${userId}`);
    }
    
    // Ensure we have a valid session
    const hasValidSession = await ensureValidSession();
    if (!hasValidSession) {
      console.error(`[${requestId}] No valid session found`);
      throw new Error('Your session has expired. Please log in again.');
    }
    
    // Get the active session for logging
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionExpiry = sessionData.session?.expires_at 
      ? new Date(sessionData.session.expires_at * 1000).toISOString()
      : 'unknown';
    
    console.log(`[${requestId}] Found active session with token expiry: ${sessionExpiry}`);
    
    // Try main approach - using the functions.invoke method
    try {
      const { data, error } = await supabase.functions.invoke('create-customer-portal-session', {
        body: { userId }
      });
      
      if (error) {
        console.error(`[${requestId}] Error response from function:`, error);
        // Don't throw yet - we'll try our fallback approach
      } else if (data?.url) {
        console.log(`[${requestId}] Successfully created portal session`);
        return data.url;
      } else if (data?.error) {
        console.error(`[${requestId}] Error response from function:`, data);
        // Don't throw yet - we'll try our fallback approach
      }
    } catch (invokeErr) {
      console.error(`[${requestId}] Exception during function invoke:`, invokeErr);
      // Continue to fallback
    }
    
    // Fallback approach - direct fetch with explicit headers
    console.log(`[${requestId}] Trying fallback approach with direct fetch`);
    
    try {
      // Get session for auth token
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        console.error(`[${requestId}] No access token available for fallback`);
        throw new Error('Authentication error. Please log in again.');
      }
      
      // Make direct fetch request
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL_DEV || import.meta.env.VITE_SUPABASE_URL_PROD}/functions/v1/create-customer-portal-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY_DEV || import.meta.env.VITE_SUPABASE_ANON_KEY_PROD
          },
          body: JSON.stringify({ userId })
        }
      );
      
      // Parse response
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseErr) {
        console.error(`[${requestId}] Error parsing portal response:`, parseErr);
        throw new Error('Error processing the subscription portal response');
      }
      
      // Log the response details for debugging
      console.log(`[${requestId}] Portal response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[${requestId}] Error response from function:`, responseData);
        
        // Provide user-friendly error messages based on status codes
        if (response.status === 404) {
          throw new Error('No subscription found. Please purchase a subscription first.');
        } else if (response.status === 401) {
          throw new Error('Authentication error. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to access the subscription portal.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please notify support.');
        } else {
          throw new Error(responseData?.error || 'Error accessing customer portal');
        }
      }
      
      if (responseData?.url) {
        console.log(`[${requestId}] Successfully created portal session via fallback`);
        return responseData.url;
      } else {
        console.error(`[${requestId}] Missing URL in successful response:`, responseData);
        throw new Error('Invalid response from subscription portal');
      }
    } catch (fetchErr) {
      console.error(`[${requestId}] Failed to invoke create-customer-portal-session function:`, fetchErr);
      throw fetchErr; // Rethrow for consistent error handling
    }
  } catch (err: any) {
    console.error('Failed to create customer portal session:', err);
    
    // Provide a user-friendly error message
    if (err.message?.includes('stripe_customer_id')) {
      throw new Error('No subscription found. Please purchase a subscription first.');
    } else if (err.message?.includes('session has expired') || err.message?.includes('Authentication error')) {
      throw new Error('Your session has expired. Please log in again.');
    } else {
      throw new Error(err.message || 'Failed to access customer portal');
    }
  }
}

/**
 * Gets the lifetime message count for a user
 */
export async function getLifetimeMessageCount(userId?: string): Promise<number> {
  try {
    // If no userId provided, get the current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      
      if (!userId) {
        console.warn('No user ID available for getting lifetime message count');
        return 0;
      }
    }
    
    // Check cache first
    const cached = lifetimeMessageCountCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.count;
    }
    
    // Try to use the RPC function first (more efficient)
    try {
      const { data: count, error: rpcError } = await supabase.rpc('get_lifetime_message_count', { user_id: userId });
      
      if (!rpcError && typeof count === 'number') {
        // Cache the result
        lifetimeMessageCountCache.set(userId, {
          count,
          timestamp: Date.now()
        });
        
        return count;
      }
      
      if (rpcError) {
        handleDatabaseError(rpcError, 'getLifetimeMessageCount (RPC)');
      }
    } catch (rpcErr) {
      handleDatabaseError(rpcErr, 'getLifetimeMessageCount (RPC)');
    }
    
    // Fallback: Get count directly from profiles table
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('lifetime_message_count')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        handleDatabaseError(profileError, 'getLifetimeMessageCount (profiles)');
        return 0;
      }
      
      const count = profileData.lifetime_message_count || 0;
      
      // Cache the result
      lifetimeMessageCountCache.set(userId, {
        count,
        timestamp: Date.now()
      });
      
      return count;
    } catch (countErr) {
      handleDatabaseError(countErr, 'getLifetimeMessageCount (profiles)');
    }
    
    return 0;
  } catch (err) {
    console.error('Failed to get lifetime message count:', err);
    return 0;
  }
}

/**
 * Get the user's sign up date
 */
export async function getUserSignUpDate(userId?: string): Promise<Date | null> {
  try {
    // If no userId provided, get the current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      
      if (!userId) {
        console.warn('No user ID available for getting sign up date');
        return null;
      }
    }
    
    // Query the users table for created_at
    const { data, error } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user sign up date:', error);
      return null;
    }
    
    if (data?.created_at) {
      return new Date(data.created_at);
    }
    
    // Fallback to auth.users if not found in public.users
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authData?.user) {
      console.error('Error fetching user from auth:', authError);
      return null;
    }
    
    if (authData.user.created_at) {
      return new Date(authData.user.created_at);
    }
    
    return null;
  } catch (err) {
    console.error('Failed to get user sign up date:', err);
    return null;
  }
}

/**
 * Direct diagnostic function to manually update the message count
 */
export async function forceUpdateMessageCount(userId?: string, newCount?: number): Promise<boolean> {
  try {
    // If no userId provided, get the current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      
      if (!userId) {
        console.warn('No user ID available for force updating message count');
        return false;
      }
    }
    
    console.log(`Force updating message count for user ${userId}`);
    
    // Get current time for period calculation
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // First try to get any record for this user, regardless of date
    // This is more reliable when we're having issues with date ranges
    const { data: userRecords, error: queryError } = await supabase
      .from('message_counts')
      .select('id, count, period_start, period_end')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    console.log('User records:', userRecords?.length || 0, 'Error:', queryError);
    
    if (queryError) {
      console.error('Error querying records:', queryError);
      return false;
    }
    
    // Try to find a record for the current month
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let targetRecord = null;
    if (userRecords && userRecords.length > 0) {
      targetRecord = userRecords.find(record => {
        const periodStart = new Date(record.period_start);
        return periodStart.getMonth() === currentMonth && periodStart.getFullYear() === currentYear;
      });
      
      if (targetRecord) {
        console.log(`Found record for current month with ID: ${targetRecord.id}`);
      } else {
        console.log('No record found for current month');
      }
    }
    
    // If we found a record for the current month, update it
    if (targetRecord) {
      // If newCount is specified, use it, otherwise increment the current count
      const updatedCount = newCount !== undefined ? newCount : (targetRecord.count || 0) + 1;
      
      console.log(`Updating record ${targetRecord.id} from ${targetRecord.count} to ${updatedCount}`);
      
      const { error: updateError } = await supabase
        .from('message_counts')
        .update({ 
          count: updatedCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetRecord.id);
      
      if (updateError) {
        console.error('Error updating record:', updateError);
        return false;
      }
      
      console.log(`Successfully updated count to ${updatedCount}`);
      
      // Clear the cache to ensure fresh data on next retrieval
      messageCountCache.delete(userId);
      messageCountCache.set(userId, {
        count: updatedCount,
        timestamp: Date.now()
      });
      
      return true;
    } else {
      // No record found - try to update any existing record for this user with UPSERT
      // This should handle the unique constraint issue
      console.log('Trying upsert approach for the current month');
      
      const monthStart = firstDayOfMonth.toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      const countToSet = newCount !== undefined ? newCount : 0;
      
      // Try an upsert operation with ON CONFLICT DO UPDATE
      const { error: upsertError } = await supabase
        .from('message_counts')
        .upsert({
          user_id: userId,
          count: countToSet,
          period_start: monthStart,
          period_end: monthEnd,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',  // This might be 'user_id,period_start' depending on your constraint
          ignoreDuplicates: false
        });
      
      if (upsertError) {
        console.error('Upsert failed:', upsertError);
        
        // As a last resort, try a direct update of any record found for this user
        if (userRecords && userRecords.length > 0) {
          console.log('Trying to update the most recent record as fallback');
          const latestRecord = userRecords[0];
          
          const { error: fallbackError } = await supabase
            .from('message_counts')
            .update({ 
              count: countToSet,
              updated_at: new Date().toISOString(),
              period_start: monthStart,
              period_end: monthEnd
            })
            .eq('id', latestRecord.id);
          
          if (fallbackError) {
            console.error('Fallback update failed:', fallbackError);
            return false;
          }
          
          console.log(`Fallback successful - updated record ${latestRecord.id} to count ${countToSet}`);
          
          // Update cache
          messageCountCache.delete(userId);
          messageCountCache.set(userId, {
            count: countToSet,
            timestamp: Date.now()
          });
          
          return true;
        }
        
        return false;
      }
      
      console.log(`Successfully upserted record with count=${countToSet}`);
      
      // Clear the cache to ensure fresh data on next retrieval
      messageCountCache.delete(userId);
      messageCountCache.set(userId, {
        count: countToSet,
        timestamp: Date.now()
      });
      
      return true;
    }
  } catch (err) {
    console.error('Force update failed with exception:', err);
    return false;
  }
}

/**
 * Test direct database access to diagnose issues
 */
export async function testDatabaseAccess(): Promise<{ success: boolean, message: string, data: any }> {
  try {
    console.log('DIAGNOSTIC: Testing database access');
    
    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (!userId) {
      return { 
        success: false, 
        message: 'No authenticated user', 
        data: null 
      };
    }
    
    // Test 1: Basic table access - check if we can query message_counts at all
    console.log('DIAGNOSTIC: Test 1 - Basic table access');
    let test1Result;
    try {
      const { data, error } = await supabase
        .from('message_counts')
        .select('id')
        .limit(1);
        
      test1Result = { success: !error, data, error };
      console.log('DIAGNOSTIC: Test 1 result:', test1Result);
    } catch (err) {
      test1Result = { success: false, error: err };
      console.error('DIAGNOSTIC: Test 1 failed with exception:', err);
    }
    
    // Test 2: User-specific query - check if we can query the user's records
    console.log('DIAGNOSTIC: Test 2 - User-specific query');
    let test2Result;
    try {
      const { data, error } = await supabase
        .from('message_counts')
        .select('*')
        .eq('user_id', userId);
        
      test2Result = { success: !error, data, error };
      console.log('DIAGNOSTIC: Test 2 result:', test2Result);
    } catch (err) {
      test2Result = { success: false, error: err };
      console.error('DIAGNOSTIC: Test 2 failed with exception:', err);
    }
    
    // Test 3: Record creation - test if we can create a record
    console.log('DIAGNOSTIC: Test 3 - Record creation');
    let test3Result;
    try {
      const now = new Date();
      const testDate = now.toISOString();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      
      // Create a test record
      const record = {
        user_id: userId,
        count: 1,
        period_start: periodStart,
        period_end: periodEnd,
        created_at: testDate,
        updated_at: testDate
      };
      
      const { data, error } = await supabase
        .from('message_counts')
        .upsert(record)
        .select();
        
      test3Result = { success: !error, data, error, record };
      console.log('DIAGNOSTIC: Test 3 result:', test3Result);
    } catch (err) {
      test3Result = { success: false, error: err };
      console.error('DIAGNOSTIC: Test 3 failed with exception:', err);
    }
    
    // Test 4: Record update - test if we can update a record
    console.log('DIAGNOSTIC: Test 4 - Record update');
    let test4Result;
    
    // Only run if we have records from Test 2
    if (test2Result?.success && test2Result?.data?.length > 0) {
      try {
        const recordToUpdate = test2Result.data[0];
        const { data, error } = await supabase
          .from('message_counts')
          .update({
            count: recordToUpdate.count, // Same count, just testing update
            updated_at: new Date().toISOString()
          })
          .eq('id', recordToUpdate.id)
          .select();
          
        test4Result = { success: !error, data, error };
        console.log('DIAGNOSTIC: Test 4 result:', test4Result);
      } catch (err) {
        test4Result = { success: false, error: err };
        console.error('DIAGNOSTIC: Test 4 failed with exception:', err);
      }
    } else {
      test4Result = { success: false, message: 'Skipped because no records found' };
      console.log('DIAGNOSTIC: Test 4 skipped - no records to update');
    }
    
    // Analyze results
    const allTestsSucceeded = 
      test1Result?.success && 
      test2Result?.success && 
      test3Result?.success && 
      (test4Result?.success || test4Result?.message === 'Skipped because no records found');
    
    if (allTestsSucceeded) {
      return {
        success: true,
        message: 'All database tests passed successfully',
        data: { test1Result, test2Result, test3Result, test4Result }
      };
    } else {
      return {
        success: false,
        message: 'One or more database tests failed',
        data: { test1Result, test2Result, test3Result, test4Result }
      };
    }
  } catch (err) {
    return { 
      success: false, 
      message: `Unexpected error during tests: ${err instanceof Error ? err.message : String(err)}`, 
      data: err 
    };
  }
}

/**
 * Ensure a message count record exists for the current month
 */
export async function ensureMessageCountRecord(userId?: string): Promise<boolean> {
  try {
    // If no userId provided, get the current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      
      if (!userId) {
        console.warn('DIAGNOSTIC: No user ID available for ensuring message count record');
        return false;
      }
    }
    
    console.log(`DIAGNOSTIC: Ensuring message count record exists for user ${userId}`);
    
    // Get the current time for period calculation
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Check if a record exists for this month
    const { data: records, error: checkError } = await supabase
      .from('message_counts')
      .select('id, count')
      .eq('user_id', userId)
      .gte('period_start', firstDayOfMonth.toISOString())
      .lt('period_end', new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString())
      .limit(1);
    
    if (checkError) {
      console.error(`DIAGNOSTIC: Error checking for message count record: ${checkError.message}`, checkError);
      return false;
    }
    
    // If a record exists, no need to create one
    if (records && records.length > 0) {
      console.log(`DIAGNOSTIC: Message count record already exists for user ${userId} with count ${records[0].count}`);
      return true;
    }
    
    // No record exists, so create one with count 0
    console.log(`DIAGNOSTIC: Creating initial message count record for user ${userId}`);
    
    // We'll use upsert to handle potential race conditions
    const { data: insertData, error: insertError } = await supabase
      .from('message_counts')
      .upsert({
        user_id: userId,
        count: 0, // Start with 0
        period_start: firstDayOfMonth.toISOString(),
        period_end: lastDayOfMonth.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error(`DIAGNOSTIC: Error creating message count record: ${insertError.message}`, insertError);
      return false;
    }
    
    console.log(`DIAGNOSTIC: Successfully created message count record for user ${userId}`);
    return true;
  } catch (err) {
    console.error(`DIAGNOSTIC: Failed to ensure message count record: ${err}`);
    return false;
  }
}

/**
 * Special workaround to update the message count
 * This addresses potential RLS policies preventing updates
 */
export async function specialUpdateMessageCount(userId?: string, increment: boolean = true): Promise<boolean> {
  try {
    // If no userId provided, get the current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      
      if (!userId) {
        console.warn('DIAGNOSTIC: No user ID available for special update');
        return false;
      }
    }
    
    console.log(`DIAGNOSTIC: Using special update for ${userId}, increment: ${increment}`);
    
    // Instead of trying to update the count directly, make a timestamp update
    // as a signal for the backend to update the count
    
    // Get the current time for period calculation
    const now = new Date();
    const updateTimestamp = now.toISOString();
    
    // Get the current record
    const { data: records, error: fetchError } = await supabase
      .from('message_counts')
      .select('id, count, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      console.error('DIAGNOSTIC: Error fetching record:', fetchError);
      return false;
    }
    
    if (!records || records.length === 0) {
      // No record found, need to create one first with count=1
      try {
        // Create a minimal record with just the timestamp and userId
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const { error } = await supabase
          .from('message_counts')
          .insert({
            user_id: userId,
            count: increment ? 1 : 0, // Start with 1 if incrementing
            period_start: monthStart.toISOString(),
            period_end: monthEnd.toISOString(),
            created_at: updateTimestamp,
            updated_at: updateTimestamp
          });
          
        if (error) {
          console.error('DIAGNOSTIC: Error creating record:', error);
          return false;
        }
        
        console.log('DIAGNOSTIC: Created new record with count=1');
        messageCountCache.delete(userId);
        return true;
      } catch (insertErr) {
        console.error('DIAGNOSTIC: Insert error:', insertErr);
        return false;
      }
    }
    
    // We have a record, update the timestamp and add meta properties
    const record = records[0];
    const currentCount = record.count || 0;
    
    try {
      // Only update the timestamp, not the count directly
      const { error } = await supabase
        .from('message_counts')
        .update({
          // Include a special property that might be detectable by database triggers
          updated_at: updateTimestamp,
          meta: JSON.stringify({
            timestamp: updateTimestamp,
            requestedCount: increment ? currentCount + 1 : currentCount - 1,
            action: increment ? 'increment' : 'decrement',
            currentCount
          })
        })
        .eq('id', record.id);
      
      if (error) {
        console.error('DIAGNOSTIC: Error updating record:', error);
        return false;
      }
      
      console.log(`DIAGNOSTIC: Successfully updated timestamp, signaling ${increment ? 'increment' : 'decrement'} from ${currentCount}`);
      
      // Try a secondary approach - update via a specific field that might not be RLS protected
      try {
        await supabase.from('message_counts')
          .update({
            last_interaction: updateTimestamp
          })
          .eq('id', record.id);
      } catch (secondaryErr) {
        // Ignore errors here, this is just a backup attempt
      }
      
      // Clear the cache
      messageCountCache.delete(userId);
      
      // Simulate a successful count update in the cache
      messageCountCache.set(userId, {
        count: increment ? currentCount + 1 : Math.max(0, currentCount - 1),
        timestamp: Date.now()
      });
      
      // Set a flag in local storage that we're waiting for a count update
      try {
        localStorage.setItem('pendingCountUpdate', 'true');
        localStorage.setItem('lastCountUpdateRequest', updateTimestamp);
      } catch (storageErr) {
        // Ignore storage errors
      }
      
      return true;
    } catch (updateErr) {
      console.error('DIAGNOSTIC: Update error:', updateErr);
      return false;
    }
  } catch (err) {
    console.error('DIAGNOSTIC: Special update failed:', err);
    return false;
  }
}

/**
 * Manually activate a user's subscription (use after successful payment if webhooks fail)
 */
export async function manuallyActivateSubscription(priceId: string): Promise<boolean> {
  try {
    console.log(`=== MANUAL ACTIVATION START ===`);
    console.log(`Manually activating subscription with price ID: ${priceId}`);
    
    // TEMPORARY: Skip session validation to test if that's the issue
    console.log('TESTING: Skipping session validation temporarily');
        
    // Get current user ID for fallback
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        
        if (!userId) {
      console.error('Could not determine user ID for activation');
          return false;
        }
        
    console.log(`User ID confirmed: ${userId}`);
    
    // Try first with standard invocation
    try {
      console.log('=== ATTEMPTING EDGE FUNCTION CALL ===');
      console.log('Calling supabase.functions.invoke with:', { priceId });
      
        const { data, error } = await supabase.functions.invoke('activate-subscription', {
        body: { priceId },
        });

      console.log('Edge function response:', { data, error });
        
        if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function failed: ${error.message}`);
        }
        
      if (data?.success) {
        console.log('✅ Edge function succeeded');
        return true;
      } else {
        console.error('Edge function returned failure:', data);
        throw new Error(data?.error || 'Unknown edge function error');
      }
    } catch (edgeError) {
      console.error('Edge function call failed:', edgeError);
      
      // Check if it's a network/connection error
      if (edgeError instanceof Error) {
        console.error('Error details:', {
          name: edgeError.name,
          message: edgeError.message,
          stack: edgeError.stack
        });
      }
      
      throw edgeError; // Re-throw to stop here for debugging
    }
  } catch (error) {
    console.error('=== MANUAL ACTIVATION FAILED ===');
    console.error('Error in manuallyActivateSubscription:', error);
          return false;
        }
}

/**
 * Get the price ID for a subscription tier from the backend
 * This is more secure than hardcoding price IDs in the frontend
 */
export async function getPriceIdForTierFromBackend(tierName: string): Promise<string | null> {
  try {
    console.log(`Getting price ID for tier: ${tierName} from backend`);
    
    const { data, error } = await supabase.functions.invoke('get-price-id', {
      body: { tier: tierName.toLowerCase() }
    });
    
    if (error) {
      console.error('Error getting price ID from backend:', error);
      return null;
        }
        
    if (data?.priceId) {
      console.log(`Backend returned price ID: ${data.priceId} for tier: ${tierName}`);
      return data.priceId;
    }
    
    console.warn(`No price ID returned for tier: ${tierName}`);
    return null;
  } catch (err) {
    console.error('Failed to get price ID from backend:', err);
    return null;
  }
}

/**
 * Determine the price ID for a subscription tier
 * @deprecated Use getPriceIdForTierFromBackend instead for better security
 */
export function getPriceIdForTier(tierName: string): string {
  console.warn('getPriceIdForTier is deprecated. Use getPriceIdForTierFromBackend for better security.');
  
  if (tierName.toLowerCase() === 'unlimited') {
    // Use the monthly unlimited price ID from environment variables
    const monthlyUnlimitedPriceId = import.meta.env.VITE_STRIPE_UNLIMITED_MONTHLY_PRICE_ID;
    if (monthlyUnlimitedPriceId) {
      return monthlyUnlimitedPriceId;
    }
    // Fallback to hardcoded value if env var not available
    return 'price_1RGYI5BAYVpTe3LyMK63jgl2'; // Unlimited tier price ID
  } else {
    // Use the monthly premium price ID from environment variables
    const monthlyPremiumPriceId = import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID;
    if (monthlyPremiumPriceId) {
      return monthlyPremiumPriceId;
    }
    // Fallback to hardcoded value if env var not available
    return 'price_1RGYI5BAYVpTe3LyMK63jgl2'; // Premium tier price ID
  }
} 