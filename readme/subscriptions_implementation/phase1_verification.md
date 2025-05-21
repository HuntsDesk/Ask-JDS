# Phase 1 Verification

Due to CLI issues, we need to verify the Phase 1 changes manually through the Supabase Studio interface.

## Steps to Verify Phase 1 Columns

1. Log in to your Supabase dashboard at [https://app.supabase.io/](https://app.supabase.io/)
2. Select your project
3. Go to the SQL Editor
4. Run the following SQL to check if the columns exist:

```sql
-- Check if Phase 1 columns exist
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  (table_name = 'user_subscriptions' AND column_name = 'stripe_price_id') OR
  (table_name = 'course_enrollments' AND column_name IN ('stripe_price_id', 'stripe_payment_intent_id'))
ORDER BY 
  table_name, 
  column_name;
```

5. If no rows are returned, you need to run the column addition SQL:

```sql
-- Add stripe_price_id to user_subscriptions table
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

COMMENT ON COLUMN public.user_subscriptions.stripe_price_id IS 'Stores the Stripe Price ID associated with this specific subscription instance (e.g., price_xxxxxxxxxxxxxx).';

-- Add stripe_price_id to course_enrollments table
ALTER TABLE public.course_enrollments
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

COMMENT ON COLUMN public.course_enrollments.stripe_price_id IS 'Stores the Stripe Price ID used for this specific course enrollment transaction (e.g., price_xxxxxxxxxxxxxx). Important if course prices change or discounts are offered via different Price IDs.';

-- Add stripe_payment_intent_id to course_enrollments table for Webhook Idempotency
ALTER TABLE public.course_enrollments
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE;

COMMENT ON COLUMN public.course_enrollments.stripe_payment_intent_id IS 'Stores the Stripe Payment Intent ID to prevent duplicate enrollments from webhook events (idempotency).';
```

6. Update the `has_course_access` function:

```sql
-- Create or replace the has_course_access function with updated logic
CREATE OR REPLACE FUNCTION has_course_access(user_id uuid, course_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
    -- Constants for subscription tiers with Stripe Price IDs
    -- These should be configured to match your actual Stripe Price IDs
    unlimited_tier_price_ids TEXT[] := ARRAY[
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
          AND stripe_price_id = ANY(unlimited_tier_price_ids)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

7. Finally, verify the changes by running the check query again.

## Environment Variable Verification

The required environment variables appear to be already set in your `.env` file:

- `STRIPE_LIVE_UNLIMITED_MONTHLY_PRICE_ID`
- `STRIPE_LIVE_UNLIMITED_ANNUAL_PRICE_ID`
- `STRIPE_LIVE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID`
- `STRIPE_LIVE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID`
- `STRIPE_UNLIMITED_MONTHLY_PRICE_ID`
- `STRIPE_UNLIMITED_ANNUAL_PRICE_ID`
- `STRIPE_ASKJDS_PREMIUM_MONTHLY_PRICE_ID`
- `STRIPE_ASKJDS_PREMIUM_ANNUAL_PRICE_ID`

## Next Steps

Once you've verified the columns exist, you can proceed to Phase 2: Stripe Product & Price Configuration. 