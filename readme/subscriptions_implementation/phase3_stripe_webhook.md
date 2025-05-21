# Phase 3: Stripe Webhook Edge Function Implementation

This document outlines the implementation of the Stripe webhook edge function for handling subscription and course enrollment events.

## Overview

The webhook function is responsible for processing events from Stripe and updating the database accordingly. It handles:

1. Course purchases via one-time payments
2. Subscription creation, updates, and cancellations
3. Invoice payment successes and failures

## Key Features Implemented

### 1. Environment-Aware Configuration
- Uses different Stripe API keys and webhook secrets based on test/production environment
- Properly handles both test and live mode events

### 2. Enhanced Security
- Validates Stripe signatures to verify webhook authenticity
- Returns appropriate status codes to prevent webhook replay attacks

### 3. Database Transaction Support
- All related database operations are wrapped in transactions
- Ensures data consistency with automatic rollbacks on error

### 4. Stripe Price ID Storage
- Stores `stripe_price_id` for both subscriptions and course enrollments
- Enables tracking of which specific price was used for the purchase

### 5. Error Handling & Logging
- Comprehensive error logging to `error_logs` table
- User-specific error tracking when possible

### 6. Payment Status Management
- Handles "past_due" state for failed payments
- Leverages Stripe's dunning process for payment retry

### 7. Idempotency
- Uses `stripe_payment_intent_id` to prevent duplicate course enrollments
- Safely handles webhook retries from Stripe

## Key Events Handled

| Event Type | Purpose |
|------------|---------|
| `payment_intent.succeeded` | Process course purchases |
| `customer.subscription.created` | Create new subscription records |
| `customer.subscription.updated` | Update existing subscription status/details |
| `customer.subscription.deleted` | Handle cancellations while preserving access until period end |
| `invoice.payment_succeeded` | Confirm subscription renewals |
| `invoice.payment_failed` | Handle failed payments, update to "past_due" |

## Testing Instructions

1. **Use Stripe CLI or Dashboard to send test events**
   ```
   stripe trigger payment_intent.succeeded
   ```

2. **Monitor logs in Supabase dashboard**
   - Check webhook function logs for event processing
   - Verify database changes in Supabase Table Editor

3. **Verify idempotency**
   - Send the same event twice
   - Confirm no duplicate records are created

## Database Schema Integration

This implementation works with the database changes from Phase 1:
- Uses the new `stripe_price_id` column in `user_subscriptions`
- Uses both `stripe_price_id` and `stripe_payment_intent_id` in `course_enrollments`

## Deployment

To deploy the webhook function to Supabase:

```bash
supabase functions deploy stripe-webhook
```

## Webhook URL Configuration

Ensure your webhook URL is configured in the Stripe dashboard:
- Test mode: `https://[project-ref].supabase.co/functions/v1/stripe-webhook`
- Live mode: Same URL (environment is determined by the API key used)

## Security Considerations

- The webhook secret is required for signature verification
- Service role key is used for database operations
- Error responses are sanitized to prevent information leakage 