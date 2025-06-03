-- Rollback for Phase 3.2: Moderate Policy Consolidation
-- Restores original multiple policies for moderate complexity tables

BEGIN;

-- =============================================================================
-- RESTORE ORIGINAL POLICIES
-- =============================================================================

-- 1. COLLECTION_SUBJECTS - restore original DELETE policies
DROP POLICY IF EXISTS "Authenticated users can delete collection_subjects" ON "public"."collection_subjects";

CREATE POLICY "Admin users can delete any collection_subjects" ON "public"."collection_subjects"
FOR DELETE TO authenticated
USING ((select auth.is_admin()) = true);

CREATE POLICY "Users can delete their own collection_subjects" ON "public"."collection_subjects"
FOR DELETE TO authenticated
USING ((select auth.uid()) = user_id);

-- 2. COLLECTION_SUBJECTS - restore original INSERT policies
DROP POLICY IF EXISTS "Authenticated users can insert collection_subjects" ON "public"."collection_subjects";

CREATE POLICY "Admin users can insert any collection_subjects" ON "public"."collection_subjects"
FOR INSERT TO authenticated
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Users can insert their own collection_subjects" ON "public"."collection_subjects"
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- 3. COLLECTION_SUBJECTS - restore original SELECT policies
DROP POLICY IF EXISTS "Authenticated users can read collection_subjects" ON "public"."collection_subjects";

CREATE POLICY "Users can access collection subjects" ON "public"."collection_subjects"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can read any collection_subjects" ON "public"."collection_subjects"
FOR SELECT TO authenticated
USING (true);

-- 4. FLASHCARD_COLLECTIONS_JUNCTION - restore original DELETE policies
DROP POLICY IF EXISTS "Authenticated users can delete flashcard_collections_junction" ON "public"."flashcard_collections_junction";

CREATE POLICY "Admin users can delete any flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR DELETE TO authenticated
USING ((select auth.is_admin()) = true);

CREATE POLICY "Users can delete their own flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR DELETE TO authenticated
USING ((select auth.uid()) = user_id);

-- 5. FLASHCARD_COLLECTIONS_JUNCTION - restore original INSERT policies
DROP POLICY IF EXISTS "Authenticated users can insert flashcard_collections_junction" ON "public"."flashcard_collections_junction";

CREATE POLICY "Admin users can insert any flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR INSERT TO authenticated
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Users can insert flashcard-collection associations" ON "public"."flashcard_collections_junction"
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- 6. FLASHCARDS - restore original anon SELECT policies
DROP POLICY IF EXISTS "Anonymous users can view sample flashcards" ON "public"."flashcards";

CREATE POLICY "Anyone can view public sample flashcards" ON "public"."flashcards"
FOR SELECT TO anon
USING (is_official = true AND is_public_sample = true);

CREATE POLICY "Anyone can view sample flashcards" ON "public"."flashcards"
FOR SELECT TO anon
USING (is_official = true AND is_public_sample = true);

-- 7. FLASHCARDS - restore original authenticated SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view flashcards" ON "public"."flashcards";

CREATE POLICY "Admins can view all flashcards" ON "public"."flashcards"
FOR SELECT TO authenticated
USING ((select auth.is_admin()) = true);

CREATE POLICY "Anyone can view public sample flashcards" ON "public"."flashcards"
FOR SELECT TO authenticated
USING (is_official = true AND is_public_sample = true);

CREATE POLICY "Anyone can view sample flashcards" ON "public"."flashcards"
FOR SELECT TO authenticated
USING (is_official = true AND is_public_sample = true);

CREATE POLICY "Subscription users can view official flashcards" ON "public"."flashcards"
FOR SELECT TO authenticated
USING (
  is_official = true 
  AND (select auth.uid()) IN (
    SELECT user_id FROM user_subscriptions 
    WHERE status = 'active' AND current_period_end > now()
  )
);

CREATE POLICY "Users can view their own flashcards" ON "public"."flashcards"
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

-- 8. FLASHCARDS - restore original UPDATE policies
DROP POLICY IF EXISTS "Authenticated users can update flashcards" ON "public"."flashcards";

CREATE POLICY "Admins can update any flashcard" ON "public"."flashcards"
FOR UPDATE TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Users can update their own flashcards" ON "public"."flashcards"
FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify we're back to multiple policies per table/role/action
SELECT 
  tablename,
  cmd,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('collection_subjects', 'flashcard_collections_junction', 'flashcards')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- Should show multiple policies restored for each table/action combination

COMMIT; 