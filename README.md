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
- **Conditional Rendering**: Different components, navbars, and layouts per domain
- **Shared Backend**: Single Supabase instance serves all domains
- **Build System**: Vite creates separate distributions per domain

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno only, no Node.js)
- **Database**: Supabase with Row Level Security (RLS)
- **Auth**: Supabase Auth with domain-aware redirects
- **Payments**: Stripe with subscription management
- **AI**: Google Gemini with tiered model approach

### Key Features
- **Chat System**: AI-powered legal Q&A with thread management
- **Flashcards**: Hierarchical study system (Subjects → Collections → Cards)
- **Course System**: Video-based learning with progress tracking
- **Admin Panel**: Content management and user administration

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

```

## Documentation

- **[Architecture Guide](docs/architecture.md)** - System design and patterns
- **[Development Guide](docs/development.md)** - Setup and workflow
- **[Database Guide](docs/database.md)** - Schema, RLS, and performance
- **[Security Guide](docs/security.md)** - Security implementation details
- **[CLAUDE.md](CLAUDE.md)** - AI assistant guidance

## Recent Updates (January 2025)

### Chat System Architecture Fixes
- **Root Cause Resolution**: Fixed infinite loading spinners by addressing stale closure and infinite refresh loop issues
- **Dependency Management**: Corrected missing `chatFSM` dependency in ChatContainer useEffect preventing proper state transitions
- **Message Loading Optimization**: Eliminated infinite `refreshMessages` loops by stabilizing function references
- **UI Flash Prevention**: Fixed welcome message flash when clicking existing threads with smart loading state logic
- **Removed Timeout Workarounds**: Eliminated artificial 15-20 second timeouts in favor of proper dependency management
- **WebSocket Reliability**: Maintained retry logic and polling fallback for legitimate infrastructure issues only
- **Smart Loading Logic**: New threads show instant welcome screen (0ms load time), existing threads only show loading when needed

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

## Contributing

1. **Development Setup**: Follow the development guide in [docs/development.md](docs/development.md)
2. **Code Quality**: Run `npm run type-check` and `npm run lint` before commits
3. **Database Changes**: Follow RLS policy patterns in [docs/database.md](docs/database.md)
4. **Security**: Review security guidelines in [docs/security.md](docs/security.md)

## License

This project is proprietary and confidential. All rights reserved.