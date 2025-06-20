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

## Performance Optimizations

### Course Access Batch Checking

**Location**: `src/hooks/useCourseAccessBatch.ts`

The platform implements efficient batch course access checking to eliminate performance bottlenecks:

- **Problem Solved**: First course tile's "Access Course" button was loading slower than others due to sequential API calls
- **Solution**: Batch access checking for all courses in a single API call using `hasCourseAccessMultiple`
- **Performance Impact**: Reduced API calls from N×3 (where N = number of courses) to 1 batch call
- **Implementation**: Uses React Query caching with 5-minute stale time for optimal performance

**Key Components**:
- `useCourseAccessBatch` - Hook for batch access checking
- `JDSCourseCard` - Updated to accept access props or fallback to individual checking
- `AvailableCoursesPage` & `AllCoursesPage` - Implement batch pattern for uniform loading

**Result**: All course tiles now load access buttons simultaneously, providing a smoother user experience.

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
- **Event Tracking**: Captures key user interactions throughout the application

### Custom Events Implementation

The platform implements comprehensive event tracking across all user interactions. These events provide valuable insights into user behavior and feature usage.

#### Authentication Events
- **`signed_up`** - User completes account registration
  - Metadata: `source`, `user_tier`
  - Location: `src/lib/auth.tsx` (signup flow)
- **`logged_in`** - User successfully logs in
  - Metadata: `source`, `user_tier`, `login_method`
  - Location: `src/lib/auth.tsx` (login flow)
- **`logged_out`** - User logs out of the application
  - Metadata: `session_duration`
  - Location: `src/lib/auth.tsx` (logout flow)

#### Chat System Events
- **`chat_thread_created`** - New chat thread started
  - Metadata: `thread_count`, `user_tier`
  - Location: `src/hooks/use-threads.ts`
- **`chat_message_sent`** - User sends a chat message
  - Metadata: `thread_id`, `message_length`, `user_tier`, `message_count`
  - Location: `src/hooks/use-messages.ts`
- **`chat_response_received`** - AI response received
  - Metadata: `thread_id`, `response_time`, `model_used`, `user_tier`
  - Location: `src/hooks/use-messages.ts`

#### Course & Education Events
- **`view_course`** - User views a course detail page
  - Metadata: `course_id`, `course_title`, `is_authenticated`, `has_access`, `user_tier`
  - Location: `src/components/courses/CourseDetail.tsx`
- **`course_enrolled`** - User attempts to enroll in a course
  - Metadata: `course_id`, `course_title`, `enrollment_method`, `has_access`, `user_tier`
  - Location: `src/components/courses/CourseDetail.tsx`
- **`lesson_completed`** - User completes a lesson
  - Metadata: `lesson_id`, `course_id`, `completion_percentage`, `time_spent`
  - Location: `jdsimplified/src/hooks/useLessonCompletion.ts`

#### Subscription & Payment Events
- **`initiate_checkout`** - User starts checkout process
  - Metadata: `tier`, `interval`, `price`, `current_plan`, `features_included`, `is_upgrade`
  - Location: `src/pages/PricingPage.tsx`, `src/hooks/use-analytics.ts`
- **`purchase_complete`** - Subscription purchase completed
  - Metadata: `tier`, `interval`, `price`, `payment_method`
  - Location: Stripe webhook processing
- **`subscription_canceled`** - User cancels subscription
  - Metadata: `tier`, `cancellation_reason`, `remaining_days`
  - Location: Subscription management flow

#### Flashcard System Events
- **`flashcard_created`** - New flashcard collection created
  - Metadata: `collection_id`, `subject_name`, `card_count`, `is_public`
  - Location: `src/components/flashcards/pages/CreateSet.tsx`
- **`flashcard_studied`** - User studies flashcards
  - Metadata: `collection_id`, `cards_studied`, `mastery_rate`, `study_duration`
  - Location: Flashcard study components

