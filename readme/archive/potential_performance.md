
[MODE: RESEARCH]

Let me analyze the project for performance bottlenecks. I'll start by exploring the project structure.

Ran tool
Now let's look at the package.json to understand what libraries are being used:

Read file: package.json
Now, let's look at the src directory to understand the project structure:

Ran tool
Let's check Supabase related files since there might be database-related performance concerns:

Ran tool
Let's look at the supabase.ts file to understand database interactions:

Read file: src/lib/supabase.ts
Now let's look at a few components to understand rendering patterns and potential performance bottlenecks:

Ran tool
Let's look at HomePage.tsx since it's a large file and might have performance issues:

Read file: src/components/HomePage.tsx
Let's also look at a few hooks to understand data fetching patterns:

Ran tool
Let's look at the use-query-flashcards.ts file to understand data fetching patterns:

Read file: src/hooks/use-query-flashcards.ts
Let's also check out the React Query configuration:

Read file: src/lib/query-client.ts
Now, let's search for any components that might be processing large data sets or doing complex operations:

Ran tool
Let's also check for any unnecessary API or database calls:

Ran tool
Let's also check for large imports or asset loading that might impact performance:

Ran tool
Based on my analysis of the codebase, I can now provide a list of performance bottlenecks and optimization suggestions.

# Performance Bottlenecks and Optimization Recommendations

1. **Database Query Optimization**
   - Multiple sequential Supabase queries in components like `useFlashcardCollection` and `useFlashcards` causing waterfall network requests
   - Inefficient data loading in `studyDataLoader.ts` with multiple map/filter operations on database results
   - N+1 query pattern in flashcard components where collections, subjects, and exam types are fetched separately

2. **Rendering Performance**
   - Large component files like `HomePage.tsx` (627 lines) may have unnecessary re-renders 
   - Heavy data transformations in components (map/filter/reduce) occurring during render cycles
   - Missing React.memo for static or rarely changing components
   - Multiple useState calls in components like `use-messages.ts` causing potential re-render cascades

3. **Network Optimization**
   - Custom fetch implementation in `supabase.ts` has a 10-second timeout which is too long for a responsive UI
   - No retry or offline handling strategy for critical data fetches
   - No service worker implementation for caching common API responses

4. **Asset Loading**
   - Large icon imports from libraries like Lucide React across many components
   - No evidence of code splitting or lazy loading for routes
   - No image optimization strategy visible for `OptimizedImage` component

5. **State Management**
   - Excessive local state in components instead of centralized state management
   - Duplicate data fetching across different components
   - Inefficient context usage causing unnecessary re-renders 

6. **Recommendations**

   a. **Database & API Optimization**
   - Create composite Supabase RPC functions to fetch related data in a single request
   - Implement proper query batching for related flashcard data
   - Add proper indexing for frequently queried fields
   - Use `useQueryClient` from React Query to prefetch predictable user paths

   b. **React Rendering Optimization**
   - Apply React.memo to pure components, especially in lists
   - Use useMemo for expensive calculations and useCallback for functions passed to child components
   - Implement virtualization with react-window for long lists (especially in flashcard components)
   - Split large components into smaller ones with focused responsibilities

   c. **Code Splitting & Lazy Loading**
   - Implement React.lazy and Suspense for route-based code splitting
   - Lazy load heavy components like the rich text editor or complex UI elements
   - Implement dynamic imports for non-critical functionality

   d. **Asset Optimization**
   - Use tree-shakeable imports for icons: `import { X } from 'lucide-react/X'`
   - Implement proper image loading strategy with srcset and sizes attributes
   - Consider using modern image formats like WebP with fallbacks

   e. **Caching Strategy**
   - Review React Query settings to optimize staleTime and cacheTime based on data volatility
   - Implement a service worker for offline support and caching of static assets
   - Use localStorage caching for frequently accessed but rarely changing data

   f. **State Management**
   - Consider introducing a more robust state management solution for complex state
   - Normalize data structures to avoid redundancy and facilitate more efficient updates
   - Use context selectors to prevent unnecessary re-renders

By addressing these performance bottlenecks, the application should become more responsive, use less network bandwidth, and provide a better user experience.



[MODE: INNOVATE]

Let me brainstorm innovative approaches for addressing the performance bottlenecks identified in the analysis:

