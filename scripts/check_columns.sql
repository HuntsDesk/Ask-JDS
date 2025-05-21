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