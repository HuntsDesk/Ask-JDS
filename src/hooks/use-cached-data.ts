import { useState, useEffect, useCallback, useRef } from 'react';

// Update cache expiration times
const PREMIUM_CACHE_EXPIRATION = 10 * 24 * 60 * 60 * 1000; // 10 days
const USER_CONTENT_CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

// Cache key prefix
const CACHE_PREFIX = 'ask-jds-cache-';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  key: string;
}

interface CacheOptions {
  expiration?: number; // Custom expiration time in ms
  bypassCache?: boolean; // Force fetch from source
}

/**
 * Hook for caching data with expiration
 * @param key Unique cache key
 * @param fetchFn Async function to fetch data if cache is invalid
 * @param options Cache options
 * @returns [data, loading, error, refetch]
 */
export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): [T | null, boolean, Error | null, () => Promise<void>] {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs for options and fetchFn to prevent dependencies from changing
  const optionsRef = useRef(options);
  const fetchFnRef = useRef(fetchFn);
  
  // Update refs when props change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);
  
  // Function to check if cache is valid
  const isCacheValid = useCallback((item: CacheItem<T>): boolean => {
    const now = Date.now();
    const expiration = optionsRef.current.expiration || PREMIUM_CACHE_EXPIRATION;
    return now - item.timestamp < expiration;
  }, []);

  // Function to save data to cache
  const saveToCache = useCallback((data: T) => {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        key
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (err) {
      console.error(`Error saving to cache (${key}):`, err);
    }
  }, [cacheKey, key]);

  // Function to load data from cache or fetch
  const loadData = useCallback(async (bypassCache = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get from cache first unless bypass is specified
      if (!bypassCache && !optionsRef.current.bypassCache) {
        try {
          const cachedItem = localStorage.getItem(cacheKey);
          
          if (cachedItem) {
            const parsedItem: CacheItem<T> = JSON.parse(cachedItem);
            
            // If cache is valid, use it
            if (isCacheValid(parsedItem)) {
              setData(parsedItem.data);
              setLoading(false);
              return;
            }
          }
        } catch (cacheErr) {
          console.warn(`Cache read error (${key}):`, cacheErr);
          // Continue to fetch data if cache read fails
        }
      }
      
      // Fetch fresh data using the ref
      const freshData = await fetchFnRef.current();
      setData(freshData);
      saveToCache(freshData);
    } catch (err) {
      console.error(`Error fetching data (${key}):`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [cacheKey, key, saveToCache, isCacheValid]);

  // Load data on mount only
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      await loadData();
    };
    
    fetchData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
    // Using a stable dependency list to prevent infinite loops
  }, [key]); // Only depend on the key, not loadData

  // Function to manually refresh data
  const refetch = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  return [data, loading, error, refetch];
}

/**
 * Helper function to clear all cached data or specific keys
 */
export function clearCache(specificKey?: string): void {
  if (specificKey) {
    localStorage.removeItem(`${CACHE_PREFIX}${specificKey}`);
    return;
  }

  // Clear all cache items
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Helper function to invalidate cache when data changes
 */
export function invalidateCache(keys: string[]): void {
  keys.forEach(key => {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  });
} 