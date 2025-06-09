# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Architecture Overview

### Multi-Domain Single Codebase
This project serves three domains from one codebase:
- **Ask JDS** (askjds.com) - AI-powered legal chat platform
- **JD Simplified** (jdsimplified.com) - Legal education with courses and flashcards
- **Admin Panel** (admin.jdsimplified.com) - Administrative interface

Domain detection is handled by `DomainProvider` context which conditionally renders different navigation, layouts, and features based on the current domain.

### Key Architectural Patterns

**Domain-Aware Routing**: `App.tsx` contains domain-specific route definitions that render different components based on the current domain context.

**Layout System**: Uses a sophisticated layout system with multiple layout containers:
- `PersistentLayout` - For chat and flashcard pages with persistent sidebar
- `CourseLayout` - For course content with specialized navigation
- `DashboardLayout` - For dashboard-style pages
- Domain-specific navbars (`JDSNavbar`, `AskJDSNavbar`)

**State Management**: 
- React Query (`@tanstack/react-query`) for server state
- Context providers for domain, subscription, sidebar, and thread state
- Local storage hooks for persisted state

**Backend Integration**:
- Supabase for database, auth, and real-time features
- Stripe for payments and subscriptions
- Supabase Edge Functions for serverless backend logic

### Database Architecture
- **Production-First Development**: Development environment uses production database directly
- **Row Level Security (RLS)**: All database access is protected by Supabase RLS policies
- **Performance Optimized**: Recent migrations have consolidated and optimized database policies for better performance

### Core Feature Areas

**Authentication & Authorization**:
- Supabase Auth with domain-aware redirects
- Subscription-based access control
- Admin role management

**Chat System** (`src/components/chat/`):
- AI-powered chat with OpenAI and Google Gemini integration
- Thread management with persistent sidebar
- Real-time message handling

**Flashcards System** (`src/components/flashcards/`):
- Hierarchical organization (Subjects → Collections → Cards)
- Study modes with progress tracking
- Virtualized rendering for performance

**Course System** (`src/components/courses/`):
- Video-based learning with Gumlet integration
- Module and lesson progression tracking
- Access control based on subscriptions

## Development Environment Setup

### Simplified Development (January 2025)
Development now uses the production database directly for streamlined workflow:
- No local Supabase setup required
- Real-time testing with production data
- Simplified environment management

### Environment Variables
Key variables are domain-aware with `_DEV` and `_PROD` suffixes. Development typically uses production endpoints for consistency.

## Code Organization Principles

### Component Structure
- Domain-specific components in respective folders (`/jds/`, `/askjds/`, `/admin/`)
- Shared UI components in `/ui/`
- Feature-specific components grouped by functionality

### Import Patterns
- Use `@/` alias for src root imports
- Lazy load large components to improve performance
- Suspense boundaries with custom loading states

### State Patterns
- Contexts for cross-cutting concerns (domain, subscription, layout)
- Custom hooks for feature-specific logic
- React Query for all server state management

## Database Interaction Guidelines

### Supabase RLS Policies
Follow established patterns in `.cursor/rules/supabase-rls-policies.mdc`:
- Always wrap `auth.uid()` in `(select auth.uid())`
- Use specific roles (`to authenticated`) for performance
- Separate policies for each operation (select, insert, update, delete)
- Add indexes on columns used in policies

### Performance Considerations
- Database has been optimized with policy consolidation
- Use proper indexes for RLS policy columns
- Minimize joins in policy definitions
- Cache function results with select statements

## Troubleshooting Common Issues

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