#### Navigation & Discovery Events
- **`search`** - User performs a search
  - Metadata: `query`, `results_count`, `category`
  - Location: Search components
- **`filter_applied`** - User applies content filters
  - Metadata: `filter_type`, `filter_value`, `results_count`
  - Location: Filter components
- **`dashboard_viewed`** - User visits dashboard
  - Metadata: `user_tier`, `login_streak`
  - Location: Dashboard components

#### Conversion Events
- **`conversion`** - Meta-event for all conversions
  - Metadata: `conversion_type`, `value`, `tier`
  - Location: Triggered alongside specific conversion events

### Usermaven Configuration

To set up custom events in your Usermaven dashboard:

1. **Access Usermaven Dashboard**: Log into your Usermaven account
2. **Navigate to Events**: Go to Events > Custom Events
3. **Add Event Names**: Configure the following custom events:
   ```
   signed_up
   logged_in
   logged_out
   chat_thread_created
   chat_message_sent
   chat_response_received
   view_course
   course_enrolled
   lesson_completed
   initiate_checkout
   purchase_complete
   subscription_canceled
   flashcard_created
   flashcard_studied
   search
   filter_applied
   dashboard_viewed
   conversion
   ```
4. **Set Event Properties**: Each event includes relevant metadata for deeper analysis
5. **Create Funnels**: Use these events to create conversion funnels:
   - **Signup Funnel**: `signed_up` → `logged_in` → `initiate_checkout` → `purchase_complete`
   - **Chat Engagement**: `chat_thread_created` → `chat_message_sent` → `chat_response_received`
   - **Course Discovery**: `view_course` → `course_enrolled` → `lesson_completed`
   - **Flashcard Usage**: `flashcard_created` → `flashcard_studied`

### Implementation Details

- **Provider**: `UsermavenAnalyticsProvider` in `src/contexts/UsermavenContext.tsx`
- **Hook**: `useAnalytics` in `src/hooks/use-analytics.ts`
- **Debug**: Debugging interface available at `/debug/usermaven`
- **Security**: CSP headers configured to allow connections to the tracking domain
- **Event Categories**: All events are organized by feature area for easy analysis
- **User Context**: Events automatically include user tier and authentication status

## Admin Utilities & Diagnostic Tools 🔧

The platform includes a comprehensive suite of diagnostic and utility tools accessible through the admin panel at `/admin/utilities`. These tools help with debugging, testing, and managing the application across different environments.

### Centralized Utilities Dashboard

**Location**: Admin panel at `/admin/utilities`

The utilities dashboard provides a modern interface for accessing all diagnostic tools with:

- **Environment Detection**: Automatically detects development vs production mode
- **Access Control**: Restricts sensitive utilities to development environment only
- **Categorized Tools**: Organized by debugging, testing, and management functions
- **Security Warnings**: Clear indicators for production-restricted tools

### Available Utilities

#### 1. Diagnostic Tests
**Category**: Debugging | **Environment**: All

Comprehensive system diagnostics including:
- **Admin Function Tests**: Tests all Supabase RPC functions (`admin_connection_test`, `get_course_statistics`, etc.)
- **Database Connectivity**: Validates database connections and permissions
- **Authentication Status**: Verifies admin privileges and user metadata
- **Browser Compatibility**: Detects Safari-specific issues and localStorage functionality
- **Flashcard Performance**: Tests flashcard queries with performance timing
- **RLS Policy Information**: Provides SQL queries for checking Row Level Security policies

#### 2. Browser Debug
**Category**: Debugging | **Environment**: All

Multi-tab browser environment debugging:
- **Browser Tab**: User agent detection, platform information, feature support
- **Storage Tab**: localStorage, sessionStorage, and cookie analysis
- **Network Tab**: Connection status, API endpoint testing
- **Auth Tab**: Authentication state, token validation, session management
- **Environment Tab**: Environment variables, build configuration, domain detection

#### 3. Usermaven Analytics Debug
**Category**: Debugging | **Environment**: All

