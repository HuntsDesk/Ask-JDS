-- Rollback for Phase 2: Threads Table Policy Consolidation
-- Restores all 12 original threads policies

BEGIN;

-- =============================================================================
-- DROP CONSOLIDATED POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "threads_insert_consolidated" ON "public"."threads";
DROP POLICY IF EXISTS "threads_delete_consolidated" ON "public"."threads";
DROP POLICY IF EXISTS "threads_update_consolidated" ON "public"."threads";
DROP POLICY IF EXISTS "threads_select_consolidated" ON "public"."threads";

-- =============================================================================
-- RESTORE ORIGINAL 12 POLICIES
-- =============================================================================

-- INSERT policies (3 original)
CREATE POLICY "Users can create own threads" ON "public"."threads"
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "threads_insert_own" ON "public"."threads"
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "threads_insert_policy" ON "public"."threads"
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL);

-- DELETE policies (3 original)
CREATE POLICY "Users can delete own threads" ON "public"."threads"
FOR DELETE TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "threads_delete_own" ON "public"."threads"
FOR DELETE TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "threads_delete_policy" ON "public"."threads"
FOR DELETE TO authenticated
USING ((select auth.uid()) = user_id);

-- UPDATE policies (3 original)
CREATE POLICY "Users can update own threads" ON "public"."threads"
FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "threads_update_own" ON "public"."threads"
FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "threads_update_policy" ON "public"."threads"
FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- SELECT policies (3 original)
CREATE POLICY "Users can view own threads" ON "public"."threads"
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "threads_select_policy" ON "public"."threads"
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "threads_view_own" ON "public"."threads"
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify we restored all 12 policies
SELECT COUNT(*) as total_threads_policies
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'threads';

-- Should return: 12

COMMIT; 