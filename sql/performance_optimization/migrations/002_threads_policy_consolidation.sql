-- Phase 2: Threads Table Policy Consolidation
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
-- DROP REDUNDANT POLICIES
-- =============================================================================

-- Drop redundant INSERT policies (keep logic from most permissive)
DROP POLICY IF EXISTS "threads_insert_own" ON "public"."threads";
DROP POLICY IF EXISTS "Users can create own threads" ON "public"."threads";

-- Drop redundant DELETE policies  
DROP POLICY IF EXISTS "threads_delete_own" ON "public"."threads";
DROP POLICY IF EXISTS "Users can delete own threads" ON "public"."threads";

-- Drop redundant UPDATE policies
DROP POLICY IF EXISTS "threads_update_own" ON "public"."threads";
DROP POLICY IF EXISTS "Users can update own threads" ON "public"."threads";

-- Drop redundant SELECT policies
DROP POLICY IF EXISTS "threads_view_own" ON "public"."threads";
DROP POLICY IF EXISTS "Users can view own threads" ON "public"."threads";

-- =============================================================================
-- CREATE CONSOLIDATED OPTIMIZED POLICIES
-- =============================================================================

-- Rename and optimize remaining policies for clarity and performance

-- 1. Consolidated INSERT policy
ALTER POLICY "threads_insert_policy" ON "public"."threads" 
RENAME TO "threads_insert_consolidated";

ALTER POLICY "threads_insert_consolidated" ON "public"."threads"
FOR INSERT 
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- 2. Consolidated DELETE policy  
ALTER POLICY "threads_delete_policy" ON "public"."threads"
RENAME TO "threads_delete_consolidated";

ALTER POLICY "threads_delete_consolidated" ON "public"."threads"
FOR DELETE
TO authenticated  
USING ((select auth.uid()) = user_id);

-- 3. Consolidated UPDATE policy
ALTER POLICY "threads_update_policy" ON "public"."threads"
RENAME TO "threads_update_consolidated";

ALTER POLICY "threads_update_consolidated" ON "public"."threads"
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- 4. Consolidated SELECT policy
ALTER POLICY "threads_select_policy" ON "public"."threads"
RENAME TO "threads_select_consolidated";

ALTER POLICY "threads_select_consolidated" ON "public"."threads"
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

COMMIT; 