# Multi-Domain React TypeScript Application

A robust React TypeScript boilerplate that supports multi-domain deployment from a single codebase. This architecture enables per-domain builds, routing, and feature toggling.

## Tech Stack

- React 18+
- TypeScript
- Vite as the build tool
- Tailwind CSS for styling
- React Router v6+ for SPA routing
- Supabase Auth (email/password, session persistence)
- shadcn/ui for UI components

## Multi-Domain Architecture

The application is designed to support multiple domains using:

- A DomainContext provider that detects the current domain via window.location.hostname
- A domain-based feature flag system (isAskJDS, isJDSimplified, isAdmin)
- Domain-specific routing and UI customization

### Sample Domains

- askjds.com → package name: ask-jds
- jdsimplified.com → package name: jds
- admin.jdsimplified.com → package name: admin

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=https://prbbuxgirnecbkpdpgcb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmJ1eGdpcm5lY2JrcGRwZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjY1NTAsImV4cCI6MjA1NTA0MjU1MH0.tUE2nfjVbY2NCr0duUyhC5Rx-fe5TMBeCoWlkzAxxds
VITE_ASKJDS_DOMAIN=askjds.com
VITE_JDSIMPLIFIED_DOMAIN=jdsimplified.com
VITE_ADMIN_DOMAIN=admin.jdsimplified.com
```

## Build & Development Scripts

The application includes the following NPM scripts for development and production builds:

```json
{
  "scripts": {
    "dev:askjds": "BUILD_DOMAIN=askjds vite",
    "dev:jds": "BUILD_DOMAIN=jds vite",
    "dev:admin": "BUILD_DOMAIN=admin vite",
    "build:askjds": "BUILD_DOMAIN=askjds vite build --outDir=dist/askjds",
    "build:jds": "BUILD_DOMAIN=jds vite build --outDir=dist/jdsimplified",
    "build:admin": "BUILD_DOMAIN=admin vite build --outDir=dist/admin",
    "build": "npm run build:askjds && npm run build:jds && npm run build:admin"
  }
}
```

Add these scripts to your package.json file to enable domain-specific development and builds.

## Project Structure

The application follows a structured organization:

```
src/
├── config/
│   └── domains.ts           # Domain configuration
├── contexts/
│   ├── DomainContext.tsx    # Domain detection and feature flags
│   └── AuthContext.tsx      # Authentication with Supabase
├── layouts/
│   ├── MainLayout.tsx       # Main application layout
│   └── AuthLayout.tsx       # Layout for authentication pages
├── lib/
│   └── supabase.ts          # Supabase client setup
├── pages/
│   ├── common/              # Pages shared across domains
│   ├── askjds/              # AskJDS specific pages
│   ├── jds/                 # JDSimplified specific pages
│   └── admin/               # Admin specific pages
└── router/
    └── DomainRouter.tsx     # Domain-aware routing
```

## Adding a New Domain

To add a new domain to the application:

1. Add the domain configuration to `src/config/domains.ts`:

```typescript
export const domains: Record<DomainType, DomainConfig> = {
  // Existing domains...
  
  newDomain: {
    key: 'newDomain',
    name: 'New Domain Name',
    hostname: import.meta.env.VITE_NEW_DOMAIN || 'newdomain.com',
    primaryColor: '#FF5733',
    routes: {
      home: '/',
      login: '/login',
      // Add domain-specific routes
    },
    features: {
      chat: true,
      courses: false,
      admin: false,
      // Add domain-specific feature flags
    }
  }
};
```

2. Update the `DomainType` type in the same file:

```typescript
export type DomainType = 'askjds' | 'jds' | 'admin' | 'newDomain';
```

3. Add the domain to your `.env` file:

```
VITE_NEW_DOMAIN=newdomain.com
```

4. Add build scripts to your package.json:

```json
{
  "scripts": {
    "dev:newDomain": "BUILD_DOMAIN=newDomain vite",
    "build:newDomain": "BUILD_DOMAIN=newDomain vite build --outDir=dist/newDomain",
    // Update the build script to include the new domain
    "build": "npm run build:askjds && npm run build:jds && npm run build:admin && npm run build:newDomain"
  }
}
```

5. Create domain-specific pages in a new directory:

```
src/pages/newDomain/
```

6. Update the `DomainRouter.tsx` to include routes for the new domain:

```typescript
{isNewDomain && (
  <>
    <Route path="/" element={
      <MainLayout>
        <NewDomainHomePage />
      </MainLayout>
    } />
    {/* Add other domain-specific routes */}
  </>
)}
```

## Adding Domain-Specific Routes or UI Logic

The application uses the `useDomain` hook to determine what features, routes, or UI elements to render:

```typescript
const MyComponent = () => {
  const { currentDomain, isAskJDS, isJDSimplified, isAdmin } = useDomain();
  
  return (
    <div>
      {/* Common UI for all domains */}
      <h1>{currentDomain.name}</h1>
      
      {/* Domain-specific UI */}
      {isAskJDS && <div>AskJDS specific content</div>}
      {isJDSimplified && <div>JD Simplified specific content</div>}
      {isAdmin && <div>Admin specific content</div>}
      
      {/* Feature-based UI */}
      {currentDomain.features.chat && <ChatComponent />}
      {currentDomain.features.courses && <CoursesComponent />}
    </div>
  );
};
```

## How Domain-Based Feature Flags Work

The domain-based feature flag system works as follows:

1. The `DomainContext` provider determines the current domain based on `window.location.hostname` or a build-time environment variable.

2. It provides domain information and feature flags through the `useDomain` hook.

3. Components can access domain-specific data and feature flags using the hook:

```typescript
const { currentDomain, isAskJDS, isJDSimplified, isAdmin } = useDomain();

// Using domain-specific data
const primaryColor = currentDomain.primaryColor;
const homeRoute = currentDomain.routes.home;

// Using feature flags from the domain config
const showChatFeature = currentDomain.features.chat;
const showCoursesFeature = currentDomain.features.courses;

// Using domain-type flags
if (isAskJDS) {
  // AskJDS specific logic
}
```

4. The router uses these flags to determine which routes to render for the current domain.

## Authentication Setup with Supabase

The application uses Supabase for authentication:

1. The Supabase client is configured in `src/lib/supabase.ts` using environment variables.

2. The `AuthContext` provides authentication functionality:

```typescript
const { user, session, loading, signIn, signUp, signOut } = useAuth();

// Sign in a user
await signIn('user@example.com', 'password');

// Sign up a new user
await signUp('newuser@example.com', 'password');

// Sign out
await signOut();
```

3. Protected routes use a `ProtectedRoute` component that redirects to the login page if the user is not authenticated.

## Development Workflow

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with the required environment variables.

4. Start the development server for your target domain:

```bash
npm run dev:askjds
# or
npm run dev:jds
# or
npm run dev:admin
```

5. Build for production:

```bash
npm run build
```

This will create separate builds for each domain in the `dist` directory.

## Deployment

You can deploy the domain-specific builds to different environments:

1. For askjds.com, deploy the contents of `dist/askjds`
2. For jdsimplified.com, deploy the contents of `dist/jdsimplified`
3. For admin.jdsimplified.com, deploy the contents of `dist/admin`

Each build contains only the code and dependencies needed for that specific domain.
