-- Phase 1.5 CORRECTED: Complete Auth Function Wrapping
-- Fixes the remaining 5 Auth RLS Initialization Plan warnings
-- Uses DROP/CREATE approach instead of ALTER POLICY

BEGIN;

-- =============================================================================
-- CORRECTED AUTH.ROLE() WRAPPING FIXES - DROP/CREATE APPROACH
-- =============================================================================

-- courses table - "Anyone can view published course info"
DROP POLICY IF EXISTS "Anyone can view published course info" ON "public"."courses";
CREATE POLICY "Anyone can view published course info" ON "public"."courses" 
FOR SELECT TO anon, authenticated, authenticator, dashboard_user 
USING (((status = 'Published'::lesson_status) AND ((current_setting('app.public_access'::text, true))::boolean OR ((select auth.role()) = 'authenticated'::text))));

-- flashcards table - "Anyone can view sample flashcards"  
DROP POLICY IF EXISTS "Anyone can view sample flashcards" ON "public"."flashcards";
CREATE POLICY "Anyone can view sample flashcards" ON "public"."flashcards"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((is_official = true) AND (is_public_sample = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR ((select auth.role()) = 'authenticated'::text))));

-- lessons table - "Anyone can view published lesson titles"
DROP POLICY IF EXISTS "Anyone can view published lesson titles" ON "public"."lessons";
CREATE POLICY "Anyone can view published lesson titles" ON "public"."lessons"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((status = 'Published'::lesson_status) AND (module_id IN ( SELECT m.id
   FROM modules m
  WHERE (m.course_id IN ( SELECT c.id
           FROM courses c
          WHERE (c.status = 'Published'::lesson_status))))) AND ((current_setting('app.public_access'::text, true))::boolean OR ((select auth.role()) = 'authenticated'::text))));

-- modules table - "Anyone can view published module titles"
DROP POLICY IF EXISTS "Anyone can view published module titles" ON "public"."modules";
CREATE POLICY "Anyone can view published module titles" ON "public"."modules"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((course_id IN ( SELECT courses.id
   FROM courses
  WHERE (courses.status = 'Published'::lesson_status))) AND ((current_setting('app.public_access'::text, true))::boolean OR ((select auth.role()) = 'authenticated'::text))));

-- subjects table - "Anyone can view official subjects"
DROP POLICY IF EXISTS "Anyone can view official subjects" ON "public"."subjects";
CREATE POLICY "Anyone can view official subjects" ON "public"."subjects"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((is_official = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR ((select auth.role()) = 'authenticated'::text))));

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify all auth.role() calls are now wrapped
SELECT 
  tablename,
  policyname,
  'auth.role()' as function_type,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    qual ~ '\Wauth\.role\(\)' 
  )
  AND NOT (
    qual ~ '\WSELECT\s+.*auth\.role\(\)'
  );

-- Should return 0 rows - all auth.role() calls should be wrapped

-- Count total wrapped auth function calls
SELECT 
  'PHASE 1.5 CORRECTED COMPLETION SUMMARY' as validation_summary,
  (
    SELECT COUNT(*) FROM pg_policies 
    WHERE schemaname = 'public'
      AND (qual ~ '\WSELECT\s+.*auth\.(uid|is_admin|role|jwt)\(\)' OR with_check ~ '\WSELECT\s+.*auth\.(uid|is_admin|role|jwt)\(\)')
  ) as total_wrapped_auth_calls;

COMMIT; 