Analytics integration testing and debugging:
- **Status Monitoring**: Initialization status and configuration validation
- **Event Testing**: Test analytics events with real-time feedback
- **Network Verification**: Validate tracking host connectivity
- **Configuration Display**: Show current analytics configuration
- **Debug Logging**: Comprehensive event logging for troubleshooting

#### 4. Storage Manager
**Category**: Management | **Environment**: Development Only

Complete browser storage management:
- **Storage Analysis**: Detailed breakdown of localStorage, sessionStorage, and cookies
- **Safari Deep Clean**: Safari-specific storage clearing with enhanced compatibility
- **Selective Clearing**: Choose specific storage types to clear
- **Activity Logging**: Track all storage operations with timestamps
- **Storage Usage**: Monitor storage quotas and usage patterns

#### 5. Subscription Tester
**Category**: Testing | **Environment**: Development Only

Payment and subscription flow testing:
- **Payment Flow Testing**: Test subscription activation without real transactions
- **Stripe Integration**: Validate Stripe configuration and webhooks
- **Environment Switching**: Test with different Stripe environments
- **Endpoint Health Checks**: Monitor payment endpoint availability
- **Mock Transactions**: Simulate subscription scenarios safely

#### 6. Auth Token Extractor
**Category**: Testing | **Environment**: Development Only

Authentication token management for API testing:
- **Token Extraction**: Extract current user authentication tokens
- **API Command Generation**: Generate curl, Postman, and JavaScript examples
- **Multi-Language Support**: Provide examples in multiple programming languages
- **Token Validation**: Verify token validity and expiration
- **Secure Handling**: Safe token display with copy-to-clipboard functionality

### Security & Access Control

The utilities system implements comprehensive security measures:

#### Environment-Based Restrictions
- **Production Safety**: Sensitive utilities automatically hidden in production
- **Development Access**: Full utility access in development environment
- **Environment Detection**: Uses `import.meta.env.DEV` for reliable environment detection
- **Visual Indicators**: Clear badges showing environment restrictions

#### Production Safeguards
- **Restricted Utilities**: Storage Manager, Subscription Tester, and Auth Token Extractor are dev-only
- **Warning Messages**: Clear warnings when running in production mode
- **Automatic Filtering**: Production users only see safe diagnostic tools
- **Security Notices**: Prominent alerts for potentially sensitive operations

### Legacy Diagnostic Tools Migration

The utilities system replaces and consolidates several legacy HTML diagnostic pages:

#### Migrated Tools
- **safari-deep-clean.html** → Storage Manager utility
- **clear-storage.html** → Storage Manager utility  
- **activate-subscription.html** → Subscription Tester utility
- **get_token.html** → Auth Token Extractor utility
- **quick-subscription-activator.html** → Subscription Tester utility

#### Migration Benefits
- **Modern UI**: React-based interface with consistent styling
- **Better Security**: Environment-based access controls
- **Enhanced Functionality**: Expanded features and better error handling
- **Centralized Access**: All tools accessible from single admin location
- **Improved Debugging**: Better logging and status reporting

### Technical Implementation

#### Component Architecture
```typescript
// Main utilities dashboard
src/components/admin/Utilities.tsx

// Individual utility components
src/components/admin/utilities/
├── DiagnosticTests.tsx      // System diagnostics
├── BrowserDebug.tsx         // Browser environment debugging
├── UsermavenDebug.tsx       // Analytics debugging
├── StorageManager.tsx       // Storage management
├── SubscriptionTester.tsx   // Payment testing
└── AuthTokenExtractor.tsx   // Token management
```

#### Environment Detection
```typescript
const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_NODE_ENV === 'development';

// Filter utilities based on environment
const availableUtilities = utilities.filter(utility => 
  utility.environment === 'all' || (utility.environment === 'dev-only' && isDevelopment)
);
```

#### Access Integration
- **Admin Navigation**: Integrated into admin sidebar with wrench icon
- **Lazy Loading**: Components loaded on-demand for performance
- **Error Boundaries**: Comprehensive error handling for all utilities
- **Responsive Design**: Mobile-friendly interface for all diagnostic tools

