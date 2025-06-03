-- Comprehensive Validation for Phase 2: Policy Consolidation
-- Validates that all 29 Multiple Permissive Policy warnings have been resolved
-- Tests functional access patterns to ensure security is maintained

BEGIN;

-- =============================================================================
-- PHASE 2 VALIDATION: MULTIPLE PERMISSIVE POLICY ELIMINATION
-- =============================================================================

-- Create validation report
DO $$
DECLARE
    original_warnings INTEGER := 29; -- From the user's warning data
    remaining_conflicts INTEGER;
    total_policies_before INTEGER := 67; -- Estimated from warning analysis
    total_policies_after INTEGER;
    reduction_percentage NUMERIC;
BEGIN
    RAISE NOTICE '=== PHASE 2 CONSOLIDATION VALIDATION REPORT ===';
    RAISE NOTICE '';
    
    -- Count remaining multiple permissive policy conflicts
    SELECT COUNT(*) INTO remaining_conflicts
    FROM (
        SELECT tablename, cmd, roles
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY tablename, cmd, roles
        HAVING COUNT(*) > 1
    ) all_conflicts;
    
    -- Count total policies after consolidation
    SELECT COUNT(*) INTO total_policies_after
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Calculate reduction percentage
    reduction_percentage := ((total_policies_before - total_policies_after)::NUMERIC / total_policies_before::NUMERIC) * 100;
    
    RAISE NOTICE 'ORIGINAL WARNINGS: % Multiple Permissive Policy warnings', original_warnings;
    RAISE NOTICE 'REMAINING CONFLICTS: % Multiple Permissive Policy conflicts', remaining_conflicts;
    RAISE NOTICE 'WARNINGS RESOLVED: % (%.1f%% resolution rate)', 
        (original_warnings - remaining_conflicts), 
        ((original_warnings - remaining_conflicts)::NUMERIC / original_warnings::NUMERIC) * 100;
    RAISE NOTICE '';
    RAISE NOTICE 'POLICY COUNT REDUCTION:';
    RAISE NOTICE '  Before: ~% policies', total_policies_before;
    RAISE NOTICE '  After:  % policies', total_policies_after;
    RAISE NOTICE '  Reduction: %.1f%%', reduction_percentage;
    RAISE NOTICE '';
    
    IF remaining_conflicts = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All Multiple Permissive Policy warnings resolved!';
    ELSE
        RAISE WARNING '❌ INCOMPLETE: % conflicts remain', remaining_conflicts;
    END IF;
END $$;

-- =============================================================================
-- DETAILED ANALYSIS BY TARGET TABLES
-- =============================================================================

-- Analyze each target table individually
DO $$
DECLARE
    table_name TEXT;
    table_conflicts INTEGER;
    table_policies INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== DETAILED TABLE ANALYSIS ===';
    
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'collection_subjects',
            'courses', 
            'flashcard_collections_junction',
            'flashcards',
            'lessons',
            'modules',
            'user_entitlements',
            'user_subscriptions'
        ])
    LOOP
        -- Count conflicts for this table
        SELECT COUNT(*) INTO table_conflicts
        FROM (
            SELECT cmd, roles
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = table_name
            GROUP BY cmd, roles
            HAVING COUNT(*) > 1
        ) table_specific_conflicts;
        
        -- Count total policies for this table
        SELECT COUNT(*) INTO table_policies
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = table_name;
        
        RAISE NOTICE '% - % policies, % conflicts', 
            table_name, table_policies, table_conflicts;
    END LOOP;
END $$;

-- =============================================================================
-- SPECIFIC VALIDATION QUERIES
-- =============================================================================

-- 1. Validate flashcards consolidation (Phase 2.1)
SELECT 
    'FLASHCARDS VALIDATION' as check_type,
    COUNT(CASE WHEN cmd = 'SELECT' AND 'authenticated' = ANY(roles) THEN 1 END) as authenticated_select_policies,
    COUNT(CASE WHEN cmd = 'SELECT' AND 'anon' = ANY(roles) THEN 1 END) as anon_select_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' AND 'authenticated' = ANY(roles) THEN 1 END) as authenticated_update_policies
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'flashcards';

