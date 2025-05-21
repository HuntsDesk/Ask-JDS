# Implementation Plan: Subscriptions and Course Enrollment System

This document outlines the step-by-step plan to implement the subscription tiers and individual course purchasing system.

## Guiding Principles
*   **Modular Implementation**: Each phase should be implementable and testable independently where possible.
*   **Clear Testing Steps**: Specific verification points after each significant step.
*   **Iterative Development**: Start with core functionality and build upon it.
*   **Security First**: Ensure Stripe integration and data handling follow best practices.

## Phase 1: Database Schema Modifications

**Objective**: Update the database schema to support storing Stripe Price IDs for subscriptions and course enrollments.

**Tasks**:

1.  **Add `stripe_price_id` to `user_subscriptions` table:**
    *   **Action**: Create a new migration file.
    *   **Note**: Before applying, manually inspect the `public.user_subscriptions` table in your database. If a similar column (e.g., `price_id`) already exists from a previous attempt, you may need to `ALTER` that column instead of adding a new one, or ensure this `ADD COLUMN` statement is compatible. The `supabase_dump.md` reviewed did not show this column as pre-existing.
    *   **SQL**:
        ```sql
        ALTER TABLE public.user_subscriptions
        ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

        COMMENT ON COLUMN public.user_subscriptions.stripe_price_id IS 'Stores the Stripe Price ID associated with this specific subscription instance (e.g., price_xxxxxxxxxxxxxx).';
        ```
    *   **Rationale**: To accurately track which Stripe Price a user is subscribed to, enabling flexible pricing, promotions, and historical accuracy.

2.  **Add `stripe_price_id` to `course_enrollments` table:**
    *   **Action**: Add to the same migration file.
    *   **SQL**:
        ```sql
        ALTER TABLE public.course_enrollments
        ADD COLUMN stripe_price_id TEXT;

        COMMENT ON COLUMN public.course_enrollments.stripe_price_id IS 'Stores the Stripe Price ID used for this specific course enrollment transaction (e.g., price_xxxxxxxxxxxxxx). Important if course prices change or discounts are offered via different Price IDs.';
        ```
    *   **Rationale**: To track the exact Stripe Price ID used for a course purchase, allowing for accurate historical sales data and handling price variations.

3.  **Add `stripe_payment_intent_id` to `course_enrollments` table (for Webhook Idempotency):**
    *   **Action**: Add to the same migration file.
    *   **SQL**:
        ```sql
        ALTER TABLE public.course_enrollments
        ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE;

        COMMENT ON COLUMN public.course_enrollments.stripe_payment_intent_id IS 'Stores the Stripe Payment Intent ID for the transaction that created/updated this enrollment. Used for webhook idempotency.';
        ```
    *   **Rationale**: To track the exact Stripe Price ID used for a course purchase, allowing for accurate historical sales data and handling price variations.
    *   **Idempotency Check**: Using the `stripe_payment_intent_id` column in `course_enrollments`, first check if this `payment_intent.id` has already been processed. If yes, return 200 OK and stop further processing for this event to ensure idempotency.
    *   Query the `courses` table to get `days_of_access` for the `courseId`.

4.  **Review/Update RLS Policies (if necessary):**
    *   **Action**: After adding columns, review RLS policies on `user_subscriptions` and `course_enrollments`. The new columns should generally follow the access patterns of other non-sensitive data in those tables (e.g., readable by the user for their own records, manageable by service role/admin).
    *   **Current Policies (from `supabase_dump.md`)**:
        *   `user_subscriptions`:
            *   Admins can view all.
            *   Service role can manage all.
            *   Users can view their own.
        *   `course_enrollments`:
            *   Admins can manage all.
            *   Users can create, update, view their own.
    *   **Likely No Change Needed**: Adding a `stripe_price_id` probably doesn't require policy changes as it's not more sensitive than existing `stripe_subscription_id` or `stripe_customer_id`.

**Testing & Verification for Phase 1**:

1.  Apply the migration successfully to your local/staging Supabase instance.
2.  Verify the new columns (`stripe_price_id`) exist in both `user_subscriptions` and `course_enrollments` tables using a SQL client or the Supabase Studio.
3.  Confirm that existing RLS policies still behave as expected (no unintended denial or granting of access due to schema change).
4.  Attempt to insert a test record into `user_subscriptions` including a mock `stripe_price_id` as an authenticated user (if allowed by policies) or via SQL as admin.
5.  Attempt to insert a test record into `course_enrollments` including a mock `stripe_price_id` as an authenticated user or via SQL as admin.

## Phase 2: Stripe Product & Price Configuration (Guidance)

**Objective**: Ensure Stripe is configured with the necessary Products and Prices for subscriptions and individual courses, for both test and live modes.

**Tasks (To be performed by you in the Stripe Dashboard)**:

1.  **Define Products in Stripe**:
    *   **Premium Subscription Product**: (e.g., "AskJDS Premium Tier") - This is a service product.
    *   **Unlimited Subscription Product**: (e.g., "AskJDS Unlimited Tier") - This is a service product.
    *   **Individual Courses Products**: Create a separate Stripe Product for each sellable course (e.g., "Civil Procedure Course," "Evidence Course"). These are likely service products too, even if sold as one-time.
    *   **Operational Note**: For clarity in the Stripe Dashboard, consider prefixing Product names with an environment indicator, e.g., `[TEST] AskJDS Premium Tier` or `[LIVE] Civil Procedure Course`, especially when managing multiple environments.

2.  **Create Prices for Each Product in Stripe**:
    *   **Premium Subscription Prices**:
        *   Monthly recurring price (e.g., `$10/month`). Note its Price ID.
        *   (Optional) Annual recurring price. Note its Price ID.
    *   **Unlimited Subscription Prices**:
        *   Monthly recurring price (e.g., `$30/month`). Note its Price ID.
        *   (Optional) Annual recurring price. Note its Price ID.
    *   **Individual Course Prices**:
        *   For each course product, create a one-time payment price. Note its Price ID.
    *   **Important**: Create these for *both Test Mode and Live Mode* in Stripe. The Price IDs will be different for test and live.

3.  **Update Environment Variables**:
    *   **Action**: Populate your `.env` file (and `.env.blank` as a template) with all the Stripe Price IDs obtained in the previous step.
    *   **Variables (as per your `.env.blank`)**:
        *   `STRIPE_LIVE_UNLIMITED_MONTHLY_PRICE_ID`
        *   `STRIPE_LIVE_UNLIMITED_ANNUAL_PRICE_ID` (if applicable)
        *   `STRIPE_LIVE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID`
        *   `STRIPE_LIVE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID` (if applicable)
        *   `STRIPE_LIVE_COURSE_[COURSE_NAME]_PRICE_ID` (for each course)
        *   And the corresponding test mode versions (e.g., `STRIPE_UNLIMITED_MONTHLY_PRICE_ID`).