## Subscription System & Database-Driven Pricing ✨

The platform implements a robust subscription system with three tiers: Free, Premium, and Unlimited. **NEW**: The system features **database-driven pricing** that allows marketing teams to change prices without code deployments.

### Database-Driven Pricing System

**🎯 Key Innovation**: Pricing is now managed through the database rather than hardcoded values, enabling zero-deployment price changes.

#### Architecture Overview

1. **Database Storage**: `stripe_price_mappings` table stores display prices and Stripe price IDs
2. **Edge Function**: `get-pricing` function serves pricing data with 5-minute caching
3. **React Hooks**: `usePricing()` and `useDynamicPricing()` fetch and format pricing data
4. **Admin Interface**: Web UI for managing prices without technical knowledge
5. **Fallback System**: Static fallback prices ensure site never breaks

#### Database Schema

```sql
-- stripe_price_mappings table
CREATE TABLE stripe_price_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_id TEXT NOT NULL UNIQUE,           -- Stripe price ID
  tier_name TEXT NOT NULL,                 -- 'Premium' or 'Unlimited'
  interval_type TEXT NOT NULL,             -- 'month' or 'year'
  environment TEXT NOT NULL,               -- 'test' or 'live'
  is_active BOOLEAN DEFAULT true,
  display_price_cents INTEGER,             -- Price in cents for display
  display_currency TEXT DEFAULT 'USD',     -- Currency code
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Supported Price Combinations

The system supports 8 total price ID combinations:

- **Premium + Monthly + Test/Live** (development/production) - *Currently hidden from UI*
- **Premium + Annual + Test/Live** (development/production) - *Currently hidden from UI*
- **Unlimited + Monthly + Test/Live** (development/production)
- **Unlimited + Annual + Test/Live** (development/production)

**Homepage Display**: Currently shows Free + Unlimited tiers only. Premium tier temporarily hidden while course content is expanded.

### Current Subscription Tiers

#### Free Tier
- **Price**: $0/month (always static)
- **Features**:
  - 10 AI chat messages per month
  - Create and manage personal flashcards
  - Access to sample flashcards only
  - No course access

#### Unlimited Tier
- **Monthly**: Database-driven pricing (currently $10/month)
- **Annual**: Database-driven pricing (currently $100/year)
- **Features**:
  - Unlimited AI chat messages
  - Create and manage personal flashcards
  - Full access to premium flashcards
  - Access to ALL courses
  - Priority support

**Note**: Premium tier is temporarily hidden from the UI to simplify pricing while course content is being expanded. All Premium tier backend functionality is preserved for easy reactivation. Existing Premium subscribers maintain full access.

### Admin Price Management

**Location**: Admin panel at `/admin/price-mapping`

The admin interface provides:

- **View All Mappings**: See all price IDs with filtering by environment, tier, and interval
- **Add New Mappings**: Create new price ID mappings with display pricing
- **Edit Existing Prices**: Inline editing of display prices and currencies
- **Environment Filtering**: Separate test and production price management
- **Cache Management**: Clear frontend pricing cache for immediate updates
- **Visual Indicators**: "Currently Displayed" badges for live monthly prices

#### Key Features

- **Multi-Currency Support**: USD, EUR, GBP with proper formatting
- **Live Preview**: See formatted prices before saving
- **Input Validation**: Prevents invalid price entries
- **Audit Trail**: Full history of price changes with timestamps
- **Environment Separation**: Clear distinction between test and live prices

### Technical Implementation

#### Edge Function (`supabase/functions/get-pricing/index.ts`)

```typescript
// Serves pricing data with caching and fallbacks
Deno.serve(async (req) => {
  // Query active price mappings for live environment
  const { data: priceMappings, error } = await supabase
    .from('stripe_price_mappings')
    .select('tier_name, interval_type, display_price_cents, display_currency')
    .eq('environment', 'live')
    .eq('is_active', true)
    .not('display_price_cents', 'is', null);

  // Format and return with caching headers
  return new Response(JSON.stringify({
    success: true,
    data: formattedPricing,
    source: 'database'
  }), {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
    }
  });
});
```

#### React Hooks

**`usePricing()`**: Fetches raw pricing data from Edge Function
**`useDynamicPricing()`**: Combines static tier configs with dynamic pricing

```typescript
// Combines static features with dynamic pricing
export function useDynamicPricing() {
  const { data: pricingData } = usePricing();
  
  const pricingTiers = useMemo(() => {
    // Build complete tier objects with live pricing
    const dynamicPricing = pricingMap.get(`${tierName}-month`);
    const finalPrice = dynamicPricing?.formatted_price || fallbackPrice;
    
    return { ...staticConfig, price: finalPrice };
  }, [pricingData]);
}
```

#### Performance & Reliability

- **5-Minute Caching**: Edge Function caches responses to reduce database load
- **React Query Caching**: Frontend caches pricing data with smart invalidation
- **Stale-While-Revalidate**: Serves cached content while fetching fresh data
- **Graceful Fallbacks**: Static pricing if database/Edge Function fails
- **Error Handling**: Comprehensive error logging and fallback mechanisms

### Price Change Workflow

**For Marketing Team** (No Technical Knowledge Required):

1. **Access Admin Panel**: Visit `/admin/price-mapping`
2. **Find Price Mapping**: Use filters to locate the price to change
3. **Edit Price**: Click edit button, enter new price, save
4. **Clear Cache**: Click "Clear Cache" button for immediate effect
5. **Verify**: Check homepage to confirm price update

**Technical Details**:
- Changes are immediate (no deployment required)
- Frontend cache clears automatically or manually via admin panel
- All changes are logged with timestamps for audit purposes
- System maintains backward compatibility with existing subscriptions

### Subscription Hook Architecture

The platform uses a unified subscription system with improved hook naming for clarity.

#### Hook Overview

**`useSubscriptionWithTier()`**: Primary hook that provides detailed subscription data including tier name
**`useSubscription()`**: Simple boolean hook for basic subscription checks

```typescript
// Detailed subscription data with tier information
const { isSubscribed, tierName, isLoading, subscription } = useSubscriptionWithTier();

