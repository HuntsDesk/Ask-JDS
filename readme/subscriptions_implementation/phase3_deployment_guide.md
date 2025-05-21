# Phase 3: Stripe Webhook Deployment Guide

This guide outlines the process for deploying and testing the Stripe webhook edge function that handles subscription and course enrollment processing.

## Prerequisites

- Supabase CLI installed and configured
- Stripe CLI installed and configured (for testing)
- Stripe API keys and webhook secrets configured in environment variables

## Deployment Steps

1. **Review the Implementation**
   - The webhook is implemented in `supabase/functions/stripe-webhook/index.ts`
   - It handles all required Stripe events for subscriptions and course enrollments
   - All database operations are wrapped in transactions for data consistency

2. **Deploy the Webhook Function**
   Run the provided deployment script:
   ```bash
   ./scripts/deploy_stripe_webhook.sh
   ```

3. **Configure Webhook in Stripe Dashboard**
   - Go to the Stripe Dashboard → Developers → Webhooks
   - Add a new endpoint with URL: `https://prbbuxgirnecbkpdpgcb.supabase.co/functions/v1/stripe-webhook`
   - Select the following events to listen for:
     - `payment_intent.succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the signing secret and update your Supabase environment variables

4. **Set Environment Variables**
   Make sure these environment variables are set in Supabase:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
   supabase secrets set STRIPE_LIVE_SECRET_KEY=sk_live_xxx
   supabase secrets set STRIPE_TEST_WEBHOOK_SECRET=whsec_test_xxx
   supabase secrets set STRIPE_LIVE_WEBHOOK_SECRET=whsec_live_xxx
   supabase secrets set ENVIRONMENT=development # or production
   ```

## Testing the Webhook

### Method 1: Using the Stripe CLI

Run the provided test script:
```bash
./scripts/test_stripe_webhook.sh
```

This will trigger test events for all supported webhook types.

### Method 2: Using the REST Client

If you have the REST Client extension in VS Code:
1. Open `supabase/functions/stripe-webhook/test.http`
2. Click "Send Request" above any test case
3. Check logs in the Supabase dashboard

### Method 3: Manually Testing with Stripe Dashboard

1. Create a test product/price in the Stripe Dashboard
2. Make a test purchase with the test credit card
3. Monitor logs in the Supabase dashboard
4. Verify the database records were created correctly

## Verification Checklist

After testing, verify the following:

1. ✅ Course enrollments are created when `payment_intent.succeeded` events are received
2. ✅ Subscriptions are created/updated when appropriate events are received
3. ✅ Failed payments update subscription status to `past_due`
4. ✅ Transactions roll back properly when errors occur
5. ✅ Webhook function handles duplicate events correctly (idempotency)
6. ✅ All operations are properly logged, including errors

## Troubleshooting

If issues occur:

1. **Check Function Logs**: View real-time logs in the Supabase Dashboard
2. **Verify Webhook Configuration**: Ensure the webhook secret is correctly set
3. **Check Event Format**: Verify the events match the expected structure
4. **Database Connectivity**: Ensure the function has proper database access

## Security Notes

- The webhook URL is publicly accessible but protected by Stripe signature verification
- Always use HTTPS for the webhook endpoint
- Keep webhook secrets secure and never expose them in client-side code

## Next Steps

After successfully deploying and testing the webhook:

1. Proceed to Phase 4: Frontend Checkout & Subscription Management
2. Keep monitoring webhook events during the implementation of subsequent phases 