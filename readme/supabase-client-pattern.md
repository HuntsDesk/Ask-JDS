# Supabase Client Usage Pattern

## Overview

This document outlines our standard pattern for using the Supabase client throughout the codebase. We've implemented a singleton pattern to ensure we have exactly one Supabase client instance per browser session, which helps prevent:

- Race conditions
- Multiple GoTrue warnings and conflicts
- Random auth failures after login
- Broken real-time subscriptions
- Multiple network connections to the same endpoint

## Implementation

The singleton client is implemented in `src/lib/supabase.ts` with these key features:

- Global instance caching via window object
- Type safety with Database types
- Custom fetch implementation with timeout handling
- Comprehensive error logging
- Automatic session refresh

## How to Use

Instead of creating a new client with `createClient()`, always import the shared client:

```typescript
// ❌ Don't do this:
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);

// ✅ Do this instead:
import { supabase } from '@/lib/supabase';
```

## Exception: Edge Functions & API Routes

Server-side code in Edge Functions and API routes should continue to create their own clients using environment variables specific to those environments:

```typescript
// In a Supabase Edge Function or API route:
import { createClient } from '@supabase/supabase-js';

// Create a client with appropriate service key:
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
```

## ESLint Rule

We've added an ESLint rule to enforce this pattern:

```javascript
'no-restricted-imports': [
  'error',
  {
    paths: [
      {
        name: '@supabase/supabase-js',
        importNames: ['createClient'],
        message: 'Please use the shared Supabase client from @/lib/supabase instead.',
      },
    ],
  },
]
```

This rule is automatically disabled for Edge Function and API route files.

## Benefits

- **Consistent Auth State**: All components use the same auth session
- **Reduced Network Traffic**: Prevents duplicate requests to Supabase
- **Better Error Handling**: Consistent error handling across the app
- **Simpler Testing**: Mock one client instead of multiple instances
- **Future-Proof**: Easy to upgrade Supabase client version in one place 