// Simple boolean check
const isSubscribed = useSubscription();
```

#### Key Improvements

- **Renamed Hook**: `useSubscriptionDetailsOld()` → `useSubscriptionWithTier()` for clarity
- **Consistent Usage**: All components now use the appropriate hook for their needs
- **Tier Detection**: Reliable tier name detection using price ID mapping
- **Performance**: Optimized caching and minimal re-renders

### Legacy Price ID Management Architecture

The subscription system maintains backward compatibility with environment variable-based price ID mapping.

#### Environment-Based Configuration

**Location**: Environment variables and `src/lib/stripe/client.ts`

```bash
# Test Environment Price IDs
VITE_STRIPE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID=price_test_premium_monthly
VITE_STRIPE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID=price_test_premium_annual
VITE_STRIPE_ASKJDS_UNLIMITED_MONTHLY_PRICE_ID=price_test_unlimited_monthly
VITE_STRIPE_ASKJDS_UNLIMITED_ANNUAL_PRICE_ID=price_test_unlimited_annual

# Live Environment Price IDs
VITE_STRIPE_LIVE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID=price_live_premium_monthly
VITE_STRIPE_LIVE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID=price_live_premium_annual
VITE_STRIPE_LIVE_ASKJDS_UNLIMITED_MONTHLY_PRICE_ID=price_live_unlimited_monthly
VITE_STRIPE_LIVE_ASKJDS_UNLIMITED_ANNUAL_PRICE_ID=price_live_unlimited_annual
```

#### Tier Determination Logic

**Location**: `src/components/chat/ChatContainer.tsx` and other components

The system determines user subscription tiers through environment variable-based price ID mapping:

```typescript
// Helper function to determine tier name from subscription data
// Uses environment variables for proper price ID mapping instead of fragile string matching
const getTierNameFromSubscription = (subscription: any): string => {
  if (!subscription || subscription.status !== 'active') {
    return 'Free';
  }
  
  const priceId = subscription.priceId;
  if (!priceId) {
    return 'Free';
  }
  
  // Get environment-based price IDs for comparison
  const unlimitedPriceIds = [
    import.meta.env.VITE_STRIPE_ASKJDS_UNLIMITED_MONTHLY_PRICE_ID,
    import.meta.env.VITE_STRIPE_ASKJDS_UNLIMITED_ANNUAL_PRICE_ID,
    import.meta.env.VITE_STRIPE_LIVE_ASKJDS_UNLIMITED_MONTHLY_PRICE_ID,
    import.meta.env.VITE_STRIPE_LIVE_ASKJDS_UNLIMITED_ANNUAL_PRICE_ID
  ].filter(Boolean);
  
  const premiumPriceIds = [
    import.meta.env.VITE_STRIPE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID,
    import.meta.env.VITE_STRIPE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID,
    import.meta.env.VITE_STRIPE_LIVE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID,
    import.meta.env.VITE_STRIPE_LIVE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID
  ].filter(Boolean);
  
  if (unlimitedPriceIds.includes(priceId)) {
    return 'Unlimited';
  }
  
  if (premiumPriceIds.includes(priceId)) {
    return 'Premium';
  }
  
  // Safe fallback for active subscriptions with unmapped price IDs
  return subscription.status === 'active' ? 'Premium' : 'Free';
};
```

### Key Architecture Benefits

#### 1. **Flexible Price Management**
- **Easy Updates**: Change price IDs by updating environment variables only
- **No Code Changes**: Tier determination automatically adapts to new price IDs
- **Environment Separation**: Different price IDs for test and production environments

#### 2. **Robust Fallback System**
- **Multiple Patterns**: Supports various environment variable naming conventions
- **Safe Defaults**: Unknown active subscriptions default to Premium tier
- **Null Safety**: Handles missing or undefined environment variables gracefully

#### 3. **Consistent Mapping**
The same environment variables are used across:
- **Frontend Components**: Chat container, pricing pages, settings
- **Edge Functions**: `get-user-subscription`, `create-payment-handler`
- **Stripe Client**: `src/lib/stripe/client.ts`

## Dynamic Pricing Management System ✨

**NEW FEATURE**: The platform now uses a **database-driven pricing system** that allows zero-deployment price changes through an admin interface.

### Architecture Overview

#### Database Schema
The `stripe_price_mappings` table stores all pricing information:

```sql
CREATE TABLE stripe_price_mappings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  price_id text NOT NULL UNIQUE,
  tier_name text NOT NULL CHECK (tier_name IN ('Premium', 'Unlimited')),
  interval_type text NOT NULL CHECK (interval_type IN ('month', 'year')),
  environment text NOT NULL CHECK (environment IN ('test', 'live')),
  is_active boolean NOT NULL DEFAULT true,
  display_price_cents integer,              -- NEW: Price in cents for display
  display_currency text DEFAULT 'USD',      -- NEW: Currency code
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Edge Function: `get-pricing`
- **Endpoint**: `/functions/v1/get-pricing`
- **Cache**: 5-minute cache with stale-while-revalidate
- **Fallback**: Static pricing if database unavailable
- **Response**: Formatted pricing data with currency symbols

