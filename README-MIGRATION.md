# Project Migration Strategy: jdsimplified → root src

This document outlines the ongoing migration from the `jdsimplified` directory structure to the root `src` directory structure.

## Background

Our project initially used a nested structure with core code in the `jdsimplified` directory. To simplify development and deployment, we're gradually migrating all components, services, and utilities to the root `src` directory.

## Directory Structure Mapping

| jdsimplified/src/ | root src/ |
|-------------------|-----------|
| components/       | components/ |
| lib/              | lib/ |
| app/              | app/ |
| pages/            | pages/ |
| types/            | types/ |
| services/         | api/ |
| hooks/            | hooks/ |

## Current Status

The following components have already been migrated:
- `CourseCard` → `src/components/courses/CourseCard.tsx`
- Stripe checkout functionality → `src/lib/stripe/checkout.ts`
- Supabase client → `src/lib/supabase/client.ts`
- Subscription components → `src/components/subscription/`
- Subscribe page → `src/pages/SubscribePage.tsx`
- LoadingSpinner → `src/components/LoadingSpinner.tsx`

## Known Issues During Migration

During the transition period, you may encounter import errors like:

```
Failed to resolve import "../components/courses/CourseCard" from "jdsimplified/src/pages/Dashboard.tsx"
```

These errors occur because components that still reside in the `jdsimplified` directory are trying to import components that have been moved to the root `src` directory.

## Path Aliases

Our project is configured with path aliases to simplify imports:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@jds/*": ["./jdsimplified/src/*"]
    }
  }
}
```

```js
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@jds': path.resolve(__dirname, './jdsimplified/src'),
    },
  },
});
```

## Fixing Import Errors

When encountering import errors for migrated components:

1. **Update imports from jdsimplified components**:
   ```javascript
   // OLD - Relative path that no longer works
   import CourseCard from '../components/CourseCard';
   
   // NEW - Use path alias to reference the migrated component
   import CourseCard from '@/components/courses/CourseCard';
   ```

2. **Update UI component imports**:
   ```javascript
   // OLD
   import { Button } from '../../src/components/ui/button';
   
   // NEW
   import { Button } from '@/components/ui/button';
   ```

3. **For utility functions**:
   ```javascript
   // OLD
   import { createSupabaseClient } from '../lib/supabase/client';
   
   // NEW
   import { createSupabaseClient } from '@/lib/supabase/client';
   ```

## Migration Process

Follow these steps when migrating a component:

1. **Identify dependencies**: Before moving a component, identify all its imports and dependencies
2. **Create the component in the new location**: Copy the component to its new home in the root `src` directory
3. **Update imports in the new component**: Ensure the new component uses imports from the root `src` directory with `@/` path aliases
4. **Update references**: Find all files that import the component from its old location and update them to use `@/` path aliases
5. **Test thoroughly**: Verify the component works in its new location
6. **Remove the old component**: Only after confirming everything works, remove the original component

## Resolving Vite Build Errors

If you encounter Vite build errors like:
```
Failed to resolve import "@/components/courses/CourseCard" from "jdsimplified/src/pages/Dashboard.tsx"
```

You have two options:

1. **Migrate the entire file**: Move the file with the import error to the root `src` directory, updating all imports
2. **Fix the import temporarily**: Use a direct import path that works with Vite:
   ```javascript
   // Direct import using relative path from project root
   import CourseCard from '../../../src/components/courses/CourseCard';
   ```

## Completion Criteria

The migration will be complete when:
- All components, services, and utilities have been moved to the root `src` directory
- All import references have been updated
- The `jdsimplified` directory can be safely removed
- The application builds and runs without import errors

## Progress Tracking

Use Git commits with the prefix "MIGRATE:" to track components that have been migrated. 