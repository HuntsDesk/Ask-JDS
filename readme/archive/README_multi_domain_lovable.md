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

- A DomainContext provider that detects the current domain via multiple strategies (hostname, localStorage, URL paths)
- A domain-based feature flag system (isAskJDS, isJDSimplified)
- Domain-specific routing and UI customization

### Current Domains

- askjds.com → package name: ask-jds
- jdsimplified.com → package name: ask-jds (shares same codebase)

## Project Structure

The project follows a monorepo-style structure with shared code between domains:

```
/                           # Root project directory
├── .github/                # GitHub configurations
│   └── workflows/          # GitHub Actions workflows
│       └── deploy.yml      # Deployment workflow
├── dist/                   # Build output (created during build)
├── dist_askjds/            # AskJDS build copied here for deployment
├── dist_jdsimplified/      # JD Simplified build copied here for deployment
├── node_modules/           # Shared dependencies
├── public/                 # Public assets
├── src/                    # Main source code
│   ├── components/         # Shared components
│   ├── config/             # Configuration files
│   │   └── domains.ts      # Domain configuration
│   ├── contexts/           # React contexts
│   │   ├── DomainContext.tsx  # Domain detection and feature flags
│   │   └── AuthContext.tsx    # Authentication with Supabase
│   ├── layouts/            # Layout components
│   ├── lib/                # Utility functions and libraries
│   ├── pages/              # Page components
│   │   ├── common/         # Shared pages
│   │   ├── askjds/         # AskJDS specific pages
│   │   └── jds/            # JD Simplified specific pages
│   └── router/             # Routing configuration
│       └── DomainRouter.tsx  # Domain-aware routing
├── package.json            # Main package configuration
├── package-lock.json       # Dependency lock file
└── vite.config.js          # Vite configuration
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=https://prbbuxgirnecbkpdpgcb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmJ1eGdpcm5lY2JrcGRwZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjY1NTAsImV4cCI6MjA1NTA0MjU1MH0.tUE2nfjVbY2NCr0duUyhC5Rx-fe5TMBeCoWlkzAxxds
VITE_ASKJDS_DOMAIN=askjds.com
VITE_JDSIMPLIFIED_DOMAIN=jdsimplified.com
```

For GitHub Actions deployment, these variables should be configured as GitHub Secrets.

## Build & Development Scripts

The application includes the following NPM scripts for development and production builds:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:askjds": "vite --mode askjds",
    "dev:jds": "vite --mode jds",
    "build:askjds": "vite build --mode askjds",
    "build:jds": "vite build --mode jds",
    "build": "npm run build:askjds && npm run build:jds",
    "type-check": "tsc -b --noEmit",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  }
}
```

The `--mode` flag is used to specify which domain configuration to use during build time. This affects environment variables and conditional compilation.

## Domain Detection Implementation

The domain detection system is implemented through the `DomainContext` in `src/contexts/DomainContext.tsx`, which provides domain awareness throughout the application. This context-based approach enables components to conditionally render based on the current domain.

Domain detection follows this priority order:

1. **Environment Variables**: The Vite mode (`import.meta.env.MODE`) takes highest precedence:
   - `mode === 'jds'` → Sets domain to 'jdsimplified'
   - `mode === 'askjds'` → Sets domain to 'askjds'

2. **Local Storage**: If no environment variables are set, check localStorage for previously detected domain.

3. **URL-Based Detection**: If neither env vars nor localStorage has a value:
   - **For localhost**: Checks URL path (`path.startsWith('/jds')`)
   - **For production**: Checks hostname (`hostname.includes('jdsimplified.com')`)

4. **Default Fallback**: If all other methods fail, defaults to 'askjds'.

### Usage in Components

Components can access domain information using the `useDomain` hook:

```typescript
import { useDomain } from '@/contexts/DomainContext';

function MyComponent() {
  const { currentDomain, isJDSimplified, isAskJDS } = useDomain();
  
  // Conditional rendering based on domain
  return (
    <div>
      {isJDSimplified ? (
        <JDSimplifiedFeature />
      ) : (
        <AskJDSFeature />
      )}
    </div>
  );
}
```

## Deployment with GitHub Actions

The application is deployed using GitHub Actions with a workflow defined in `.github/workflows/deploy.yml`. This workflow:

1. Checks out the code
2. Sets up Node.js with npm caching
3. Installs dependencies using `npm ci --legacy-peer-deps`
4. Builds the application for each domain
5. Verifies build output (checks for presence of index.html)
6. Deploys to AWS S3
7. Invalidates CloudFront cache

### Required GitHub Secrets

The deployment workflow requires the following GitHub Secrets:

1. **AWS Credentials**:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`