#### React Hooks

##### `usePricing()` - Raw Pricing Data
```typescript
const { data: pricingData, isLoading, error } = usePricing();
```

##### `useDynamicPricing()` - Complete Tier Objects
```typescript  
const { pricingTiers, masterFeatures, isLoading } = useDynamicPricing();
```

### Admin Interface

#### Price Management Dashboard
- **Access**: `npm run dev:admin` → `http://localhost:5175/admin/price-mapping`
- **Features**:
  - ✅ Add/edit Stripe price IDs and display prices
  - ✅ Environment separation (test/live)
  - ✅ Active/inactive status management
  - ✅ Multi-currency support (USD, EUR, GBP)
  - ✅ Live price preview with formatting
  - ✅ Safe database operations with validation

#### Usage Workflow
1. **Add Price ID**: Enter Stripe price ID (e.g., `price_1ABC123...`)
2. **Set Display Price**: Enter amount in dollars (e.g., `15.00`)
3. **Configure Settings**: Select tier, interval, environment
4. **Activate**: Enable the mapping for immediate use
5. **Verify**: Homepage automatically reflects new pricing

### Implementation Benefits
- ✅ **Zero-deployment pricing changes** - Update prices instantly via admin UI
- ✅ **Promotional pricing support** - Run sales without code deployments  
- ✅ **Multi-currency ready** - Support for USD, EUR, GBP with proper symbols
- ✅ **Performance optimized** - 5-minute caching with fallback mechanisms
- ✅ **Admin-friendly** - Non-technical users can manage pricing
- ✅ **Audit trail** - All pricing changes tracked with timestamps
- ✅ **Failsafe design** - Static fallbacks ensure site never breaks

