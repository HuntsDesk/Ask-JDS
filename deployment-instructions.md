# Stripe Payment Element Integration Deployment

This document provides instructions for deploying the Stripe Payment Element integration.

## Prerequisites

1. Ensure Docker is installed and running (required for Supabase functions deployment)
2. Set up environment variables:
   - Add `VITE_STRIPE_PUBLISHABLE_KEY` to your `.env` file
   - Configure `SKIP_DB_FOR_TEST_EVENTS` in your Supabase Edge Functions settings

## Deployment Steps

1. Deploy the Edge Functions:

   ```bash
   # Deploy the payment intent function
   supabase functions deploy create-payment-intent
   
   # Update the webhook handler
   supabase functions deploy stripe-webhook
   ```

2. Configure Stripe Webhook Endpoint:

   - Log in to your Stripe Dashboard
   - Go to Developers > Webhooks
   - Add an endpoint pointing to your Supabase Edge Function URL:
     - `https://<your-supabase-project>.functions.supabase.co/stripe-webhook`
   - Add the following events:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

3. Set Stripe webhook secrets:

   ```bash
   # Set the test webhook secret
   supabase secrets set STRIPE_TEST_WEBHOOK_SECRET=whsec_your_test_webhook_secret
   
   # Set the live webhook secret (when ready for production)
   supabase secrets set STRIPE_LIVE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
   ```

## Testing

1. Use Stripe test cards to verify the checkout flow:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires Auth: `4000 0025 0000 3155`

2. Verify webhook events using the Stripe CLI:

   ```bash
   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
   ```

3. Check that course enrollments and subscriptions are properly created after successful payments.

## Implementation Notes

- The embedded checkout uses Stripe Payment Element, which provides a complete, customizable checkout form
- Payment intents are created server-side for security via the `create-payment-intent` Edge Function
- The webhook handler processes both standard checkout sessions and payment intents
- CSP errors from the redirect-based checkout should be resolved with this implementation 