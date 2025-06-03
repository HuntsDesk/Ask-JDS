-- Emergency Security Fix: Flashcards Access Control
-- Fixes overly permissive policy that allowed all authenticated users to view official flashcards
-- Official flashcards should only be accessible to users with active subscriptions or admins

BEGIN;

-- =============================================================================
-- FLASHCARDS SECURITY PATCH
-- =============================================================================

-- The "Anyone can view official flashcards" policy was incorrectly granting 
-- all authenticated users access to official flashcards without subscription checking.
-- This policy should have been subscription-gated from the beginning.

-- Drop the problematic policy (should already be dropped by user)
DROP POLICY IF EXISTS "Anyone can view official flashcards" ON "public"."flashcards";

-- Create the correct subscription-gated policy
CREATE POLICY "Subscription users can view official flashcards" ON "public"."flashcards"
FOR SELECT TO authenticated
USING (
  is_official = true
  AND (
    -- Admin access
    (select auth.is_admin())
    OR 
    -- Active subscription access  
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = (select auth.uid())
        AND us.status = 'active'
        AND us.current_period_end > now()
    )
    OR
    -- Public sample access (these are meant to be freely accessible)
    is_public_sample = true
  )
);

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify the policy was created correctly
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'flashcards'
  AND policyname = 'Subscription users can view official flashcards';

-- Verify no more overly permissive official flashcard policies exist
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'flashcards'
  AND (
    qual LIKE '%is_official = true%'
    AND qual NOT LIKE '%subscription%'
    AND qual NOT LIKE '%is_public_sample%'
    AND qual NOT LIKE '%auth.is_admin%'
  );

-- Should return 0 rows - no policies granting blanket access to official flashcards

COMMIT; 