-- Rollback for Phase 1.6: Complete current_setting() Function Wrapping
-- Restores policies to the state after Phase 1.5 (auth.role wrapped, current_setting unwrapped)

BEGIN;

-- =============================================================================
-- ROLLBACK TO PHASE 1.5 STATE - UNWRAP CURRENT_SETTING() CALLS
-- =============================================================================

-- courses table - restore Phase 1.5 state
DROP POLICY IF EXISTS "Anyone can view published course info" ON "public"."courses";
CREATE POLICY "Anyone can view published course info" ON "public"."courses" 
FOR SELECT TO anon, authenticated, authenticator, dashboard_user 
USING (((status = 'Published'::lesson_status) AND ((current_setting('app.public_access'::text, true))::boolean OR ((select auth.role()) = 'authenticated'::text))));

-- flashcards table - restore Phase 1.5 state
DROP POLICY IF EXISTS "Anyone can view sample flashcards" ON "public"."flashcards";
CREATE POLICY "Anyone can view sample flashcards" ON "public"."flashcards"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((is_official = true) AND (is_public_sample = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR ((select auth.role()) = 'authenticated'::text))));

-- lessons table - restore Phase 1.5 state
DROP POLICY IF EXISTS "Anyone can view published lesson titles" ON "public"."lessons";
CREATE POLICY "Anyone can view published lesson titles" ON "public"."lessons"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((status = 'Published'::lesson_status) AND (module_id IN ( SELECT m.id
   FROM modules m
  WHERE (m.course_id IN ( SELECT c.id
           FROM courses c
          WHERE (c.status = 'Published'::lesson_status))))) AND ((current_setting('app.public_access'::text, true))::boolean OR ((select auth.role()) = 'authenticated'::text))));

-- modules table - restore Phase 1.5 state
DROP POLICY IF EXISTS "Anyone can view published module titles" ON "public"."modules";
CREATE POLICY "Anyone can view published module titles" ON "public"."modules"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((course_id IN ( SELECT courses.id
   FROM courses
  WHERE (courses.status = 'Published'::lesson_status))) AND ((current_setting('app.public_access'::text, true))::boolean OR ((select auth.role()) = 'authenticated'::text))));

-- subjects table - restore Phase 1.5 state
DROP POLICY IF EXISTS "Anyone can view official subjects" ON "public"."subjects";
CREATE POLICY "Anyone can view official subjects" ON "public"."subjects"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((is_official = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR ((select auth.role()) = 'authenticated'::text))));

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify current_setting() calls are back to unwrapped state
SELECT COUNT(*) as unwrapped_current_setting_calls
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

-- Should return 5 after rollback (unwrapped current_setting calls restored)

COMMIT; 