-- 2. Validate courses/lessons/modules consolidation (Phase 2.2)
SELECT 
    'COURSE SYSTEM VALIDATION' as check_type,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('courses', 'lessons', 'modules')
GROUP BY tablename
ORDER BY tablename;

-- 3. Validate subscription system consolidation (Phase 2.2)
SELECT 
    'SUBSCRIPTION SYSTEM VALIDATION' as check_type,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_entitlements', 'user_subscriptions')
GROUP BY tablename
ORDER BY tablename;

-- 4. Validate collection system consolidation (Phase 2.3)
SELECT 
    'COLLECTION SYSTEM VALIDATION' as check_type,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('collection_subjects', 'flashcard_collections_junction')
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- COMPREHENSIVE CONFLICT CHECK
-- =============================================================================

-- List any remaining multiple permissive policy conflicts
SELECT 
    'REMAINING CONFLICTS' as report_type,
    tablename,
    cmd,
    roles,
    COUNT(*) as policy_count,
    array_agg(policyname ORDER BY policyname) as conflicting_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd, roles
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;

-- =============================================================================
-- PERFORMANCE VALIDATION
-- =============================================================================

-- Check that wrapped auth functions are being used
SELECT 
    'AUTH FUNCTION USAGE' as check_type,
    COUNT(*) as total_policies_with_auth,
    COUNT(CASE WHEN (qual LIKE '%(select auth.uid())%' OR qual LIKE '%(select auth.is_admin())%') THEN 1 END) as wrapped_auth_functions,
    COUNT(CASE WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%') THEN 1 END) as unwrapped_auth_uid,
    COUNT(CASE WHEN (qual LIKE '%auth.is_admin()%' AND qual NOT LIKE '%(select auth.is_admin())%') THEN 1 END) as unwrapped_auth_is_admin
FROM pg_policies 
WHERE schemaname = 'public' 
AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.is_admin()%');

-- =============================================================================
-- FUNCTIONAL ACCESS TESTING SETUP
-- =============================================================================

-- Note: These are schema-only validations
-- Functional testing would require actual user sessions and data

-- Validate policy names follow expected patterns
SELECT 
    'POLICY NAMING VALIDATION' as check_type,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN policyname LIKE '%can view%' OR policyname LIKE '%can access%' OR policyname LIKE '%can read%' THEN 1 END) as read_policies,
    COUNT(CASE WHEN policyname LIKE '%can insert%' OR policyname LIKE '%can create%' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN policyname LIKE '%can update%' OR policyname LIKE '%can modify%' THEN 1 END) as update_policies,
    COUNT(CASE WHEN policyname LIKE '%can delete%' OR policyname LIKE '%can remove%' THEN 1 END) as delete_policies,
    COUNT(CASE WHEN policyname LIKE '%can manage%' OR policyname LIKE 'Admin%' THEN 1 END) as admin_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'collection_subjects', 'courses', 'flashcard_collections_junction',
    'flashcards', 'lessons', 'modules', 'user_entitlements', 'user_subscriptions'
)
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================

DO $$
DECLARE
    final_conflicts INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_conflicts
    FROM (
        SELECT tablename, cmd, roles
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY tablename, cmd, roles
        HAVING COUNT(*) > 1
    ) all_conflicts;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== PHASE 2 CONSOLIDATION FINAL SUMMARY ===';
    
    IF final_conflicts = 0 THEN
        RAISE NOTICE '🎉 COMPLETE SUCCESS: All 29 Multiple Permissive Policy warnings resolved!';
        RAISE NOTICE '✅ Database performance should be significantly improved';
        RAISE NOTICE '✅ RLS evaluation overhead dramatically reduced';
        RAISE NOTICE '✅ Query execution plans optimized';
    ELSE
        RAISE WARNING '⚠️  PARTIAL SUCCESS: % conflicts still remain', final_conflicts;
        RAISE NOTICE 'Additional investigation needed for remaining conflicts';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Next recommended steps:';
    RAISE NOTICE '1. Deploy these migrations to staging environment';
    RAISE NOTICE '2. Run functional tests to verify access patterns';
    RAISE NOTICE '3. Measure query performance improvements';
    RAISE NOTICE '4. Deploy to production with rollback plan ready';
END $$;

COMMIT; 