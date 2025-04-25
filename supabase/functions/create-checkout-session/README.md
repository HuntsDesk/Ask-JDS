# Stripe Checkout Edge Function

This Supabase Edge Function handles both course purchases and subscription signup processes through Stripe.

## Important Note on TypeScript Linting

The TypeScript linting in this function may show errors in some IDEs because of the Deno environment. These errors can be safely ignored as they are related to the Deno runtime environment which is different from Node.js.

Common linter errors include:
- Cannot find name 'Deno'
- Cannot find module imports for Deno standard library
- Type definition errors

These errors will not affect the functionality when deployed to Supabase Edge Functions, as they use the Deno runtime.

## Local Development

To run this function locally using Supabase CLI:

```bash
supabase functions serve --no-verify-jwt
```

For TypeScript validation when developing with Deno:

```bash
deno run --allow-net --allow-env --allow-read index.ts
```

## Environment Variables

This function requires the following environment variables:

### Stripe Configuration
- `STRIPE_SECRET_KEY` - Stripe API secret key for development/testing
- `VITE_STRIPE_LIVE_SECRET_KEY` - Stripe API secret key for production

### Subscription Price IDs
- `VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID` - Premium monthly subscription price ID
- `VITE_STRIPE_PREMIUM_ANNUAL_PRICE_ID` - Premium annual subscription price ID
- `VITE_STRIPE_UNLIMITED_MONTHLY_PRICE_ID` - Unlimited monthly subscription price ID
- `VITE_STRIPE_UNLIMITED_ANNUAL_PRICE_ID` - Unlimited annual subscription price ID

### Supabase Configuration
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin access

### Application Configuration
- `VITE_APP_URL` - Your application URL for success/cancel redirects

## Functionality

This function handles two types of Stripe checkout sessions:

1. **Course Purchases** - Individual purchases of courses
2. **Subscription Signups** - Monthly or annual subscription plans with tiered options

Both processes authenticate the user, gather appropriate data, and redirect to Stripe for payment processing.

## Deployment

This function is automatically deployed when pushed to the main branch through CI/CD. 