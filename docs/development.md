# Development Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- Deno (for Supabase Edge Functions)
- Supabase CLI
- Stripe CLI (for webhook testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HuntsDesk/Ask-JDS.git
   cd Ask-JDS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development (uses production database)**
   ```bash
   npm run dev
   ```

   **Note**: Development environment now uses the production database directly for a streamlined workflow.

## Development Commands

### Core Development
- `npm run dev` - Start development server (uses production database)
- `npm run dev:askjds` - Start Ask JDS domain development (port 5173)
- `npm run dev:jds` - Start JD Simplified domain development (port 5174)  
- `npm run dev:admin` - Start admin domain development (port 5175)

### Building & Quality
- `npm run build` - Build all three domains (askjds, jds, admin)
- `npm run build:askjds` - Build Ask JDS domain only
- `npm run build:jds` - Build JD Simplified domain only
- `npm run build:admin` - Build admin domain only
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint for code quality

### Testing & Quality Assurance
- No test framework is currently configured in package.json
- Use `npm run type-check` and `npm run lint` before committing changes

## Environment Configuration

### Simplified Development (January 2025)
Development now uses the production database directly for streamlined workflow:
- ✅ **Development uses production database** - No local Supabase required
- ✅ **Simplified workflow** - One environment, no sync issues
- ✅ **Instant production readiness** - Development IS production
- ✅ **Real data testing** - See exactly what users see

### Environment Variables

**Core Application Variables:**
```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ASKJDS_DOMAIN=askjds.com
VITE_JDSIMPLIFIED_DOMAIN=jdsimplified.com
VITE_ADMIN_DOMAIN=admin.jdsimplified.com
BUILD_DOMAIN=askjds|jds|admin
```

**Required Environment Variables (see `.env.example`):**

```bash
# Supabase (auto-populated in hosted environment)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # REGENERATE if using exposed key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_TEST_WEBHOOK_SECRET=whsec_...
STRIPE_LIVE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Application
ENVIRONMENT=development
PUBLIC_APP_URL=http://localhost:5173

# CDN & Media Services
VITE_GUMLET_ACCOUNT_ID=your_gumlet_account_id      # Video CDN (Gumlet)


# AI Models (Set via `npx supabase secrets set`)
AI_MODEL_PRIMARY_DEV=jds-titan      # Primary chat model for development
AI_MODEL_SECONDARY_DEV=jds-flash    # Secondary model for titles (development)
AI_MODEL_PRIMARY_PROD=jds-titan     # Primary chat model for production
AI_MODEL_SECONDARY_PROD=jds-flash   # Secondary model for titles (production)
AI_MODELS_LOGGING=true              # Enable model logging for debugging
```

## Development Workflow

### Multi-Domain Development
Each domain can be developed independently:

1. **Ask JDS** (port 5173): AI chat platform
2. **JD Simplified** (port 5174): Educational content  
3. **Admin** (port 5175): Administrative interface

### Code Organization

#### Component Structure
- Domain-specific components in respective folders (`/jds/`, `/askjds/`, `/admin/`)
- Shared UI components in `/ui/`
- Feature-specific components grouped by functionality

#### Import Patterns
- Use `@/` alias for src root imports
- Lazy load large components to improve performance
- Suspense boundaries with custom loading states

#### State Patterns
- Contexts for cross-cutting concerns (domain, subscription, layout)
- Custom hooks for feature-specific logic
- React Query for all server state management

### Build System

The project uses Vite with domain-aware configuration:

- **Separate builds** for each domain
- **Code splitting** for optimal performance
- **Environment detection** based on build mode
- **Asset optimization** with Gumlet (videos)

### Database Development

#### Production-First Approach
- Development uses production database directly
- No local database setup required
- Real-time collaboration with production data
- Simplified environment management

#### Database Interaction Guidelines
- All access protected by Supabase RLS policies
- Use established patterns from `.cursor/rules/supabase-rls-policies.mdc`
- Always wrap `auth.uid()` in `(select auth.uid())`
- Use specific roles (`to authenticated`) for performance

## Troubleshooting

### Build Issues
- Run `npm run type-check` to identify TypeScript errors
- Check that all imports use the `@/` alias correctly
- Verify environment variables are set for the target domain

### Runtime Issues
- Check browser console for client-side errors
- Verify Supabase connection in Network tab
- Check domain context is correctly detecting the environment

### Performance Issues  
- Use React DevTools Profiler to identify slow components
- Check for unnecessary re-renders with React Query DevTools
- Monitor database query performance in Supabase dashboard

## Key Dependencies

### Core Framework
- React 18 with TypeScript
- Vite for building and dev server
- React Router for client-side routing

### UI & Styling
- Tailwind CSS for styling
- Radix UI for accessible components
- Lucide React for icons

### Backend Integration
- Supabase JS SDK for database and auth
- Stripe JS for payment processing
- React Query for server state

### AI Integration
- OpenAI SDK for GPT models
- Google Generative AI for Gemini models