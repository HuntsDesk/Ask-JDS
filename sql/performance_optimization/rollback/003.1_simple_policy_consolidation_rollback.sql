-- Rollback for Phase 3.1: Simple Policy Consolidation
-- Restores original 2 policies for each of the 4 simple tables

BEGIN;

-- =============================================================================
-- RESTORE ORIGINAL POLICIES
-- =============================================================================

-- 1. AI_SETTINGS - restore 2 original policies
DROP POLICY IF EXISTS "Authenticated users can read AI settings and admins can manage" ON "public"."ai_settings";

CREATE POLICY "Admins can manage AI settings" ON "public"."ai_settings"
FOR SELECT TO authenticated
USING ((select auth.is_admin()) = true);

CREATE POLICY "All users can read active setting" ON "public"."ai_settings"  
FOR SELECT TO authenticated
USING (is_active = true);

-- 2. EXAM_TYPES - restore 2 original policies
DROP POLICY IF EXISTS "Authenticated users can access exam types" ON "public"."exam_types";

CREATE POLICY "Only admins can manage exam types" ON "public"."exam_types"
FOR SELECT TO authenticated
USING ((select auth.is_admin()) = true);

CREATE POLICY "Users can access exam types" ON "public"."exam_types"
FOR SELECT TO authenticated  
USING (true);

-- 3. SUBJECTS - restore 2 original policies
DROP POLICY IF EXISTS "Authenticated users can read all subjects" ON "public"."subjects";

CREATE POLICY "Anyone can read subjects" ON "public"."subjects"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Anyone can view official subjects" ON "public"."subjects"
FOR SELECT TO authenticated
USING ((is_official = true) AND (((select current_setting('app.public_access'::text, true))::boolean) OR ((select auth.role()) = 'authenticated'::text)));

-- 4. SYSTEM_PROMPTS - restore 2 original policies  
DROP POLICY IF EXISTS "Authenticated users can read system prompts and admins can manage" ON "public"."system_prompts";

CREATE POLICY "Admins can manage system prompts" ON "public"."system_prompts"
FOR SELECT TO authenticated
USING ((select auth.is_admin()) = true);

CREATE POLICY "All users can read active prompt" ON "public"."system_prompts"
FOR SELECT TO authenticated
USING (is_active = true);

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify we're back to 2 policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('ai_settings', 'exam_types', 'subjects', 'system_prompts')
  AND 'authenticated' = ANY(roles)
  AND cmd = 'SELECT'
GROUP BY tablename;

-- Should return 4 rows, each with policy_count = 2

COMMIT; 