**Testing & Verification for Phase 2**:

1.  Confirm all required products (Premium, Unlimited, individual courses) exist in your Stripe Dashboard (Test and Live modes).
2.  Confirm each product has at least one Price (monthly/annual for subscriptions, one-time for courses) in Stripe (Test and Live modes).
3.  Verify that all obtained Price IDs are correctly updated in your local `.env` file and that `.env.blank` reflects all the necessary variable names.
4.  Double-check that you have distinct Price IDs for test mode and live mode for each offering.

## Phase 3: Backend - Stripe Webhook Edge Function

**Phase 3 Completion Summary**:
- ✅ Implemented robust webhook handler for all required Stripe events
- ✅ Added enhanced error handling with proper logging
- ✅ Implemented fallback for missing metadata fields
- ✅ Added transaction management for data consistency
- ✅ Created testing tools (webhook-test.js, webhook-test-all.js, stripe-proxy.js)
- ✅ Verified webhook signature verification and event processing

**Key Issues Fixed**:
- Added graceful handling for missing user_id in payment_intent.succeeded events
- Improved error logging with proper JSON stringification
- Enhanced transaction management to ensure proper commits/rollbacks
- Added detailed event logging for easier debugging

**Objective**: Implement/Refactor the Supabase Edge Function (`stripe-webhook`) to securely handle events from Stripe, particularly for creating and managing subscriptions and course enrollments.

**Starting Point**: Review and consider refactoring/basing the implementation on the existing webhook logic found in `supabase/functions_downloaded/stripe-webhook/`, as it may be more complete than any version currently in `supabase/functions/stripe-webhook/`.

**Location**: `supabase/functions/stripe-webhook/index.ts` (or a new function if preferred, ensure correct deployment path)

**Key Stripe Events to Handle**:

*   `payment_intent.succeeded` (Primary for one-time payments and initial subscription payments if applicable)
*   `setup_intent.succeeded` (If using SetupIntents for trials before charging)
*   `customer.subscription.created`
*   `customer.subscription.updated` (e.g., plan changes, payment failures, successful payments after retries)
*   `customer.subscription.deleted` (cancellations)
*   `invoice.payment_succeeded` (Crucial for recurring subscription payments and confirming subscription activation/renewal)
*   `invoice.payment_failed`
*   `checkout.session.completed` (Retain if any part of the flow, e.g. setting up a subscription with SCA, might still use this. However, focus is shifting to PaymentIntents for direct payment actions).

**Webhook Events Documentation**:

Below is a detailed explanation of each webhook event, what triggers it, the actions to take, and expected outcomes:

| Event | Trigger | Actions | Expected Outcome |
|-------|---------|---------|-----------------|
| `payment_intent.succeeded` | Payment is successfully processed | • For course purchases: Create enrollment record with stripe_price_id, calculate expires_at<br>• For subscriptions: Update profiles.stripe_customer_id<br>• Apply idempotency check using stripe_payment_intent_id | • New course_enrollments record with active status<br>• Customer ID updated in profiles table |
| `customer.subscription.created` | New subscription is successfully created | • Insert into user_subscriptions with user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_end<br>• Update profiles.stripe_customer_id | • User gains access to Premium/Unlimited tier features<br>• Subscription record created |
| `customer.subscription.updated` | Subscription details change (plan changes, payment method updates, etc.) | • Update user_subscriptions record with latest status, stripe_price_id, current_period_end, cancel_at_period_end<br>• Handle status changes like 'past_due' → 'active' (successful retry) or 'past_due' → 'canceled' (after all retries fail) | • User subscription reflects current state<br>• Access level updated if plan changed |
| `customer.subscription.deleted` | Subscription is canceled | • Update user_subscriptions status to 'canceled' or 'inactive'<br>• If cancel_at_period_end was true, may still keep 'active' until current_period_end | • User reverts to Free tier when subscription period ends<br>• Message limits apply |
| `invoice.payment_succeeded` | Recurring subscription payment succeeds | • Update user_subscriptions with status='active'<br>• Update current_period_end<br>• Verify stripe_price_id is current | • Subscription period extended<br>• User maintains access to paid tier |
| `invoice.payment_failed` | Subscription payment attempt fails | • Update user_subscriptions status to 'past_due'<br>• Log failure for monitoring<br>• Note: Stripe will handle automatic retries via its dunning process | • Access is determined by our business logic for 'past_due' status |
| `setup_intent.succeeded` | Payment method is successfully set up | • For trials: May complete subscription setup without immediate charge<br>• For saved payment methods: Update customer payment methods | • Payment method stored for future subscription billing |
| `checkout.session.completed` | Checkout flow completes | • Process based on session metadata (subscription vs. course purchase)<br>• May create/update user_subscriptions or course_enrollments | • Depends on checkout context and metadata<br>• Generally creates or updates subscription/enrollment |

**Important Implementation Notes**:
- All webhook handlers must be idempotent as Stripe may send the same event multiple times
- Verify the webhook signature using Stripe's signing secret
- Include appropriate error handling and logging
- Return 200 response code for successful processing (even if the event is ignored)
- Use consistent metadata keys across checkout creation and webhook processing
- **Payment Method Updates**: No special webhook handling is needed when users update their payment methods via Stripe Portal. Stripe manages the customer's payment methods, and the application only needs to respond if payments succeed or fail.
- **Failed Recurring Payments & Dunning**: Stripe handles failed payments with automatic retry attempts (dunning). The app should update subscription status to 'past_due' on `invoice.payment_failed` events, but access control during this period should be explicitly defined according to business requirements.

**Tasks**:

1. **Basic Setup & Security**:
    *   Ensure the function uses `Deno.serve`.
    *   Retrieve the Stripe webhook secret from environment variables (`STRIPE_TEST_WEBHOOK_SECRET` or `STRIPE_LIVE_WEBHOOK_SECRET` based on the environment).
    *   Verify the Stripe signature for every incoming event to ensure authenticity. Reject requests with invalid signatures.
    *   Initialize the Supabase client using service role key for database operations.

2. **Define Consistent Metadata Keys**:
    *   **Action**: Establish a consistent set of metadata keys used when creating Stripe Checkout sessions and expected by this webhook. Document these, possibly in a shared constants file if developing across multiple functions.
    *   **Essential Keys (Examples)**:
        *   `userId` (Supabase Auth User ID)
        *   `targetStripePriceId` (The Stripe Price ID for the item being purchased/subscribed to)
        *   `purchaseType` (e.g., 'subscription', 'course_purchase')
        *   `courseId` (Internal Course ID, if `purchaseType` is 'course_purchase')
        *   `isRenewal` (boolean, if applicable for course purchases)
        *   `successUrl`, `cancelUrl` (though these are top-level checkout session params, sometimes useful in metadata for context)
    *   **Rationale**: Ensures reliable data transfer from checkout initiation to webhook processing.

