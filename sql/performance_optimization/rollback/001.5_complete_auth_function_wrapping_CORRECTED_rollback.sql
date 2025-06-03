-- Rollback for Phase 1.5 CORRECTED: Complete Auth Function Wrapping
-- Restores original auth.role() calls without SELECT wrapping
-- Uses DROP/CREATE approach to restore original policies

BEGIN;

-- =============================================================================
-- ROLLBACK AUTH.ROLE() WRAPPING FIXES - RESTORE ORIGINAL POLICIES
-- =============================================================================

-- courses table - restore original "Anyone can view published course info"
DROP POLICY IF EXISTS "Anyone can view published course info" ON "public"."courses";
CREATE POLICY "Anyone can view published course info" ON "public"."courses"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((status = 'Published'::lesson_status) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text))));

-- flashcards table - restore original "Anyone can view sample flashcards"  
DROP POLICY IF EXISTS "Anyone can view sample flashcards" ON "public"."flashcards";
CREATE POLICY "Anyone can view sample flashcards" ON "public"."flashcards"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((is_official = true) AND (is_public_sample = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR (auth.role() = 'authenticated'::text))));

-- lessons table - restore original "Anyone can view published lesson titles"
DROP POLICY IF EXISTS "Anyone can view published lesson titles" ON "public"."lessons";
CREATE POLICY "Anyone can view published lesson titles" ON "public"."lessons"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((status = 'Published'::lesson_status) AND (module_id IN ( SELECT m.id
   FROM modules m
  WHERE (m.course_id IN ( SELECT c.id
           FROM courses c
          WHERE (c.status = 'Published'::lesson_status))))) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text))));

-- modules table - restore original "Anyone can view published module titles"
DROP POLICY IF EXISTS "Anyone can view published module titles" ON "public"."modules";
CREATE POLICY "Anyone can view published module titles" ON "public"."modules"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((course_id IN ( SELECT courses.id
   FROM courses
  WHERE (courses.status = 'Published'::lesson_status))) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text))));

-- subjects table - restore original "Anyone can view official subjects"
DROP POLICY IF EXISTS "Anyone can view official subjects" ON "public"."subjects";
CREATE POLICY "Anyone can view official subjects" ON "public"."subjects"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (((is_official = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR (auth.role() = 'authenticated'::text))));

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify auth.role() calls are back to unwrapped state
SELECT COUNT(*) as unwrapped_auth_role_calls
FROM pg_policies 
WHERE schemaname = 'public'
  AND qual ~ '\Wauth\.role\(\)'
  AND NOT qual ~ '\WSELECT\s+.*auth\.role\(\)';

-- Should return 5 after rollback

COMMIT; 