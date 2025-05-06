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

3.  **Review/Update RLS Policies (if necessary):**
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

**Tasks**:

1.  **Basic Setup & Security**:
    *   Ensure the function uses `Deno.serve`.
    *   Retrieve the Stripe webhook secret from environment variables (`STRIPE_TEST_WEBHOOK_SECRET` or `STRIPE_LIVE_WEBHOOK_SECRET` based on the environment).
    *   Verify the Stripe signature for every incoming event to ensure authenticity. Reject requests with invalid signatures.
    *   Initialize the Supabase client using service role key for database operations.

2.  **Define Consistent Metadata Keys**:
    *   **Action**: Establish a consistent set of metadata keys used when creating Stripe Checkout sessions and expected by this webhook. Document these, possibly in a shared constants file if developing across multiple functions.
    *   **Essential Keys (Examples)**:
        *   `userId` (Supabase Auth User ID)
        *   `targetStripePriceId` (The Stripe Price ID for the item being purchased/subscribed to)
        *   `purchaseType` (e.g., 'subscription', 'course_purchase')
        *   `courseId` (Internal Course ID, if `purchaseType` is 'course_purchase')
        *   `isRenewal` (boolean, if applicable for course purchases)
        *   `successUrl`, `cancelUrl` (though these are top-level checkout session params, sometimes useful in metadata for context)
    *   **Rationale**: Ensures reliable data transfer from checkout initiation to webhook processing.

3.  **Handle `payment_intent.succeeded`**:
    *   This event confirms a successful payment.
    *   **Metadata**: The `payment_intent.metadata` should contain `userId`, `purchaseType`, `targetStripePriceId`, `courseId` (if applicable), `isRenewal` (if applicable).
    *   **For One-Time Course Purchases (`metadata.purchaseType === 'course_purchase'`)**:
        *   Extract `userId`, `courseId`, `targetStripePriceId` from metadata.
        *   Query the `courses` table to get `days_of_access` for the `courseId`.
        *   Calculate `expires_at` (NOW() + `days_of_access`).
        *   Insert into `public.course_enrollments` (ensure idempotency, e.g., check if already processed based on `payment_intent.id`):
            *   `user_id` = `userId`
            *   `course_id` = `courseId`
            *   `stripe_price_id` = `targetStripePriceId`
            *   `enrolled_at` = NOW()
            *   `expires_at` = calculated expiration
            *   `status` = 'active'
            *   `renewal_count` = (if `metadata.isRenewal`, increment existing or set to 1, else 0)
        *   Update `profiles.stripe_customer_id` with `payment_intent.customer` if not already set.
    *   **For Initial Subscription Payment (`metadata.purchaseType === 'subscription'`)**:
        *   This might confirm the first payment of a subscription. The actual subscription record might be created/updated more reliably via `customer.subscription.created/updated` or `invoice.payment_succeeded` for the first invoice.
        *   Can be used as a trigger to ensure the user profile has the `stripe_customer_id` (`payment_intent.customer`).
        *   Log this event and correlate with subscription events.

4.  **Handle `customer.subscription.created` and `customer.subscription.updated`**:
    *   `customer.subscription.created`: Typically fires when a new subscription is successfully set up.
    *   `customer.subscription.updated`: Fires for various changes including plan changes, trial ending, status changes.
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
    *   **Identify Context**: Check `invoice.billing_reason` (e.g., 'subscription_create', 'subscription_cycle', 'subscription_update').
    *   **Metadata**: `invoice.subscription_details.metadata` or `invoice.metadata` might contain your `userId` if set during subscription creation.
    *   **Action**: Primarily for subscriptions. If `invoice.subscription` (the Stripe Subscription ID) is present:
        *   Update `public.user_subscriptions` for the given `stripe_subscription_id`:
            *   `status` = 'active' (if not already)
            *   `current_period_end` = `invoice.lines.data[0].period.end` (or `subscription.current_period_end` from the associated subscription object)
            *   `stripe_price_id` = `invoice.lines.data[0].price.id`.
        *   This is where you reliably activate/extend a subscription period.

