-- Phase 3.2: Moderate Policy Consolidation
-- Consolidates moderate tables with 2-3 policies each per role/action
-- Target: 8 Multiple Permissive Policies warnings resolved

BEGIN;

-- =============================================================================
-- MODERATE POLICY CONSOLIDATIONS
-- =============================================================================

-- 1. COLLECTION_SUBJECTS - authenticated DELETE (2 policies)
-- Current: "Admin users can delete any collection_subjects", "Users can delete their own collection_subjects"
-- Consolidate to single policy allowing both admin and user deletion

DROP POLICY IF EXISTS "Admin users can delete any collection_subjects" ON "public"."collection_subjects";
DROP POLICY IF EXISTS "Users can delete their own collection_subjects" ON "public"."collection_subjects";

CREATE POLICY "Authenticated users can delete collection_subjects" ON "public"."collection_subjects"
FOR DELETE TO authenticated
USING (
  -- Admins can delete any collection_subjects
  ((select auth.is_admin()) = true)
  OR 
  -- Users can delete their own collection_subjects
  ((select auth.uid()) = user_id)
);

-- 2. COLLECTION_SUBJECTS - authenticated INSERT (2 policies)
-- Current: "Admin users can insert any collection_subjects", "Users can insert their own collection_subjects"
-- Consolidate to single policy allowing both admin and user insertion

DROP POLICY IF EXISTS "Admin users can insert any collection_subjects" ON "public"."collection_subjects";
DROP POLICY IF EXISTS "Users can insert their own collection_subjects" ON "public"."collection_subjects";

CREATE POLICY "Authenticated users can insert collection_subjects" ON "public"."collection_subjects"
FOR INSERT TO authenticated
WITH CHECK (
  -- Admins can insert any collection_subjects
  ((select auth.is_admin()) = true)
  OR 
  -- Users can insert their own collection_subjects
  ((select auth.uid()) = user_id)
);

-- 3. COLLECTION_SUBJECTS - authenticated SELECT (2 policies)
-- Current: "Users can access collection subjects", "Users can read any collection_subjects"
-- Consolidate to single policy allowing user access

DROP POLICY IF EXISTS "Users can access collection subjects" ON "public"."collection_subjects";
DROP POLICY IF EXISTS "Users can read any collection_subjects" ON "public"."collection_subjects";

CREATE POLICY "Authenticated users can read collection_subjects" ON "public"."collection_subjects"
FOR SELECT TO authenticated
USING (true); -- All authenticated users can read all collection_subjects

-- 4. FLASHCARD_COLLECTIONS_JUNCTION - authenticated DELETE (2 policies)
-- Current: "Admin users can delete any flashcard_collections_junction", "Users can delete their own flashcard_collections_junction"
-- Consolidate to single policy allowing both admin and user deletion

DROP POLICY IF EXISTS "Admin users can delete any flashcard_collections_junction" ON "public"."flashcard_collections_junction";
DROP POLICY IF EXISTS "Users can delete their own flashcard_collections_junction" ON "public"."flashcard_collections_junction";

CREATE POLICY "Authenticated users can delete flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR DELETE TO authenticated
USING (
  -- Admins can delete any junction records
  ((select auth.is_admin()) = true)
  OR 
  -- Users can delete their own junction records (assuming user_id column exists)
  ((select auth.uid()) = user_id)
);

-- 5. FLASHCARD_COLLECTIONS_JUNCTION - authenticated INSERT (2 policies)
-- Current: "Admin users can insert any flashcard_collections_junction", "Users can insert flashcard-collection associations"
-- Consolidate to single policy allowing both admin and user insertion

DROP POLICY IF EXISTS "Admin users can insert any flashcard_collections_junction" ON "public"."flashcard_collections_junction";
DROP POLICY IF EXISTS "Users can insert flashcard-collection associations" ON "public"."flashcard_collections_junction";

CREATE POLICY "Authenticated users can insert flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR INSERT TO authenticated
WITH CHECK (
  -- Admins can insert any junction records
  ((select auth.is_admin()) = true)
  OR 
  -- Users can insert their own junction records
  ((select auth.uid()) = user_id)
);