### Migration from Static Pricing
The system maintains backward compatibility:
- Static pricing in `src/lib/pricingData.ts` serves as fallback
- Components automatically use database pricing when available
- Gradual rollout possible by environment

### Backend Integration

#### Edge Functions

**Location**: `supabase/functions/`

Key functions for subscription management:

- **`get-user-subscription`**: Returns subscription details with proper tier mapping
- **`create-payment-handler`**: Creates Stripe checkout sessions with environment-based price IDs
- **`get-price-id`**: Backend service for secure price ID resolution
- **`stripe-webhook`**: Handles Stripe webhook events for subscription updates

#### Database Schema

**Location**: `supabase/migrations/`

Key tables:
- **`user_subscriptions`**: Stores subscription status, price IDs, and billing periods
- **`message_counts`**: Tracks usage for free tier limits
- **`course_enrollments`**: Manages course access for Unlimited tier users

### Subscription Hooks

**Location**: `src/hooks/useSubscription.ts`

The platform provides several subscription hooks for different use cases:

#### `useSubscriptionWithTier()` - **Primary Hook for Components**
Returns detailed subscription information including tier name, loading states, and subscription status:

```typescript
import { useSubscriptionWithTier } from '@/hooks/useSubscription';

function MyComponent() {
  const { tierName, isLoading, isActive, current_period_end } = useSubscriptionWithTier();
  const hasPaidSubscription = tierName === 'Premium' || tierName === 'Unlimited';
  
  if (isLoading) return <div>Loading subscription...</div>;
  
  return (
    <div>
      <p>Current Tier: {tierName}</p>
      <p>Has Paid Access: {hasPaidSubscription ? 'Yes' : 'No'}</p>
      {isActive && <p>Expires: {current_period_end}</p>}
    </div>
  );
}
```

#### `useSubscription()` - Simple Boolean Check
Returns only a boolean subscription status (used internally):

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function SimpleComponent() {
  const hasSubscription = useSubscription();
  return <div>Subscribed: {hasSubscription ? 'Yes' : 'No'}</div>;
}
```

#### `useSubscriptionDetails()` - Raw Subscription Data
Returns raw subscription object from database (used for data processing):

```typescript
import { useSubscriptionDetails } from '@/hooks/useSubscription';

function DataComponent() {
  const subscriptionQuery = useSubscriptionDetails();
  // Process raw subscription data...
}
```

#### Hook Migration Notes

> **Important**: Previously, components used `useSubscriptionDetailsOld()` which has been renamed to `useSubscriptionWithTier()` for clarity. The "Old" naming was causing confusion and maintenance issues.

**Migration Pattern**:
```typescript
// Before (deprecated)
import { useSubscriptionDetailsOld } from '@/hooks/useSubscription';
const { tierName, isLoading } = useSubscriptionDetailsOld();

