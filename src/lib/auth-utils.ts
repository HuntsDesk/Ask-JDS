// Auth utility functions that can be imported by other modules

import { supabase } from './supabase';

/**
 * Helper function that adds a timeout to a promise
 */
export function withTimeout<T>(
  promiseFunc: () => Promise<T>,
  timeoutMs: number = 10000,
  errorMessage: string = 'Operation timed out',
  retryCount: number = 0
): { promise: Promise<T>; cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let isCancelled = false;
  let currentPromise: Promise<T> | null = null;
  
  const cancel = () => {
    isCancelled = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const promise = new Promise<T>(async (resolve, reject) => {
    // Track retries
    let retries = 0;
    
    const executeWithRetry = async () => {
      if (isCancelled) {
        reject(new Error('Operation cancelled'));
        return;
      }
      
      try {
        // Set timeout for this attempt
        const timeout = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            timeoutId = null;
            if (retries < retryCount) {
              console.log(`Attempt ${retries + 1} timed out, retrying...`);
              retries++;
              executeWithRetry();
            } else {
              reject(new Error(errorMessage));
            }
          }, timeoutMs);
        });
        
        // Execute the promise function
        currentPromise = promiseFunc();
        
        // Race the promise against the timeout
        const result = await Promise.race([currentPromise, timeout]);
        
        // Clear the timeout if the promise resolves first
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (!isCancelled) {
          resolve(result);
        } else {
          reject(new Error('Operation cancelled'));
        }
      } catch (error) {
        // Clear the timeout if the promise rejects
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (isCancelled) {
          reject(new Error('Operation cancelled'));
          return;
        }
        
        // If retries available and not cancelled, retry
        if (retries < retryCount) {
          console.log(`Attempt ${retries + 1} failed, retrying...`, error);
          retries++;
          executeWithRetry();
        } else {
          reject(error);
        }
      }
    };
    
    executeWithRetry();
  });
  
  return { 
    promise,
    cancel
  };
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Fetch with retry capability for critical endpoints
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  backoff = 300
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (response.ok) return response;
    
    // Only retry on 5xx server errors or specific cases
    if (response.status >= 500 || response.status === 429) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    return response;
  } catch (err) {
    if (retries === 0) throw err;
    
    console.log(`Retrying fetch to ${url}, ${retries} retries left`);
    await new Promise(resolve => setTimeout(resolve, backoff));
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
}

/**
 * Ensure a user record exists in the database
 */
export async function ensureUserRecord(userId: string, email: string): Promise<void> {
  if (!userId || !email) {
    console.error('Cannot ensure user record: missing userId or email');
    return;
  }

  try {
    const response = await fetch('/api/ensure-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, email }),
    });

    if (!response.ok) {
      throw new Error(`Failed to ensure user record: ${response.status}`);
    }
    
    console.log('User record ensured in database');
  } catch (error) {
    console.error('Error ensuring user record:', error);
    // Don't throw - this is a non-critical operation
  }
} 