2. **Supabase Credentials**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **CloudFront Distribution IDs**:
   - `CLOUDFRONT_ID_ASKJDS` - For Ask JDS
   - `CLOUDFRONT_ID_JDS` - For JD Simplified

### Sample Workflow Configuration

```yaml
name: Deploy Website

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy-askjds:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
          cache-dependency-path: '**/package-lock.json'
      
      - name: Install Dependencies
        run: npm ci --legacy-peer-deps
      
      - name: Fix vulnerabilities
        run: npm audit fix --legacy-peer-deps || true
        
      - name: Build Ask JDS
        run: npx vite build --mode askjds
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Prepare deployment directory
        run: |
          mkdir -p dist_askjds
          cp -r dist/* dist_askjds/
          
      - name: Verify build output
        run: |
          if [ ! -f dist_askjds/index.html ]; then
            echo "Error: Build output missing index.html file"
            exit 1
          fi
          echo "Build verification successful"
          
      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@v0.5.1
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ask-jds
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ${{ secrets.AWS_REGION }}
          SOURCE_DIR: dist_askjds
          
      - name: Invalidate CloudFront
        uses: koki-develop/cloudfront-invalidate-action@v0.1.0
        with:
          id: ${{ secrets.CLOUDFRONT_ID_ASKJDS }}
          paths: /*
          wait: true
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ${{ secrets.AWS_REGION }}

  # Similar job for JD Simplified...
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
      // Add domain-specific feature flags
    }
  }
};
```

2. Update the `DomainType` type in the same file:

```typescript
export type DomainType = 'askjds' | 'jdsimplified' | 'newDomain';
```

3. Add the domain to your `.env` file:

```
VITE_NEW_DOMAIN=newdomain.com
```

4. Add build scripts to your package.json:

```json
{
  "scripts": {
    "dev:newDomain": "vite --mode newDomain",
    "build:newDomain": "vite build --mode newDomain",
    // Update the build script to include the new domain
    "build": "npm run build:askjds && npm run build:jds && npm run build:newDomain"
  }
}
```

5. Create domain-specific pages in a new directory:

```
src/pages/newDomain/
```

6. Update the deployment workflow to include the new domain.

## Development Workflow

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies:

```bash
npm ci
```

3. Create a `.env` file with the required environment variables.

4. Start the development server for your target domain:

```bash
npm run dev:askjds
# or
npm run dev:jds
```

5. Build for production:

```bash
npm run build
```

## Performance Optimization Recommendations

Based on build logs, consider these optimizations:

1. **Code Splitting**: Some chunks are larger than 500KB after minification. Use dynamic imports to code-split:

```typescript
// Instead of direct import
import { HeavyComponent } from './components/HeavyComponent';

// Use dynamic import
const HeavyComponent = React.lazy(() => import('./components/HeavyComponent'));
```

2. **Manual Chunking**: Configure Vite to better split vendor code:

```javascript
// vite.config.js
export default defineConfig({
  // ...other config
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-popover'],
          'data-vendor': ['@tanstack/react-query']
        }
      }
    }
  }
});
```

3. **Update Dependencies**: Consider addressing the moderate security vulnerabilities in esbuild (via vite) when convenient. Test thoroughly after updates as they may contain breaking changes.

## Troubleshooting

### Common Issues

1. **Dependency Conflicts**: If you encounter peer dependency issues, use the `--legacy-peer-deps` flag with npm:

```bash
npm ci --legacy-peer-deps
```

2. **Build Verification Failures**: If the build fails verification, check that:
   - index.html is being generated properly
   - Required assets are included in the build output
   - Environment variables are correctly set

3. **Deployment Failures**: For S3 or CloudFront issues, verify:
   - AWS credentials are correctly set in GitHub Secrets
   - Bucket permissions allow for the actions being performed
   - CloudFront distribution IDs are correct
