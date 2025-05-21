-- TEST SCRIPT: Only run this in development/testing environments
-- This script tests the new columns by inserting sample data

-- Function to test the changes
CREATE OR REPLACE FUNCTION test_stripe_price_id_columns()
RETURNS TEXT AS $$
DECLARE
  test_user_id UUID;
  test_course_id UUID;
  sub_id UUID;
  enrollment_id UUID;
  test_result TEXT;
BEGIN
  -- Only run in dev/test environments
  IF current_setting('app.environment', TRUE) != 'development' THEN
    RETURN 'Skipping tests: not in development environment';
  END IF;
  
  -- Get a random user ID from the auth.users table (or create one if needed)
  BEGIN
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
      RAISE NOTICE 'No test user found, test will be skipped';
      RETURN 'No test user found';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error getting test user: %', SQLERRM;
    RETURN 'Error getting test user';
  END;
  
  -- Get a random course ID (or create one if needed)
  BEGIN
    SELECT id INTO test_course_id FROM public.courses LIMIT 1;
    
    IF test_course_id IS NULL THEN
      RAISE NOTICE 'No test course found, test will be skipped';
      RETURN 'No test course found';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error getting test course: %', SQLERRM;
    RETURN 'Error getting test course';
  END;
  
  -- Test 1: Insert into user_subscriptions with stripe_price_id
  BEGIN
    INSERT INTO public.user_subscriptions (
      user_id,
      status,
      current_period_end,
      cancel_at_period_end,
      created_at,
      updated_at,
      stripe_price_id
    ) VALUES (
      test_user_id,
      'active',
      NOW() + INTERVAL '30 days',
      FALSE,
      NOW(),
      NOW(),
      'price_test_subscription_123'
    ) RETURNING id INTO sub_id;
    
    -- Verify insertion
    IF sub_id IS NULL THEN
      RETURN 'Failed to insert test subscription';
    END IF;
    
    RAISE NOTICE 'Test subscription inserted with id: %', sub_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting test subscription: %', SQLERRM;
    RETURN 'Error inserting test subscription: ' || SQLERRM;
  END;
  
  -- Test 2: Insert into course_enrollments with stripe_price_id and stripe_payment_intent_id
  BEGIN
    INSERT INTO public.course_enrollments (
      user_id,
      course_id,
      enrolled_at,
      expires_at,
      status,
      created_at,
      updated_at,
      stripe_price_id,
      stripe_payment_intent_id
    ) VALUES (
      test_user_id,
      test_course_id,
      NOW(),
      NOW() + INTERVAL '30 days',
      'active',
      NOW(),
      NOW(),
      'price_test_course_456',
      'pi_test_payment_intent_789'
    ) RETURNING id INTO enrollment_id;
    
    -- Verify insertion
    IF enrollment_id IS NULL THEN
      RETURN 'Failed to insert test enrollment';
    END IF;
    
    RAISE NOTICE 'Test enrollment inserted with id: %', enrollment_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting test enrollment: %', SQLERRM;
    RETURN 'Error inserting test enrollment: ' || SQLERRM;
  END;
  
  -- Test 3: Query the inserted data to verify
  BEGIN
    SELECT 
      'Tests passed: ' || 
      'subscription.stripe_price_id=' || s.stripe_price_id || ', ' ||
      'enrollment.stripe_price_id=' || e.stripe_price_id || ', ' ||
      'enrollment.stripe_payment_intent_id=' || e.stripe_payment_intent_id
    INTO test_result
    FROM public.user_subscriptions s, public.course_enrollments e
    WHERE s.id = sub_id AND e.id = enrollment_id;
    
    RETURN test_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error verifying test data: %', SQLERRM;
    RETURN 'Error verifying test data: ' || SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;

-- Run the test function
SELECT test_stripe_price_id_columns();

-- Clean up the test data (Comment out to keep the test data for inspection)
-- DELETE FROM public.user_subscriptions WHERE stripe_price_id = 'price_test_subscription_123';
-- DELETE FROM public.course_enrollments WHERE stripe_payment_intent_id = 'pi_test_payment_intent_789';

-- Drop the test function
DROP FUNCTION IF EXISTS test_stripe_price_id_columns(); 