-- 6. FLASHCARDS - anon SELECT (2 policies)
-- Current: "Anyone can view public sample flashcards", "Anyone can view sample flashcards"
-- Consolidate to single policy allowing anon access to sample flashcards

DROP POLICY IF EXISTS "Anyone can view public sample flashcards" ON "public"."flashcards";
DROP POLICY IF EXISTS "Anyone can view sample flashcards" ON "public"."flashcards";

CREATE POLICY "Anonymous users can view sample flashcards" ON "public"."flashcards"
FOR SELECT TO anon
USING (
  -- Anonymous users can view public sample flashcards
  (is_official = true AND is_public_sample = true)
);

-- 7. FLASHCARDS - authenticated SELECT (5 policies)
-- Current: "Admins can view all flashcards", "Anyone can view public sample flashcards", "Anyone can view sample flashcards", "Subscription users can view official flashcards", "Users can view their own flashcards"
-- Consolidate to single comprehensive policy

DROP POLICY IF EXISTS "Admins can view all flashcards" ON "public"."flashcards";
DROP POLICY IF EXISTS "Anyone can view public sample flashcards" ON "public"."flashcards";
DROP POLICY IF EXISTS "Anyone can view sample flashcards" ON "public"."flashcards";
DROP POLICY IF EXISTS "Subscription users can view official flashcards" ON "public"."flashcards";
DROP POLICY IF EXISTS "Users can view their own flashcards" ON "public"."flashcards";

CREATE POLICY "Authenticated users can view flashcards" ON "public"."flashcards"
FOR SELECT TO authenticated
USING (
  -- Admins can view all flashcards
  ((select auth.is_admin()) = true)
  OR
  -- All authenticated users can view public sample flashcards
  (is_official = true AND is_public_sample = true)
  OR
  -- Subscription users can view official flashcards
  (
    is_official = true 
    AND (select auth.uid()) IN (
      SELECT user_id FROM user_subscriptions 
      WHERE status = 'active' AND current_period_end > now()
    )
  )
  OR
  -- Users can view their own flashcards
  ((select auth.uid()) = user_id)
);

-- 8. FLASHCARDS - authenticated UPDATE (2 policies)
-- Current: "Admins can update any flashcard", "Users can update their own flashcards"
-- Consolidate to single policy allowing both admin and user updates

DROP POLICY IF EXISTS "Admins can update any flashcard" ON "public"."flashcards";
DROP POLICY IF EXISTS "Users can update their own flashcards" ON "public"."flashcards";

CREATE POLICY "Authenticated users can update flashcards" ON "public"."flashcards"
FOR UPDATE TO authenticated
USING (
  -- Admins can update any flashcard
  ((select auth.is_admin()) = true)
  OR 
  -- Users can update their own flashcards
  ((select auth.uid()) = user_id)
)
WITH CHECK (
  -- Same conditions for updates
  ((select auth.is_admin()) = true)
  OR 
  ((select auth.uid()) = user_id)
);

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Check for remaining multiple permissive policies in consolidated tables
DO $$
DECLARE
    remaining_conflicts INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_conflicts
    FROM (
        SELECT tablename, cmd, array_agg(roles) as role_groups
        FROM pg_policies 
        WHERE schemaname = 'public'
          AND tablename IN ('collection_subjects', 'flashcard_collections_junction', 'flashcards')
        GROUP BY tablename, cmd, roles
        HAVING COUNT(*) > 1
    ) conflicts;
    
    RAISE NOTICE 'PHASE 3.2 VALIDATION: % remaining conflicts in consolidated tables', remaining_conflicts;
END $$;

-- Count total policies in consolidated tables after consolidation
SELECT 
  'PHASE 3.2 COMPLETION SUMMARY' as validation_summary,
  (
    SELECT COUNT(*) FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename IN ('collection_subjects', 'flashcard_collections_junction', 'flashcards')
  ) as total_policies_after_consolidation;

COMMIT; 