6.  **Handle `customer.subscription.deleted` (Cancellation)**:
    *   This fires when a subscription is canceled (either immediately or at period end).
    *   Update the `public.user_subscriptions` record:
        *   Set `status` to 'canceled' or 'inactive'.
        *   If `cancel_at_period_end` was true, the subscription might still be active until `current_period_end`. The status should reflect this (e.g., keep 'active' but note `cancel_at_period_end` is true). The final "inactive" update might come when the period actually ends, or you handle it based on `current_period_end` in your app logic.
    *   **Logic**: User reverts to "Free Tier". No specific database change for this beyond the subscription status, as "Free Tier" is the absence of an active paid subscription. Message limits will apply based on `get_user_message_count` and application logic.

7.  **Idempotency**: Ensure your webhook logic is idempotent. Stripe may send the same event multiple times. Design updates/inserts to handle this gracefully (e.g., using `ON CONFLICT` for inserts, or checking if an update is actually needed before performing it).

8.  **Error Handling & Logging**:
    *   Robustly log errors.
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
5.  **Security**:
    *   Test with an invalid Stripe signature; verify the webhook rejects it.
6.  **Idempotency**: Send the same event twice; verify it doesn't create duplicate records or fail.
7.  **Logging**: Check Supabase function logs for errors and successful processing messages.

## Phase 4: Frontend - Self-Hosted Checkout with Stripe Payment Elements

**Objective**: Implement frontend components and logic for a self-hosted (embedded) checkout experience using Stripe Payment Elements, providing a seamless payment process within the application.

**Tasks (Frontend Development)**:

