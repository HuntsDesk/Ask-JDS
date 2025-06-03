-- Phase 2.3: Moderate Impact Policy Consolidation
-- Target: collection_subjects, flashcard_collections_junction, remaining flashcards policies
-- Impact: Resolves final 7 Multiple Permissive Policy warnings
-- Expected: 50% policy reduction on remaining affected tables

BEGIN;

-- =============================================================================
-- PHASE 2.3: MODERATE IMPACT CONSOLIDATIONS
-- =============================================================================

-- =============================================================================
-- 1. COLLECTION_SUBJECTS TABLE CONSOLIDATION
-- =============================================================================
-- Current: 3 warnings (DELETE, INSERT, SELECT for authenticated)
-- Target: 3 consolidated policies (1 per operation)

-- DELETE consolidation: Admin OR collection ownership
DROP POLICY IF EXISTS "Admin users can delete any collection_subjects" ON "public"."collection_subjects";
DROP POLICY IF EXISTS "Users can delete their own collection_subjects" ON "public"."collection_subjects";

CREATE POLICY "Authenticated users can delete collection_subjects" ON "public"."collection_subjects"
FOR DELETE TO authenticated
USING (
    -- Admins can delete any collection_subjects
    ((select auth.is_admin()) = true)
    OR 
    -- Users can delete collection_subjects for their own collections
    (EXISTS (
        SELECT 1 FROM collections c 
        WHERE c.id = collection_subjects.collection_id 
        AND c.user_id = (select auth.uid())
    ))
);

-- INSERT consolidation: Admin OR collection ownership
DROP POLICY IF EXISTS "Admin users can insert any collection_subjects" ON "public"."collection_subjects";
DROP POLICY IF EXISTS "Users can insert their own collection_subjects" ON "public"."collection_subjects";

CREATE POLICY "Authenticated users can insert collection_subjects" ON "public"."collection_subjects"
FOR INSERT TO authenticated
WITH CHECK (
    -- Admins can insert any collection_subjects
    ((select auth.is_admin()) = true)
    OR 
    -- Users can insert collection_subjects for their own collections
    (EXISTS (
        SELECT 1 FROM collections c 
        WHERE c.id = collection_subjects.collection_id 
        AND c.user_id = (select auth.uid())
    ))
);

-- SELECT consolidation: Unified read access
DROP POLICY IF EXISTS "Users can access collection subjects" ON "public"."collection_subjects";
DROP POLICY IF EXISTS "Users can read any collection_subjects" ON "public"."collection_subjects";

CREATE POLICY "Authenticated users can read collection_subjects" ON "public"."collection_subjects"
FOR SELECT TO authenticated
USING (true); -- All authenticated users can read all collection_subjects

-- =============================================================================
-- 2. FLASHCARD_COLLECTIONS_JUNCTION TABLE CONSOLIDATION
-- =============================================================================
-- Current: 2 warnings (DELETE, INSERT for authenticated)
-- Target: 2 consolidated policies

-- DELETE consolidation: Admin OR collection ownership
DROP POLICY IF EXISTS "Admin users can delete any flashcard_collections_junction" ON "public"."flashcard_collections_junction";
DROP POLICY IF EXISTS "Users can delete their own flashcard_collections_junction" ON "public"."flashcard_collections_junction";

CREATE POLICY "Authenticated users can delete flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR DELETE TO authenticated
USING (
    -- Admins can delete any junction records
    ((select auth.is_admin()) = true)
    OR 
    -- Users can delete junction records for their own collections
    (EXISTS (
        SELECT 1 FROM collections c 
        WHERE c.id = flashcard_collections_junction.collection_id 
        AND c.user_id = (select auth.uid())
    ))
);

-- INSERT consolidation: Admin OR collection access (own collections OR official collections)
DROP POLICY IF EXISTS "Admin users can insert any flashcard_collections_junction" ON "public"."flashcard_collections_junction";
DROP POLICY IF EXISTS "Users can insert flashcard-collection associations" ON "public"."flashcard_collections_junction";

