-- Rollback for Phase 2.1: Critical Policy Consolidation
-- Restores original 5 SELECT policies for flashcards authenticated users

BEGIN;

-- =============================================================================
-- ROLLBACK PHASE 2.1: RESTORE ORIGINAL FLASHCARDS POLICIES
-- =============================================================================

-- Drop the consolidated policy
DROP POLICY IF EXISTS "Authenticated users can view flashcards" ON "public"."flashcards";
DROP POLICY IF EXISTS "Anonymous users can view sample flashcards" ON "public"."flashcards";

-- Restore original 5 SELECT policies for authenticated users

-- 1. Restore admin access policy
CREATE POLICY "Admins can view all flashcards" ON "public"."flashcards"
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = (select auth.uid()) 
        AND profiles.is_admin = true
    )
);

-- 2. Restore official flashcards access
CREATE POLICY "Anyone can view official flashcards" ON "public"."flashcards"
FOR SELECT TO authenticated
USING (is_official = true);

-- 3. Restore subscription user access
CREATE POLICY "Subscription users can view official flashcards" ON "public"."flashcards"
FOR SELECT TO authenticated
USING (
    is_official = true 
    AND (select auth.uid()) IN (
        SELECT user_id FROM user_subscriptions 
        WHERE status = 'active' 
        AND current_period_end > now()
    )
);

-- 4. Restore user ownership access
CREATE POLICY "Users can view their own flashcards" ON "public"."flashcards"
FOR SELECT TO authenticated
USING ((select auth.uid()) = created_by);

-- 5. Restore the multi-role public sample policy (serves both anon and authenticated)
CREATE POLICY "Anyone can view public sample flashcards" ON "public"."flashcards"
FOR SELECT TO anon, authenticated
USING (
    (is_official = true) 
    AND (is_public_sample = true)
);

-- Also restore the anon-specific sample policy if it existed
CREATE POLICY "Anyone can view sample flashcards" ON "public"."flashcards"
FOR SELECT TO anon
USING (
    (is_official = true) 
    AND (is_public_sample = true) 
    AND (
        ((select current_setting('app.public_access'::text, true))::boolean) 
        OR ((select auth.role()) = 'authenticated'::text)
    )
);

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify rollback worked - should see multiple policies again
DO $$
DECLARE
    select_policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO select_policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'flashcards'
    AND cmd = 'SELECT'
    AND 'authenticated' = ANY(roles);
    
    RAISE NOTICE 'ROLLBACK PHASE 2.1: SELECT policies for authenticated role restored: %', select_policy_count;
    
    IF select_policy_count >= 5 THEN
        RAISE NOTICE 'ROLLBACK PHASE 2.1: ✅ Successfully restored original multiple policies';
    ELSE
        RAISE WARNING 'ROLLBACK PHASE 2.1: Expected 5+ SELECT policies for authenticated, found %', select_policy_count;
    END IF;
END $$;

COMMIT; 