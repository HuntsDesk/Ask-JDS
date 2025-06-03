-- Phase 2: Threads Table Policy Consolidation (CORRECTED)
-- Consolidates 12 redundant policies into 4 optimized policies (one per CRUD operation)
-- Fixes Multiple Permissive Policies warnings for threads table

BEGIN;

-- =============================================================================
-- BACKUP CURRENT THREADS POLICIES (for reference)
-- =============================================================================

-- Current policies (12 total):
-- 1. "Users can create own threads" (INSERT)
-- 2. "threads_insert_own" (INSERT) 
-- 3. "threads_insert_policy" (INSERT)
-- 4. "Users can delete own threads" (DELETE)
-- 5. "threads_delete_own" (DELETE)
-- 6. "threads_delete_policy" (DELETE)
-- 7. "Users can update own threads" (UPDATE)
-- 8. "threads_update_own" (UPDATE)
-- 9. "threads_update_policy" (UPDATE)
-- 10. "Users can view own threads" (SELECT)
-- 11. "threads_select_policy" (SELECT)
-- 12. "threads_view_own" (SELECT)

-- =============================================================================
-- DROP ALL EXISTING REDUNDANT POLICIES
-- =============================================================================

-- Drop all INSERT policies
DROP POLICY IF EXISTS "Users can create own threads" ON "public"."threads";
DROP POLICY IF EXISTS "threads_insert_own" ON "public"."threads";
DROP POLICY IF EXISTS "threads_insert_policy" ON "public"."threads";

-- Drop all DELETE policies  
DROP POLICY IF EXISTS "Users can delete own threads" ON "public"."threads";
DROP POLICY IF EXISTS "threads_delete_own" ON "public"."threads";
DROP POLICY IF EXISTS "threads_delete_policy" ON "public"."threads";

-- Drop all UPDATE policies
DROP POLICY IF EXISTS "Users can update own threads" ON "public"."threads";
DROP POLICY IF EXISTS "threads_update_own" ON "public"."threads";
DROP POLICY IF EXISTS "threads_update_policy" ON "public"."threads";

-- Drop all SELECT policies
DROP POLICY IF EXISTS "Users can view own threads" ON "public"."threads";
DROP POLICY IF EXISTS "threads_select_policy" ON "public"."threads";
DROP POLICY IF EXISTS "threads_view_own" ON "public"."threads";

-- =============================================================================
-- CREATE CONSOLIDATED OPTIMIZED POLICIES
-- =============================================================================

-- 1. Consolidated INSERT policy
CREATE POLICY "threads_insert_consolidated" ON "public"."threads"
FOR INSERT 
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- 2. Consolidated DELETE policy  
CREATE POLICY "threads_delete_consolidated" ON "public"."threads"
FOR DELETE
TO authenticated  
USING ((select auth.uid()) = user_id);

-- 3. Consolidated UPDATE policy
CREATE POLICY "threads_update_consolidated" ON "public"."threads"
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- 4. Consolidated SELECT policy
CREATE POLICY "threads_select_consolidated" ON "public"."threads"
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify we now have exactly 4 policies for threads table
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'threads'
ORDER BY cmd, policyname;

-- Should show exactly 4 policies:
-- 1. threads_delete_consolidated (DELETE)
-- 2. threads_insert_consolidated (INSERT) 
-- 3. threads_select_consolidated (SELECT)
-- 4. threads_update_consolidated (UPDATE)

-- Count verification
SELECT COUNT(*) as total_threads_policies
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'threads';

-- Should return: 4

COMMIT; 