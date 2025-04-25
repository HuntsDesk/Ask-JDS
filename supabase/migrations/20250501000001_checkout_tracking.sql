-- Add new tables for checkout session tracking and webhook event processing

-- Table for tracking checkout sessions
CREATE TABLE IF NOT EXISTS "public"."checkout_sessions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "stripe_session_id" text UNIQUE,
  "user_id" uuid REFERENCES auth.users(id),
  "checkout_type" text NOT NULL,
  "course_id" uuid NULL REFERENCES public.courses(id),
  "subscription_tier" text NULL,
  "interval" text NULL,
  "success_url" text,
  "cancel_url" text,
  "metadata" jsonb,
  "is_completed" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone NULL,
  "expires_at" timestamp with time zone DEFAULT (now() + interval '24 hours') NOT NULL
);

-- Add indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON public.checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_session_id ON public.checkout_sessions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_expires_at ON public.checkout_sessions(expires_at);

-- Table for tracking webhook events to ensure idempotency
CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "stripe_event_id" text UNIQUE NOT NULL,
  "event_type" text NOT NULL,
  "stripe_session_id" text NULL,
  "stripe_subscription_id" text NULL,
  "is_processed" boolean DEFAULT false,
  "is_livemode" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "processed_at" timestamp with time zone NULL,
  "raw_event" jsonb,
  "error_message" text NULL,
  "retry_count" integer DEFAULT 0
);

-- Add indexes for webhook events lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON public.webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_session_id ON public.webhook_events(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_is_processed ON public.webhook_events(is_processed);

-- Add RLS policies
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Checkout sessions policies
CREATE POLICY "Users can view their own checkout sessions"
  ON public.checkout_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all checkout sessions"
  ON public.checkout_sessions
  FOR ALL
  TO service_role
  USING (true);

-- Webhook events policies
CREATE POLICY "Service role can manage all webhook events"
  ON public.webhook_events
  FOR ALL
  TO service_role
  USING (true);

-- Add function to clean up expired checkout sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_checkout_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.checkout_sessions
  WHERE expires_at < now() AND NOT is_completed;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$; 