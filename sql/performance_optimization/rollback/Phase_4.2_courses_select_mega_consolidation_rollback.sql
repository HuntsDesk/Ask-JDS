-- =====================================================
-- Phase 4.2 ROLLBACK: Courses SELECT Mega-Consolidation
-- =====================================================
-- This script restores the original 4 courses SELECT policies
-- if Phase 4.2 migration needs to be reverted
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'PHASE 4.2 ROLLBACK: Restoring original courses SELECT policies';
    RAISE NOTICE '================================================================';
END $$;

-- STEP 1: Drop consolidated policies
DO $$
BEGIN
    RAISE NOTICE 'Dropping mega-consolidated policies...';
END $$;

DROP POLICY IF EXISTS "Mega-consolidated courses access" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

DO $$
BEGIN
    RAISE NOTICE 'Consolidated policies dropped successfully.';
END $$;

-- STEP 2: Restore original SELECT policies
DO $$
BEGIN
    RAISE NOTICE 'Restoring original separate SELECT policies...';
END $$;

-- Restore admin policy (ALL operations including SELECT)
CREATE POLICY "Admins can manage all courses" ON courses
FOR ALL TO authenticated
USING ((SELECT auth.is_admin()) = true)
WITH CHECK ((SELECT auth.is_admin()) = true);

-- Restore public access policy for published courses
CREATE POLICY "Anyone can view published course info" ON courses
FOR SELECT TO anon, authenticated, authenticator, dashboard_user 
USING (((status = 'Published'::lesson_status) AND 
        (((SELECT current_setting('app.public_access'::text, true))::boolean) OR 
         ((SELECT auth.role()) = 'authenticated'::text))));

-- Restore authenticated user access to all courses
CREATE POLICY "Authenticated users can view all courses" ON courses
FOR SELECT TO authenticated
USING (((SELECT auth.role()) = 'authenticated'::text));

-- Restore user enrollment-based access
CREATE POLICY "Users can see published or purchased courses" ON courses
FOR SELECT TO authenticated
USING (((status = 'Published'::lesson_status) OR (status = 'Coming Soon'::lesson_status) OR 
        (EXISTS (
            SELECT 1
            FROM course_enrollments ce
            WHERE ce.course_id = courses.id 
              AND ce.user_id = (SELECT auth.uid()) 
              AND ce.expires_at >= now()
        ))));

DO $$
BEGIN
    RAISE NOTICE 'Original policies restored successfully.';
END $$;

-- STEP 3: Validation
DO $$
DECLARE
    select_policy_count INTEGER;
    total_policy_count INTEGER;
BEGIN
    RAISE NOTICE 'ROLLBACK VALIDATION';
    RAISE NOTICE '==================';
    
    -- Count SELECT policies
    SELECT COUNT(*) INTO select_policy_count
    FROM pg_policies 
    WHERE tablename = 'courses' AND cmd = 'SELECT';
    
    -- Count total policies
    SELECT COUNT(*) INTO total_policy_count
    FROM pg_policies 
    WHERE tablename = 'courses';
    
    RAISE NOTICE 'COURSES TABLE: % SELECT policies, % total policies', select_policy_count, total_policy_count;
    RAISE NOTICE 'ROLLBACK COMPLETE: Restored 4 original SELECT policies';
END $$;

SELECT 
    'ROLLBACK_RESULT' as phase,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'courses'
ORDER BY cmd, policyname;

COMMIT; 