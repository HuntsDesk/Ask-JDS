# Ask JDS Platform Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Build System](#build-system)
- [Multi-Domain Setup](#multi-domain-setup)
- [Layout System](#layout-system)
- [Database Structure](#database-structure)
- [UI Style Guide](#ui-style-guide)
- [Pricing Model](#pricing-model)
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

The application follows a consistent style guide for UI elements:

### Color Palette
```css
--primary: #F37022;                  /* Orange primary color */
--primary-foreground: white;         /* Text on primary */
--secondary: #001DA9;                /* Blue secondary color */
--secondary-foreground: white;       /* Text on secondary */
--background: white;                 /* Light mode background */
--foreground: #333333;               /* Light mode text */
--muted: #F5F5F5;                    /* Muted backgrounds */
--muted-foreground: #636363;         /* Text on muted backgrounds */
--card: white;                       /* Card backgrounds */
--card-foreground: #333333;          /* Text on cards */
--border: #D9D9D9;                   /* Border color */
--accent: #EBF3FF;                   /* Accent backgrounds */
--accent-foreground: #001DA9;        /* Text on accent */
--destructive: #E11D48;              /* Destructive actions */
--destructive-foreground: white;     /* Text on destructive */
--ring: #E5E5E5;                     /* Focus rings */
--focus-ring: #3B82F6;               /* Focus indicators */
--success: #22C55E;                  /* Success messages */
--warning: #F5B111;                  /* Yellow for warning states */
}
```

### Dark Mode
For dark mode, the palette shifts to darker backgrounds and lighter text:

```css
.dark {
  --background: #111111;             /* Dark mode background */
  --foreground: #F3F3F3;             /* Dark mode text */
  --muted: #262626;                  /* Dark muted backgrounds */
  --muted-foreground: #A1A1A1;       /* Dark muted text */
  --card: #1A1A1A;                   /* Dark card backgrounds */
  --card-foreground: #F3F3F3;        /* Dark card text */
  --border: #333333;                 /* Dark borders */
  --ring: #333333;                   /* Dark focus rings */
}
```

### SVG and Icon Handling

The application uses two approaches for handling icons and SVGs with dark mode support:

1. **Dynamic CSS Approach (Preferred)**
   
   SVGs are modified with CSS filters for dark mode, keeping a single source file:
   
   ```jsx
   <img 
     src="/images/icon.svg" 
     alt="Icon" 
     className="h-5 w-5 dark:invert dark:brightness-[1.75] dark:hue-rotate-180"
   />
   ```
   
   This applies these CSS transformations only in dark mode:
   - `dark:invert` - Inverts colors (black becomes white)
   - `dark:brightness-[1.75]` - Increases brightness for visibility
   - `dark:hue-rotate-180` - Maintains brand color feeling
   
   Benefits: 
   - Single file to maintain
   - Reduces HTTP requests
   - Prevents theme switch flicker
   - Automatic aspect ratio preservation

2. **Multiple Files Approach (Legacy)**
   
   For complex SVGs where CSS filters don't produce adequate results:
   
   ```jsx
   <>
     <img 
       src="/images/icon-light.svg" 
       alt="Icon" 
       className="block dark:hidden h-5 w-5"
     />
     <img 
       src="/images/icon-dark.svg" 
       alt="Icon" 
       className="hidden dark:block h-5 w-5"
     />
   </>
   ```
   
   This approach requires maintaining separate files but provides precise control over complex SVGs.

### Typography
```css
/* Headings */
h1 { @apply text-3xl font-bold; }
h2 { @apply text-2xl font-bold; }
h3 { @apply text-xl font-semibold; }
h4 { @apply text-lg font-semibold; }

/* Body text */
p { @apply text-base leading-relaxed; }
small { @apply text-sm; }
```

### Spacing System
The application follows an 8px spacing system (using Tailwind's default spacing scale):

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem;  /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem;    /* 16px */
--space-6: 1.5rem;  /* 24px */
--space-8: 2rem;    /* 32px */
--space-12: 3rem;   /* 48px */
--space-16: 4rem;   /* 64px */
```

## Pricing Model

### Subscription Tiers

#### Free Tier
- **Price**: $0/month
- **Features**:
  - 10 AI chat messages per month
  - Create and manage personal flashcards
  - Access to sample flashcards only
  - No course access

#### Premium Tier
- **Price**: $10/month
- **Features**:
  - Unlimited AI chat messages
  - Create and manage personal flashcards
  - Full access to premium flashcards
  - No course access

#### Per-Course Purchase
- **Price**: Varies per course (stored in `courses.price` column)
- **Access Duration**: Typically 30 days (controlled by `courses.days_of_access` column)
- **Features**:
  - Access to specific purchased course content
  - Course materials, videos, and assessments
  - Does not include premium flashcards or unlimited chat

#### Unlimited Tier
- **Price**: $30/month
- **Features**:
  - Unlimited AI chat messages
  - Create and manage personal flashcards
  - Full access to premium flashcards
  - Access to ALL courses

### Database Implementation

#### User Subscriptions
- Stored in `user_subscriptions` table
- Tracks subscription status, tier, and billing periods
- Key fields: `user_id`, `status`, `tier`, `current_period_end`

#### Course Enrollments
- Stored in `course_enrollments` table
- Tracks which users have access to which courses and when that access expires
- Key fields: `user_id`, `course_id`, `expires_at`, `status`

#### Course Pricing
- `courses.price`: Current selling price of the course
- `courses.original_price`: Original/regular price (for showing discounts)
- `courses.days_of_access`: Duration of access after purchase (typically 30 days)

### Access Control Logic

Course access is determined by the `has_course_access` function which checks:
1. If the course is free (`price = 0 or price IS NULL`)
2. If the user has an active enrollment for the specific course
3. If the user has an unlimited subscription

Chat access is limited based on the user's subscription tier and monthly message count tracked in the `message_counts` table.

## Course Enrollment System

### System Overview

Users can either purchase individual courses or subscribe to a plan that provides full access. The system uses Stripe for payments, Supabase for backend logic, and a dual-mode access model backed by SQL functions and policies.

### User Tiers

#### Free Tier
- Price: $0/month  
- Features:
  - 10 AI chat messages per month
  - Sample flashcards only
  - No course access

#### Premium Tier
- Price: $10/month  
- Features:
  - Unlimited AI chat messages
  - Full access to premium flashcards
  - No course access

#### Per-Course Purchase
- Price: Varies (stored in `courses.price`)
- Access Duration: Usually 30 days (`courses.days_of_access`)
- Features:
  - Access to that course's videos, materials, and lessons only

#### Unlimited Tier
- Price: $30/month  
- Features:
  - Unlimited AI chat
  - Premium flashcards
  - Full access to all courses

_Note: Legacy AskJDS-only subscriptions are deprecated and replaced by Premium or Unlimited tiers._

### Access Control Logic

Access to course content is granted when:
1. The course is free (`price = 0`)
2. The user has an active `course_enrollments` record with a valid `expires_at`
3. The user has an active Unlimited subscription in `user_subscriptions` table with `price_id` matching `price_unlimited_monthly` or `price_unlimited_annual`

SQL helper:

```sql
-- Access checker
SELECT * FROM has_course_access('user_id', 'course_id');
```

### Database Structure

#### Tables
- `courses`
- `course_enrollments`
- `user_subscriptions`
- `message_counts`
- `analytics_events`

#### Key Functions
- `has_course_access(user_id, course_id)`
- `create_course_enrollment(p_user_id, p_course_id, p_days_of_access)`

#### RLS Policies
- Users can read/update their own enrollments
- Only service role can INSERT
- Admins can access all data

### Stripe Integration

#### Products
1. Course Product (one-time)
2. Unlimited Subscription (recurring)
3. Premium Subscription (recurring)

#### Checkout Flows
- `createCourseCheckout()`
- `createCourseRenewalCheckout()`
- `createUnlimitedSubscriptionCheckout()`

All Stripe metadata includes user_id, course_id, and isRenewal flags.

### Webhook Logic

Edge function stripe-webhook handles:
- `checkout.session.completed`: Creates course enrollment or subscription
- `customer.subscription.updated`: Updates billing period
- `customer.subscription.deleted`: Sets subscription as inactive
- Adds analytics events after each event

### Frontend Components
- `CourseCard`: Shows price or access button
- `CourseDetail`: Shows purchase options or start learning
- `SubscriptionStatus`: Displays active plan, renewals, upgrades
- `CourseSampleVideos`: Tabs for 1-3 sample Gumlet videos

### Analytics & Notifications

#### Events Tracked
- course_view, course_purchase, subscription_start, lesson_complete

#### Email Notifications
- Sent 7 and 1 day before expiration (via Edge Function)
- Flags stored in notification_7day_sent and notification_1day_sent

### Testing & Security

#### Stripe Cards
- 4242 4242 4242 4242: Success
- 4000 0000 0000 9995: Insufficient funds

#### CSRF & Input Validation
- All POST routes validated via Zod
- CSRF token required in all Stripe API calls

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

### Common Issues

#### Supabase upsert conflicts
When using Supabase's `.upsert()` method with tables that have unique constraints, always specify the `onConflict` parameter to handle potential conflicts. For example:

```typescript
await supabase
  .from('table_name')
  .upsert(
    { data_to_upsert },
    { 
      onConflict: 'column1,column2', // Specify columns in the unique constraint
      ignoreDuplicates: false 
    }
  )
```

This is particularly important for junction tables or any table with composite unique constraints.

#### Failed to update mastery status on flashcards
If you encounter "Failed to update mastery status" errors when toggling flashcard mastery, ensure the upsert operation specifies the composite unique constraint of `user_id,flashcard_id` in the `onConflict` parameter.

#### RLS policy restrictions
If you encounter "violates row-level security policy" errors, check that your operation is allowed by the RLS policies:

- **flashcard_collections_junction**: Users can associate flashcards with collections they own OR with official collections
- **flashcard_subjects**: Users can associate their own flashcards with any subject
- **flashcard_progress**: Users can only manage their own progress records
- **collections**: Users can only modify non-official collections they own

## Console Commands

These commands can be executed in the browser's developer console during development:

### Subscription Testing
```javascript
// Enable premium subscription for testing
localStorage.setItem('forceSubscription', 'true')

// Disable forced subscription
localStorage.removeItem('forceSubscription')
```

The `forceSubscription` flag has these effects in development mode:
- Allows viewing of premium content (answers are visible)
- Removes premium content banners
- Bypasses the paywall for viewing restricted content
- BUT still prevents editing/deleting official flashcards (isReadOnly protection)

### Domain Switching
```javascript
// Force admin domain view
localStorage.setItem('current_domain', 'admin')

// Force JD Simplified domain view
localStorage.setItem('current_domain', 'jdsimplified')

// Force Ask JDS domain view
localStorage.setItem('current_domain', 'askjds')
```

### Theme Testing
```javascript
// Force light theme
localStorage.setItem('theme', 'light')

// Force dark theme
localStorage.setItem('theme', 'dark')
```

Note: These commands only work in development mode and are intended for testing purposes only.

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
   git clone https://github.com/HuntsDesk/ask-jds.git
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

## Flashcards Module

The Flashcards module provides a comprehensive study tool with the following features:

- Collections of flashcards organized by subject
- Subjects for categorizing and navigating content
- Advanced pagination with infinite scroll for large datasets
- Mastery tracking with visual indicators
- Premium content access controls
- Responsive layouts optimized for all screen sizes

### Component Structure

The flashcards module uses the following main components:

- **FlashcardsPage**: Container for all flashcard-related routes
- **FlashcardCollections**: Displays collections with card counts and mastery stats
- **FlashcardSubjects**: Subject browser and filter interface
- **AllFlashcards**: Browse all flashcards with filtering options
- **CreateSet**: Create new flashcard collections
- **CreateFlashcard**: Create individual flashcards
- **UnifiedStudyMode**: Combined study interface for reviewing cards

### Infinite Scroll Implementation

The flashcards module uses offset-based pagination with React Query's `useInfiniteQuery` for efficient data loading:

```typescript
// Query implementation with pagination
const { 
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteQuery({
  queryKey: [...queryKeys, filter, subjectIds],
  queryFn: async ({ pageParam = 0 }) => {
    // Calculate pagination parameters
    const pageSize = 21;  // Number of items per page
    const offset = pageParam * pageSize;
    
    // Supabase query with range-based pagination
    const { data, count } = await supabase
      .from('table')
      .select('*', { count: 'exact' })
      // Apply filters
      .range(offset, offset + pageSize - 1);
      
    // Check if more pages exist
    const hasNextPage = offset + data.length < count;
    const nextCursor = hasNextPage ? pageParam + 1 : null;
    
    return {
      items: data,
      nextCursor,
      totalCount: count
    };
  },
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  staleTime: 30 * 60 * 1000, // 30 minute cache
});
```

The UI implementation uses an Intersection Observer to trigger pagination:

```tsx
// DOM reference for intersection observer
const observerTarget = useRef(null);

// Setup observer when component mounts
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    },
    { threshold: 0.1 }
  );
  
  if (observerTarget.current) {
    observer.observe(observerTarget.current);
  }
  
  return () => observer.disconnect();
}, [fetchNextPage, hasNextPage]);

// Render the observer target at the bottom of the list
return (
  <>
    {/* Content items */}
    {hasNextPage && (
      <div ref={observerTarget} className="h-10 flex justify-center">
        {isFetchingNextPage && <LoadingSpinner />}
      </div>
    )}
  </>
);
```

### Caching Strategy

The flashcards module uses an optimized caching strategy:

- **Stale Time**: 30 minutes for collections, subjects, and exam types
- **Pagination**: Only fetches visible data, keeps previous pages in memory
- **Invalidation**: Selective cache invalidation on mutations (create/update/delete)
- **Prefetching**: Related data is prefetched in parallel queries

This approach provides the best balance between performance and memory usage for large datasets.

### Premium Content Handling

When browsing flashcards, premium content is handled in two ways:

1. **Filtering**: The 'Premium' tab filter shows only official content, using a custom query that finds cards where either:
   - The card itself is marked as official (`is_official = true`)
   - The card belongs to an official collection (`collection.is_official = true`)

2. **Card Display**: Premium cards are visually distinguished with:
   - An orange "PREMIUM CONTENT" banner at the top
   - Locked content indication for users without a subscription
   - Protected editing/deletion rights

Access control is determined by:
- `isCardPremium`: Checks if content should be treated as premium based on ownership and subscription status
- `isFlashcardReadOnly`: Determines if a flashcard should be editable, protecting official content

## Recent Updates

### Authentication System Fixes (2023-05-07)

Fixed critical issues with the authentication system:
- Implemented missing auth method implementations for signIn, signUp, and other authentication functions
- Added robust error handling for all authentication flows
- Improved user-facing error messages for better guidance during auth failures
- Fixed the TypeError that occurred during sign-in and sign-up attempts

### Authentication and Chat Loading Improvements (2023-05-06)

We've implemented a robust solution to address authentication and chat loading issues, using a Finite State Machine (FSM) approach:

#### 1. Authentication State Management
- Added proper tracking of authentication resolution state with the `isAuthResolved` flag
- Ensured ProtectedRoute components wait for auth to fully resolve before making routing decisions
- Fixed race conditions in authentication flow that were causing navigation loops

#### 2. Chat State Management
- Implemented a dedicated `useChatFSM` hook to manage chat loading states through well-defined transitions
- Created a proper loading sequence: auth → threads → messages
- Added advanced error handling with retry functionality

#### 3. UI Improvements
- Fixed dark mode compatibility issues on the welcome page
- Enhanced loading state visibility and feedback

These changes ensure a more reliable user experience with fewer loading interruptions and better state consistency across the application.
