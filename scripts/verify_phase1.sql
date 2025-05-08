-- Verify Phase 1 database changes

-- 1. Check if columns exist
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_name IN ('user_subscriptions', 'course_enrollments')
  AND column_name IN ('stripe_price_id', 'stripe_payment_intent_id')
ORDER BY
  table_name, 
  column_name;

-- 2. Check if the unique constraint exists on stripe_payment_intent_id
SELECT 
  tc.table_schema, 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name
FROM 
  information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE 
  tc.table_name = 'course_enrollments'
  AND kcu.column_name = 'stripe_payment_intent_id'
  AND tc.constraint_type = 'UNIQUE';

-- 3. Check the updated has_course_access function
SELECT pg_get_functiondef('has_course_access(uuid, uuid)'::regprocedure);

-- 4. Check RLS policies on both tables
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM 
  pg_policies 
WHERE 
  tablename IN ('user_subscriptions', 'course_enrollments')
ORDER BY 
  tablename, 
  policyname; 