-- Phase 3.1: Simple Policy Consolidation
-- Consolidates 4 simple tables with 2 policies each
-- Target: 8 Multiple Permissive Policies warnings resolved

BEGIN;

-- =============================================================================
-- SIMPLE POLICY CONSOLIDATIONS (2 policies each)
-- =============================================================================

-- 1. AI_SETTINGS - authenticated SELECT
-- Current: "Admins can manage AI settings", "All users can read active setting"
-- Consolidate to single policy allowing both admin management and user reading

DROP POLICY IF EXISTS "Admins can manage AI settings" ON "public"."ai_settings";
DROP POLICY IF EXISTS "All users can read active setting" ON "public"."ai_settings";

CREATE POLICY "Authenticated users can read AI settings and admins can manage" ON "public"."ai_settings"
FOR SELECT TO authenticated
USING (
  -- All authenticated users can read active settings
  (is_active = true)
  OR 
  -- Admins can read all settings (for management)
  ((select auth.is_admin()) = true)
);

-- 2. EXAM_TYPES - authenticated SELECT  
-- Current: "Only admins can manage exam types", "Users can access exam types"
-- Consolidate to single policy allowing both admin management and user access

DROP POLICY IF EXISTS "Only admins can manage exam types" ON "public"."exam_types";
DROP POLICY IF EXISTS "Users can access exam types" ON "public"."exam_types";

CREATE POLICY "Authenticated users can access exam types" ON "public"."exam_types"
FOR SELECT TO authenticated
USING (true); -- All authenticated users can access exam types

-- 3. SUBJECTS - authenticated SELECT
-- Current: "Anyone can read subjects", "Anyone can view official subjects"  
-- Consolidate to single policy covering all subject access

DROP POLICY IF EXISTS "Anyone can read subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Anyone can view official subjects" ON "public"."subjects";

CREATE POLICY "Authenticated users can read all subjects" ON "public"."subjects"
FOR SELECT TO authenticated
USING (true); -- All authenticated users can read all subjects

-- 4. SYSTEM_PROMPTS - authenticated SELECT
-- Current: "Admins can manage system prompts", "All users can read active prompt"
-- Consolidate to single policy allowing both admin management and user reading

DROP POLICY IF EXISTS "Admins can manage system prompts" ON "public"."system_prompts";
DROP POLICY IF EXISTS "All users can read active prompt" ON "public"."system_prompts";

CREATE POLICY "Authenticated users can read system prompts and admins can manage" ON "public"."system_prompts"
FOR SELECT TO authenticated
USING (
  -- All authenticated users can read active prompts
  (is_active = true)
  OR 
  -- Admins can read all prompts (for management)
  ((select auth.is_admin()) = true)
);

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Check for remaining multiple permissive policies in consolidated tables
SELECT 
  tablename,
  COUNT(*) as policy_count,
  'authenticated' as role_name,
  'SELECT' as action_type
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('ai_settings', 'exam_types', 'subjects', 'system_prompts')
  AND 'authenticated' = ANY(roles)
  AND cmd = 'SELECT'
GROUP BY tablename
HAVING COUNT(*) > 1;

-- Should return 0 rows - each table should have only 1 SELECT policy for authenticated

-- Count total policies in consolidated tables
SELECT 
  'PHASE 3.1 COMPLETION SUMMARY' as validation_summary,
  (
    SELECT COUNT(*) FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename IN ('ai_settings', 'exam_types', 'subjects', 'system_prompts')
  ) as total_policies_after_consolidation;

COMMIT; 