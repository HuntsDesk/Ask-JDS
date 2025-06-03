-- =====================================================
-- Phase 4.1 ROLLBACK: Course Enrollments Mega-Consolidation
-- =====================================================
-- This script restores the original course_enrollments policies
-- if Phase 4.1 migration needs to be reverted
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'PHASE 4.1 ROLLBACK: Restoring original course_enrollments policies';
    RAISE NOTICE '==================================================================';
END $$;

-- STEP 1: Drop consolidated policies
DO $$
BEGIN
    RAISE NOTICE 'Dropping consolidated mega-policies...';
END $$;

DROP POLICY IF EXISTS "Users and admins can create enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users and admins can view enrollments" ON course_enrollments;  
DROP POLICY IF EXISTS "Users and admins can update enrollments" ON course_enrollments;

DO $$
BEGIN
    RAISE NOTICE 'Consolidated policies dropped successfully.';
END $$;

-- STEP 2: Restore original separate policies
DO $$
BEGIN
    RAISE NOTICE 'Restoring original separate admin and user policies...';
END $$;

-- Restore admin policy (covers all actions)
CREATE POLICY "Admins can manage all enrollments" ON course_enrollments
FOR ALL
USING ((SELECT auth.is_admin()) = true)
WITH CHECK ((SELECT auth.is_admin()) = true);

-- Restore user INSERT policy
CREATE POLICY "Users can create their own enrollments" ON course_enrollments
FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

-- Restore user SELECT policy  
CREATE POLICY "Users can view their own course enrollments" ON course_enrollments
FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- Restore user UPDATE policy
CREATE POLICY "Users can update their own enrollments" ON course_enrollments  
FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DO $$
BEGIN
    RAISE NOTICE 'Original policies restored successfully.';
END $$;

-- STEP 3: Validation - verify rollback
DO $$
BEGIN
    RAISE NOTICE 'ROLLBACK VALIDATION: Restored policies';
    RAISE NOTICE '===================================';
END $$;

SELECT 
    policyname,
    cmd,
    permissive, 
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'course_enrollments'
ORDER BY cmd, policyname;

-- Count validation
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'course_enrollments';
    
    RAISE NOTICE 'Total course_enrollments policies after rollback: %', policy_count;
    
    IF policy_count = 4 THEN
        RAISE NOTICE '✅ ROLLBACK SUCCESS: Expected 4 policies, found %', policy_count;
        RAISE NOTICE 'Policies restored: 1 admin + 3 user policies';
    ELSE
        RAISE WARNING '⚠️  ROLLBACK ISSUE: Expected 4 policies, found %', policy_count;
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE 'PHASE 4.1 ROLLBACK COMPLETED';
    RAISE NOTICE 'Status: Original policy structure restored';
    RAISE NOTICE 'Impact: 3 warnings → 12 warnings (reverted consolidation)';
    RAISE NOTICE 'Note: Performance Advisor will show original warning count';
    RAISE NOTICE 'Rollback completed successfully! ✅';
END $$; 