### Database Query Optimization Ideas

- **GraphQL Layer**: Introducing a GraphQL layer on top of Supabase could allow for precise data fetching with a single request, eliminating the N+1 problem
- **Denormalization Strategy**: Strategically denormalizing some data structures for flashcards to reduce join operations
- **Edge Function Aggregators**: Create Supabase Edge Functions that aggregate multiple database calls into single endpoints for common operations
- **Materialized Views**: For complex or frequently accessed data like flashcard collections with their relationships

### Front-end Performance Approaches

- **Component Architecture Redesign**: Split large components like HomePage into composable micro-components that can be optimized individually
- **Virtualization Everywhere**: Apply windowing techniques for all list-based views (threads list, flashcards, collections)
- **Custom React Query Extensions**: Develop specialized hooks that intelligently manage cache invalidation for related entities
- **Selective Hydration**: Consider implementing islands architecture for static/dynamic content separation
- **Suspense-based Waterfalls Removal**: Leverage React Suspense for coordinating parallel data fetching

### State Management Innovations

- **Event-Sourced Local State**: For flashcard study sessions, consider an event-sourced approach to track user progress with minimal re-renders
- **Atomic State Management**: Switch to a more granular state management system like Jotai or Recoil for targeted updates
- **Async Component State**: Explore libraries like use-context-selector to prevent context-based re-render cascades
- **Derived State Optimization**: Create a system of computed/derived values with intelligent dependency tracking

### Asset Delivery Enhancements

- **Modern Bundling Strategy**: Consider Vite's new features like import.meta.glob for dynamic imports based on user patterns
- **Icon System Overhaul**: Replace individual icon imports with a single SVG sprite system or a dynamic icon loader
- **Component-Level Code Splitting**: Beyond route-level, consider component-level code splitting for heavy UI elements
- **Resource Hints**: Implement preload/prefetch for critical assets and likely navigation paths

### Caching & Network Strategies

- **Staggered Loading Pattern**: Implement a tiered loading strategy where critical UI appears first, followed by content in priority order
- **Offline-First Architecture**: Redesign key workflows to function offline, with synchronization when connection is restored
- **Predictive Prefetching**: Analyze user behavior to prefetch likely-to-be-needed data based on current context
- **Two-Tier Caching**: Implement different caching strategies for different data types (reference data vs. user-specific data)

These possibilities represent different strategic directions rather than specific implementations. The next step would be to prioritize these ideas based on impact vs. implementation complexity.



[MODE: PLAN]

# Comprehensive Performance Optimization Plan

## Overview
This plan addresses the key performance bottlenecks in the application, prioritizing high-impact improvements that can be implemented incrementally. The plan is structured in phases focusing on the most critical issues first.

## Phase 1: Database Query Optimization

### 1.1 Create Composite Supabase Functions
1. Create a new migration file in the supabase/migrations directory
2. Implement RPC functions to fetch related data in a single query

```sql
-- Function for fetching flashcard data with all relationships in one call
CREATE OR REPLACE FUNCTION get_flashcard_with_relationships(flashcard_id UUID)
RETURNS JSONB AS $$
  -- Return flashcard with joined collections, subjects, and exam types
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'flashcard', to_jsonb(f.*),
      'collections', (
        SELECT jsonb_agg(to_jsonb(c.*))
        FROM collections c
        JOIN flashcard_collections_junction fcj ON c.id = fcj.collection_id
        WHERE fcj.flashcard_id = f.id
      ),
      'subjects', (
        SELECT jsonb_agg(to_jsonb(s.*))
        FROM subjects s
        JOIN flashcard_subjects fs ON s.id = fs.subject_id
        WHERE fs.flashcard_id = f.id
      ),
      'exam_types', (
        SELECT jsonb_agg(to_jsonb(e.*))
        FROM exam_types e
        JOIN flashcard_exam_types fe ON e.id = fe.exam_type_id
        WHERE fe.flashcard_id = f.id
      )
    )
    FROM flashcards f
    WHERE f.id = flashcard_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get all flashcards for a collection with relationships
CREATE OR REPLACE FUNCTION get_collection_flashcards(collection_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'collection', to_jsonb(c.*),
      'flashcards', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'flashcard', to_jsonb(f.*),
            'subjects', (
              SELECT jsonb_agg(to_jsonb(s.*))
              FROM subjects s
              JOIN flashcard_subjects fs ON s.id = fs.subject_id
              WHERE fs.flashcard_id = f.id
            ),
            'exam_types', (
              SELECT jsonb_agg(to_jsonb(e.*))
              FROM exam_types e
              JOIN flashcard_exam_types fe ON e.id = fe.exam_type_id
              WHERE fe.flashcard_id = f.id
            )
          )
        )
        FROM flashcards f
        JOIN flashcard_collections_junction fcj ON f.id = fcj.flashcard_id
        WHERE fcj.collection_id = c.id
      )
    )
    FROM collections c
    WHERE c.id = collection_id
  );
END;
$$ LANGUAGE plpgsql;
```

