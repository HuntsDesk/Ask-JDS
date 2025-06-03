-- Rollback for Phase 1.5: Complete Auth Function Wrapping
-- Restores original auth.role() calls without SELECT wrapping

BEGIN;

-- =============================================================================
-- ROLLBACK AUTH.ROLE() WRAPPING FIXES
-- =============================================================================

-- courses table - restore original "Anyone can view published course info"
ALTER POLICY "Anyone can view published course info" ON "public"."courses"
USING (((status = 'Published'::lesson_status) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text))));

-- flashcards table - restore original "Anyone can view sample flashcards"  
ALTER POLICY "Anyone can view sample flashcards" ON "public"."flashcards"
USING (((is_official = true) AND (is_public_sample = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR (auth.role() = 'authenticated'::text))));

-- lessons table - restore original "Anyone can view published lesson titles"
ALTER POLICY "Anyone can view published lesson titles" ON "public"."lessons"
USING (((status = 'Published'::lesson_status) AND (module_id IN ( SELECT m.id
   FROM modules m
  WHERE (m.course_id IN ( SELECT c.id
           FROM courses c
          WHERE (c.status = 'Published'::lesson_status))))) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text))));

-- modules table - restore original "Anyone can view published module titles"
ALTER POLICY "Anyone can view published module titles" ON "public"."modules"
USING (((course_id IN ( SELECT courses.id
   FROM courses
  WHERE (courses.status = 'Published'::lesson_status))) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text))));

-- subjects table - restore original "Anyone can view official subjects"
ALTER POLICY "Anyone can view official subjects" ON "public"."subjects"
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