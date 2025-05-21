# Phase 1: Database Schema Modifications

This document outlines the database schema changes implemented in Phase 1 of the Subscription and Course Enrollment System.

## Changes Implemented

1. **Added `stripe_price_id` to `user_subscriptions` table**
   - Purpose: Store the Stripe Price ID associated with this specific subscription instance
   - Type: TEXT
   - Examples: "price_unlimited_monthly", "price_unlimited_annual"

2. **Added `stripe_price_id` to `course_enrollments` table**
   - Purpose: Store the Stripe Price ID used for specific course enrollment transactions
   - Type: TEXT
   - Examples: "price_course_civil_procedure"

3. **Added `stripe_payment_intent_id` to `course_enrollments` table**
   - Purpose: Store the Stripe Payment Intent ID for webhook idempotency
   - Type: TEXT with UNIQUE constraint
   - Examples: "pi_3Oy1AtBdYlmFidIZ1KMJGB5s"

4. **Updated `has_course_access` function**
   - Changed logic to only grant course access to users with **Unlimited** tier subscriptions
   - Premium tier users no longer get automatic course access
   - Added temporary fallback for subscriptions before `stripe_price_id` was added

## Migrations

The following migration files were created:

1. `20240601000000_add_stripe_price_id_columns.sql` - Adds the new columns
2. `20240601000001_verify_columns_and_rls.sql` - Verifies columns were added correctly
3. `20240601000002_test_phase1_changes.sql` - Tests the new columns with sample data
4. `20240601000003_update_has_course_access.sql` - Updates the access control function

## RLS Policies

No changes were made to RLS policies as the existing policies already handle the new columns appropriately:

### For `user_subscriptions`:
- "Admins can view all subscriptions" - Admins/service role can view all
- "Only service role can insert/update/delete subscriptions" - Only service role can modify
- "Users can view their own subscriptions" - Users can view their own

### For `course_enrollments`:
- "Admins can manage all enrollments" - Admins can perform all operations
- "Users can create their own enrollments" - Users can create their own
- "Users can update their own enrollments" - Users can update their own
- "Users can view their own course enrollments" - Users can view their own

## How to Apply the Migrations

Run the provided script:

```bash
./scripts/apply_phase1_migrations.sh
```

This script will:
1. Apply the migrations to your local Supabase database
2. Run verification scripts to ensure everything was applied correctly
3. Provide instructions for the next steps

## Next Steps

After applying these migrations:

1. Configure Stripe Products and Prices in the Stripe Dashboard (Phase 2)
2. Update your `.env` file with your Stripe Price IDs
3. Implement the webhook handler (Phase 3)

## Testing

Test the migrations by:

1. Inserting a test subscription with `stripe_price_id`
2. Inserting a test course enrollment with `stripe_price_id` and `stripe_payment_intent_id`
3. Verifying that the `has_course_access` function works correctly with the new schema 