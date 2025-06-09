# Architecture Overview

## Multi-Domain Single Codebase

This project serves three domains from one codebase:
- **Ask JDS** (askjds.com) - AI-powered legal chat platform
- **JD Simplified** (jdsimplified.com) - Legal education with courses and flashcards
- **Admin Panel** (admin.jdsimplified.com) - Administrative interface

Each is served via a domain-specific entrypoint with conditional logic driven by the DomainContext. All share the same Supabase backend, database, authentication, and UI foundations.

## Tech Stack

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

### Core Technologies
- **Runtime**: Vite + Deno (No Node.js)
- **Backend**: Supabase Edge Functions (Deno only)
- **Frontend**: Vite/React (ESM only)/Tailwind CSS
- **Authentication**: Supabase Auth

## Key Architectural Points

### Deno-Native Edge Functions
- Uses `Deno.serve` with npm: specifiers only
- Key functions:
  - `stripe-webhook`: Handles incoming Stripe events for subscriptions and purchases
  - `create-payment-handler`: Creates Stripe PaymentIntents/Subscriptions for Payment Elements flow
  - `get-payment-status`: Securely retrieves the status of Stripe PaymentIntents/SetupIntents
  - `get-user-subscription`: Fetches current user subscription details for the frontend
  - `chat-google`: Connects to Google's Gemini API using a tiered model approach for different tasks

### Shared ESM-Only Components
- Vite dev/build system
- **No Node.js runtime** - Only used as dev-time tooling
- Single flat .env file approach (no nested environments)

## AI Model Configuration

The platform uses Google's Gemini API with a tiered approach to optimize both performance and cost:

### 1. Tiered Model Structure
- **Primary Chat Model**: A more capable model (`jds-titan`) handles main chat responses
- **Secondary Title Model**: A faster, economical model (`jds-flash`) generates thread titles

### 2. Security Through Obfuscation
- Model names are obfuscated through a code-name system
- Actual model endpoints are never exposed in client code
- Code names are mapped to real model names only in secure server-side code
- All model configuration is centralized in `_shared/config.ts`

### 3. Environment Variables
```
# Development environment
AI_MODEL_PRIMARY_DEV=jds-titan    # For main chat responses
AI_MODEL_SECONDARY_DEV=jds-flash  # For thread titles

# Production environment
AI_MODEL_PRIMARY_PROD=jds-titan   # For main chat responses
AI_MODEL_SECONDARY_PROD=jds-flash # For thread titles

# Logging configuration
AI_MODELS_LOGGING=false           # Set to true for development
```

### 4. Request Type Detection
- Chat responses and thread title generation use different models
- Determined by `X-Request-Type` header or request body parameters
- Minimizes latency for title generation while maintaining high quality for chat

### 5. API Key Management
- Single `GOOGLE_AI_API_KEY` shared across models
- Key is never exposed to client-side code
- All API requests are authenticated and verified

This architecture allows for independent scaling of models based on task requirements and protects specific implementation details from being easily discovered by competitors.

## Domain-Aware Routing

The application uses sophisticated routing that adapts based on the current domain:

- **Domain Detection**: `DomainProvider` context determines which domain is active
- **Conditional Rendering**: Different components, navbars, and layouts based on domain
- **Shared Backend**: All domains use the same Supabase instance and database
- **Build System**: Vite builds separate distributions for each domain

## Layout System

Multiple layout containers handle different page types:

- **PersistentLayout**: For chat and flashcard pages with persistent sidebar
- **CourseLayout**: For course content with specialized navigation
- **DashboardLayout**: For dashboard-style pages
- **Domain-specific navbars**: `JDSNavbar`, `AskJDSNavbar`

## State Management

- **React Query** (`@tanstack/react-query`) for server state
- **Context Providers** for domain, subscription, sidebar, and thread state  
- **Local Storage Hooks** for persisted state
- **Real-time Updates** via Supabase subscriptions

## Backend Integration

- **Supabase** for database, auth, and real-time features
- **Stripe** for payments and subscriptions
- **Supabase Edge Functions** for serverless backend logic
- **Row Level Security (RLS)** for all database access
- **Performance Optimized** database with consolidated policies

## Development Environment

### Production-First Development
- Development environment uses production database directly
- No local Supabase setup required
- Real-time testing with production data
- Simplified environment management

### Build System
- **Multi-domain builds**: Separate build commands for each domain
- **Code splitting**: Optimized chunks for performance
- **Environment-aware**: Different ports and configurations per domain
- **TypeScript**: Full type checking across the codebase