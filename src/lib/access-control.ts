/**
 * Access control utilities for courses
 */
import { createClient } from '@supabase/supabase-js';
import { trackEvent } from './analytics/track';

// Create a supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache for access checks
interface CacheItem {
  value: boolean;
  timestamp: number;
}
const accessCache = new Map<string, CacheItem>();

/**
 * Check if a user has access to a course
 * 
 * @param userId - The user ID
 * @param courseId - The course ID
 * @returns Promise<boolean> - Whether the user has access
 */
export async function checkCourseAccess(userId: string, courseId: string): Promise<boolean> {
  // Return false if missing required params
  if (!userId || !courseId) {
    return false;
  }
  
  // Check cache first
  const cacheKey = `access:${userId}:${courseId}`;
  const cachedResult = getCachedValue(cacheKey);
  
  if (cachedResult !== null) {
    return cachedResult;
  }
  
  try {
    // Call RPC function to check access
    const { data, error } = await supabase
      .rpc('has_course_access', { 
        p_user_id: userId, 
        p_course_id: courseId 
      });
      
    if (error) {
      console.error('Error checking course access:', error);
      
      // Log error to analytics
      trackEvent('error', 'access_check' as any, {
        error_message: error.message,
        user_id: userId,
        course_id: courseId
      });
      
      return false;
    }
    
    // Cache the result
    setCachedValue(cacheKey, !!data, CACHE_DURATION);
    
    // Track access check in analytics in development mode
    if (import.meta.env.MODE !== 'production') {
      trackEvent('debug', 'access_check' as any, {
        user_id: userId,
        course_id: courseId,
        has_access: !!data
      });
    }
    
    return !!data;
  } catch (error) {
    console.error('Unexpected error checking course access:', error);
    return false;
  }
}

/**
 * Get user subscription tier
 * 
 * @param userId - The user ID
 * @returns Promise<string> - The subscription tier
 */
export async function getUserSubscriptionTier(userId: string): Promise<'free' | 'askjds' | 'unlimited'> {
  if (!userId) {
    return 'free';
  }
  
  const cacheKey = `subscription:${userId}`;
  const cachedTier = getCachedValue(cacheKey);
  
  if (cachedTier !== null) {
    return cachedTier as 'free' | 'askjds' | 'unlimited';
  }
  
  try {
    // Check for unlimited subscription
    const { data: unlimitedData, error: unlimitedError } = await supabase
      .from('user_subscriptions')
      .select('price_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .in('price_id', ['price_unlimited_monthly', 'price_unlimited_annual'])
      .maybeSingle();
      
    if (unlimitedError) {
      console.error('Error checking unlimited subscription:', unlimitedError);
      return 'free';
    }
    
    if (unlimitedData) {
      setCachedValue(cacheKey, 'unlimited', CACHE_DURATION);
      return 'unlimited';
    }
    
    // Check for AskJDS subscription
    const { data: askjdsData, error: askjdsError } = await supabase
      .from('user_subscriptions')
      .select('price_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .eq('price_id', 'price_askjds_monthly')
      .maybeSingle();
      
    if (askjdsError) {
      console.error('Error checking AskJDS subscription:', askjdsError);
      return 'free';
    }
    
    if (askjdsData) {
      setCachedValue(cacheKey, 'askjds', CACHE_DURATION);
      return 'askjds';
    }
    
    // Default to free tier
    setCachedValue(cacheKey, 'free', CACHE_DURATION);
    return 'free';
  } catch (error) {
    console.error('Error getting user subscription tier:', error);
    return 'free';
  }
}

/**
 * Get remaining access time for a course in days
 * 
 * @param userId - The user ID
 * @param courseId - The course ID
 * @returns Promise<number> - Days remaining (0 if no access or unlimited)
 */
export async function getRemainingAccessDays(userId: string, courseId: string): Promise<number> {
  if (!userId || !courseId) {
    return 0;
  }
  
  try {
    // First check if user has unlimited access
    const tier = await getUserSubscriptionTier(userId);
    if (tier === 'unlimited') {
      return -1; // -1 indicates unlimited access
    }
    
    // Otherwise check for individual enrollment
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
      
    if (error || !data) {
      return 0;
    }
    
    // Calculate days remaining
    const now = new Date();
    const expiryDate = new Date(data.expires_at);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  } catch (error) {
    console.error('Error getting remaining access days:', error);
    return 0;
  }
}

/**
 * Get a value from the cache
 * 
 * @param key - The cache key
 * @returns The cached value or null if not found
 */
function getCachedValue<T>(key: string): T | null {
  const item = accessCache.get(key);
  
  if (!item) {
    return null;
  }
  
  // Check if item has expired
  if (Date.now() - item.timestamp > CACHE_DURATION) {
    accessCache.delete(key);
    return null;
  }
  
  return item.value as T;
}

/**
 * Set a value in the cache
 * 
 * @param key - The cache key
 * @param value - The value to cache
 * @param duration - How long to cache for (ms)
 */
function setCachedValue<T>(key: string, value: T, duration: number = CACHE_DURATION): void {
  accessCache.set(key, {
    value: value as any,
    timestamp: Date.now()
  });
  
  // Set up auto-expiry
  setTimeout(() => {
    accessCache.delete(key);
  }, duration);
}

/**
 * Clear the access cache for a user/course
 * 
 * @param userId - The user ID
 * @param courseId - The course ID (optional)
 */
export function clearAccessCache(userId: string, courseId?: string): void {
  if (courseId) {
    // Clear specific user/course cache
    accessCache.delete(`access:${userId}:${courseId}`);
  } else {
    // Clear all cache entries for this user
    for (const key of accessCache.keys()) {
      if (key.includes(`:${userId}:`)) {
        accessCache.delete(key);
      }
    }
    
    // Also clear subscription cache
    accessCache.delete(`subscription:${userId}`);
  }
} 