### 1.2 Update React Query Hooks
1. Refactor `src/hooks/use-query-flashcards.ts` to use the new RPC functions

```typescript
// Update the useFlashcards hook to use the new RPC function
export function useFlashcards(collectionId: string, options = {}) {
  return useQuery(
    flashcardKeys.cards(collectionId),
    async () => {
      if (!collectionId) return [];
      
      const { data, error } = await supabase.rpc(
        'get_collection_flashcards',
        { collection_id: collectionId }
      );
      
      if (error) throw error;
      
      // Transform the response to match existing format
      const collection = data.collection;
      const flashcards = data.flashcards.map(item => ({
        ...item.flashcard,
        subjects: item.subjects || [],
        exam_types: item.exam_types || [],
        collections: [collection]
      }));
      
      return flashcards;
    },
    {
      enabled: !!collectionId,
      ...options,
    }
  );
}
```

2. Implement similar updates for `useFlashcardCollection` and other query hooks

### 1.3 Optimize Query Caching Strategy
1. Update `src/lib/query-client.ts` to optimize caching parameters

```typescript
import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized cache settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Increase stale time for rarely-changing reference data
      staleTime: 10 * 60 * 1000, // 10 minutes
      // Increase cache time
      cacheTime: 30 * 60 * 1000, // 30 minutes
      // Retry failed queries 1 time
      retry: 1,
      // More aggressive retry delay for better user experience
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 15000),
      // More intelligent refetch strategies
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});
```

## Phase 2: React Rendering Optimization

### 2.1 Implement Component Memoization
1. Identify and memoize pure components in the flashcard system

```typescript
// In src/components/flashcards/FlashcardItem.tsx
import React from 'react';

const FlashcardItem = ({ card, onEdit, onDelete }) => {
  // Component implementation
};

// Memoize to prevent unnecessary re-renders
export default React.memo(FlashcardItem);
```

2. Apply similar memoization to other pure components

### 2.2 Optimize Large Components 
1. Refactor `src/components/HomePage.tsx` into smaller components

```typescript
// Create specialized sub-components
// src/components/home/BenefitsList.tsx
import React from 'react';
import { benefits } from '@/lib/constants/home-content';

export const BenefitsList = React.memo(() => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
      {benefits.map((benefit, index) => (
        <BenefitCard key={index} {...benefit} />
      ))}
    </div>
  );
});

// src/components/home/BenefitCard.tsx
import React from 'react';

export const BenefitCard = React.memo(({ icon: Icon, title, description, color, gradient }) => {
  return (
    <div className={`p-6 rounded-xl bg-gradient-to-br ${gradient}`}>
      <Icon className={`w-10 h-10 ${color}`} />
      <h3 className="text-xl font-semibold mt-4">{title}</h3>
      <p className="mt-2 text-gray-700">{description}</p>
    </div>
  );
});
```

### 2.3 Implement Virtualization for Lists
1. Add virtualized list rendering for chat history and flashcards

```typescript
// In src/components/flashcards/FlashcardsList.tsx
import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import FlashcardItem from './FlashcardItem';

const FlashcardsList = ({ cards }) => {
  // Memoize row renderer to prevent recreation on each render
  const rowRenderer = useMemo(() => {
    return ({ index, style }) => {
      const card = cards[index];
      return (
        <div style={style}>
          <FlashcardItem 
            card={card}
            onEdit={() => handleEdit(card.id)}
            onDelete={() => handleDelete(card.id)}
          />
        </div>
      );
    };
  }, [cards]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={cards.length}
            itemSize={120} // Adjust based on card height
          >
            {rowRenderer}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export default React.memo(FlashcardsList);
```

