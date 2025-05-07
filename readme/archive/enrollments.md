# Enrollment System

This document outlines the design and implementation of the course enrollment system for JD Simplified/Ask JDS.

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Structure](#database-structure)
3. [Dual Access System](#dual-access-system)
4. [Stripe Integration](#stripe-integration)
5. [API Implementation](#api-implementation)
6. [Webhook Extension](#webhook-extension)
7. [Frontend Components](#frontend-components)
8. [Notification System](#notification-system)
9. [Analytics & Metrics](#analytics--metrics)
10. [Performance Considerations](#performance-considerations)
11. [Testing Strategy](#testing-strategy)
12. [Security Considerations](#security-considerations)
13. [Implementation Steps](#implementation-steps)

## System Overview

The course enrollment system allows users to:
- Purchase individual courses with time-limited access
- Subscribe to an unlimited plan that grants access to all courses
- Track progress through enrolled courses
- Extend access to individual courses

### User Tiers

The platform supports multiple user tiers:
- **Free users**: Limited access to platform features and sample content
- **AskJDS subscribers**: Access to AI chat features
- **Individual course purchasers**: Time-limited access to specific courses
- **Unlimited subscribers**: Full access to AskJDS and all courses

### Access Control Flow

1. When a user attempts to access a course:
   - First check `course_enrollments` table for individual purchases
   - If not found, check for active unlimited subscription
   - Grant access if either condition is met

2. For course listings:
   - All published courses are visible to all users
   - Interface shows enrollment status and remaining access time
   - "My Courses" section shows courses the user can access
   - "Available Courses" section is hidden for unlimited subscribers

## Database Structure

### Key Tables

1. **`course_enrollments`**
   - Tracks individual course purchases
   - Key fields:
     - `id` (uuid, PK)
     - `user_id` (uuid, FK to profiles)
     - `course_id` (uuid, FK to courses)
     - `enrolled_at` (timestamp with time zone)
     - `expires_at` (timestamp with time zone)
     - `renewal_count` (integer) - Tracks number of renewals
     - `notification_7day_sent` (boolean) - For expiration notifications
     - `notification_1day_sent` (boolean) - For expiration notifications
     - `last_accessed` (timestamp with time zone) - For analytics
     - `created_at` (timestamp with time zone)
     - `updated_at` (timestamp with time zone)

2. **`user_subscriptions`**
   - Tracks subscription status
   - Key fields:
     - `id` (uuid, PK)
     - `user_id` (uuid, FK to profiles)
     - `status` (text, required)
     - `price_id` (text) - Stripe price ID for tier identification
     - `current_period_end` (timestamp with time zone)
     - `cancel_at_period_end` (boolean)
     - `stripe_customer_id` (text)
     - `stripe_subscription_id` (text)
     - `created_at` (timestamp with time zone)
     - `updated_at` (timestamp with time zone)

3. **`courses`**
   - Course information
   - Key fields:
     - `id` (uuid, PK)
     - `title` (text, required)
     - `tile_description` (text)
     - `days_of_access` (integer) - Default access duration for individual purchases
     - `price` (numeric) - Course price
     - `sample_video_1_id` (text) - Gumlet ID for first sample video
     - `sample_video_1_title` (text) - Title for first sample video
     - `sample_video_2_id` (text) - Gumlet ID for second sample video
     - `sample_video_2_title` (text) - Title for second sample video
     - `sample_video_3_id` (text) - Gumlet ID for third sample video
     - `sample_video_3_title` (text) - Title for third sample video

4. **`analytics_events`**
   - Tracks user interactions for analytics
   - Key fields:
     - `id` (uuid, PK)
     - `event_type` (text) - Type of event (e.g., purchase, view)
     - `user_id` (uuid, FK to profiles)
     - `properties` (jsonb) - Event details
     - `session_id` (text) - For anonymous session tracking
     - `created_at` (timestamp with time zone)
     - `processed` (boolean) - For batch processing

### Database Functions

1. **`has_course_access(user_id UUID, course_id UUID)`**
   - Checks if user has access to a course through individual purchase or unlimited subscription
   - Returns boolean
   - Used for access control checks

2. **`create_course_enrollment(p_user_id UUID, p_course_id UUID, p_days_of_access INTEGER)`**
   - Creates a new course enrollment with proper expiration date
   - Used by webhook handler
   - Returns the new enrollment ID

### Row Level Security (RLS)

The course enrollment system uses the following RLS policies:

1. **For `course_enrollments`**:
   - Admins can manage all enrollments (ALL operations)
   - Users can view their own enrollments (SELECT where user_id = auth.uid())
   - Users can update their own enrollments (UPDATE where user_id = auth.uid())
   - Service role handles enrollment creation (INSERT operations)

2. **For `user_subscriptions`**:
   - Managed via webhook with service role
   - Users can view their own subscriptions

3. **For `analytics_events`**:
   - Users can insert their own events
   - No one can update analytics events
   - Admins can view all events

### Database Indexes

```sql
-- Course enrollments indexes
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_course ON course_enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_expires_at ON course_enrollments(expires_at);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_enrolled_at ON course_enrollments(enrolled_at);

-- User subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_price_id ON user_subscriptions(price_id);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
```

## Dual Access System

The system implements a dual access approach:

### Individual Course Access
- Created when user purchases a specific course
- Record in `course_enrollments` table
- Access period is determined by course's `days_of_access` field
- Can be extended/renewed

### Unlimited Subscription Access
- Grants automatic access to all courses
- Access continues as long as subscription is active
- No individual enrollment records created
- Access check occurs at runtime

### Key Decision Points

1. **When checking if a user has access to a course**:
   ```sql
   -- First check for individual enrollment
   SELECT * FROM course_enrollments 
   WHERE user_id = [current_user_id] 
   AND course_id = [requested_course_id]
   AND expires_at > NOW();
   
   -- If not found, check for active unlimited subscription
   SELECT * FROM user_subscriptions
   WHERE user_id = [current_user_id]
   AND status = 'active'
   AND current_period_end > NOW()
   AND price_id IN ('price_unlimited_monthly', 'price_unlimited_annual');
   ```

2. **When calculating metrics**:
   ```sql
   -- Total users with access to a specific course
   SELECT COUNT(DISTINCT user_id) FROM (
     -- Users with individual enrollments
     SELECT user_id FROM course_enrollments
     WHERE course_id = [course_id]
     AND expires_at > NOW()
     
     UNION
     
     -- Users with unlimited subscriptions
     SELECT user_id FROM user_subscriptions
     WHERE status = 'active'
     AND current_period_end > NOW()
     AND price_id IN ('price_unlimited_monthly', 'price_unlimited_annual')
   ) AS users_with_access;
   ```

3. **Handling subscription transitions**:
   - When user upgrades from individual to unlimited, individual enrollments remain but are superseded by the subscription
   - When subscription is cancelled, access continues until the end of billing period
   - When subscription expires, system falls back to checking individual enrollments

## Stripe Integration

### Products and Prices

Three primary product types in Stripe:

1. **AskJDS Subscription**
   - Existing product
   - Monthly recurring price ($10/month)
   - Existing webhook handler

2. **Individual Courses**
   - One-time payment
   - Price varies by course
   - Access period based on course's `days_of_access`

3. **Unlimited Subscription**
   - Monthly/annual recurring price
   - Includes AskJDS and all courses
   - Will replace existing AskJDS subscription if user upgrades

### Environment Configuration

The Stripe API keys, webhook secrets, and specific Price IDs for different products and tiers (for both test and live environments) are managed in the project's environment file (e.g., `.env` or `.env.local`). The `.env.blank` file in the root directory serves as a template and lists all necessary Stripe-related environment variables, including:

-   `VITE_STRIPE_PUBLISHABLE_KEY` (for test)
-   `VITE_STRIPE_LIVE_PUBLISHABLE_KEY`
-   `STRIPE_SECRET_KEY` (for test backend)
-   `STRIPE_LIVE_SECRET_KEY` (for live backend)
-   `STRIPE_TEST_WEBHOOK_SECRET`
-   `STRIPE_LIVE_WEBHOOK_SECRET`
-   Various `STRIPE_[TIER/COURSE]_[INTERVAL]_PRICE_ID` variables for both live and test modes (e.g., `STRIPE_UNLIMITED_MONTHLY_PRICE_ID`, `STRIPE_LIVE_UNLIMITED_MONTHLY_PRICE_ID`).

Key considerations:
- Ensure the correct set of keys (test or live) is used based on the environment (development/staging vs. production).
- Supabase Edge Functions require their environment variables (secrets) to be set appropriately in the Supabase dashboard for each environment.
- The application's build and deployment process should ensure that the frontend receives the correct publishable key and the backend functions use the corresponding secret key and webhook secret.

### Checkout Flow

1. **Individual Course Purchase**:
   - User clicks "Purchase" on course detail page
   - Two options shown:
     - Purchase this course (one-time payment)
     - Get unlimited access (subscription)
   - Stripe Checkout created with appropriate price
   - On successful payment, create course enrollment

2. **Unlimited Subscription**:
   - Checkout with recurring subscription price
   - On success, cancel existing AskJDS subscription if present
   - Webhook updates `user_subscriptions` table

3. **Course Renewal**:
   - User can renew when approaching expiration
   - Renewal extends access from current expiry or current date if expired
   - No duplicate enrollments created

### Webhook Handler

The webhook handler in `supabase/functions/stripe-webhook` needs to handle:

1. New subscriptions (checkout.session.completed)
   - Create subscription records for unlimited plans
   - Handle upgrades from AskJDS to unlimited
   
2. Subscription updates (customer.subscription.updated)
   - Update subscription status and details
   
3. Subscription cancellations (customer.subscription.deleted)
   - Update subscription to inactive status
   
4. One-time payments for courses
   - Create course enrollment records
   - Set expiration based on course's access period
   
5. Course renewals
   - Update existing enrollment's expiration date
   - Reset notification flags

## API Implementation

### Access Control Utilities

```typescript
// src/lib/access-control.ts
export async function checkCourseAccess(userId: string, courseId: string): Promise<boolean> {
  // Check cache first
  const cachedResult = await getCachedCourseAccess(userId, courseId);
  if (cachedResult !== null) return cachedResult;
  
  // If not in cache, check database
  const { data, error } = await supabase
    .rpc('has_course_access', { user_id: userId, course_id: courseId });
  
  if (error) {
    console.error('Error checking course access:', error);
    return false;
  }
  
  // Cache the result
  await setCachedCourseAccess(userId, courseId, !!data);
  
  return !!data;
}

export async function getUserSubscriptionTier(userId: string): Promise<'free' | 'askjds' | 'unlimited'> {
  // Implementation details
}
```

### Checkout APIs

```typescript
// src/lib/stripe/checkout.ts
export async function createCourseCheckout(userId: string, courseId: string): Promise<{url: string}> {
  // Implementation details
}

export async function createCourseRenewalCheckout(userId: string, courseId: string): Promise<{url: string}> {
  // Implementation details
}

export async function createUnlimitedSubscriptionCheckout(userId: string, interval: 'month' | 'year'): Promise<{url: string}> {
  // Implementation details
}
```

### API Routes

```typescript
// src/app/api/checkout/route.ts
export async function POST(request: NextRequest) {
  // CSRF validation
  // Authentication check
  // Input validation
  // Checkout creation
  // Error handling
}

// src/app/api/subscription/cancel/route.ts
export async function POST(request: NextRequest) {
  // Implementation details
}
```

### Admin Analytics API

```typescript
// src/app/api/admin/analytics/route.ts
export async function GET(request: NextRequest) {
  // Admin authorization
  // Date range parsing
  // Fetch enrollment and subscription metrics
  // Return formatted data
}
```

## Webhook Extension

The Stripe webhook handler needs to be extended to handle course purchases and renewals:

```typescript
// supabase/functions/stripe-webhook/index.ts
// Add to case 'checkout.session.completed':

// Handle course purchases
if (session.metadata?.courseId && session.metadata?.isRenewal !== 'true') {
  const userId = session.metadata.userId;
  const courseId = session.metadata.courseId;
  
  // Create enrollment with retry mechanism
  try {
    await processEnrollment(userId, courseId);
    
    // Track analytics
    await supabase.from('analytics_events').insert({
      event_type: 'course_purchase',
      user_id: userId,
      properties: { courseId, source: 'checkout' },
      created_at: new Date().toISOString()
    });
  } catch (error) {
    // Error handling
  }
}

// Handle course renewals
else if (session.metadata?.courseId && session.metadata?.isRenewal === 'true') {
  // Implementation details
}

// Handle subscription upgrades
else if (session.metadata?.isUpgrade === 'true') {
  // Implementation details
}
```

## Frontend Components

### Course Card Component

```tsx
export function CourseCard({ id, title, description, image, price, days_of_access, ...props }) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  
  // Check course access
  // Update UI based on access
  // Handle click events
}
```

### Course Detail Purchase Section

```tsx
// In CourseDetail.tsx
// Show different UIs based on access status:
// 1. Not logged in -> login prompt
// 2. Has access -> start learning button
// 3. No access -> purchase options
// 4. Expires soon -> renewal option
```

### Sample Videos Component

```tsx
export function CourseSampleVideos({ videos }) {
  // Display sample videos with Gumlet player
  // Handle multiple videos with tabs
}
```

### Subscription Management

```tsx
export function SubscriptionStatus() {
  // Display current subscription details
  // Show cancel/resume options
  // Show upgrade path if applicable
}
```

### Dashboard Courses Section

```tsx
// In Dashboard.tsx
// Filter courses based on subscription tier
// Show "My Courses" for all users
// Hide "Available Courses" for unlimited subscribers
```

## Notification System

### Email Notifications

- 7-day expiration reminder
- 1-day expiration reminder
- Purchase confirmation
- Renewal confirmation
- Subscription activation/cancellation

### Notification Edge Function

```typescript
// supabase/functions/enrollment-notifications/index.ts
// Find enrollments expiring soon
// Send email notifications
// Update notification status in database
// Handle retry logic for failures
```

### In-App Notifications

- Show expiration countdown in course UI
- Prompt for renewal when approaching expiration
- Highlight subscription status changes

## Analytics & Metrics

### Event Tracking

```typescript
export enum EventType {
  COURSE_VIEW = 'course_view',
  COURSE_PURCHASE = 'course_purchase',
  COURSE_RENEW = 'course_renew',
  SUBSCRIPTION_START = 'subscription_start',
  SUBSCRIPTION_CANCEL = 'subscription_cancel',
  LESSON_COMPLETE = 'lesson_complete'
}

export function trackEvent(eventType: EventType, properties: Record<string, any>) {
  // Track with analytics provider
  // Store in database
}
```

### Admin Dashboard Metrics

- Total enrollments by course
- Conversion rates
- Renewal rates
- Subscription upgrades
- Revenue trends

### Data Retention Policy

```sql
-- Purge old analytics data
-- Anonymize expired enrollments
-- Clean up error logs
```

## Performance Considerations

### Caching

```typescript
// Cache course access results
export async function getCachedCourseAccess(userId: string, courseId: string): Promise<boolean | null> {
  const key = `course_access:${userId}:${courseId}`;
  return getCachedValue<boolean>(key);
}
```

### Database Optimizations

- Proper indexing for common queries
- Efficient RLS policies
- Server-side functions for complex operations

### UI Performance

- Lazy loading for course lists
- Pagination for long lists
- Optimistic UI updates

## Testing Strategy

### Stripe Test Cards

```typescript
export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINE: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  REQUIRES_AUTH: '4000002500003155',
};
```

### End-to-End Testing

- Purchase flow testing
- Subscription flow testing
- Access verification
- Renewal process

### Integration Testing

- Webhook handler testing
- API endpoint testing
- Database function testing

## Security Considerations

### Input Validation

```typescript
export const checkoutSchema = z.object({
  courseId: z.string().uuid().optional(),
  isRenewal: z.boolean().default(false),
  subscriptionType: z.enum(['unlimited']).optional(),
  interval: z.enum(['month', 'year']).optional()
});
```

### CSRF Protection

```typescript
// Validate CSRF token in API routes
const csrfResult = await csrf.validate(request);
if (!csrfResult.success) {
  return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
}
```

### Error Handling

```typitten
// Sanitized error responses
// Logging for debugging
// Fallbacks for critical operations
```

## Implementation Steps

1. **Database Schema Updates**
   - Add required tables and fields
   - Create database functions
   - Set up RLS policies
   - Add necessary indexes

2. **Stripe Configuration**
   - Set up products and prices
   - Configure webhook endpoint
   - Set up test and production environments

3. **API Implementation**
   - Create access control utilities
   - Implement checkout flows
   - Add subscription management
   - Build admin analytics endpoints

4. **Webhook Extension**
   - Update for course purchases
   - Add renewal handling
   - Handle subscription changes
   - Add analytics tracking

5. **Frontend Development**
   - Update course components
   - Build subscription UI
   - Create sample video player
   - Implement dashboard views

6. **Testing & Deployment**
   - Test with Stripe test cards
   - Verify access control
   - Check analytics tracking
   - Deploy to staging environment

7. **Monitoring & Maintenance**
   - Set up error alerting
   - Configure analytics dashboards
   - Implement data retention policies 