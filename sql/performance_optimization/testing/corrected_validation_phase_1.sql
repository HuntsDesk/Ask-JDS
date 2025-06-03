-- Corrected Validation Script for Phase 1: Auth Function Wrapping
-- Properly detects unwrapped auth function calls accounting for Postgres formatting

-- =============================================================================
-- CORRECTED AUTH FUNCTION WRAPPING VALIDATION
-- =============================================================================

-- 1. Check for TRULY unwrapped auth.uid() calls
-- Any call that doesn't have SELECT in front of auth.uid() is unwrapped
SELECT 
  tablename,
  policyname,
  'auth.uid()' as function_type,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    -- Direct calls without SELECT wrapper
    qual ~ '\Wauth\.uid\(\)' 
    OR with_check ~ '\Wauth\.uid\(\)'
  )
  AND NOT (
    -- Properly wrapped calls (various formats)
    qual ~ '\WSELECT\s+.*auth\.uid\(\)'
    OR with_check ~ '\WSELECT\s+.*auth\.uid\(\)'
  );

-- 2. Check for TRULY unwrapped auth.is_admin() calls  
SELECT 
  tablename,
  policyname,
  'auth.is_admin()' as function_type,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    -- Direct calls without SELECT wrapper
    qual ~ '\Wauth\.is_admin\(\)' 
    OR with_check ~ '\Wauth\.is_admin\(\)'
  )
  AND NOT (
    -- Properly wrapped calls (various formats)
    qual ~ '\WSELECT\s+.*auth\.is_admin\(\)'
    OR with_check ~ '\WSELECT\s+.*auth\.is_admin\(\)'
  );

-- 3. Check for TRULY unwrapped auth.role() calls
SELECT 
  tablename,
  policyname,
  'auth.role()' as function_type,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    -- Direct calls without SELECT wrapper
    qual ~ '\Wauth\.role\(\)' 
    OR with_check ~ '\Wauth\.role\(\)'
  )
  AND NOT (
    -- Properly wrapped calls (various formats)
    qual ~ '\WSELECT\s+.*auth\.role\(\)'
    OR with_check ~ '\WSELECT\s+.*auth\.role\(\)'
  );

-- 4. Check for TRULY unwrapped auth.jwt() calls
SELECT 
  tablename,
  policyname,
  'auth.jwt()' as function_type,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    -- Direct calls without SELECT wrapper
    qual ~ '\Wauth\.jwt\(\)' 
    OR with_check ~ '\Wauth\.jwt\(\)'
  )
  AND NOT (
    -- Properly wrapped calls (various formats)
    qual ~ '\WSELECT\s+.*auth\.jwt\(\)'
    OR with_check ~ '\WSELECT\s+.*auth\.jwt\(\)'
  );

-- =============================================================================
-- SUMMARY COUNT OF TRULY UNWRAPPED CALLS
-- =============================================================================

SELECT 
  'TRULY UNWRAPPED AUTH CALLS SUMMARY' as validation_summary,
  (
    SELECT COUNT(*) FROM pg_policies 
    WHERE schemaname = 'public'
      AND (qual ~ '\Wauth\.(uid|is_admin|role|jwt)\(\)' OR with_check ~ '\Wauth\.(uid|is_admin|role|jwt)\(\)')
      AND NOT (qual ~ '\WSELECT\s+.*auth\.(uid|is_admin|role|jwt)\(\)' OR with_check ~ '\WSELECT\s+.*auth\.(uid|is_admin|role|jwt)\(\)')
  ) as unwrapped_count,
  (
    SELECT COUNT(*) FROM pg_policies 
    WHERE schemaname = 'public'
      AND (qual ~ '\WSELECT\s+.*auth\.(uid|is_admin|role|jwt)\(\)' OR with_check ~ '\WSELECT\s+.*auth\.(uid|is_admin|role|jwt)\(\)')
  ) as properly_wrapped_count;

-- =============================================================================
-- PERFORMANCE VERIFICATION
-- =============================================================================

-- Sample policies that should now be optimized
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN (qual ~ '\WSELECT\s+.*auth\.' OR with_check ~ '\WSELECT\s+.*auth\.') 
    THEN '✅ OPTIMIZED' 
    ELSE '❌ NOT OPTIMIZED'
  END as optimization_status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('threads', 'flashcards', 'course_enrollments')
  AND (qual ~ '\Wauth\.' OR with_check ~ '\Wauth\.')
ORDER BY tablename, policyname; 