CREATE POLICY "Authenticated users can insert flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR INSERT TO authenticated
WITH CHECK (
    -- Admins can insert any junction records
    ((select auth.is_admin()) = true)
    OR 
    -- Users can insert into their own collections OR official collections
    (EXISTS (
        SELECT 1 FROM collections c 
        WHERE c.id = flashcard_collections_junction.collection_id 
        AND (c.user_id = (select auth.uid()) OR c.is_official = true)
    ))
);

-- =============================================================================
-- 3. REMAINING FLASHCARDS CONSOLIDATIONS
-- =============================================================================
-- Handle remaining flashcards anon SELECT and authenticated UPDATE consolidations

-- FLASHCARDS anon SELECT consolidation: Remove redundant sample policies
DROP POLICY IF EXISTS "Anyone can view public sample flashcards" ON "public"."flashcards";
DROP POLICY IF EXISTS "Anyone can view sample flashcards" ON "public"."flashcards";

-- Keep only the anonymous sample policy created in Phase 2.1
-- This should already exist from Phase 2.1: "Anonymous users can view sample flashcards"
-- If it doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'flashcards' 
        AND policyname = 'Anonymous users can view sample flashcards'
    ) THEN
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
    END IF;
END $$;

-- FLASHCARDS authenticated UPDATE consolidation: Admin OR owner
DROP POLICY IF EXISTS "Admins can update any flashcard" ON "public"."flashcards";
DROP POLICY IF EXISTS "Users can update their own flashcards" ON "public"."flashcards";

CREATE POLICY "Authenticated users can update flashcards" ON "public"."flashcards"
FOR UPDATE TO authenticated
USING (
    -- Admins can update any flashcard
    (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = (select auth.uid()) 
            AND profiles.is_admin = true
        )
    )
    OR 
    -- Users can update their own flashcards
    ((select auth.uid()) = created_by)
)
WITH CHECK (
    -- Same conditions for WITH CHECK
    (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = (select auth.uid()) 
            AND profiles.is_admin = true
        )
    )
    OR 
    ((select auth.uid()) = created_by)
);

-- =============================================================================
-- VALIDATION FOR PHASE 2.3
-- =============================================================================

-- Check for remaining multiple permissive policies across all affected tables
DO $$
DECLARE
    remaining_conflicts INTEGER;
    total_policies INTEGER;
BEGIN
    -- Count remaining conflicts
    SELECT COUNT(*) INTO remaining_conflicts
    FROM (
        SELECT tablename, cmd, roles
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('collection_subjects', 'flashcard_collections_junction', 'flashcards')
        GROUP BY tablename, cmd, roles
        HAVING COUNT(*) > 1
    ) conflicts;
    
    -- Count total policies for these tables
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('collection_subjects', 'flashcard_collections_junction', 'flashcards');
    
    RAISE NOTICE 'PHASE 2.3: Remaining policy conflicts: %', remaining_conflicts;
    RAISE NOTICE 'PHASE 2.3: Total policies for affected tables: %', total_policies;
    
    IF remaining_conflicts = 0 THEN
        RAISE NOTICE 'PHASE 2.3: ✅ Successfully eliminated all multiple permissive policy conflicts';
    ELSE
        RAISE WARNING 'PHASE 2.3: Still have % policy conflicts remaining', remaining_conflicts;
    END IF;
END $$;

-- Final summary across all tables affected by Phase 2 consolidation
SELECT 
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'collection_subjects', 
    'flashcard_collections_junction', 
    'flashcards',
    'courses',
    'lessons', 
    'modules',
    'user_entitlements',
    'user_subscriptions'
)
GROUP BY tablename
ORDER BY tablename;

-- Check for any remaining multiple permissive policy conflicts across ALL tables
SELECT 
    'FINAL CHECK: Multiple permissive policies remaining' as status,
    COUNT(*) as conflict_count
FROM (
    SELECT tablename, cmd, roles
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd, roles
    HAVING COUNT(*) > 1
) all_conflicts;

COMMIT; 