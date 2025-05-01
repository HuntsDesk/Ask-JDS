# Ask JDS Platform Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Build System](#build-system)
- [Multi-Domain Setup](#multi-domain-setup)
- [Layout System](#layout-system)
- [Database Structure](#database-structure)
- [UI Style Guide](#ui-style-guide)
- [Development Guidelines](#development-guidelines)
- [Security & Best Practices](#security--best-practices)
- [Troubleshooting](#troubleshooting)
- [Common Development Tasks](#common-development-tasks)
- [Contributing](#contributing)
- [Migration Backlog](#migration-backlog)
- [Additional Documentation](#additional-documentation)

## Overview

This monorepo powers three interrelated deployments from a single codebase:
- **Ask JDS** (askjds.com)
- **JD Simplified** (jdsimplified.com)
- **Admin Panel** (admin.jdsimplified.com)

Each is served via a domain-specific entrypoint with conditional logic driven by the DomainContext. All share the same Supabase backend, database, authentication, and UI foundations.

## Architecture

### Tech Stack
```
projectEnv: {
  runtime: "vite + deno (no node.js)",
  backend: "supabase edge functions (deno only)",
  frontend: "vite/react (ESM only)/Tailwind CSS",
  env: "single flat .env only (no nesting or overrides)",
  denoImports: "use npm: or jsr:, never relative or node_modules",
  viteOptimizer: "uses esbuild to pre-bundle/cache deps; config/env/lockfile changes trigger reopt",
  viteVersion: "5.4.17 (upgradable if needed, no downgrade required)",
  importMaps: "deprecated in favor of npm: imports for deno",
  node: "explicitly NOT used anywhere in this project",
  optimizationPolicy: "minimize file churn; rapid config changes trigger Vite reopt loops"
}
```

- **Runtime**: Vite + Deno (No Node.js)
- **Backend**: Supabase Edge Functions (Deno only)
- **Frontend**: Vite/React (ESM only)/Tailwind CSS
- **Authentication**: Supabase Auth

### Key Architectural Points
- Deno-native Edge Functions (Deno.serve, npm: specifiers only)
- Shared ESM-only components
- Vite dev/build system
- **No Node.js runtime** - Only used as dev-time tooling
- Single flat .env file approach (no nested environments)

### Environment Variables
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ASKJDS_DOMAIN=askjds.com
VITE_JDSIMPLIFIED_DOMAIN=jdsimplified.com
VITE_ADMIN_DOMAIN=admin.jdsimplified.com
BUILD_DOMAIN=askjds|jds|admin
```

## Build System

### Development Commands
```bash
# Start development server for specific domain
npm run dev:askjds  # Port 5173
npm run dev:jds     # Port 5174
npm run dev:admin   # Port 5175

# Default development server (askjds)
npm run dev
```

### Production Builds
```bash
# Build for all domains
npm run build

# Build for specific domain
npm run build:askjds
npm run build:jds
npm run build:admin

# Full production build with optimizations
./scripts/build.sh

# Build with options
./scripts/build.sh --skip-clean --skip-check --only=askjds,admin
```

### Utility Commands
```bash
# Clean Vite cache
npm run clean         # Clean domain-specific caches
npm run clean:full    # Clean all caches including node_modules/.vite
npm run clean:dist    # Clean distribution directories
npm run clean:all     # Clean everything

# Environment management
npm run env           # Show current environment status
npm run env:askjds    # Set environment to askjds
npm run env:jds       # Set environment to jds
npm run env:admin     # Set environment to admin
```

## Multi-Domain Setup

### Domain Detection

Domain detection follows this priority order:

1. **Environment Variables**: The Vite mode (`import.meta.env.MODE`) takes highest precedence:
   - `mode === 'jds'` → Sets domain to 'jdsimplified'
   - `mode === 'askjds'` → Sets domain to 'askjds'

2. **Local Storage**: If no environment variables are set, check localStorage for previously detected domain.

3. **URL-Based Detection**: If neither env vars nor localStorage has a value:
   - **For localhost**: Checks URL path (`path.startsWith('/jds')`)
   - **For production**: Checks hostname (`hostname.includes('jdsimplified.com')`)

4. **Default Fallback**: If all other methods fail, defaults to 'askjds'.

### GitHub Actions Setup

**Note**: The GitHub Actions workflow for JDS domain deployment needs the `CLOUDFRONT_ID_JDS` secret to be added to the repository secrets. This is currently not complete.

### Routing & Domain Router

Routing is driven by domain and feature flags from useDomain():

```jsx
<Route path="/" element={
  isJDSimplified ? <JDSHomePage /> : <AskJDSHomePage />
} />
```

Routes are conditionally rendered in DomainRouter.tsx based on flags: isAskJDS, isJDSimplified, isAdmin.

```jsx
// Example DomainRouter pattern
<Route path={currentDomain.routes.login} element={<AuthLayout><LoginPage /></AuthLayout>} />

{isAskJDS && (
  <Route path="/chat" element={<ProtectedRoute element={<MainLayout><ChatPage /></MainLayout>} />} />
)}

{isJDSimplified && (
  <Route path="/courses" element={<ProtectedRoute element={<MainLayout><CoursesPage /></MainLayout>} />} />
)}

{isAdmin && (
  <Route path="/dashboard" element={<ProtectedRoute element={<MainLayout><AdminDashboardPage /></MainLayout>} />} />
)}
```

## Layout System

### Layout Components

The application uses several layout components for consistency across features:

1. **BaseLayout**: A simple container layout that provides the core layout structure.

2. **PersistentLayout**: Used for protected routes, includes the sidebar and maintains state across navigation. This component handles:
   - Sidebar state management (expanded/collapsed)
   - Thread context for chat
   - Authentication redirects
   - Dynamic content padding based on sidebar state

3. **CourseLayout**: Specialized layout for course content, includes navigation for modules and lessons.

4. **DashboardLayout**: Used for dashboard pages with specialized navigation.

### PageContainer

All pages should wrap their content with the `PageContainer` component, which provides consistent padding and layout based on sidebar state:

```tsx
import { PageContainer } from '@/components/layout/PageContainer';

export const MyPage = () => {
  return (
    <PageContainer>
      <h1>My Content</h1>
      {/* Content automatically gets correct padding */}
    </PageContainer>
  );
};
```

PageContainer features:
- Dynamically applies horizontal padding based on sidebar state
- Supports max-width constraints for optimal readability
- Handles overflow behavior consistently
- Provides visual boundaries between sidebar and content (optional)
- Supports smooth transitions when sidebar state changes

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `disablePadding` | boolean | false | Disable automatic padding |
| `noOverflow` | boolean | false | Disable overflow handling |
| `maxWidth` | 'narrow' \| 'default' \| 'wide' \| string | 'default' | Container max width |
| `fullHeight` | boolean | true | Make container full height |
| `noTransitions` | boolean | false | Disable smooth transitions |
| `showBoundary` | boolean | false | Show visual boundary with sidebar |
| `flexColumn` | boolean | false | Use flex column layout to prevent sidebar overlap |
| `bare` | boolean | false | Remove all layout constraints for complete control |
| `className` | string | undefined | Additional CSS classes |

#### Special Cases

**Chat Page Exception**:
The chat page has unique layout requirements. Use:
```tsx
<PageContainer bare>
  {/* Chat UI with complete layout control */}
</PageContainer>
```

The `bare` prop removes all layout constraints (maxWidth, padding, overflow, flex) for components that need complete control over their layout, like the chat interface with its custom scrolling behavior.

### Layout Hooks

#### useLayoutState

A centralized hook that provides all layout-related values:

```tsx
const { 
  isDesktop,     // Is viewport desktop size
  isPinned,      // Is sidebar pinned
  setIsPinned,   // Function to pin/unpin sidebar
  isExpanded,    // Is sidebar expanded
  isMobile,      // Is viewport mobile size
  contentPadding, // Tailwind classes for padding
  contentMargin   // Tailwind classes for margin
} = useLayoutState();
```

#### useLayoutPadding

A lightweight hook that returns just padding and margin:

```tsx
const { contentPadding, contentMargin } = useLayoutPadding();
```

### Padding Values

The PageContainer dynamically applies horizontal padding based on sidebar state:

- `px-16` when sidebar is pinned and expanded
- `px-12` when pinned and collapsed
- `px-6` when not pinned but expanded
- `px-4` when not pinned and collapsed
- `px-4` on mobile

### Layout Animations

All layout shifts (like sidebar expanding/collapsing or pinning/unpinning) use smooth transitions:

```css
transition-all duration-300 ease-in-out
```

### Debug Tools

During development, you can use the LayoutDebugger to view current layout values:

1. Press `Alt+D` to toggle the debugger
2. It shows viewport size, sidebar state, and applied padding/margin classes

### Enhancements (Future)

- **Responsive Layout Scaling**: Additional breakpoint-specific adjustments
- **Layout Preferences**: User settings for preferred layout configuration
- **Visual Content Boundaries**: Additional visual delineation between sidebar and content

### Page Exceptions

Some pages may require custom layout handling:

- Chat page uses `noOverflow` to handle its own scrolling behavior
- Pages with complex UI elements may need custom padding

### Shared Functionality

All apps use:
- Supabase Auth
- Shared layouts and components
- Conditional rendering via useDomain()

Features:
- Chat: Ask JDS & JD Simplified
- Flashcards: Shared
- Courses: Full in JD Simplified
- Settings: Shared
- Admin tools: Only in Admin Panel

## Database Structure

### Overview

The Supabase database uses PostgreSQL with many-to-many relationships to organize content by subjects, collections, and exam types.

### Core Tables

1. **`flashcards`**
   - Primary storage for all flashcard content
   - Key fields: id, question, answer, created_by, is_official, is_public_sample, difficulty_level, etc.

2. **`subjects`**
   - Stores subject areas (e.g., Constitutional Law, Contracts, Torts)
   - Key fields: id, name, description, created_at

3. **`courses`**
   - Stores course information for JD Simplified learning platform
   - Key fields: id, title, overview, days_of_access, is_featured, status, etc.

4. **`course_enrollments`**
   - Tracks user enrollment in courses
   - Key fields: id, user_id, course_id, enrolled_at, expires_at

5. **`modules`**
   - Stores course module information
   - Key fields: id, course_id, title, description, position, created_at

6. **`lessons`**
   - Stores individual lesson content within modules
   - Key fields: id, module_id, title, content, position, duration, created_at

### Schema Inspection

The database includes built-in tools for inspecting schema structure:

```sql
-- Get complete database schema
select get_database_schema();

-- Get table-centric view
select * from schema_overview;

-- View specific table structure
select table_name, policies, constraints 
from schema_overview 
where table_name = 'your_table';

-- Find tables with RLS policies
select table_name, policies 
from schema_overview 
where policies != '[]'::jsonb;
```

## UI Style Guide

### Typography System

- Uses the "New York" style system from shadcn/ui
- Implemented through Tailwind CSS
- Prioritizes system fonts for performance

#### Font Scale
- xs: 0.75rem (12px) - For badges, small labels
- sm: 0.875rem (14px) - For form labels, descriptions
- base: 1rem (16px) - For body text
- lg: 1.125rem (18px) - For dialog titles
- xl: 1.25rem (20px) - For feature headings
- 2xl: 1.5rem (24px) - For section titles
- 3xl: 1.875rem (30px) - For main headings (mobile)
- 4xl: 2.25rem (36px) - For main headings (desktop)

### Brand Colors
```css
:root {
  /* Primary Brand Colors */
  --jds-blue: #00178E;                /* JDS Blue - Primary brand color */
  --jds-orange: #F37022;              /* JDS Orange - Secondary brand color */
  --jds-yellow: #F5B111;              /* JDS Yellow - Accent color */
  
  /* UI Brand Colors */
  --primary: 262.1 83.3% 57.8%;       /* Purple - Primary UI color */
  --primary-foreground: 210 20% 98%;  /* Light text on primary */
  --secondary: 220 14.3% 95.9%;       /* Light gray - Secondary UI color */
  --accent: 220 14.3% 95.9%;          /* Accent color for UI elements */
}
```

### Status Colors
```css
/* Status Colors */
--success: #22C55E;                   /* Green for success states */
--warning: #F5B111;                   /* Yellow for warning states */
--error: #EF4444;                     /* Red for error states */
```

### Chat Bubble Styling

The chat interface uses distinctive bubble styling to differentiate between user and assistant messages.

#### Current Implementation
- **User Messages**: 
  - Right-aligned with orange background (`#F37022`)
  - White text with rounded corners (except bottom-right)
  - Maximum width of 80% of container

- **Assistant Messages**:
  - Left-aligned with light gray background (`bg-gray-100`, dark: `bg-gray-800`)
  - Dark text (light in dark mode) with rounded corners (except bottom-left)
  - Maximum width of 80% of container

#### Planned Enhancements

1. **Timestamp Display**
   - Add subtle timestamps to messages (either always visible or on hover)
   - Use small, low-contrast text (0.75rem/12px) below each message
   - Format: "hh:mm AM/PM" or "Today, hh:mm" depending on recency
   - For older messages, display full date

2. **Interaction Enhancements**
   - Add copy button to messages for easy text copying
   - Implement message reactions (like/bookmark)
   - Add context menu with options: Copy, Quote, Share
   - Long-press on mobile should reveal interaction options

## Development Guidelines

### React Hooks Coding Standard

1. **Rules of Hooks — Always**
   - Call all hooks at the top of your function
   - Never call hooks inside if, for, while, switch, or after return
   - Never conditionally skip or reorder hooks

2. **Custom Hooks**
   ```js
   export function useX(someId?: string) {
     const [state, setState] = useState(defaultValue);
     const ref = useRef(null);
     
     // Early return only after all hooks are called
     if (!someId) {
       return { state: defaultValue, fetcher: async () => {} };
     }
     
     return { state, fetcher: async () => {} };
   }
   ```

3. **useEffect Dependencies**
   ```js
   // Good
   useCallback(() => {...}, [a, b, condition]);
   
   // Bad
   useCallback(() => {...}, condition ? [a, b] : [a]);
   ```

4. **Real-Time Subscription Management**
   ```js
   useEffect(() => {
     const sub = supabase.channel(...).on(...).subscribe();
     return () => {
       sub.unsubscribe();
     };
   }, [threadId]);
   ```

## Troubleshooting

### Vite Optimization Issues

If Vite throws:
```
504 (Outdated Optimize Dep)
```

Clear cache and restart:
```bash
rm -rf node_modules/.vite
npm run dev:askjds
```

Avoid rapid config changes (.env, tsconfig.json, package-lock.json) to prevent optimizer invalidation.

### Build System Issues

1. **Clean the cache**: `npm run clean:full`
2. **Restore environment**: `npm run env:restore`
3. **Force dependency optimization**: `npm run optimize`
4. **Rebuild with full checks**: `./scripts/build.sh`

For persistent issues, check the Vite logs for more detailed information.

## Security & Best Practices

### Supabase RLS Policies

Row Level Security (RLS) is used extensively to ensure data security:

1. **Always Enable RLS**
   - All tables must have RLS enabled
   - Default behavior should deny access unless explicitly granted

2. **Policy Naming Convention**
   - Use descriptive names: `table_name_action_role`
   - Example: `flashcards_select_authenticated_users`

3. **Checking Existing Policies**
   ```sql
   SELECT 
     schemaname, 
     tablename, 
     policyname, 
     permissive, 
     roles, 
     cmd, 
     qual, 
     with_check 
   FROM 
     pg_policies 
   ORDER BY 
     tablename, 
     policyname;
   ```

4. **Common Policy Patterns**
   - Owner-based access: `auth.uid() = owner_id`
   - Role-based access: `get_user_role(auth.uid()) = 'admin'`
   - Public content: `is_public = true`

### Authentication Security

1. **Email Verification**
   - Required for sensitive operations
   - Enforce via RLS with `auth.users.email_confirmed_at IS NOT NULL`

2. **Password Requirements**
   - Minimum 8 characters
   - Requires a combination of letters, numbers, and special characters
   - Implemented via Supabase Auth settings

3. **Session Management**
   - Short-lived session tokens (default 1 hour)
   - Refresh tokens with reasonable expiry (default 2 weeks)
   - Automatic session refresh via Supabase client

### Data Validation

1. **Server-side Validation**
   - All data must be validated in Edge Functions
   - Implement validation for all API endpoints

2. **Client-side Validation**
   - Use Zod schemas for form validation
   - Implement consistent error handling

## Common Development Tasks

### Adding a New Feature

1. **Create feature-specific components**
   ```bash
   # Example directory structure
   mkdir -p src/components/feature-name
   touch src/components/feature-name/FeatureComponent.tsx
   ```

2. **Implement domain-aware rendering**
   ```tsx
   import { useDomain } from '@/contexts/DomainContext';

   const FeatureComponent = () => {
     const { isAskJDS, isJDSimplified } = useDomain();
     
     return (
       <div>
         {isAskJDS && <AskJDSFeature />}
         {isJDSimplified && <JDSimplifiedFeature />}
       </div>
     );
   };
   ```

3. **Add routes to DomainRouter**
   ```tsx
   // In src/lib/domain-router.tsx
   {isAskJDS && (
     <Route 
       path="/new-feature" 
       element={
         <ProtectedRoute element={
           <MainLayout>
             <FeaturePage />
           </MainLayout>
         } />
       } 
     />
   )}
   ```

### Working with the Database

1. **Querying data with Supabase client**
   ```tsx
   const fetchData = async () => {
     const { data, error } = await supabase
       .from('your_table')
       .select('*')
       .eq('user_id', user.id);
       
     if (error) {
       console.error('Error fetching data:', error);
       return [];
     }
     
     return data;
   };
   ```

2. **Implementing RLS policies**
   ```sql
   -- Allow users to read their own data
   CREATE POLICY "users_read_own_data" ON "your_table"
   FOR SELECT
   USING (auth.uid() = user_id);
   
   -- Allow users to update their own data
   CREATE POLICY "users_update_own_data" ON "your_table"
   FOR UPDATE
   USING (auth.uid() = user_id);
   ```

## Contributing

### Development Workflow

1. **Setup the development environment**
   ```bash
   # Clone the repository
   git clone https://github.com/your-username/ask-jds.git
   cd ask-jds
   
   # Install dependencies
   npm install
   
   # Copy environment template
   cp .env.template .env
   
   # Start development server
   npm run dev:askjds
   ```

2. **Git workflow**
   - Use feature branches for all changes
   - Follow conventional commit messages
   - Squash commits before merging to main

3. **Testing**
   - Write tests for new features
   - Ensure existing tests pass before submitting PR
   - Test across all domains

### Code Style

- Follow the existing code style
- Use ESLint and Prettier for code formatting
- Run linting before committing changes:
  ```bash
  npm run lint
  ```

## Migration Backlog

These files may still be duplicated under jdsimplified/. Validate and migrate as needed:

```
jdsimplified/src/components/home/HeroSection.tsx
jdsimplified/src/components/home/FeaturesSection.tsx
jdsimplified/src/components/home/NonServicesSection.tsx
jdsimplified/src/components/home/FeaturedCoursesSection.tsx
jdsimplified/src/components/home/TestimonialsSection.tsx
jdsimplified/src/components/home/AboutSection.tsx
jdsimplified/src/components/home/FaqSection.tsx
jdsimplified/src/components/home/ContactSection.tsx
jdsimplified/src/components/home/CtaSection.tsx
jdsimplified/src/components/Navbar.tsx
jdsimplified/src/pages/Dashboard.tsx
jdsimplified/src/index.css
```

Completed migrations:
- ✅ jdsimplified/src/components/AuthenticatedLayout.tsx - Removed (unused)
- ✅ jdsimplified/src/pages/Dashboard.tsx - Migrated to src/pages/Dashboard.tsx

## Additional Documentation

Reference documentation for specific technical implementations:

- [Supabase JS Upgrade Summary](readme/supabase-js-upgrade-summary.md) - Technical details about the upgrade from Supabase JS 2.38.0 to 2.39.3
- [Supabase JS Upgrade Checklist](readme/supabase-js-upgrade-checklist.md) - Implementation checklist for the Supabase JS upgrade
- [Supabase Client Pattern](readme/supabase-client-pattern.md) - Standardized pattern for using the Supabase client throughout the codebase

### Flashcards Module

The Flashcards module provides study tools with the following features:
- Collections of flashcards organized by subject
- Progressive loading with skeleton UI for improved UX
- React Query integration for efficient data fetching and caching
- Mastery tracking with visual indicators
- Premium content access control
- Responsive grid layouts for all screen sizes

#### Component Structure
- `FlashcardsPage`: Main container for all flashcard-related routes
- `FlashcardCollections`: Displays collections with card counts and mastery stats
- `AllFlashcards`: Shows all flashcards with filtering options
- `FlashcardItem`: Individual flashcard component with mastery toggle
- `Card`: Reusable card component for collections and subjects
- `SkeletonFlashcard`: Loading placeholder components

#### Performance Optimizations
- Parallel data fetching for collections, subjects, and relationships
- Efficient relationship data processing with lookup maps
- Progressive content rendering with skeleton UI
- Memoization of filtered and processed data
- React Query for caching and background updates

#### Known Issues
- Tile buttons in study mode need adjustment for proper rendering
- Optimizations needed for handling large collections

To create a new flashcard collection:
1. Navigate to `/flashcards/collections`
2. Click "Add Collection"
3. Fill in the details and assign subjects

To study flashcards:
1. Select a collection
2. Click "Study" to enter study mode
3. Toggle mastery status with the checkmark button