3. **Handle `payment_intent.succeeded`**:
    *   This event confirms a successful payment.
    *   **Metadata**: The `payment_intent.metadata` should contain `userId`, `purchaseType`, `targetStripePriceId`, `courseId` (if applicable), `isRenewal` (if applicable).
    *   **Database Transaction**: Wrap related operations in a transaction to ensure data consistency. 
    *   **For One-Time Course Purchases (`metadata.purchaseType === 'course_purchase'`)**:
        *   Extract `userId`, `courseId`, `targetStripePriceId` from metadata, and `payment_intent.id` from the event.
        *   **Idempotency Check**: Using the `stripe_payment_intent_id` column in `course_enrollments`, first check if this `payment_intent.id` has already been processed. If yes, return 200 OK and stop further processing for this event to ensure idempotency.
        *   Query the `courses` table to get `days_of_access` for the `courseId`.
        *   Calculate `expires_at` (NOW() + `days_of_access`).
        *   Insert into `public.course_enrollments` (ensure idempotency, e.g., check if already processed based on `payment_intent.id`):
            *   `user_id` = `userId`
            *   `course_id` = `courseId`
            *   `stripe_price_id` = `targetStripePriceId`
            *   `stripe_payment_intent_id` = `payment_intent.id` (if column added)
            *   `enrolled_at` = NOW()
            *   `expires_at` = calculated expiration
            *   `status` = 'active'
            *   `renewal_count` = (if `metadata.isRenewal`, increment existing or set to 1, else 0)
        *   Update `profiles.stripe_customer_id` with `payment_intent.customer` if not already set.
    *   **For Initial Subscription Payment (`metadata.purchaseType === 'subscription'`)**:
        *   This might confirm the first payment of a subscription. The actual subscription record might be created/updated more reliably via `customer.subscription.created/updated` or `invoice.payment_succeeded` for the first invoice.
        *   Can be used as a trigger to ensure the user profile has the `stripe_customer_id` (`payment_intent.customer`).
        *   Log this event and correlate with subscription events.

4. **Handle `customer.subscription.created` and `customer.subscription.updated`**:
    *   `customer.subscription.created`: Typically fires when a new subscription is successfully set up.
    *   `customer.subscription.updated`: Fires for various changes including plan changes, trial ending, status changes.
    *   **Database Transaction**: Wrap related operations in a transaction.
    *   **Action**: Upsert into `public.user_subscriptions`:
        *   `user_id` = `subscription.metadata.userId` (ensure `userId` is passed in subscription metadata when creating it, or retrieve by `stripe_customer_id`)
        *   `stripe_customer_id` = `subscription.customer`
        *   `stripe_subscription_id` = `subscription.id`
        *   `stripe_price_id` = `subscription.items.data[0].price.id`
        *   `status` = `subscription.status` (e.g., 'active', 'trialing', 'past_due')
        *   `current_period_end` = `subscription.current_period_end` (timestamp)
        *   `cancel_at_period_end` = `subscription.cancel_at_period_end` (boolean)
    *   Ensure `profiles.stripe_customer_id` is updated.

5. **Handle `invoice.payment_succeeded`**:
    *   Crucial for ongoing subscriptions and potentially for the first payment if a subscription starts immediately with an invoice.
    *   **Database Transaction**: Wrap related operations in a transaction.
    *   **Identify Context**: Check `invoice.billing_reason` (e.g., 'subscription_create', 'subscription_cycle', 'subscription_update').
    *   **Metadata**: `invoice.subscription_details.metadata` or `invoice.metadata` might contain your `userId` if set during subscription creation.
    *   **Action**: Primarily for subscriptions. If `invoice.subscription` (the Stripe Subscription ID) is present:
        *   Update `public.user_subscriptions` for the given `stripe_subscription_id`:
            *   `status` = 'active' (if not already)
            *   `current_period_end` = `invoice.lines.data[0].period.end` (or `subscription.current_period_end` from the associated subscription object)
            *   `stripe_price_id` = `invoice.lines.data[0].price.id`.
        *   This is where you reliably activate/extend a subscription period.

6.  **Handle `invoice.payment_failed`**:
    *   Fired when an invoice payment attempt fails.
    *   **Database Transaction**: Wrap related operations in a transaction.
    *   Update the `public.user_subscriptions` record:
        *   Set `status` to 'past_due'.
    *   **Access Control During Past Due**: Define in application logic how to handle users during this "past_due" grace period - whether they retain access while Stripe attempts to collect payment or lose access immediately. This should be explicitly documented as a business decision.
    *   Log the failure event in the `error_logs` table for monitoring and customer support purposes.

7.  **Handle `customer.subscription.deleted` (Cancellation)**:
    *   This fires when a subscription is canceled (either immediately or at period end).
    *   **Database Transaction**: Wrap related operations in a transaction.
    *   Update the `public.user_subscriptions` record:
        *   Set `status` to 'canceled' or 'inactive'.
        *   If `cancel_at_period_end` was true, the subscription might still be active until `current_period_end`. The status should reflect this (e.g., keep 'active' but note `cancel_at_period_end` is true). The final "inactive" update might come when the period actually ends, or you handle it based on `current_period_end` in your app logic.
    *   **Logic**: User reverts to "Free Tier". No specific database change for this beyond the subscription status, as "Free Tier" is the absence of an active paid subscription. Message limits will apply based on `get_user_message_count` and application logic.

8.  **Database Transactions**:
    *   Implement transaction support for all webhook handlers that perform multiple database operations to ensure data consistency:
    
    ```typescript
    try {
      // Begin transaction
      await supabaseClient.rpc('begin');
      
      // Multiple database operations
      await supabaseClient.from('user_subscriptions').upsert({...});
      await supabaseClient.from('profiles').update({...});
      
      // Commit if all succeeded
      await supabaseClient.rpc('commit');
    } catch (error) {
      // Rollback on any error
      await supabaseClient.rpc('rollback');
      throw error;
    }
    ```

9.  **Error Handling & Logging**:
    *   Log all errors to the existing `error_logs` table for consistent error tracking.
    *   Include event type, event ID, and error details in the logs.
    *   Return appropriate HTTP status codes to Stripe (200 for success, 4xx for client errors like bad signature, 5xx for server errors). Stripe will retry webhooks that don't receive a 200.

**Testing & Verification for Phase 3**:

1.  **Deploy the Webhook**: Deploy the initial version of your `stripe-webhook` function to Supabase (staging environment).
2.  **Configure Webhook Endpoint in Stripe (Test Mode)**:
    *   Point Stripe (Test Mode) to your deployed Supabase function URL.
    *   Select the specific events to send (start with `checkout.session.completed`).
