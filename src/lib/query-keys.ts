/**
 * Query keys factory and structure for React Query
 * This file centralizes all query keys to ensure consistency and avoid typos
 */

/**
 * Create a set of query keys for a given base key
 */
export const createQueryKeys = <T extends string>(baseKey: T) => ({
  all: [baseKey] as const,
  lists: () => [...createQueryKeys(baseKey).all, 'list'] as const,
  list: (filters: unknown) => [...createQueryKeys(baseKey).lists(), { filters }] as const,
  details: () => [...createQueryKeys(baseKey).all, 'detail'] as const,
  detail: (id: string) => [...createQueryKeys(baseKey).details(), id] as const,
});

/**
 * Application query keys
 */
export const queryKeys = {
  threads: {
    all: ['threads'] as const,
    thread: (id: string) => [...queryKeys.threads.all, id] as const,
    messages: (threadId: string) => [...queryKeys.threads.thread(threadId), 'messages'] as const,
  },
  user: {
    profile: ['user', 'profile'] as const,
    settings: ['user', 'settings'] as const,
    subscription: ['user', 'subscription'] as const,
    messageCount: ['user', 'messageCount'] as const,
  }
}; 