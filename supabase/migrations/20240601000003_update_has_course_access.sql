-- This migration updates the has_course_access function to check for Unlimited tier subscriptions specifically
-- Note: This is preparation for Phase 6 but makes sense to include with the schema changes

-- Store the existing function definition for reference
DO $$
BEGIN
  RAISE NOTICE 'Current has_course_access function definition:';
  RAISE NOTICE '%', pg_get_functiondef('has_course_access(uuid, uuid)'::regprocedure);
END $$;

-- Create or replace the has_course_access function with updated logic
CREATE OR REPLACE FUNCTION has_course_access(user_id uuid, course_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
    -- These should match your environment variables in a production setting.
    -- For the migration, we're hardcoding them, but they will be checked dynamically
    -- against the actual subscription price_id values.
    unlimited_price_ids TEXT[] := ARRAY[
        'price_unlimited_monthly', 
        'price_unlimited_annual'
    ];
BEGIN
  RETURN EXISTS (
    -- Check for direct course enrollment (unchanged logic)
    SELECT 1 FROM public.course_enrollments 
    WHERE user_id = has_course_access.user_id 
      AND course_id = has_course_access.course_id
      AND expires_at > NOW()
      AND status = 'active'
  ) OR EXISTS (
    -- Check for Unlimited tier subscription specifically
    -- This used to check for ANY active subscription but now checks for Unlimited tier only
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = has_course_access.user_id
      AND status = 'active'
      AND current_period_end > NOW()
      -- Check if the price ID matches any of the Unlimited tier prices
      AND (
        stripe_price_id = ANY(unlimited_price_ids)
        -- Fallback for subscriptions migrated before stripe_price_id was added
        -- Remove this condition after migration is complete and all subscriptions have price IDs
        OR (
          stripe_price_id IS NULL AND
          (current_setting('app.unlimited_subscription_fallback', TRUE)::boolean IS TRUE)
        )
      )
  );
END;
$$ LANGUAGE plpgsql;

-- Test the updated function
DO $$
DECLARE
  test_user_id UUID;
  test_course_id UUID;
  has_access BOOLEAN;
BEGIN
  -- Only run in dev/test environments
  IF current_setting('app.environment', TRUE) != 'development' THEN
    RAISE NOTICE 'Skipping tests: not in development environment';
    RETURN;
  END IF;
  
  -- Get a random user ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  -- Get a random course ID
  SELECT id INTO test_course_id FROM public.courses LIMIT 1;
  
  IF test_user_id IS NULL OR test_course_id IS NULL THEN
    RAISE NOTICE 'Skipping test_has_course_access: missing test data';
    RETURN;
  END IF;
  
  -- Test the function
  SELECT has_course_access(test_user_id, test_course_id) INTO has_access;
  
  RAISE NOTICE 'has_course_access(%, %) = %', 
               test_user_id, test_course_id, has_access;
END $$; 