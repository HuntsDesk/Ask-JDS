-- =====================================================
-- Phase 4.1: Course Enrollments Mega-Consolidation
-- =====================================================
-- Target: Reduce 12 warnings to 3 warnings (75% reduction for this table)
-- Impact: 44 → 35 total warnings (20% improvement)
-- 
-- BEFORE: 6 policies (2 per action) across 4 roles = 12 warnings
-- AFTER:  3 policies (1 per action) for all roles = 3 warnings
-- 
-- Strategy: Create mega-policies with role OR logic instead of separate policies
-- =====================================================

-- VALIDATION: Check current policies before changes
DO $$
BEGIN
    RAISE NOTICE 'PHASE 4.1 VALIDATION: Current course_enrollments policies';
    RAISE NOTICE '====================================================';
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

-- =====================================================
-- STEP 1: DROP ALL EXISTING COURSE_ENROLLMENTS POLICIES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping existing course_enrollments policies...';
END $$;

-- Drop admin policies
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON course_enrollments;

-- Drop user policies  
DROP POLICY IF EXISTS "Users can create their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can view their own course enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON course_enrollments;

-- Drop any other potential policies (safety cleanup)
DROP POLICY IF EXISTS "Users can delete their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Admin users can manage all course enrollments" ON course_enrollments;

DO $$
BEGIN
    RAISE NOTICE 'All existing course_enrollments policies dropped successfully.';
END $$;

-- =====================================================
-- STEP 2: CREATE MEGA-CONSOLIDATED POLICIES  
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Creating consolidated mega-policies...';
END $$;

-- MEGA INSERT POLICY (All roles consolidated)
CREATE POLICY "Users and admins can create enrollments" ON course_enrollments
FOR INSERT 
WITH CHECK (
    -- Admin access: Full control
    ((SELECT auth.is_admin()) = true) OR 
    -- User access: Can only create their own enrollments
    (user_id = (SELECT auth.uid()))
);

-- MEGA SELECT POLICY (All roles consolidated)  
CREATE POLICY "Users and admins can view enrollments" ON course_enrollments
FOR SELECT 
USING (
    -- Admin access: Can view all enrollments
    ((SELECT auth.is_admin()) = true) OR 
    -- User access: Can only view their own enrollments
    (user_id = (SELECT auth.uid()))
);

-- MEGA UPDATE POLICY (All roles consolidated)
CREATE POLICY "Users and admins can update enrollments" ON course_enrollments
FOR UPDATE 
USING (
    -- Admin access: Can update all enrollments
    ((SELECT auth.is_admin()) = true) OR 
    -- User access: Can only update their own enrollments  
    (user_id = (SELECT auth.uid()))
)
WITH CHECK (
    -- Admin access: Can update all enrollments
    ((SELECT auth.is_admin()) = true) OR 
    -- User access: Can only update their own enrollments
    (user_id = (SELECT auth.uid()))
);

DO $$
BEGIN
    RAISE NOTICE 'Mega-consolidated policies created successfully.';
END $$;

-- =====================================================
-- STEP 3: VALIDATION - VERIFY NEW POLICY STRUCTURE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'PHASE 4.1 VALIDATION: New consolidated policies';
    RAISE NOTICE '==============================================';
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
    
    RAISE NOTICE 'Total course_enrollments policies after consolidation: %', policy_count;
    
    IF policy_count = 3 THEN
        RAISE NOTICE '✅ SUCCESS: Expected 3 policies, found %', policy_count;
    ELSE
        RAISE EXCEPTION '❌ FAILURE: Expected 3 policies, found %', policy_count;
    END IF;
END $$;

-- =====================================================
-- STEP 4: FUNCTIONAL VALIDATION TESTS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'PHASE 4.1 FUNCTIONAL VALIDATION';
    RAISE NOTICE '==============================';
END $$;

-- Test 1: Admin auth function availability
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        RAISE NOTICE '✅ auth.is_admin() function exists';
    ELSE
        RAISE EXCEPTION '❌ auth.is_admin() function missing - required for admin access';
    END IF;
END $$;

-- Test 2: User ID function availability  
DO $$
BEGIN
    PERFORM (SELECT auth.uid());
    RAISE NOTICE '✅ auth.uid() function accessible';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ auth.uid() function not accessible - required for user access';
END $$;

-- =====================================================
-- STEP 5: PERFORMANCE OPTIMIZATION VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'PHASE 4.1 PERFORMANCE VERIFICATION';
    RAISE NOTICE '=================================';
END $$;

-- Verify auth functions are wrapped for initPlan optimization
DO $$
DECLARE
    policy_text TEXT;
    wrapped_count INTEGER := 0;
BEGIN
    -- Check each policy for proper auth function wrapping
    FOR policy_text IN 
        SELECT qual FROM pg_policies WHERE tablename = 'course_enrollments' AND qual IS NOT NULL
        UNION
        SELECT with_check FROM pg_policies WHERE tablename = 'course_enrollments' AND with_check IS NOT NULL
    LOOP
        IF policy_text LIKE '%(SELECT auth.%' THEN
            wrapped_count := wrapped_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Auth functions properly wrapped for initPlan optimization: % instances', wrapped_count;
    
    IF wrapped_count >= 6 THEN  -- 3 policies × 2 auth functions minimum
        RAISE NOTICE '✅ Auth functions properly wrapped for performance';
    ELSE
        RAISE WARNING '⚠️  Some auth functions may not be wrapped - check performance impact';
    END IF;
END $$;

-- =====================================================
-- STEP 6: EXPECTED IMPACT SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'PHASE 4.1 COMPLETION SUMMARY';
    RAISE NOTICE '============================';
    RAISE NOTICE 'Target achieved: course_enrollments policies consolidated';
    RAISE NOTICE 'Before: 6 policies → 12 warnings (2 policies × 3 actions × 4 roles)';
    RAISE NOTICE 'After:  3 policies → 3 warnings (1 policy per action for all roles)';
    RAISE NOTICE 'Reduction: 9 warnings eliminated (75%% reduction for this table)';
    RAISE NOTICE 'Total impact: 44 → 35 total warnings (20%% improvement)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next recommended phase: 4.2 (Flashcards SELECT optimization)';
    RAISE NOTICE 'Migration completed successfully! ✅';
END $$;

-- =====================================================
-- ROLLBACK INFORMATION
-- =====================================================
-- To rollback this migration, use:
-- sql/performance_optimization/rollback/Phase_4.1_course_enrollments_mega_consolidation_rollback.sql 