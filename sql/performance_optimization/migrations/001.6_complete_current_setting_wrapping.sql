-- Phase 1.6: Complete current_setting() Function Wrapping
-- Fixes current_setting() calls that are still unwrapped in the 5 flagged policies
-- This should finally resolve all Auth RLS Initialization Plan warnings

BEGIN;

-- =============================================================================
-- WRAP CURRENT_SETTING() CALLS IN FLAGGED POLICIES
-- =============================================================================

-- courses table - "Anyone can view published course info"
DROP POLICY IF EXISTS "Anyone can view published course info" ON "public"."courses";
CREATE POLICY "Anyone can view published course info" ON "public"."courses" 
FOR SELECT TO anon, authenticated, authenticator, dashboard_user 
USING (((status = 'Published'::lesson_status) AND (((select current_setting('app.public_access'::text, true))::boolean) OR ((select auth.role()) = 'authenticated'::text))));

-- flashcards table - "Anyone can view sample flashcards"  
DROP POLICY IF EXISTS "Anyone can view sample flashcards" ON "public"."flashcards";
CREATE POLICY "Anyone can view sample flashcards" ON "public"."flashcards"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((is_official = true) AND (is_public_sample = true) AND (((select current_setting('app.public_access'::text, true))::boolean) OR ((select auth.role()) = 'authenticated'::text))));

-- lessons table - "Anyone can view published lesson titles"
DROP POLICY IF EXISTS "Anyone can view published lesson titles" ON "public"."lessons";
CREATE POLICY "Anyone can view published lesson titles" ON "public"."lessons"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((status = 'Published'::lesson_status) AND (module_id IN ( SELECT m.id
   FROM modules m
  WHERE (m.course_id IN ( SELECT c.id
           FROM courses c
          WHERE (c.status = 'Published'::lesson_status))))) AND (((select current_setting('app.public_access'::text, true))::boolean) OR ((select auth.role()) = 'authenticated'::text))));

-- modules table - "Anyone can view published module titles"
DROP POLICY IF EXISTS "Anyone can view published module titles" ON "public"."modules";
CREATE POLICY "Anyone can view published module titles" ON "public"."modules"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((course_id IN ( SELECT courses.id
   FROM courses
  WHERE (courses.status = 'Published'::lesson_status))) AND (((select current_setting('app.public_access'::text, true))::boolean) OR ((select auth.role()) = 'authenticated'::text))));

-- subjects table - "Anyone can view official subjects"
DROP POLICY IF EXISTS "Anyone can view official subjects" ON "public"."subjects";
CREATE POLICY "Anyone can view official subjects" ON "public"."subjects"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((is_official = true) AND (((select current_setting('app.public_access'::text, true))::boolean) OR ((select auth.role()) = 'authenticated'::text))));

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify no unwrapped current_setting() calls remain
SELECT 
  tablename,
  policyname,
  'current_setting()' as function_type,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND qual ~ '\Wcurrent_setting\('
  AND NOT qual ~ '\WSELECT\s+.*current_setting\('
  AND policyname IN (
    'Anyone can view published course info',
    'Anyone can view sample flashcards', 
    'Anyone can view published lesson titles',
    'Anyone can view published module titles',
    'Anyone can view official subjects'
  );

-- Should return 0 rows - all current_setting() calls should be wrapped

-- Verify no unwrapped auth function calls remain
SELECT 
  tablename,
  policyname,
  'auth functions' as function_type,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND qual ~ '\Wauth\.(uid|is_admin|role|jwt)\('
  AND NOT qual ~ '\WSELECT\s+.*auth\.(uid|is_admin|role|jwt)\('
  AND policyname IN (
    'Anyone can view published course info',
    'Anyone can view sample flashcards', 
    'Anyone can view published lesson titles',
    'Anyone can view published module titles',
    'Anyone can view official subjects'
  );

-- Should return 0 rows - all auth function calls should be wrapped

-- Count total wrapped function calls
SELECT 
  'PHASE 1.6 COMPLETION SUMMARY' as validation_summary,
  (
    SELECT COUNT(*) FROM pg_policies 
    WHERE schemaname = 'public'
      AND (
        qual ~ '\WSELECT\s+.*auth\.(uid|is_admin|role|jwt)\(\)' 
        OR qual ~ '\WSELECT\s+.*current_setting\('
        OR with_check ~ '\WSELECT\s+.*auth\.(uid|is_admin|role|jwt)\(\)'
        OR with_check ~ '\WSELECT\s+.*current_setting\('
      )
  ) as total_wrapped_function_calls;

COMMIT; 