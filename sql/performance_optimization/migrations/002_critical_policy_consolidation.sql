-- Phase 2.1: Critical Policy Consolidation 
-- Target: flashcards table - 5 redundant SELECT policies for authenticated users
-- Impact: Resolves highest-impact Multiple Permissive Policy warning
-- Expected: 60% policy reduction for flashcards SELECT operations

BEGIN;

-- =============================================================================
-- PHASE 2.1: CRITICAL FLASHCARDS SELECT CONSOLIDATION
-- =============================================================================

-- CURRENT STATE: 5 separate SELECT policies for authenticated users on flashcards:
-- 1. "Admins can view all flashcards" 
-- 2. "Anyone can view public sample flashcards" (authenticated role)
-- 3. "Anyone can view official flashcards"
-- 4. "Subscription users can view official flashcards" 
-- 5. "Users can view their own flashcards"

-- TARGET: Single comprehensive policy covering all access patterns

-- Drop all existing redundant SELECT policies for authenticated users
DROP POLICY IF EXISTS "Admins can view all flashcards" ON "public"."flashcards";
DROP POLICY IF EXISTS "Anyone can view official flashcards" ON "public"."flashcards";
DROP POLICY IF EXISTS "Subscription users can view official flashcards" ON "public"."flashcards";
DROP POLICY IF EXISTS "Users can view their own flashcards" ON "public"."flashcards";

-- Note: Keep "Anyone can view public sample flashcards" policy as it serves both anon and authenticated
-- We'll modify it to only serve anon users to eliminate the authenticated overlap

-- First, check if the multi-role policy exists and handle it properly
DO $$
BEGIN
    -- Drop the existing multi-role policy if it exists
    DROP POLICY IF EXISTS "Anyone can view public sample flashcards" ON "public"."flashcards";
    
    -- Create separate policies for anon and authenticated to eliminate role overlap
    CREATE POLICY "Anonymous users can view sample flashcards" ON "public"."flashcards"
    FOR SELECT TO anon
    USING (
        (is_official = true) 
        AND (is_public_sample = true)
        AND (
            ((select current_setting('app.public_access'::text, true))::boolean) 
            OR ((select auth.role()) = 'authenticated'::text)
        )
    );
END $$;

-- Create the consolidated SELECT policy for authenticated users
CREATE POLICY "Authenticated users can view flashcards" ON "public"."flashcards"
FOR SELECT TO authenticated
USING (
    -- Admins can view all flashcards
    (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = (select auth.uid()) 
            AND profiles.is_admin = true
        )
    )
    OR
    -- All authenticated users can view public sample flashcards
    (is_official = true AND is_public_sample = true)
    OR
    -- All authenticated users can view official flashcards (basic access)
    (is_official = true)
    OR
    -- Subscription users get enhanced access to official flashcards
    (
        is_official = true 
        AND (select auth.uid()) IN (
            SELECT user_id FROM user_subscriptions 
            WHERE status = 'active' 
            AND current_period_end > now()
        )
    )
    OR
    -- Users can view their own created flashcards
    ((select auth.uid()) = created_by)
);

-- =============================================================================
-- VALIDATION FOR PHASE 2.1
-- =============================================================================

-- Verify the consolidation worked
DO $$
DECLARE
    policy_count INTEGER;
    select_policy_count INTEGER;
BEGIN
    -- Count total flashcards policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'flashcards';
    
    RAISE NOTICE 'PHASE 2.1: Total flashcards policies after consolidation: %', policy_count;
    
    -- Count SELECT policies specifically for authenticated role
    SELECT COUNT(*) INTO select_policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'flashcards'
    AND cmd = 'SELECT'
    AND 'authenticated' = ANY(roles);
    
    RAISE NOTICE 'PHASE 2.1: SELECT policies for authenticated role: %', select_policy_count;
    
    -- Should be exactly 1 now
    IF select_policy_count != 1 THEN
        RAISE WARNING 'PHASE 2.1: Expected 1 SELECT policy for authenticated, found %', select_policy_count;
    ELSE
        RAISE NOTICE 'PHASE 2.1: ✅ Successfully consolidated to 1 SELECT policy for authenticated users';
    END IF;
END $$;

-- Check for remaining multiple permissive policies on flashcards
SELECT 
    tablename,
    cmd,
    roles,
    COUNT(*) as policy_count,
    array_agg(policyname) as policy_names
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'flashcards'
GROUP BY tablename, cmd, roles
HAVING COUNT(*) > 1;

-- Should return no rows if consolidation was successful

COMMIT; 