# Ask JDS Platform

Multi-domain legal education platform serving AI-powered chat, courses, and flashcards from a single codebase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Deno (for Supabase Edge Functions)
- Supabase CLI
- Stripe CLI (for webhook testing)

### Installation

1. **Clone and install**
   ```bash
   git clone https://github.com/HuntsDesk/Ask-JDS.git
   cd Ask-JDS
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development**
   ```bash
   npm run dev
   ```

   **Note**: Development uses production database for streamlined workflow.

## Platform Overview

This monorepo powers three deployments from a single codebase:

- **[Ask JDS](https://askjds.com)** - AI-powered legal chat platform
- **[JD Simplified](https://jdsimplified.com)** - Legal education with courses and flashcards  
- **[Admin Panel](https://admin.jdsimplified.com)** - Administrative interface

All domains share the same Supabase backend, database, authentication, and UI foundations.

## Legal Document Management

The platform includes a comprehensive legal agreements system that automatically tracks user acceptance of Terms of Service, Privacy Policy, and Educational Disclaimer with full audit trails for compliance.

### Version Management

**Location**: `src/lib/legal-agreements.ts`

Legal document versions are centrally managed in the `LEGAL_DOCUMENTS` constant:

```typescript
export const LEGAL_DOCUMENTS = {
  terms: {
    version: "2025-01-15",           // Update this when terms change
    effectiveDate: "2025-01-15",    // Date new terms take effect
    displayTitle: "Terms of Service (v2025.1)"
  },
  privacy: {
    version: "2025-01-15",
    effectiveDate: "2025-01-15", 
    displayTitle: "Privacy Policy (v2025.1)"
  },
  disclaimer: {
    version: "2025-01-15",
    effectiveDate: "2025-01-15",
    displayTitle: "Educational Disclaimer (v2025.1)"
  }
} as const;
```

### Updating Legal Documents

**When terms/privacy/disclaimer change:**

1. **Update the content** in respective page components (`src/pages/TermsOfService.tsx`, etc.)
2. **Update version numbers** in `src/lib/legal-agreements.ts`
3. **Deploy changes** - existing users will see acceptance prompts for new versions
4. **Audit trail** - all acceptances are automatically logged with timestamps and IP addresses

### Database Schema

The `user_agreements` table tracks all legal document acceptances:

- `user_id` - Links to authenticated user
- `document_type` - 'terms', 'privacy', or 'disclaimer'  
- `version` - Which version was accepted
- `accepted_at` - Timestamp of acceptance
- `ip_address` - User's IP for legal audit trail
- `user_agent` - Browser information

**Security**: Full RLS policies ensure users can only view their own agreements, while admins can access all records for compliance auditing.

## Analytics Integration

The platform uses Usermaven for privacy-focused analytics across all domains.

### Configuration

**Location**: `.env` and `src/lib/analytics/usermaven.ts`

```bash
# Usermaven Analytics
VITE_USERMAVEN_KEY=your-usermaven-key
VITE_USERMAVEN_TRACKING_HOST=https://a.jdsimplified.com
```

### Key Features

- **Privacy-Focused**: Uses a white-labeled domain (`a.jdsimplified.com`) for first-party data collection
- **Cross-Domain Tracking**: Seamlessly tracks user journey across all domains
- **User Identification**: Associates analytics with user profiles when authenticated
- **Event Tracking**: Captures key user interactions throughout the application:
  - Authentication events (sign-ups, logins)
  - Chat interactions (thread creation, message sending)
  - Subscription events (checkout initiation, purchases)
  - Feature usage (courses, flashcards, content engagement)

### Implementation Details

- **Provider**: `UsermavenAnalyticsProvider` in `src/contexts/UsermavenContext.tsx`
- **Hook**: `useAnalytics` in `src/hooks/use-analytics.ts`
- **Debug**: Debugging interface available at `/debug/usermaven`
- **Security**: CSP headers configured to allow connections to the tracking domain

## Development Commands

### Core Development
- `npm run dev` - Start development server (production database)
- `npm run dev:askjds` - Ask JDS domain (port 5173)
- `npm run dev:jds` - JD Simplified domain (port 5174)  
- `npm run dev:admin` - Admin domain (port 5175)

### Building & Quality
- `npm run build` - Build all three domains
- `npm run type-check` - TypeScript type checking
- `npm run lint` - ESLint code quality check

## Project Structure

```
├── src/                    # React frontend application
│   ├── components/        # UI components organized by feature
│   ├── pages/            # Page-level components
│   ├── lib/              # Utilities and configurations
│   └── hooks/            # Custom React hooks
├── supabase/
│   ├── functions/        # Deno Edge Functions
│   └── migrations/       # Database migrations
├── docs/                 # Detailed documentation
│   ├── architecture.md  # System architecture
│   ├── development.md   # Development guide
│   ├── database.md      # Database & RLS policies
│   └── security.md      # Security implementation
├── readme/               # Legacy documentation (archived)
└── scripts/              # Deployment and utility scripts
```

## Architecture Highlights

### Multi-Domain Architecture
- **Domain Detection**: `DomainProvider` context determines active domain
- **Unified Layout**: Single modern UI system shared across all domains
- **Domain-Specific Features**: Preserves ability to serve domain-specific content when needed
- **Shared Backend**: Single Supabase instance serves all domains
- **Build System**: Vite creates separate distributions per domain

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno only, no Node.js)
- **Database**: Supabase with Row Level Security (RLS)
- **Auth**: Supabase Auth with comprehensive email confirmation flow
- **Payments**: Stripe with subscription management
- **AI**: Google Gemini with tiered model approach
- **Analytics**: Usermaven with white-labeled domain for privacy-focused tracking

### Authentication Flow
- **Email Confirmation**: Robust signup flow with email verification
- **Error Handling**: Comprehensive OTP error detection and user-friendly recovery
- **Resend Functionality**: Inline email resend with auto-focus and validation
- **Tab Navigation**: Seamless switching between signin/signup modes
- **Session Management**: Automatic redirect handling with preserved message state

### Key Features
- **Chat System**: AI-powered legal Q&A with thread management
- **Flashcards**: Hierarchical study system (Subjects → Collections → Cards)
- **Course System**: Video-based learning with progress tracking
- **Admin Panel**: Content management and user administration
- **Analytics**: Comprehensive event tracking and user behavior analysis

## Performance & Security

### Database Performance
- ✅ **100% Optimized**: Zero Performance Advisor suggestions remaining
- 🚀 **Performance Gains**: 25-60% improvements across all features
- 💾 **Efficient Storage**: Optimized index architecture with zero waste

### Security Implementation
- ✅ **Complete Security Overhaul**: 20+ edge functions with unified auth
- 🛡️ **Automated Security Pipeline**: Lighthouse CI + manual fallbacks
- 🔒 **RLS Policies**: All database access protected with optimized policies
- 📊 **Rate Limiting**: Database-level protection with configurable limits

## Environment Configuration

Development uses production database for streamlined workflow:

```bash
# Core variables
VITE_SUPABASE_URL=https://prbbuxgirnecbkpdpgcb.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Domain configuration
VITE_ASKJDS_DOMAIN=askjds.com
VITE_JDSIMPLIFIED_DOMAIN=jdsimplified.com
VITE_ADMIN_DOMAIN=admin.jdsimplified.com