3.  **Use Stripe CLI for Local Testing (Highly Recommended)**:
    *   Install Stripe CLI.
    *   Use `stripe listen --forward-to <your_local_function_url_or_ngrok_url>` to receive webhooks locally during development.
    *   Trigger events using `stripe trigger <event_name>` (e.g., `stripe trigger checkout.session.completed`).
4.  **Test Scenarios**:
    *   **New Subscription (via Embedded Flow)**:
        *   Trigger a payment flow that results in a new subscription (e.g., `payment_intent.succeeded` for initial payment if any, then `customer.subscription.created`, then `invoice.payment_succeeded` for the first invoice).
        *   Verify a new record is created/updated in `user_subscriptions` with correct `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `status='active'` (or 'trialing'), and `current_period_end`.
        *   Verify `profiles.stripe_customer_id` is updated.
    *   **New Course Purchase (via Embedded Flow)**:
        *   Trigger a `payment_intent.succeeded` for a one-time payment (course).
        *   Verify a new record is created in `course_enrollments` with correct `user_id`, `course_id`, `stripe_price_id`, `enrolled_at`, `expires_at`, and `status`.
        *   Verify `profiles.stripe_customer_id` is updated.
    *   **Subscription Update**:
        *   Trigger `customer.subscription.updated`.
        *   Verify the corresponding `user_subscriptions` record is updated.
    *   **Subscription Cancellation**:
        *   Trigger `customer.subscription.deleted`.
        *   Verify the `user_subscriptions` status is updated appropriately.
    *   **Failed Payment & Dunning**:
        *   Trigger `invoice.payment_failed`.
        *   Verify the subscription status is set to 'past_due'.
        *   Trigger successful payment retry (leading to `customer.subscription.updated` with status 'active').
        *   Verify the subscription status is updated correctly.
5.  **Security**:
    *   Test with an invalid Stripe signature; verify the webhook rejects it.
6.  **Idempotency**: Send the same event twice; verify it doesn't create duplicate records or fail.
7.  **Logging**: Check Supabase function logs for errors and successful processing messages.

## Phase 4: Frontend - Self-Hosted Checkout with Stripe Payment Elements

**Objective**: Implement frontend components and logic for a self-hosted (embedded) checkout experience using Stripe Payment Elements, providing a seamless payment process within the application.

**Critical Requirements & Lessons Learned (from Phase 3 & Reviews)**:

1.  **Stripe Elements Flow - Manual Confirmation & Status Check (Client-Side Responsibility)**:
    *   Unlike Stripe Checkout (redirect flow), Stripe Elements requires **explicit client-side actions** to confirm payment status after user interaction.
    *   When you call `stripe.confirmPayment({ elements, confirmParams: { return_url: 'YOUR_RETURN_URL' } })` (or `confirmSetup`):
        *   Stripe processes the payment/setup and handles any necessary authentication (e.g., 3D Secure).
        *   The user is then redirected to your specified `return_url`.
    *   **On the page serving this `return_url`, your client-side JavaScript MUST**:
        1.  Retrieve the `payment_intent_client_secret` (for PaymentIntents) or `setup_intent_client_secret` (for SetupIntents) from the URL query parameters (e.g., `new URLSearchParams(window.location.search).get('payment_intent_client_secret')`).
        2.  Use this `client_secret` to fetch the **latest status** of the PaymentIntent/SetupIntent directly from Stripe. This is typically done by calling a secure backend endpoint you create (e.g., `/api/get-payment-status`) which then uses the Stripe SDK on the server-side (`stripe.paymentIntents.retrieve(payment_intent_id)`).
        3.  Based on the retrieved status (e.g., `succeeded`, `processing`, `requires_payment_method`), display the appropriate confirmation, error, or pending message to the user.
    *   **The redirect to `return_url` does NOT automatically mean payment success.** Verification is a client-side and server-assisted responsibility.
    *   The webhook (Phase 3) handles backend fulfillment (e.g., creating enrollments) asynchronously, but the client needs to provide immediate user feedback.

2.  **Backend Enforcement of Access Control (`has_course_access`) - CRITICAL FOR SECURITY**:
    *   Displaying UI elements (e.g., "Access Course" vs "Purchase" buttons) based on `has_course_access` or `SubscriptionProvider` state is for **user experience only**.
    *   **Actual delivery of protected course content MUST be gated by rigorous backend checks.**
    *   Any API routes, Supabase Edge Functions, or server-side logic that serves course-specific data (e.g., video URLs from Gumlet, lesson content, downloadable materials) **must re-verify the user's access rights at the moment of the request.** This involves calling the `has_course_access` SQL function or equivalent logic within the backend function using the authenticated user's ID and the target course ID.
    *   **Rationale**: This prevents unauthorized access by users who might bypass client-side UI restrictions (e.g., by manipulating JavaScript, making direct API calls, or sharing links).

3.  **Required Metadata Fields (MUST be sent to `create-payment-handler`)**:
    *   `user_id`: **REQUIRED** (Supabase Auth User ID)
    *   `purchase_type`: **REQUIRED** (e.g., 'subscription', 'course_purchase')
    *   `targetStripePriceId`: **REQUIRED** (The Stripe Price ID for the item being purchased/subscribed to)
    *   `courseId`: (Required for `purchaseType === 'course_purchase'`, your internal Course ID)
    *   `days_of_access`: (Required for `purchaseType === 'course_purchase'`, if not centrally defined for the course/price)
    *   `isRenewal`: (Boolean, optional, for course renewals)

4.  **Validation in `create-payment-handler` (Backend Edge Function)**:
    *   Implement strict server-side validation for all incoming parameters from the client, especially `userId`, `purchaseType`, `targetStripePriceId`, and `courseId` (when applicable), before interacting with the Stripe API.
    *   Example: `if (!userId) throw new Error("User ID is required for payment processing");`

5.  **Error Handling Guidelines**:
    *   Frontend: Provide clear, user-friendly messages for card declines, payment processing errors, and other issues encountered during the checkout flow. Offer actionable next steps or ways to retry.
    *   Backend (`create-payment-handler`, `get-payment-status`): Log detailed errors from Stripe API calls and internal processing. Return appropriate HTTP status codes and structured error responses to the client.

**Architectural Considerations for Phase 4**:

*   **`SubscriptionProvider` (New Task)**: Implement a React Context (`SubscriptionProvider`) to centralize user subscription state (status, tier, loading, `current_period_end`, refresh function). This will simplify components needing this data and provide a single source of truth for subscription status. The provider will likely call a backend endpoint to fetch this data, which in turn uses centrally configured **Unlimited Tier Stripe Price IDs** (e.g., from environment variables like `STRIPE_UNLIMITED_TIER_PRICE_IDS="price_abc,price_def"` parsed by an Edge Function) to determine if a subscription grants full course access. (Detailed mechanism for `has_course_access` to be finalized in Phase 6).
*   **`CheckoutConfirmationPage` or Component (New Task)**: Create a dedicated page/component to handle the `return_url` from Stripe Elements. This component is responsible for the client-side status verification of PaymentIntents/SetupIntents as described in point #1 above.

**Tasks (Frontend Development)**:

1.  **Implement `SubscriptionProvider` (React Context)**:
    *   **Status**: `[Scaffolded]` - `useSubscription` hook and `SubscriptionProvider` context generated. `get-user-subscription` Edge Function generated. Requires integration and potentially wrapping relevant app sections.
    *   On mount, or when user auth state changes, fetch the user's current subscription details from a new backend endpoint (e.g., `/api/get-subscription-status`).
        *   This backend endpoint will query `public.user_subscriptions` for the user.
        *   It will also determine if the subscription tier (based on `stripe_price_id`) corresponds to an "Unlimited" tier by checking against a centrally managed list of Unlimited Tier Stripe Price IDs (e.g., read from an environment variable like `STRIPE_UNLIMITED_TIER_PRICE_IDS` by this endpoint).
    *   Provide state like `isActive`, `tierName` (e.g., 'Premium', 'Unlimited', 'Free'), `isLoading`, `current_period_end`, and a `refreshSubscription` function.
    *   Wrap relevant parts of the application (e.g., main layout, course pages) with this provider.

2.  **Create Backend `create-payment-handler` Edge Function**:
    *   **Status**: `[Generated]` - Function created at `supabase/functions/create-payment-handler/index.ts`. Requires deployment and client-side integration.
    *   **Security**: Ensure this function is callable only by authenticated users.
    *   **Input**: Accepts `userId` (verified from auth context), `targetStripePriceId`, `purchaseType`, `courseId` (if applicable), `stripeCustomerId` (optional, to reuse existing Stripe customer), `isRenewal` (optional).
    *   **Validation**: Strictly validate all inputs as per "Required Metadata Fields" and "Validation" requirements above.
    *   **Logic for Course Purchase (`purchaseType === 'course_purchase'`)**:
        *   Retrieve/Create Stripe Customer: Use `userId` to find or create a Stripe Customer. Store/update `stripe_customer_id` in `public.profiles`.
        *   Create Stripe `PaymentIntent`: Use `targetStripePriceId` (which defines amount and currency), `customer` (Stripe Customer ID), and populate `metadata` with all required fields (`userId`, `purchaseType`, `courseId`, `targetStripePriceId`, `isRenewal`, `days_of_access`).
        *   Return the `client_secret` of the PaymentIntent to the frontend.
    *   **Logic for New Subscription (`purchaseType === 'subscription'`)**:
        *   Retrieve/Create Stripe Customer (as above).
        *   Create Stripe `Subscription`: Use `customer` and `items: [{ price: targetStripePriceId }]`. Include `payment_settings: { save_default_payment_method: 'on_subscription' }`.
            *   Populate `subscription.metadata` with `userId`, `purchaseType`, `targetStripePriceId`.
            *   To handle the first payment or setup for trial: Set `payment_behavior: 'default_incomplete'` and `expand: ['latest_invoice.payment_intent']`. This ensures a PaymentIntent is created for the first invoice, whose `client_secret` can be used by the frontend.
            *   If it's a trial without immediate payment, you might lean towards a `SetupIntent` first, then create the subscription. (For now, assume subscriptions might have an initial payment or start immediately, thus `payment_behavior: 'default_incomplete'` is suitable).
        *   Return the `client_secret` from `subscription.latest_invoice.payment_intent.client_secret`.
    *   Ensure robust error handling and detailed logging.

3.  **Create Backend `get-payment-status` Edge Function (New Task)**:
    *   **Status**: `[Generated]` - Function created at `supabase/functions/get-payment-status/index.ts`. Requires deployment and client-side integration.
    *   **Security**: Ensure this function is callable only by authenticated users.
    *   **Input**: Accepts `payment_intent_id` or `setup_intent_id`.
    *   **Logic**: Uses the Stripe SDK server-side to call `stripe.paymentIntents.retrieve(id)` or `stripe.setupIntents.retrieve(id)`.
    *   **Output**: Returns a subset of the intent object, primarily the `status` and any relevant error information, to the client.

4.  **Implement Client-Side Checkout Logic (using Stripe.js and React Stripe.js)**:
    *   On checkout pages/modals (for courses or subscriptions):
        *   Initialize Stripe.js with your `VITE_STRIPE_PUBLISHABLE_KEY` (this should be chosen based on live/test mode, perhaps via an env var like `VITE_STRIPE_MODE === 'live' ? VITE_STRIPE_LIVE_PUBLISHABLE_KEY : VITE_STRIPE_TEST_PUBLISHABLE_KEY`).
        *   When user initiates payment: Call your `create-payment-handler` Edge Function to get the `client_secret`.
        *   If `client_secret` is received, wrap your payment form with the `<Elements>` provider from `@stripe/react-stripe-js`, passing the `client_secret` and Stripe instance options.
        *   Mount the `<PaymentElement />` (and optionally `<LinkAuthenticationElement />` for returning customers).
        *   Handle form submission using `stripe.confirmPayment({ elements, confirmParams: { return_url: 'YOUR_APP_DOMAIN/checkout-confirmation' } })`. (Adjust `return_url` path as needed).
        *   Handle any immediate errors from `stripe.confirmPayment()` (e.g., card validation errors) and display them to the user directly in the payment form.

5.  **Implement `CheckoutConfirmationPage` (or Component) at `YOUR_APP_DOMAIN/checkout-confirmation`**:
    *   **Status**: `[Generated]` - Skeleton component created at `src/pages/CheckoutConfirmationPage.tsx`. Requires routing setup and potentially UI refinement.
    *   This page is the `return_url` specified in `confirmParams`.
    *   On component mount:
        *   Extract `payment_intent_client_secret` or `setup_intent_client_secret` from URL query parameters.
        *   If a secret is found, call the `get-payment-status` backend Edge Function to fetch the latest intent status from Stripe.
        *   Based on the retrieved status:
            *   `succeeded`: Display a success message (e.g., "Payment successful! Your access has been granted/updated."). Optionally, `refreshSubscription()` from `SubscriptionProvider` if it was a subscription purchase.
            *   `processing`: Display a pending message (e.g., "Your payment is processing. We will notify you once confirmed.").
            *   `requires_payment_method` or other failure statuses: Display an error message (e.g., "Payment failed. Please try a different payment method or contact support."). Provide a link to go back to the payment form or pricing page.
        *   If no client_secret is in the URL, show an appropriate error or redirect.

6.  **UI for Course Purchases (Embedded Flow)**:
    *   On individual course pages:
        *   Use `SubscriptionProvider` and `has_course_access` (via a hook that calls a backend endpoint) to determine user's access status for *this specific course* and their overall subscription tier.
        *   Conditionally display: "Start Learning" button (if access granted), or a "Purchase Course for $X" / "Enroll via Unlimited Subscription" section.
        *   The "Purchase Course" button initiates the `create-payment-handler` flow (Task #2) for the course's `targetStripePriceId` and presents the embedded Stripe Payment Element modal/section.
        *   Display price. **Strategy**: Display price amounts from environment variables (e.g., `VITE_COURSE_XYZ_DISPLAY_PRICE="$49"`). The actual charge is determined by the `targetStripePriceId`.

7.  **UI for Subscription Signup (Embedded Flow)**:
    *   On a dedicated pricing/subscription page:
        *   Use `SubscriptionProvider` to display current plan (if any) and available tiers.
        *   For each available tier, display a "Subscribe" or "Upgrade" button.
        *   Clicking initiates the `create-payment-handler` flow (Task #2) for the tier's `targetStripePriceId` and presents the embedded Stripe Payment Element.
        *   Display price amounts from environment variables (e.g., `VITE_PREMIUM_MONTHLY_DISPLAY_PRICE="$10/month"`).

8.  **Displaying Subscription Status & Course Access (Leveraging `SubscriptionProvider` and backend checks)**:
    *   Across the application (e.g., navbars, course lists, content pages), use data from `SubscriptionProvider` to conditionally render UI elements.
    *   When attempting to access specific course content, components should re-verify access with a backend check if needed, beyond just relying on initially loaded `SubscriptionProvider` state, especially for sensitive actions.

**Testing & Verification for Phase 4**:

1.  **Subscription Signup Flow**:
    *   UI correctly displays subscription options, prices, and current plan (if any).
    *   User can select a tier; embedded payment form appears.
    *   Complete test payment (Stripe test cards for success, decline, 3DS).
    *   User is redirected to `checkout-confirmation` page. Page correctly fetches intent status from `get-payment-status` endpoint and displays appropriate (success/failure/pending) message.
    *   Webhook (Phase 3) processes `customer.subscription.created` and `invoice.payment_succeeded` correctly.
    *   `user_subscriptions` table in DB is updated.
    *   `SubscriptionProvider` state updates, and UI reflects new active subscription.
2.  **Course Purchase Flow**:
    *   UI correctly displays course purchase options and price; purchase button is conditional on existing access.
    *   User clicks purchase; embedded payment form appears.
    *   Complete test payment.
    *   User is redirected to `checkout-confirmation` page, which correctly verifies and displays status.
    *   Webhook (Phase 3) processes `payment_intent.succeeded`.
    *   `course_enrollments` table in DB is updated.
    *   UI (e.g., course page) now grants access to course content (verified via `has_course_access` logic).
3.  **Error Handling & Payment Failures**:
    *   Test card declines: UI shows Stripe-provided error directly in PaymentElement.
    *   Test other payment failures: `checkout-confirmation` page shows failure message after status check.
    *   Test cancelling out of Stripe authentication modals (e.g., 3D Secure); user returns to `checkout-confirmation` which should reflect the incomplete/failed status.
4.  **Access Control Logic (Frontend & Backend)**:
    *   Verify UI elements (buttons, links) are correctly gated based on `SubscriptionProvider` and `has_course_access` results.
    *   **Crucially**: Attempt to access course content URLs or trigger course-data-fetching API endpoints directly (e.g., using `curl` or Postman if API routes exist, or by manipulating frontend state to bypass UI button logic) as a user *without* access. These attempts **must be blocked by backend enforcement** which calls `has_course_access` or equivalent.
5.  **Metadata and Validation**:
    *   Use browser dev tools and backend logs to trace and verify all required metadata (`userId`, `purchaseType`, etc.) is correctly passed: Client -> `create-payment-handler` -> Stripe PaymentIntent/Subscription metadata -> Webhook processing.
    *   Test `create-payment-handler` by sending requests with missing required metadata to ensure server-side validation throws appropriate errors before calling Stripe.
6.  **Frontend Structure & Configuration**:
    *   Verify the correct Stripe Publishable Key (`VITE_STRIPE_PUBLISHABLE_KEY` or `VITE_STRIPE_LIVE_PUBLISHABLE_KEY`) is loaded and used by Stripe.js based on the application's mode (test/live).
    *   Inspect Stripe Elements integration for adherence to best practices (e.g., single `<Elements>` provider per checkout flow, error handling).
7.  **Edge Cases**:
    *   Test course renewal flow if `create-payment-handler` and UI support it.
    *   Test UI for users already subscribed to one tier when viewing options for another (e.g., clear indication of current plan, correct options for upgrade/downgrade if supported).
    *   Test behavior if `create-payment-handler` or `get-payment-status` endpoints fail (e.g., network error, server error) - UI should handle gracefully.

## Phase 5: Stripe Customer Portal Integration

**Objective**: Allow users to manage their subscriptions (update payment methods, cancel, view invoices) via the Stripe Customer Portal.

**Tasks**:

1.  **Configure Customer Portal in Stripe Dashboard**:
    *   Customize branding, allowed actions (e.g., allow plan changes, cancellations, payment method updates).
    *   Set up redirect URLs.
2.  **Backend Endpoint to Create Portal Session**:
    *   Create a Supabase Edge Function or backend API endpoint.
    *   This endpoint takes the authenticated `user_id`.
    *   Retrieves the `stripe_customer_id` from the `public.profiles` or `public.user_subscriptions` table for that user.
    *   Uses the Stripe SDK to create a Billing Portal session: `stripe.billingPortal.sessions.create({ customer: stripe_customer_id, return_url: 'your_app_settings_url' })`.
    *   Returns the `session.url` to the client.
    *   **Optional Enhancement**: Consider logging portal access events (e.g., session creation, user ID) for user support and debugging purposes.

3.  **Frontend Link to Portal**:
    *   In the user's account/settings page, provide a "Manage Subscription" or "Billing Portal" button/link.
    *   When clicked, this calls the backend endpoint from step 2 and redirects the user to the returned portal URL.

**Testing & Verification for Phase 5**:

1.  Click the "Manage Subscription" link in your application.
2.  Verify successful redirection to the Stripe Customer Portal (Test Mode).
3.  In the portal, test allowed actions:
    *   Update payment method (using Stripe's test cards).
    *   Cancel subscription (if you've configured it to be allowed directly).
    *   View invoice history.
4.  Verify any changes made in the portal (like a cancellation) trigger the appropriate webhooks (Phase 3) and update your database records correctly.

## Phase 6: Handling Subscription Lifecycle & Free Tier Reversion

**Objective**: Ensure the application correctly handles subscription cancellations, expiries, and reverts users to the Free Tier with associated message limits. Also, ensure course access logic is correctly checking for Unlimited Tier subscriptions.

**Tasks**:

1.  **Webhook Logic (Reinforce from Phase 3)**:
    *   `customer.subscription.deleted` or `customer.subscription.updated` (with status like `canceled` or `past_due` leading to cancellation): Ensure the `user_subscriptions.status` is set to a final inactive state (e.g., 'canceled', 'expired').

2.  **Application Logic for Access Control**:
    *   Your `has_course_access` function and other access checks should explicitly rely on: 
        * `user_subscriptions.status = 'active'` (or 'trialing') AND 
        * `user_subscriptions.current_period_end > NOW()`
    *   This combination properly handles the period between cancellation and actual subscription end.
    *   When a user's subscription is no longer active by these criteria, they are effectively "Free Tier."
    *   For 'past_due' status: Define explicit business rules for whether users retain access during Stripe's dunning process.

3.  **Message Limit Enforcement & UI Feedback**:
    *   The existing `get_user_message_count` function tracks monthly messages.
    *   Your application logic (likely in the chat feature) needs to:
        *   **Step 1**: Check if the user has an active *paid* subscription (Premium or Unlimited). This involves querying `public.user_subscriptions` for a record where `user_id = auth.uid()`, `status = 'active'`, `current_period_end > NOW()`, AND `stripe_price_id` matches one of the known Premium or Unlimited Price IDs (from env vars).
        *   **Step 2**: If **no** active paid subscription is found (i.e., user is effectively Free Tier), **then** call `public.get_user_message_count(auth.uid())`.
        *   **Step 3**: If the count from Step 2 is >= the defined limit (e.g., 10), block the user from sending a new message.
            *   **UX Note**: Implement a clear, informative, yet non-intrusive banner (e.g., `<UsageBanner />` component) at the top of the chat interface for Free Tier users. This banner should display current message usage (X of Y), provide an easy link to upgrade, and potentially use distinct styling if the limit is reached. Consider a progress bar for visual feedback. (Reference user-provided design draft and AI feedback for details).
            *   **Analytics Note**: Consider logging these blocked attempts (anonymously or tied to user ID if privacy policy allows) for analytics on feature demand and potential conversion triggers.
        *   The `increment_user_message_count` function should still be called for all user messages, regardless of tier, for tracking purposes.

4.  **Refine `has_course_access` Function:**
    *   **Action**: Review and modify the existing `public.has_course_access(user_id, course_id)` database function.
    *   **Required Change**: The part of the function that checks `user_subscriptions` needs to be updated. Instead of just checking for *any* active subscription, it must specifically check if the active subscription's `stripe_price_id` corresponds to an **Unlimited Tier** Price ID.
    *   **Implementation Approach**: Store the Stripe Price IDs in environment variables and pass these to the edge functions that need them. For database functions, determine the tier by matching against known Price IDs:
    
    ```sql
    CREATE OR REPLACE FUNCTION has_course_access(user_id uuid, course_id uuid)
    RETURNS BOOLEAN AS $$
    DECLARE
        unlimited_price_ids TEXT[] := ARRAY[
            /* These should be passed in or sourced from a database lookup */
            'price_unlimited_monthly', 
            'price_unlimited_annual'
        ];
    BEGIN
      RETURN EXISTS (
        -- Check for direct course enrollment
        SELECT 1 FROM public.course_enrollments 
        WHERE user_id = has_course_access.user_id 
          AND course_id = has_course_access.course_id
          AND expires_at > NOW()
      ) OR EXISTS (
        -- Check for Unlimited tier subscription specifically
        SELECT 1 FROM public.user_subscriptions
        WHERE user_id = has_course_access.user_id
          AND status = 'active'
          AND current_period_end > NOW()
          -- Check if the price ID matches any of the Unlimited tier prices
          AND stripe_price_id = ANY(unlimited_price_ids)
      );
    END;
    $$ LANGUAGE plpgsql;
    ```
    *   **Alternative Implementation**: Store pricing tier information in a separate database table that maps Stripe Price IDs to tier names/capabilities.

**Testing & Verification for Phase 6**:

1.  **Subscription Cancellation (via Portal or API if built)**:
    *   Cancel an active test subscription.
    *   Verify the webhook updates `user_subscriptions.status`.
    *   Verify the user loses access to premium features/all courses at the appropriate time (immediately or at period end, depending on Stripe settings and your webhook logic).
    *   Verify the user is now subject to the 10-message monthly limit in the chat. Send messages to test this.
2.  **Subscription Expiry (Simulate)**:
    *   Manually set `current_period_end` of an active test subscription in the database to a past date.
    *   Verify the user loses access and reverts to Free Tier message limits.
3.  **Transition from Paid to Free**:
    *   Ensure the UI correctly reflects the change in status (e.g., no "Premium" badge, course access revoked).
4.  **Payment Failure & Dunning Process**:
    *   Simulate an invoice payment failure (status changes to 'past_due').
    *   Verify access behavior during the dunning period matches business requirements.
    *   Simulate a successful retry and verify subscription status updates correctly.
    *   Simulate a failed dunning process (all retries failed) and verify subscription status becomes 'canceled'.
5.  **Access Control Function Testing**:
    *   Test the updated `has_course_access` function with various combinations:
        *   User with direct course enrollment - Should have access
        *   User with Unlimited tier subscription - Should have access to all courses
        *   User with Premium tier subscription - Should NOT have access to courses
        *   User with no subscription - Should have no access

## Phase 7: Course Renewal Flow (DEFERRED)

This phase is deferred from the initial MVP. Expired access to individually purchased courses will be handled by the user repurchasing the course via the standard purchase flow (Phase 4), which creates a new enrollment record.

## Phase 8: Final Testing and Refinement

**Objective**: Conduct end-to-end testing of all flows and refine based on findings.

**Tasks**:

1.  **Full User Journeys**:
    *   New user signs up -> Free Tier -> Purchases a course.
    *   New user signs up -> Free Tier -> Subscribes to Premium.
    *   New user signs up -> Free Tier -> Subscribes to Unlimited.
    *   Existing Premium user upgrades to Unlimited (if plan change is allowed via portal/custom UI).
    *   User with course purchase subscribes to Unlimited.
    *   User cancels subscription -> Reverts to Free.
    *   User's course enrollment expires -> Loses access.
2.  **Edge Cases**:
    *   Payment failures during checkout.
    *   Webhook delivery failures/retries (Stripe dashboard helps monitor this).
    *   Concurrent actions.
3.  **Review All RLS and Security Settings.**
4.  **Check Logs for any errors.**

## Phase 8.5: RLS Policy Verification and Update

**Objective**: Ensure database-level Row Level Security (RLS) policies enforce the same entitlement-based course access control that we've implemented at the application level.

**Tasks**:

1. **Audit Existing RLS Policies**:
   * Review current RLS policies on course-related tables (`courses`, `course_enrollments`, `modules`, `lessons`).
   * Document gaps between the entitlement logic in CourseAccessGuard and database-enforced access control.

2. **Create or Update Database Function for Course Access**:
   * **Action**: Create a reusable Postgres function that serves as a single source of truth for course access.
   * **SQL**:
     ```sql
     CREATE OR REPLACE FUNCTION public.has_course_access(course_id UUID)
     RETURNS BOOLEAN
     LANGUAGE plpgsql SECURITY DEFINER
     SET search_path = public
     AS $$
     DECLARE
         unlimited_price_ids TEXT[] := ARRAY[
             /* These should match the values used in the application */
             'price_unlimited_monthly', 
             'price_unlimited_annual'
         ];
     BEGIN
       RETURN EXISTS (
         -- Check for direct course enrollment
         SELECT 1 FROM public.course_enrollments 
         WHERE user_id = auth.uid() 
           AND course_id = has_course_access.course_id
           AND status = 'active'
           AND expires_at > NOW()
       ) OR EXISTS (
         -- Check for Unlimited tier subscription
         SELECT 1 FROM public.user_subscriptions
         WHERE user_id = auth.uid()
           AND status = 'active'
           AND current_period_end > NOW()
           AND stripe_price_id = ANY(unlimited_price_ids)
       );
     END;
     $$;
     ```

3. **Update RLS Policies for Course Content**:
   * **Action**: Apply consistent RLS policies across all course-related tables using the `has_course_access` function.
   * **For `courses` Table**:
     ```sql
     -- Allow any authenticated user to view courses (basic metadata)
     CREATE POLICY "courses_select_for_authenticated" ON "courses"
     FOR SELECT TO authenticated
     USING (true);
     
     -- Enable admins to manage courses
     CREATE POLICY "courses_all_for_admins" ON "courses"
     FOR ALL TO authenticated
     USING (is_admin(auth.uid()));
     ```

   * **For `modules` Table**:
     ```sql
     -- Allow viewing modules for courses the user has access to
     CREATE POLICY "modules_select_if_has_course_access" ON "modules"
     FOR SELECT TO authenticated
     USING (has_course_access(course_id));
     
     -- Enable admins to manage modules
     CREATE POLICY "modules_all_for_admins" ON "modules"
     FOR ALL TO authenticated
     USING (is_admin(auth.uid()));
     ```

   * **For `lessons` Table**:
     ```sql
     -- Allow viewing lessons for modules in courses the user has access to
     CREATE POLICY "lessons_select_if_has_course_access" ON "lessons"
     FOR SELECT TO authenticated
     USING (
       has_course_access(
         (SELECT course_id FROM modules WHERE id = module_id)
       )
     );
     
     -- Enable admins to manage lessons
     CREATE POLICY "lessons_all_for_admins" ON "lessons"
     FOR ALL TO authenticated
     USING (is_admin(auth.uid()));
     ```

   * **For `course_enrollments` Table**:
     ```sql
     -- Allow users to view their own enrollments
     CREATE POLICY "course_enrollments_select_own" ON "course_enrollments"
     FOR SELECT TO authenticated
     USING (user_id = auth.uid());
     
     -- Allow service_role to manage enrollments (for webhook processing)
     CREATE POLICY "course_enrollments_all_for_service_role" ON "course_enrollments"
     FOR ALL TO service_role
     USING (true);
     
     -- Enable admins to manage all enrollments
     CREATE POLICY "course_enrollments_all_for_admins" ON "course_enrollments"
     FOR ALL TO authenticated
     USING (is_admin(auth.uid()));
     ```

4. **Test RLS Policies**:
   * Test direct API/SQL access to course content as different user types:
     * Users with direct course enrollment
     * Users with Unlimited subscription
     * Users with Premium subscription (should NOT have course access)
     * Users with no subscription
     * Admins
   * Attempt to bypass application-level guards by making direct Supabase client queries to protected content.
   * Verify that queries respect the same entitlement rules implemented in CourseAccessGuard.

**Testing & Verification**:

1. Create test users with different access scenarios (enrolled in specific course, Unlimited subscription, no access).
2. Directly query course content tables via SQL while authenticated as each test user.
3. Verify access is granted/denied according to expected entitlements.
4. Test edge cases like expired enrollments and canceled subscriptions.
5. Ensure the access control logic is identical between application-level guards and database-level policies.

**Important Note**: This phase ensures defense-in-depth by enforcing access control at both the application and database levels. Even if a client bypasses the frontend CourseAccessGuard, they will be unable to fetch unauthorized content due to RLS policies.

## Phase 9: Cleanup (Post-Stabilization)

**Objective**: Ensure the codebase and Supabase project are clean and free of deprecated artifacts.

**Tasks**:

1.  **Remove `supabase/functions_downloaded/` directory**:
    *   **Action**: Once all relevant logic from the downloaded functions has been successfully integrated into the primary functions (e.g., `supabase/functions/stripe-webhook`, `supabase/functions/create-payment-handler`) and the new system is stable and thoroughly tested, delete the `supabase/functions_downloaded/` directory from your project repository.
2.  **Identify and Remove Unused/Deprecated Edge Functions**:
    *   **Action**: Review all functions deployed to your Supabase project (via `supabase functions list`) and within your `supabase/functions/` directory.
    *   Identify any functions that are no longer used or have been superseded by the new implementation.
    *   Securely undeploy and delete these functions from Supabase and remove their code from the repository.

**Testing & Verification for Phase 9**:

1.  Confirm the application continues to function correctly after removing the `supabase/functions_downloaded/` directory.
2.  Verify that only necessary and active Edge Functions are deployed and present in the codebase.
3.  Ensure no critical functionality was accidentally removed.

## Future Considerations (Post-MVP)
*   **Subscription Proration Logic**: For handling upgrades/downgrades between tiers (e.g., Premium to Unlimited mid-cycle), understand and implement logic for Stripe's proration behavior.
*   **Partial Refund Handling**: If customer support scenarios require partial refunds for courses or subscriptions, the webhook might need to handle `charge.refunded` events to update access or records accordingly.
*   **In-app Selection of Saved Payment Methods**: For new one-time purchases, allowing users to select a previously saved card (managed via Stripe Customer object) directly within the embedded checkout form, rather than always re-entering details. This would require extending the `create-payment-handler`.
*   **Multi-Course Bundling**: If you plan to offer bundles of courses for a single price in the future, the schema and logic might need adjustments (e.g., a new `bundles` table and linking enrollments to bundles or individual courses within a bundle).
*   **Custom UI for subscription upgrades/downgrades**: If the Stripe Customer Portal doesn't meet all future needs for managing plan changes, a custom in-app interface might be considered.
*   **Internationalization (i18n)**: Implement full internationalization support for multilingual users using react-i18next.


</rewritten_file> 