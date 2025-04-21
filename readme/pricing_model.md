# Ask JDS Pricing Model

## Subscription Tiers

### Free Tier
- **Price**: $0/month
- **Features**:
  - 10 AI chat messages per month
  - Create and manage personal flashcards
  - Access to sample flashcards only
  - No course access

### Premium Tier
- **Price**: $10/month
- **Features**:
  - Unlimited AI chat messages
  - Create and manage personal flashcards
  - Full access to premium flashcards
  - No course access

### Per-Course Purchase
- **Price**: Varies per course (stored in `courses.price` column)
- **Access Duration**: Typically 30 days (controlled by `courses.days_of_access` column)
- **Features**:
  - Access to specific purchased course content
  - Course materials, videos, and assessments
  - Does not include premium flashcards or unlimited chat

### Unlimited Tier
- **Price**: $30/month
- **Features**:
  - Unlimited AI chat messages
  - Create and manage personal flashcards
  - Full access to premium flashcards
  - Access to ALL courses

## Database Implementation

### User Subscriptions
- Stored in `user_subscriptions` table
- Tracks subscription status, tier, and billing periods
- Key fields: `user_id`, `status`, `tier`, `current_period_end`

### Course Enrollments
- Stored in `course_enrollments` table
- Tracks which users have access to which courses and when that access expires
- Key fields: `user_id`, `course_id`, `expires_at`, `status`

### Course Pricing
- `courses.price`: Current selling price of the course
- `courses.original_price`: Original/regular price (for showing discounts)
- `courses.days_of_access`: Duration of access after purchase (typically 30 days)

## Access Control Logic

Course access is determined by the `has_course_access` function which checks:
1. If the course is free (`price = 0 or price IS NULL`)
2. If the user has an active enrollment for the specific course
3. If the user has an unlimited subscription

Chat access is limited based on the user's subscription tier and monthly message count tracked in the `message_counts` table. 