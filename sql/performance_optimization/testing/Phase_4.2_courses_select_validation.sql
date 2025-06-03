-- =====================================================
-- Phase 4.2 VALIDATION: Courses SELECT Prerequisites
-- =====================================================
-- This script validates prerequisites for courses SELECT mega-consolidation
-- Run this BEFORE executing the main migration to ensure safety
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'PHASE 4.2 VALIDATION: Courses SELECT Mega-Consolidation Prerequisites';
    RAISE NOTICE '====================================================================';
END $$;

-- =====================================================
-- PREREQUISITE 1: Verify expected policies exist
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Checking for expected courses SELECT policies...';
END $$;

SELECT 
    'EXPECTED_POLICIES' as check_type,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'courses' AND cmd = 'SELECT'
ORDER BY policyname;

-- Verify we have exactly 4 SELECT policies (or at least the conflicting ones)
DO $$
DECLARE
    policy_count INTEGER;
    expected_policies TEXT[] := ARRAY[
        'Admins can manage all courses',
        'Anyone can view published course info', 
        'Authenticated users can view all courses',
        'Users can see published or purchased courses'
    ];
    missing_policies TEXT[] := '{}';
    policy_name TEXT;
BEGIN
    -- Check each expected policy exists
    FOREACH policy_name IN ARRAY expected_policies LOOP
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE tablename = 'courses' 
          AND policyname = policy_name;
          
        IF policy_count = 0 THEN
            missing_policies := array_append(missing_policies, policy_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_policies, 1) > 0 THEN
        RAISE NOTICE 'WARNING: Missing expected policies: %', missing_policies;
    ELSE
        RAISE NOTICE 'SUCCESS: All expected policies found';
    END IF;
END $$;

-- =====================================================
-- PREREQUISITE 2: Verify table structure and dependencies
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Checking courses table structure...';
END $$;

-- Check table exists and has required columns
SELECT 
    'TABLE_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'courses'
  AND column_name IN ('id', 'status', 'title')
ORDER BY column_name;

-- =====================================================
-- PREREQUISITE 3: Verify auth functions are accessible
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Checking auth function accessibility...';
END $$;

-- Test auth functions (non-destructive check)
DO $$
BEGIN
    -- Test auth.is_admin() function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'auth' AND p.proname = 'is_admin'
    ) THEN
        RAISE NOTICE 'SUCCESS: auth.is_admin() function available';
    ELSE
        RAISE NOTICE 'WARNING: auth.is_admin() function not found';
    END IF;
    
    -- Test auth.uid() function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'auth' AND p.proname = 'uid'
    ) THEN
        RAISE NOTICE 'SUCCESS: auth.uid() function available';
    ELSE
        RAISE NOTICE 'WARNING: auth.uid() function not found';
    END IF;
    
    -- Test auth.role() function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'auth' AND p.proname = 'role'
    ) THEN
        RAISE NOTICE 'SUCCESS: auth.role() function available';
    ELSE
        RAISE NOTICE 'WARNING: auth.role() function not found';
    END IF;
END $$;

-- =====================================================
-- PREREQUISITE 4: Check course_enrollments relationship
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Checking course_enrollments dependency...';
END $$;

-- Verify course_enrollments table exists (needed for enrollment logic)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'course_enrollments'
    ) THEN
        RAISE NOTICE 'SUCCESS: course_enrollments table exists';
    ELSE
        RAISE NOTICE 'WARNING: course_enrollments table not found';
    END IF;
END $$;

-- =====================================================
-- PREREQUISITE 5: Check for potential conflicts
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Checking for potential conflicts...';
END $$;

-- Check if there are any other policies that might conflict
SELECT 
    'OTHER_POLICIES' as check_type,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'courses' AND cmd != 'SELECT'
ORDER BY cmd, policyname;

-- =====================================================
-- PREREQUISITE 6: Final safety check
-- =====================================================

DO $$
DECLARE
    total_policies INTEGER;
    select_policies INTEGER;
BEGIN
    RAISE NOTICE 'FINAL SAFETY CHECK';
    RAISE NOTICE '==================';
    
    -- Count current policies
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies 
    WHERE tablename = 'courses';
    
    SELECT COUNT(*) INTO select_policies
    FROM pg_policies 
    WHERE tablename = 'courses' AND cmd = 'SELECT';
    
    RAISE NOTICE 'Current courses table: % total policies, % SELECT policies', total_policies, select_policies;
    
    -- Safety recommendation
    IF select_policies >= 3 THEN
        RAISE NOTICE 'READY: Multiple SELECT policies detected - consolidation will provide benefit';
    ELSE
        RAISE NOTICE 'WARNING: Low SELECT policy count - verify migration is needed';
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE 'VALIDATION COMPLETE - Review output before proceeding with migration';
END $$; 