-- Add stripe_price_id to user_subscriptions table
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

COMMENT ON COLUMN public.user_subscriptions.stripe_price_id IS 'Stores the Stripe Price ID associated with this specific subscription instance (e.g., price_xxxxxxxxxxxxxx).';

-- Add stripe_price_id to course_enrollments table
ALTER TABLE public.course_enrollments
ADD COLUMN stripe_price_id TEXT;

COMMENT ON COLUMN public.course_enrollments.stripe_price_id IS 'Stores the Stripe Price ID used for this specific course enrollment transaction (e.g., price_xxxxxxxxxxxxxx). Important if course prices change or discounts are offered via different Price IDs.';

-- Add stripe_payment_intent_id to course_enrollments table for Webhook Idempotency
ALTER TABLE public.course_enrollments
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE;

COMMENT ON COLUMN public.course_enrollments.stripe_payment_intent_id IS 'Stores the Stripe Payment Intent ID for the transaction that created/updated this enrollment. Used for webhook idempotency.';

-- Review RLS policies - no changes needed since the new columns follow the same access pattern
-- as other non-sensitive columns in these tables. 