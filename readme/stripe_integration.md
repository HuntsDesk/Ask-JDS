# Stripe Integration

This document outlines how Stripe is integrated into the application for handling payments and subscriptions.

## Environment Variables

The following environment variables are required for Stripe integration:

```bash
# Required for client-side Stripe Elements
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...

# Required for server-side (Edge Functions)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_LIVE_SECRET_KEY=sk_live_...

# Subscription Price IDs (server-side only)
STRIPE_PRICE_ID_UNLIMITED_MONTH=price_...
STRIPE_PRICE_ID_UNLIMITED_YEAR=price_...
```

## Checkout Flow

1. Client initiates checkout by calling `createCheckoutSession(tier, interval)` with:
   - `tier`: The subscription tier ('unlimited')
   - `interval`: The billing interval ('month' or 'year')

2. The Edge Function (`create-checkout-session`) handles the request by:
   - Validating the authenticated user
   - Mapping the tier and interval to the appropriate Stripe Price ID
   - Creating a Stripe Checkout Session
   - Returning the checkout URL

3. Client redirects to the checkout URL for payment completion

## Security Considerations

- Stripe Price IDs are kept server-side to prevent unauthorized access to different pricing tiers
- Only publishable keys are exposed to the client
- All checkout session creation happens server-side
- User authentication is required for all checkout operations

## Error Handling

The checkout flow includes comprehensive error handling:
- Client-side validation of parameters
- Server-side validation of user authentication
- Proper error messages for various failure scenarios
- Loading states during async operations

## Testing

For testing, use the test environment variables and test credit card numbers from Stripe's documentation.

## Stripe Product Configuration

For each course in the Ask JDS platform:

1. Create a corresponding product in Stripe
2. Set up a price for the product (one-time payment)
3. Store the Stripe Product ID in your database (not required but helpful)

## Webhook Configuration

Two webhook endpoints must be configured in the Stripe dashboard:

1. **Test Environment**: 
   - URL: https://[your-project-ref].supabase.co/functions/v1/stripe-webhook
   - Events to listen for:
     - checkout.session.completed
     - customer.subscription.updated
     - customer.subscription.deleted

2. **Production Environment**: 
   - Same URL as Test, but register it in the production Stripe dashboard
   - Same events as Test

## Workflow

1. User clicks "Purchase" on a course
2. Frontend calls createCourseCheckout
3. Supabase Edge Function creates a Stripe checkout session
4. User completes payment on Stripe's hosted checkout page
5. Stripe sends webhook event to our webhook handler
6. Webhook handler grants access to the course
7. User is redirected to the success page based on the purchase type

## Success Pages

The application uses the following success pages for different purchase types:

1. **Thank You Page** (`/thank-you`)
   - General entry point for all successful payments
   - Examines the session data and redirects to the appropriate specific success page
   - Used in checkout session URLs: `success_url: ${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`

2. **Course Purchase Success** (`/purchase/success`)
   - Displays confirmation for course purchases
   - Shows course-specific information and next steps
   - Provides buttons to access the purchased course

3. **Subscription Success** (`/subscription/success`)
   - Displays confirmation for subscription purchases
   - Shows subscription benefits and features
   - Provides links to key features included in the subscription

## Stripe Wrapper Extension

The Supabase Stripe Wrapper extension allows querying Stripe data directly from PostgreSQL. To enable it:

1. Go to Supabase Dashboard → Database → Extensions
2. Enable "Wrappers" extension
3. Create the Stripe wrapper:
   ```sql
   CREATE FOREIGN DATA WRAPPER stripe_wrapper
     HANDLER stripe_fdw_handler
     VALIDATOR stripe_fdw_validator;

   CREATE SERVER stripe_server
     FOREIGN DATA WRAPPER stripe_wrapper
     OPTIONS (
       api_key 'YOUR_STRIPE_API_KEY',
       api_version '2023-10-16'
     );

   CREATE SCHEMA stripe;
   
   IMPORT FOREIGN SCHEMA stripe
     LIMIT TO ("customers", "checkout_sessions", "subscriptions", "payment_intents")
     FROM SERVER stripe_server
     INTO stripe;
   ```

## Troubleshooting

1. **Redirected to /chat after clicking Purchase**: 
   - Check browser console for error messages
   - Verify the Supabase Edge Function logs in the Supabase dashboard
   - Ensure environment variables are correct in both the frontend and Edge Functions
   - Test Edge Function directly using the Supabase interface

2. **Missing webhook events**: 
   - Check Stripe dashboard → Developers → Webhooks → Recent events
   - Verify webhook endpoint is correctly set and responding
   - Check Supabase Edge Function logs

3. **Access not granted after payment**: 
   - Verify webhook endpoint is receiving events
   - Check database tables to ensure data is being inserted correctly

## Common Issues and Solutions

1. **Redirect to /chat issue**: This often happens when:
   - Authentication check fails in the handleCoursePurchase function
   - The Edge Function URL is incorrect
   - CORS issues prevent the API call from completing

   Solution:
   ```javascript
   // Add more detailed error handling to identify the issue
   try {
     // Existing code
   } catch (error) {
     console.error("Detailed checkout error:", {
       message: error.message,
       stack: error.stack,
       responseText: error.responseText
     });
     // Rest of error handling
   }
   ```

2. **Multiple Supabase client instances warning**:
   - Consolidate Supabase client creation to a single file
   - Import the same client instance throughout the app

## Production Deployment Checklist

1. Verify all Stripe product configurations are correct
2. Ensure webhooks are properly configured in production Stripe account
3. Validate that environment variables are set correctly in all environments:
   - Frontend (.env.production)
   - Supabase Edge Functions
4. Perform a test purchase with test keys before going live
5. Switch to live keys in production environment 