# Media CDNs
VITE_GUMLET_ACCOUNT_ID=your_gumlet_id      # Video CDN

# Analytics
VITE_USERMAVEN_KEY=your_usermaven_key
VITE_USERMAVEN_TRACKING_HOST=https://a.jdsimplified.com
```

### Environment Variable Handling

**Important**: Vite processes environment variables during build time, not runtime. This has important implications:

1. **Runtime Validation**: The application includes environment validation in `src/lib/env-utils.ts` that strictly checks for required variables.
2. **Stripe Integration**: Pay special attention to `VITE_STRIPE_PUBLISHABLE_KEY` as it's critical for payment processing.
3. **Local Development**: Always restart the dev server after changing `.env` files to ensure variables are properly loaded.
4. **Production Builds**: Environment variables must be available during the build process, not just at runtime.
5. **Troubleshooting**: If you encounter "Missing required environment variable" errors despite variables being in `.env`, try:
   - Ensuring the dev server was restarted after changes
   - Verifying the variable name matches exactly what's expected in validation
   - Running `npm run verify-env` to check if environment variables are properly embedded in builds
   - Checking that the validation code in `src/lib/env-utils.ts` correctly handles the variable
   - Ensuring your deployment pipeline includes environment variables during the build process

### Runtime Configuration System

The application includes a hybrid environment variable system that provides both build-time and runtime configuration:

1. **Build-time Variables**: Standard Vite environment variables processed during build
2. **Runtime Configuration**: `public/runtime-config.js` provides fallback values available at runtime
3. **Smart Fallbacks**: The system automatically falls back from build-time to runtime configuration

**Key Components:**
- `src/lib/env-utils.ts`: Unified environment variable access with fallbacks
- `public/runtime-config.js`: Runtime configuration for production deployments
- `scripts/verify-build-env.js`: Verification script to check environment variable availability

**Verification Commands:**
```bash
npm run verify-env    # Check if environment variables are properly embedded
npm run build         # Build all domains with environment variable injection
```

**Example validation code:**
```typescript
// src/lib/env-utils.ts
export function validateEnv<T extends Record<string, string>>(
  requiredEnvVars: Array<keyof T>,
  env: T
): T {
  for (const key of requiredEnvVars) {
    if (!env[key]) {
      throw new Error(`Missing required environment variable: ${String(key)}`);
    }
  }
  return env;
}
```

## Documentation

- **[Architecture Guide](docs/architecture.md)** - System design and patterns
- **[Development Guide](docs/development.md)** - Setup and workflow
- **[Database Guide](docs/database.md)** - Schema, RLS, and performance
- **[Security Guide](docs/security.md)** - Security implementation details
- **[Analytics Guide](docs/guides/usermaven-analytics.md)** - Analytics implementation details
- **[CLAUDE.md](CLAUDE.md)** - AI assistant guidance

## Recent Updates (June 2025)

### Analytics Integration (June 2025)
- **Usermaven Implementation**: Added privacy-focused analytics with white-labeled tracking domain
- **Cross-Domain Tracking**: Unified analytics across all domains with shared user identification
- **Event Tracking**: Comprehensive tracking of key user interactions (auth, chat, subscriptions)
- **Security**: Updated Content Security Policy to allow connections to tracking domain
- **Debug Tools**: Added analytics debugging interface for development and testing

### Layout & User Interface Unification (January 2025)
- **Unified Homepage**: Both AskJDS and JD Simplified domains now share the same modern homepage
- **Consolidated Layout Components**: Removed duplicate JDS-specific components (Navbar, Footer, PageLayout)
- **Single Design System**: All UI components now follow the AskJDS design language for consistent branding
- **Reduced Bundle Size**: Eliminated redundant components to improve load times and maintenance
- **Simplified Codebase**: Removed conditional routing logic while maintaining domain-specific detection when needed

### Signup System Security Fixes (January 2025)
- **RLS Policy Resolution**: Fixed 401 Unauthorized errors during signup caused by legal agreement recording before email confirmation
- **SECURITY DEFINER Implementation**: Created `record_user_agreements()` function that bypasses RLS to record legal consent at the exact moment of form submission
- **Audit Trail Preservation**: Maintains precise legal compliance by capturing agreement timestamps, IP addresses, and user agents when users click signup
- **Batch Agreement Recording**: Optimized single RPC call to record all three legal documents (Terms, Privacy, Disclaimer) atomically
- **Email Confirmation Flow**: Fixed expired OTP issues and improved email confirmation UX with proper orange styling
- **UI Improvements**: Enhanced password validation feedback and fixed navigation routing inconsistencies

### Technical Implementation Details
**Database**: Added `public.record_user_agreements()` SECURITY DEFINER function in migration `20250116000001_create_record_agreements_function.sql`
**Frontend**: Updated `legal-agreements.ts` to use RPC calls instead of direct table inserts for unconfirmed users
**Security**: Function grants execute permissions to `anon` and `authenticated` roles while maintaining strict RLS on the underlying table

### Chat System Architecture Fixes
- **Root Cause Resolution**: Fixed infinite loading spinners by addressing stale closure and infinite refresh loop issues
- **Dependency Management**: Corrected missing `chatFSM` dependency in ChatContainer useEffect preventing proper state transitions
- **Message Loading Optimization**: Eliminated infinite `refreshMessages` loops by stabilizing function references
- **UI Flash Prevention**: Fixed welcome message flash when clicking existing threads with smart loading state logic
- **Removed Timeout Workarounds**: Eliminated artificial 15-20 second timeouts in favor of proper dependency management

### Mobile Chat Layout Optimization
- Fixed mobile scroll behavior issues - eliminated "false top" scroll detection
- Implemented proper fixed positioning for chat input on mobile devices
- Enhanced touch scrolling with iOS momentum scrolling support
- Resolved z-index stacking to prevent messages appearing behind input area
- Added safe area inset support for modern iOS devices

### Typography and Font System
- Added Google Fonts integration (Inter and Playfair Display)
- Standardized hero text sizing across AskJDS and JDS domains
- Removed unused TwicPics image optimization system
- Enhanced font consistency and loading performance

### Security Enhancements
- Complete security framework overhaul with unified authentication
- Automated security pipeline with Lighthouse CI and manual fallbacks
- Enhanced CSP, permissions policies, and rate limiting

### Performance Optimization
- Database performance optimized to 100% efficiency (150 suggestions → 0)
- 25-60% query performance improvements across all features
- Complete RLS policy consolidation and index optimization

### Infrastructure Improvements
- Fixed video infrastructure with proper Gumlet integration
- Cleaned up unused image optimization dependencies
- Enhanced legal framework with comprehensive T&S, privacy policy, and disclaimers

### UX Improvements
- Homepage layout optimization with better content alignment
- Interactive flashcard demo enhancements
- Refined marketing copy with student-friendly tone
- Consistent hero styling across all domains

### Legal Agreements & Compliance System
- **Terms Tracking**: Automatic recording of Terms of Service, Privacy Policy, and Educational Disclaimer acceptance
- **Version Management**: Centralized version control system with audit trail for legal compliance
- **Email Verification**: Required email confirmation for new user accounts with resend functionality
- **Database Integration**: `user_agreements` table with full RLS policies for secure compliance tracking
- **IP Address Logging**: Automatic capture of user IP and browser details for legal audit requirements

## Contributing

1. **Development Setup**: Follow the development guide in [docs/development.md](docs/development.md)
2. **Code Quality**: Run `npm run type-check` and `npm run lint` before commits
3. **Database Changes**: Follow RLS policy patterns in [docs/database.md](docs/database.md)
4. **Security**: Review security guidelines in [docs/security.md](docs/security.md)

## License

This project is proprietary and confidential. All rights reserved.