// After (current)
import { useSubscriptionWithTier } from '@/hooks/useSubscription';
const { tierName, isLoading } = useSubscriptionWithTier();
```

### Usage Examples

#### Checking Subscription Status
```typescript
import { useSubscriptionWithTier } from '@/hooks/useSubscription';

function MyComponent() {
  const { tierName, isLoading } = useSubscriptionWithTier();
  const hasPaidSubscription = tierName === 'Premium' || tierName === 'Unlimited';
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Current Tier: {tierName}</p>
      <p>Has Paid Access: {hasPaidSubscription ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

#### Creating Checkout Sessions
```typescript
import { createCheckoutSession } from '@/lib/subscription';

// Backend automatically resolves price ID based on tier name
const checkoutUrl = await createCheckoutSession(userId, 'unlimited');
```

### Updating Price IDs

**Database-Driven Management (Recommended):**

1. **Access Admin Interface**: Visit admin domain at port 5175 (`npm run dev:admin`)
2. **Navigate**: Go to `/admin/price-mapping` in the admin interface
3. **Manage Price IDs**: Add, deactivate, or modify price ID mappings
4. **Instant Updates**: Changes take effect within 5 minutes (cache TTL)
5. **No Deployment Required**: Zero downtime price changes

**Legacy Environment Variable Method:**

1. **Update Environment Variables**: Change the price ID in your `.env` file or deployment environment
2. **Deploy Changes**: The system automatically picks up new price IDs
3. **No Code Changes**: All tier determination logic adapts automatically
4. **Test Thoroughly**: Verify tier detection works with new price IDs

### Security Considerations

- **Backend Price Resolution**: Sensitive price ID logic handled in Edge Functions
- **Environment Variable Protection**: Price IDs stored securely in environment variables
- **RLS Policies**: All subscription data protected with Row Level Security
- **Webhook Validation**: Stripe webhooks validated with signing secrets

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

### Production Readiness (January 2025)
- **Centralized Logging System**: Created environment-aware logger with automatic sensitive data sanitization
- **Security Enhancements**: Comprehensive data sanitizer for PII protection
- **Performance Monitoring**: Added performance tracking utilities and React optimization helpers
- **Connection Resilience**: WebSocket reconnection with exponential backoff
- **Build Verification**: Automated script to check production builds for issues
- **Console Statement Replacement**: Ongoing migration from console.log to centralized logger (4/1236+ files completed)
- **Production Configuration**: Enhanced Vite config with optimizations (pending plugin installations)

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

### Flashcard System Fixes (January 2025)
- **Mastery Persistence**: Fixed flashcard mastery state persistence by unifying tracking system to use `flashcard_progress` table consistently
- **Cache Invalidation**: Added proper React Query cache invalidation when marking cards as mastered to update collection mastery percentages
- **Subject Deletion Fix**: Resolved RLS permission issues for subject deletion by fixing missing `user_id` fields in CreateSet component
- **UI Streamlining**: Removed unnecessary filter options (Exam Types, Difficulty, Common Pitfalls) from Study Mode for cleaner interface
- **Theme Consistency**: Updated button colors from green to orange theme in "No flashcards available" state
- **Data Integrity**: Created SQL migration script to fix existing subjects with null `user_id` fields
- **Debug Enhancement**: Added comprehensive debugging logs for RLS policy troubleshooting and permission validation
- **Performance**: Improved query performance with proper cache management and reduced UI churn in Study Mode

## Contributing

1. **Development Setup**: Follow the development guide in [docs/development.md](docs/development.md)
2. **Code Quality**: Run `npm run type-check` and `npm run lint` before commits
3. **Database Changes**: Follow RLS policy patterns in [docs/database.md](docs/database.md)
4. **Security**: Review security guidelines in [docs/security.md](docs/security.md)

## License

This project is proprietary and confidential. All rights reserved.