-- Validation Script for Phase 1: Auth Function Wrapping
-- Tests that all auth function changes work correctly and don't break access patterns

-- =============================================================================
-- PRE-FLIGHT CHECKS
-- =============================================================================

-- Check that all target policies exist before attempting to modify them
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN (
    'Users can delete their own collection_subjects',
    'Users can insert their own collection_subjects', 
    'Users can delete their own flashcard_collections_junction',
    'Users can insert flashcard-collection associations',
    'Users can create their own enrollments',
    'Users can update their own enrollments',
    'Users can view their own course enrollments',
    'Users can delete their own flashcard progress',
    'Users can insert their own flashcard progress',
    'Users can update their own flashcard progress',
    'Users can view their own flashcard progress',
    'Users can insert flashcard-subject associations',
    'Admins can update any flashcard',
    'Admins can view all flashcards',
    'Users can delete their own flashcards',
    'Users can update their own flashcards',
    'Users can view their own flashcards',
    'Users can view their own lesson progress',
    'Users can insert their own message counts',
    'Users can update their own message counts',
    'Users can view their own message counts',
    'Users can create messages in own threads',
    'Users can view messages from own threads',
    'Users can insert their own profile',
    'Users can update their own profile',
    'Users can view their own profile',
    'Users can create own threads',
    'Users can delete own threads',
    'Users can update own threads',
    'Users can view own threads',
    'threads_delete_own',
    'threads_delete_policy',
    'threads_insert_own',
    'threads_insert_policy',
    'threads_select_policy',
    'threads_update_own',
    'threads_update_policy',
    'threads_view_own',
    'Users can read their own entitlements',
    'Users can view their own subscriptions',
    'Admin users can delete any collection_subjects',
    'Admin users can insert any collection_subjects',
    'Admin users can update any collection_subjects',
    'Admin users can delete any flashcard_collections_junction',
    'Admin users can insert any flashcard_collections_junction',
    'Admin users can update any flashcard_collections_junction',
    'Admin users can delete any flashcard_exam_types',
    'Admin users can insert any flashcard_exam_types',
    'Admin users can update any flashcard_exam_types',
    'Admin users can delete any flashcard_subjects',
    'Admin users can update any flashcard_subjects',
    'Admins can view all subscriptions',
    'Admins can manage all enrollments',
    'Admins can manage all courses',
    'Admins can manage all lessons',
    'Admins can manage all modules',
    'Admins can manage system prompts',
    'Only admins can view query logs',
    'Only admins can view error logs',
    'models_access',
    'Admins can create course-subject relationships',
    'Admins can delete course-subject relationships',
    'Admins can update course-subject relationships',
    'Only admins can manage exam types',
    'Anyone can view published course info',
    'Authenticated users can view all courses',
    'Anyone can view published lesson titles',
    'Anyone can view published module titles',
    'Anyone can view official subjects',
    'Anyone can view sample flashcards',
    'Only service role can insert/update/delete subscriptions',
    'Users can see published or purchased courses',
    'Users can view lessons for their enrolled courses',
    'Users can view modules for their enrolled courses',
    'Users can create error logs'
  )
ORDER BY tablename, policyname;

-- =============================================================================
-- POST-MIGRATION VALIDATION QUERIES
-- =============================================================================

-- 1. Verify auth.uid() wrapping patterns
SELECT 
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    qual LIKE '%auth.uid()%' 
    OR with_check LIKE '%auth.uid()%'
  )
  AND NOT (
    qual LIKE '%(select auth.uid())%'
    OR with_check LIKE '%(select auth.uid())%'
  );

-- Should return 0 rows after migration - all auth.uid() calls should be wrapped

-- 2. Verify auth.is_admin() wrapping patterns  
SELECT 
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    qual LIKE '%auth.is_admin()%' 
    OR with_check LIKE '%auth.is_admin()%'
  )
  AND NOT (
    qual LIKE '%(select auth.is_admin())%'
    OR with_check LIKE '%(select auth.is_admin())%'
  );

-- Should return 0 rows after migration - all auth.is_admin() calls should be wrapped

-- 3. Verify auth.role() wrapping patterns
SELECT 
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    qual LIKE '%auth.role()%' 
    OR with_check LIKE '%auth.role()%'
  )
  AND NOT (
    qual LIKE '%(select auth.role())%'
    OR with_check LIKE '%(select auth.role())%'
  );

-- Should return 0 rows after migration - all auth.role() calls should be wrapped

-- 4. Verify auth.jwt() wrapping patterns
SELECT 
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    qual LIKE '%auth.jwt()%' 
    OR with_check LIKE '%auth.jwt()%'
  )
  AND NOT (
    qual LIKE '%(select auth.jwt())%'
    OR with_check LIKE '%(select auth.jwt())%'
  );

-- Should return 0 rows after migration - all auth.jwt() calls should be wrapped

-- =============================================================================
-- FUNCTIONAL VALIDATION (Requires active user session)
-- =============================================================================

-- Test basic auth function availability
SELECT 
  (select auth.uid()) as current_user_id,
  (select auth.role()) as current_role,
  (select auth.is_admin()) as is_admin_result;

-- =============================================================================
-- PERFORMANCE VALIDATION QUERIES
-- =============================================================================

-- Sample query to check explain plan optimization for threads table
-- This should show initPlan usage for auth functions after migration
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM threads 
WHERE user_id = (select auth.uid())
LIMIT 10;

-- Sample query for flashcards table
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM flashcards 
WHERE created_by = (select auth.uid())
LIMIT 10;

-- =============================================================================
-- POLICY COUNT VERIFICATION
-- =============================================================================

-- Count policies by table to verify no policies were accidentally dropped
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- =============================================================================
-- SPECIFIC TABLE VALIDATIONS
-- =============================================================================

-- Validate threads table policies (should still have all 12 policies)
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'threads'
ORDER BY policyname;

-- Validate course_enrollments policies  
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'course_enrollments'
ORDER BY policyname;

-- Validate flashcards policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'flashcards'
ORDER BY policyname; 