-- URGENT SECURITY FIX: Subjects Table RLS Policies
-- CRITICAL: Current policies don't enforce user_id ownership!
-- Any authenticated user can modify ANY non-official subject
-- This migration fixes the massive security vulnerability

BEGIN;

-- =============================================================================
-- URGENT: FIX SUBJECTS TABLE SECURITY POLICIES
-- =============================================================================

-- DROP BROKEN POLICIES THAT DON'T ENFORCE OWNERSHIP
DROP POLICY IF EXISTS "Users can create their own subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Users can delete their own non-official subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Users can update their own non-official subjects" ON "public"."subjects";

-- CREATE PROPER OWNERSHIP-ENFORCED POLICIES

-- INSERT: Users can create their own non-official subjects
CREATE POLICY "Users can create their own subjects" ON "public"."subjects"
FOR INSERT TO authenticated
WITH CHECK (
  is_official = false 
  AND (select auth.uid()) = user_id
);

-- DELETE: Users can only delete their own non-official subjects
CREATE POLICY "Users can delete their own subjects" ON "public"."subjects"
FOR DELETE TO authenticated
USING (
  is_official = false 
  AND (select auth.uid()) = user_id
);

-- UPDATE: Users can only update their own non-official subjects
CREATE POLICY "Users can update their own subjects" ON "public"."subjects"
FOR UPDATE TO authenticated
USING (
  is_official = false 
  AND (select auth.uid()) = user_id
)
WITH CHECK (
  is_official = false 
  AND (select auth.uid()) = user_id
);

-- =============================================================================
-- ALSO FIX MULTIPLE PERMISSIVE POLICIES WHILE WE'RE HERE
-- =============================================================================

-- CONSOLIDATE THE TWO SELECT POLICIES
-- Current: "Anyone can read subjects" (authenticated), "Anyone can view official subjects" (anon)
-- These overlap for authenticated users - consolidate for performance

DROP POLICY IF EXISTS "Anyone can read subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Anyone can view official subjects" ON "public"."subjects";

-- Create optimized SELECT policies

-- Anonymous users: Only official subjects with public access settings
CREATE POLICY "Anonymous users can view official subjects" ON "public"."subjects"
FOR SELECT TO anon
USING (
  is_official = true 
  AND (((select current_setting('app.public_access'::text, true))::boolean) OR ((select auth.role()) = 'authenticated'::text))
);

-- Authenticated users: Own subjects OR official subjects  
CREATE POLICY "Authenticated users can view subjects" ON "public"."subjects"
FOR SELECT TO authenticated
USING (
  -- Users can view their own subjects
  ((select auth.uid()) = user_id)
  OR
  -- All authenticated users can view official subjects
  (is_official = true)
);

-- =============================================================================
-- ADMIN POLICIES (if not already present)
-- =============================================================================

-- Ensure admins can manage all subjects
CREATE POLICY "Admins can manage all subjects" ON "public"."subjects"
FOR ALL TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify no conflicts remain
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subjects';
    
    RAISE NOTICE 'SUBJECTS SECURITY FIX: % total policies after fix', policy_count;
    
    -- Check for remaining multiple permissive conflicts
    SELECT COUNT(*) INTO policy_count
    FROM (
        SELECT cmd, array_agg(roles) as role_groups
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'subjects'
        GROUP BY cmd, roles
        HAVING COUNT(*) > 1
    ) conflicts;
    
    RAISE NOTICE 'SUBJECTS SECURITY FIX: % remaining policy conflicts', policy_count;
END $$;

COMMIT; 