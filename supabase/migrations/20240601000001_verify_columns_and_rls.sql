-- Verification script for Phase 1 database changes

-- Check if columns were added successfully
DO $$
DECLARE
  user_subs_price_id_exists BOOLEAN;
  course_enroll_price_id_exists BOOLEAN;
  course_enroll_payment_intent_id_exists BOOLEAN;
BEGIN
  -- Check user_subscriptions.stripe_price_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'stripe_price_id'
  ) INTO user_subs_price_id_exists;

  -- Check course_enrollments.stripe_price_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_enrollments' 
    AND column_name = 'stripe_price_id'
  ) INTO course_enroll_price_id_exists;

  -- Check course_enrollments.stripe_payment_intent_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_enrollments' 
    AND column_name = 'stripe_payment_intent_id'
  ) INTO course_enroll_payment_intent_id_exists;

  -- Output results
  RAISE NOTICE 'Column verification:';
  RAISE NOTICE '  user_subscriptions.stripe_price_id exists: %', user_subs_price_id_exists;
  RAISE NOTICE '  course_enrollments.stripe_price_id exists: %', course_enroll_price_id_exists;
  RAISE NOTICE '  course_enrollments.stripe_payment_intent_id exists: %', course_enroll_payment_intent_id_exists;
END $$;

-- Verify RLS Policies
-- No changes needed to RLS policies for user_subscriptions:
-- 1. "Admins can view all subscriptions" - Admins/service role can view all
-- 2. "Only service role can insert/update/delete subscriptions" - Only service role can modify
-- 3. "Users can view their own subscriptions" - Users can view their own

-- No changes needed to RLS policies for course_enrollments:
-- 1. "Admins can manage all enrollments" - Admins can perform all operations
-- 2. "Users can create their own enrollments" - Users can create their own
-- 3. "Users can update their own enrollments" - Users can update their own
-- 4. "Users can view their own course enrollments" - Users can view their own

-- These existing policies will automatically apply to the new columns,
-- so no policy modifications are needed.

-- NOTE: Make sure stripe_payment_intent_id has a UNIQUE constraint for idempotency
-- This was added in the initial migration with:
-- ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE; 