## Phase 3: Code Splitting & Lazy Loading

### 3.1 Implement Route-Based Code Splitting
1. Update the router configuration in `src/App.tsx` to use lazy loading

```typescript
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Lazy load route components
const HomePage = lazy(() => import('@/components/HomePage'));
const ChatContainer = lazy(() => import('@/components/chat/ChatContainer'));
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'));
const FlashcardsPage = lazy(() => import('@/components/flashcards/FlashcardsPage'));

export function App() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <HomePage />
          </Suspense>
        } 
      />
      <Route 
        path="/chat/*" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <ChatContainer />
          </Suspense>
        } 
      />
      {/* Add similar patterns for other routes */}
    </Routes>
  );
}
```

### 3.2 Implement Dynamic Imports for Heavy Components
1. Update imports of heavy components like rich text editors

```typescript
// In components that use heavy dependencies
import React, { lazy, Suspense } from 'react';

// Lazy load heavy components
const RichMarkdownEditor = lazy(() => import('@/components/RichMarkdownEditor'));

const ChatInput = () => {
  return (
    <div>
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse rounded"></div>}>
        <RichMarkdownEditor />
      </Suspense>
    </div>
  );
};
```

## Phase 4: Asset Optimization

### 4.1 Optimize Icon Imports
1. Replace bulk imports with specific imports in components

```typescript
// Before
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

// After
import X from 'lucide-react/dist/esm/icons/x';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Info from 'lucide-react/dist/esm/icons/info';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
```

### 4.2 Enhance Image Loading Strategy
1. Update the OptimizedImage component for better performance

```typescript
// In src/components/ui/optimized-image.tsx
import React from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  sizes = '100vw',
  priority = false,
  ...props
}) => {
  // Generate srcSet based on the source image
  const generateSrcSet = (imageSrc: string) => {
    // Basic implementation - in production, use a proper image service
    const basePath = imageSrc.split('.').slice(0, -1).join('.');
    const extension = imageSrc.split('.').pop();
    
    return `
      ${basePath}-sm.${extension} 640w,
      ${basePath}-md.${extension} 768w,
      ${basePath}-lg.${extension} 1024w,
      ${imageSrc} 1280w
    `;
  };

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      sizes={sizes}
      srcSet={generateSrcSet(src)}
      {...props}
    />
  );
};
```

## Phase 5: Network & Caching Optimizations

### 5.1 Optimize Supabase Client
1. Update `src/lib/supabase.ts` to improve fetch handling

```typescript
// Optimize the custom fetch function
function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 9);
  
  // Extract URL for logging
  const url = typeof input === 'string' 
    ? new URL(input, window.location.origin).pathname
    : input instanceof URL 
      ? input.pathname
      : 'Request';
  
  // Check network status immediately - Don't waste time on offline requests
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn(`[${requestId}] Network appears to be offline. Preventing request.`);
    return Promise.reject(new Error('Network connection unavailable.'));
  }
  
  // Reduce timeout from 10s to 5s for better UX
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.warn(`[${requestId}] Supabase fetch request timed out after 5 seconds: ${url}`);
  }, 5000);
  
  const fetchPromise = fetch(input, {
    ...init,
    signal: controller.signal
  });
  
  return fetchPromise
    .then(response => {
      clearTimeout(timeoutId);
      return response;
    })
    .catch(error => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${url} timed out after 5 seconds.`);
      }
      throw error;
    });
}
```

### 5.2 Implement Service Worker for Caching
1. Enhance `src/service-worker.ts` for better caching strategy

```typescript
// Add to service-worker.ts

// Cache static assets
const STATIC_CACHE = 'static-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets
];

// Cache API responses
const API_CACHE = 'api-cache-v1';
const API_ROUTES = [
  '/subjects',
  '/exam_types',
  // Add other API routes that can be cached
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // For API requests that can be cached
  if (API_ROUTES.some(route => requestUrl.pathname.includes(route))) {
    // Network first, fallback to cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else if (requestUrl.pathname.startsWith('/images/')) {
    // Cache first for images, network fallback
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((response) => {
          const clonedResponse = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        });
      })
    );
  }
  // For other requests, use default browser strategy
});
```

2. Register the service worker in `src/main.tsx`

```typescript
// Add to main.tsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
```

## Phase 6: State Management Improvements

### 6.1 Implement Optimized Context Provider
1. Create a new context with selector optimization

```typescript
// src/contexts/optimized-context.tsx
import React, { createContext, useContext, useReducer, useMemo } from 'react';

