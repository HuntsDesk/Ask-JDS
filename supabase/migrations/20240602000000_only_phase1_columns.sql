-- This is a simplified version of Phase 1 that only adds the necessary columns
-- without any complex logic or testing to avoid migration issues

-- Add stripe_price_id to user_subscriptions table
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add stripe_price_id to course_enrollments table
ALTER TABLE public.course_enrollments
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add stripe_payment_intent_id to course_enrollments table for Webhook Idempotency
ALTER TABLE public.course_enrollments
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE; 