1.  **Create PaymentIntents/SetupIntents (via a Backend Endpoint)**:
    *   **Action**: Implement client-side logic to call a dedicated backend Edge Function (e.g., `create-payment-handler`). This function will be responsible for creating Stripe `PaymentIntents` (for immediate payments) or `SetupIntents` (for saving cards/setting up future payments, e.g., for subscription trials).
    *   **Backend Edge Function Design (e.g., `create-payment-handler`)**:
        *   **Starting Point**: This is a key function. Review and **strongly consider refactoring/basing this on `supabase/functions_downloaded/create-payment-intent/index.ts`** as it likely contains relevant logic for creating PaymentIntents and handling metadata.
        *   This function must securely use the Stripe SDK (with the appropriate Stripe Secret Key).
        *   **Parameters it should accept from the client** (ensure these align with metadata defined in Phase 3, Task 2):
            *   `userId` (authenticated user's ID)
            *   `targetStripePriceId` (the specific Stripe Price ID for the subscription or course)
            *   `purchaseType` (e.g., 'subscription' or 'course_purchase')
            *   `courseId` (your internal course ID, if `purchaseType` is 'course_purchase')
            *   `stripeCustomerId` (optional, pass if known to Stripe, otherwise the function can create/retrieve it)
            *   `isRenewal` (boolean, optional, for course renewals)
            *   `paymentMethodId` (optional, if reusing a saved payment method)
        *   **Function Logic for Course Purchase (`purchaseType === 'course_purchase'`)**:
            *   Retrieve/Create Stripe Customer for `userId` (store/update `stripe_customer_id` in `profiles`).
            *   Fetch course price details from Stripe using `targetStripePriceId` to get the amount.
            *   Create a Stripe `PaymentIntent` with amount, currency, `customer` (Stripe Customer ID), and populate `metadata` with `userId`, `targetStripePriceId`, `purchaseType`, `courseId`, `isRenewal`.
            *   Return the `client_secret` of the PaymentIntent to the frontend.
        *   **Function Logic for New Subscription (`purchaseType === 'subscription'`)**:
            *   Retrieve/Create Stripe Customer for `userId`.
            *   Create a Stripe `Subscription` with the `customer` and `items: [{ price: targetStripePriceId }]`.
                *   Crucially, include `userId` in `subscription.metadata`.
                *   Set `payment_behavior: 'default_incomplete'` and `expand: ['latest_invoice.payment_intent']` if the first payment needs to be captured immediately via a PaymentIntent.
                *   Or, configure a `trial_period_days` if starting with a trial, in which case you might create a `SetupIntent` to save payment method: `stripe.setupIntents.create({ customer, payment_method_types: ['card'], metadata: {...} })`.
            *   Return the `client_secret` from `subscription.latest_invoice.payment_intent.client_secret` (for immediate payment) or `setupIntent.client_secret` (for trials).
    *   **Client-side Logic (Using `@stripe/react-stripe-js`, `@stripe/stripe-js`)**:
        *   On your checkout page/modal:
            *   Initialize Stripe.js with your publishable key.
            *   When the user proceeds to pay, call your `create-payment-handler` Edge Function to get the `client_secret`.
            *   Wrap your payment form with the `<Elements>` provider from `@stripe/react-stripe-js`, passing the `client_secret` and Stripe instance.
            *   Mount the `<PaymentElement />` (and optionally `<LinkAuthenticationElement />`).
            *   Handle form submission using `stripe.confirmPayment({ elements, confirmParams: { return_url: 'your_order_confirmation_page_url' } })` for PaymentIntents, or `stripe.confirmSetup()` for SetupIntents.
            *   The `return_url` will be invoked by Stripe after the user attempts payment (or completes 3D Secure). Your page at this URL should check the status of the PaymentIntent/SetupIntent to show a success/failure message. The webhook will handle backend fulfillment.

2.  **UI for Course Purchases (Embedded Flow)**:
    *   On course pages, a "Purchase Course" button. Clicking this should open a modal or navigate to an in-app checkout page where the Stripe Payment Element is displayed.
    *   Initiates the `create-payment-handler` flow for the specific course's `targetStripePriceId`.

3.  **UI for Subscription Signup (Embedded Flow)**:
    *   On a pricing/subscription page, "Subscribe" buttons for tiers.
    *   Clicking initiates the `create-payment-handler` flow for the corresponding subscription `targetStripePriceId`, which will set up the PaymentIntent/SetupIntent for the subscription.

4.  **Displaying Subscription Status & Course Access**:
    *   Fetch user's active subscription from `user_subscriptions` (via an RPC or API call).
    *   Fetch user's active course enrollments from `course_enrollments`.
    *   Conditionally render UI based on access (e.g., "Start Learning" vs. "Purchase", show "Premium Content" banners).
    *   Use the `has_course_access(user_id, course_id)` database function.

**Testing & Verification for Phase 4**:

1.  **Subscription Signup Flow**:
    *   From the UI, attempt to subscribe to the Premium tier. Verify redirection to Stripe Checkout.
    *   Complete a test payment using Stripe test cards.
    *   Verify redirection to `success_url`.
    *   Verify the webhook (Phase 3) processed the event correctly and the `user_subscriptions` table reflects the new subscription.
    *   Verify the UI now shows the user as subscribed to Premium.
    *   Test the same for the Unlimited tier.
2.  **Course Purchase Flow**:
    *   From a course page, attempt to purchase the course. Verify redirection to Stripe Checkout.
    *   Complete a test payment.
    *   Verify redirection to `success_url`.
    *   Verify the webhook processed the event and `course_enrollments` table reflects the purchase.
    *   Verify the UI now grants access to the course content.
3.  **Error Handling**: Test what happens if Checkout is cancelled.
4.  **Access Control**: Verify that content is correctly gated based on subscription/enrollment status.

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

**Objective**: Ensure the application correctly handles subscription cancellations, expiries, and reverts users to the Free Tier with associated message limits.

**Tasks**:

1.  **Webhook Logic (Reinforce from Phase 3)**:
    *   `customer.subscription.deleted` or `customer.subscription.updated` (with status like `canceled` or `past_due` leading to cancellation): Ensure the `user_subscriptions.status` is set to a final inactive state (e.g., 'canceled', 'expired').
2.  **Application Logic for Access Control**:
    *   Your `has_course_access` function and other access checks should rely on `user_subscriptions.status = 'active'` (or 'trialing') AND `user_subscriptions.current_period_end > NOW()`.
    *   When a user's subscription is no longer active by these criteria, they are effectively "Free Tier."
3.  **Message Limit Enforcement & UI Feedback**:
    *   The existing `get_user_message_count` function tracks monthly messages.
    *   Your application logic (likely in the chat feature) needs to:
        *   Check if the user has an active paid subscription (Premium or Unlimited).
        *   If NOT, then check `get_user_message_count(auth.uid())`. If it's >= 10 (or your defined limit), disallow sending new messages.
            *   **UX Note**: Implement a clear, informative, yet non-intrusive banner (e.g., `<UsageBanner />` component) at the top of the chat interface for Free Tier users. This banner should display current message usage (X of Y), provide an easy link to upgrade, and potentially use distinct styling if the limit is reached. Consider a progress bar for visual feedback. (Reference user-provided design draft and AI feedback for details).
            *   **Analytics Note**: Consider logging these blocked attempts (anonymously or tied to user ID if privacy policy allows) for analytics on feature demand and potential conversion triggers.
        *   The `increment_user_message_count` function should still be called for all user messages, regardless of tier, for tracking purposes.

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

## Phase 7: Course Renewal Flow (Conceptual - If Implementing Custom Renewals)

**Objective**: Allow users to renew/extend access to individually purchased courses. (If using Stripe Customer Portal for everything, this might be simpler or handled by new purchases). The `readme/archive/enrollments.md` mentions `createCourseRenewalCheckout`.

**Tasks (Frontend & Backend if custom renewal is needed)**:

1.  **UI for Renewal**:
    *   If a `course_enrollment` is nearing `expires_at` (or has expired), show a "Renew Access" button.
2.  **Backend for Renewal Checkout**:
    *   This would use the same consolidated `create-checkout-session` Edge Function from Phase 4.
    *   **Parameters to send**:
        *   `targetStripePriceId` (original or current price ID for the course).
        *   `purchaseType`: 'course_purchase'.
        *   `courseId`.
        *   `isRenewal`: `true`.
        *   `existingEnrollmentId` (optional, if needed by webhook to locate the exact enrollment, though `userId` and `courseId` might be sufficient).
    *   **Starting Point**: Investigate adapting any renewal-specific logic if present in `supabase/functions_downloaded/create-payment-intent/index.ts`, ensuring it aligns with the `PaymentIntent` flow.
3.  **Webhook Handling for Renewals**:
    *   When `payment_intent.succeeded` with `metadata.isRenewal: true` and relevant `courseId` is received:
        *   Find the existing `course_enrollments` record.
        *   Update its `expires_at` by adding `days_of_access` to the *current `expires_at`* (if renewing before expiry) or to *NOW()* (if renewing after expiry).
        *   Increment `renewal_count`.
        *   Reset notification flags (`notification_7day_sent`, `notification_1day_sent`).

**Testing & Verification for Phase 7**:

1.  For an enrolled course nearing expiration, click "Renew Access."
2.  Complete the test Stripe Checkout.
3.  Verify the webhook updates the existing `course_enrollments` record's `expires_at` and `renewal_count`, rather than creating a new enrollment.
4.  Verify continued access to the course.

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

## Future Considerations (Post-MVP)
*   **Subscription Proration Logic**: For handling upgrades/downgrades between tiers (e.g., Premium to Unlimited mid-cycle), understand and implement logic for Stripe's proration behavior.
*   **Partial Refund Handling**: If customer support scenarios require partial refunds for courses or subscriptions, the webhook might need to handle `charge.refunded` events to update access or records accordingly.
*   **Multi-Course Bundling**: If you plan to offer bundles of courses for a single price in the future, the schema and logic might need adjustments (e.g., a new `bundles` table and linking enrollments to bundles or individual courses within a bundle).
*   **Custom UI for subscription upgrades/downgrades**: If the Stripe Customer Portal doesn't meet all future needs for managing plan changes, a custom in-app interface might be considered.

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


</rewritten_file> 