// Create context with initial undefined value
const StateContext = createContext(undefined);
const DispatchContext = createContext(undefined);

// Provider component
export function OptimizedProvider({ children, initialState, reducer }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Memoize the value to prevent unnecessary re-renders
  const memoizedState = useMemo(() => state, [state]);
  
  return (
    <StateContext.Provider value={memoizedState}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// Custom hook to access only specific parts of state
export function useStateSelector(selector) {
  const state = useContext(StateContext);
  if (state === undefined) {
    throw new Error('useStateSelector must be used within an OptimizedProvider');
  }
  
  // Select only what's needed from state
  return useMemo(() => selector(state), [state, selector]);
}

// Hook to access dispatch
export function useDispatch() {
  const dispatch = useContext(DispatchContext);
  if (dispatch === undefined) {
    throw new Error('useDispatch must be used within an OptimizedProvider');
  }
  return dispatch;
}
```

2. Implement for flashcard state management

```typescript
// src/contexts/flashcard-context.tsx
import React from 'react';
import { OptimizedProvider, useStateSelector, useDispatch } from './optimized-context';

// Define state and actions
const initialState = {
  cards: [],
  collections: [],
  subjects: [],
  examTypes: [],
  loading: false,
  error: null
};

// Reducer function
function flashcardReducer(state, action) {
  switch (action.type) {
    case 'SET_CARDS':
      return { ...state, cards: action.payload };
    case 'SET_COLLECTIONS':
      return { ...state, collections: action.payload };
    // Add other cases
    default:
      return state;
  }
}

// Provider component
export function FlashcardProvider({ children }) {
  return (
    <OptimizedProvider initialState={initialState} reducer={flashcardReducer}>
      {children}
    </OptimizedProvider>
  );
}

// Custom hooks for components
export function useCards() {
  return useStateSelector(state => state.cards);
}

export function useCollections() {
  return useStateSelector(state => state.collections);
}

export function useFlashcardDispatch() {
  return useDispatch();
}
```

## Implementation Checklist:

1. **Create Composite Supabase Functions**
   - Create SQL migration file with optimized query functions
   - Run migration to deploy functions
   - Update database access patterns in React Query hooks

2. **Optimize React Query Hooks**
   - Refactor useFlashcards hook to use RPC function
   - Update useFlashcardCollection hook for optimized data fetching
   - Enhance caching parameters in query-client.ts
   - Add query prefetching for predictable navigation paths

3. **Implement Component Memoization**
   - Apply React.memo to FlashcardItem component
   - Add memoization to pure components in HomePage
   - Optimize list rendering components with useMemo for handlers
   - Implement useCallback for event handlers passed to child components

4. **Refactor Large Components**
   - Split HomePage.tsx into smaller specialized components
   - Extract BenefitsList and BenefitCard into separate components
   - Create specialized QuestionsList component
   - Update imports in parent components

5. **Add Virtualization**
   - Implement react-window for flashcard lists
   - Add virtualization to chat message history
   - Add virtualization to collection lists
   - Include AutoSizer for responsive virtualized lists

6. **Implement Code Splitting**
   - Update App.tsx with lazy-loaded routes
   - Add Suspense boundaries with appropriate fallbacks
   - Create lazy-loaded imports for heavy components
   - Ensure error boundaries around Suspense components

7. **Optimize Asset Loading**
   - Refine icon imports across components
   - Enhance OptimizedImage component
   - Generate appropriate image size variants
   - Set up proper loading attributes on images

8. **Enhance Supabase Client**
   - Refine supabase.ts with optimized fetch function
   - Reduce request timeout from 10s to 5s
   - Improve offline detection and handling
   - Add better error messaging for network issues

9. **Implement Service Worker**
   - Enhance service-worker.ts with caching strategies
   - Register service worker in main.tsx
   - Set up cache invalidation for API responses
   - Configure precaching for critical assets

10. **Implement Optimized State Management**
    - Create optimized-context.tsx with selector pattern
    - Implement specific contexts for different data domains
    - Update components to use selector hooks
    - Add optimized dispatch functions
