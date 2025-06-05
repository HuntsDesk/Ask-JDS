-- Phase 2.2: High Impact Policy Consolidation
-- Target: courses, lessons, modules, user_entitlements, user_subscriptions
-- Impact: Resolves 21 Multiple Permissive Policy warnings (4+4+4+4+5)
-- Expected: 75-80% policy reduction on high-traffic tables

BEGIN;

-- =============================================================================
-- PHASE 2.2: HIGH IMPACT CONSOLIDATIONS
-- =============================================================================

-- =============================================================================
-- 1. COURSES TABLE CONSOLIDATION
-- =============================================================================
-- Current: Multiple SELECT policies across anon, authenticated, authenticator, dashboard_user
-- Target: 2 optimized policies (public access + admin management)

-- Drop existing redundant policies
DROP POLICY IF EXISTS "Admins can manage all courses" ON "public"."courses";
DROP POLICY IF EXISTS "Mega-consolidated courses access" ON "public"."courses";
DROP POLICY IF EXISTS "Anyone can view published course info" ON "public"."courses";
DROP POLICY IF EXISTS "Authenticated users can view all courses" ON "public"."courses";
DROP POLICY IF EXISTS "Users can see published or purchased courses" ON "public"."courses";

-- Create consolidated public access policy (covers anon, authenticated, authenticator, dashboard_user)
CREATE POLICY "Public access to courses" ON "public"."courses"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    -- Published courses are visible to everyone if public access is enabled
    (
        status = 'Published'::lesson_status 
        AND (
            ((select current_setting('app.public_access'::text, true))::boolean) 
            OR ((select auth.role()) = 'authenticated'::text)
        )
    )
    OR
    -- Coming Soon courses visible to authenticated users
    (
        status = 'Coming Soon'::lesson_status 
        AND (select auth.role()) = 'authenticated'::text
    )
    OR
    -- Enrolled users can see their purchased courses
    (
        (select auth.uid()) IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM course_enrollments ce
            WHERE ce.course_id = courses.id 
            AND ce.user_id = (select auth.uid())
            AND ce.expires_at >= now()
        )
    )
);

-- Create admin management policy
CREATE POLICY "Admins can manage courses" ON "public"."courses"
FOR ALL TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

-- =============================================================================
-- 2. LESSONS TABLE CONSOLIDATION  
-- =============================================================================
-- Current: Multiple SELECT policies across anon, authenticated, authenticator, dashboard_user
-- Target: 3 optimized policies (anon published + authenticated access + admin)

-- Drop existing redundant policies
DROP POLICY IF EXISTS "Admins can manage all lessons" ON "public"."lessons";
DROP POLICY IF EXISTS "Anyone can view published lesson titles" ON "public"."lessons";
DROP POLICY IF EXISTS "Users can view lessons for their enrolled courses" ON "public"."lessons";

-- Create anon access to published lessons
CREATE POLICY "Anonymous access to published lessons" ON "public"."lessons"
FOR SELECT TO anon
USING (
    status = 'Published'::lesson_status
    AND module_id IN (
        SELECT m.id FROM modules m
        WHERE m.course_id IN (
            SELECT c.id FROM courses c
            WHERE c.status = 'Published'::lesson_status
        )
    )
    AND (
        ((select current_setting('app.public_access'::text, true))::boolean) 
        OR ((select auth.role()) = 'authenticated'::text)
    )
);

-- Create authenticated access (enrolled + published)
CREATE POLICY "Authenticated access to lessons" ON "public"."lessons"  
FOR SELECT TO authenticated, authenticator, dashboard_user
USING (
    -- Published lessons in published courses
    (
        status = 'Published'::lesson_status
        AND module_id IN (
            SELECT m.id FROM modules m
            WHERE m.course_id IN (
                SELECT c.id FROM courses c
                WHERE c.status = 'Published'::lesson_status
            )
        )
    )
    OR
    -- Lessons in enrolled courses
    (
        module_id IN (
            SELECT m.id FROM modules m
            WHERE m.course_id IN (
                SELECT ce.course_id FROM course_enrollments ce
                WHERE ce.user_id = (select auth.uid())
                AND ce.expires_at >= now()
            )
        )
    )
);

-- Create admin full access
CREATE POLICY "Admins can manage lessons" ON "public"."lessons"
FOR ALL TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

-- =============================================================================
-- 3. MODULES TABLE CONSOLIDATION
-- =============================================================================
-- Current: Multiple SELECT policies across anon, authenticated, authenticator, dashboard_user  
-- Target: 3 optimized policies (anon published + authenticated access + admin)

-- Drop existing redundant policies
DROP POLICY IF EXISTS "Admins can manage all modules" ON "public"."modules";
DROP POLICY IF EXISTS "Anyone can view published module titles" ON "public"."modules";
DROP POLICY IF EXISTS "Users can view modules for their enrolled courses" ON "public"."modules";

-- Create anon access to published modules
CREATE POLICY "Anonymous access to published modules" ON "public"."modules"
FOR SELECT TO anon
USING (
    course_id IN (
        SELECT courses.id FROM courses
        WHERE courses.status = 'Published'::lesson_status
    )
    AND (
        ((select current_setting('app.public_access'::text, true))::boolean) 
        OR ((select auth.role()) = 'authenticated'::text)
    )
);

-- Create authenticated access (enrolled + published)
CREATE POLICY "Authenticated access to modules" ON "public"."modules"
FOR SELECT TO authenticated, authenticator, dashboard_user
USING (
    -- Modules in published courses
    (
        course_id IN (
            SELECT courses.id FROM courses
            WHERE courses.status = 'Published'::lesson_status
        )
    )
    OR
    -- Modules in enrolled courses
    (
        course_id IN (
            SELECT ce.course_id FROM course_enrollments ce
            WHERE ce.user_id = (select auth.uid())
            AND ce.expires_at >= now()
        )
    )
);

-- Create admin full access
CREATE POLICY "Admins can manage modules" ON "public"."modules"
FOR ALL TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

-- =============================================================================
-- 4. USER_ENTITLEMENTS TABLE CONSOLIDATION
-- =============================================================================
-- Current: Multiple SELECT policies across anon, authenticated, authenticator, dashboard_user
-- Target: 2 optimized policies (user self-access + service/admin management)

-- Drop existing redundant policies  
DROP POLICY IF EXISTS "Service role can manage entitlements" ON "public"."user_entitlements";
DROP POLICY IF EXISTS "Users can read their own entitlements" ON "public"."user_entitlements";

-- Create user self-access policy
CREATE POLICY "Users can access their entitlements" ON "public"."user_entitlements"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING ((select auth.uid()) = user_id);

-- Create service/admin management policy
CREATE POLICY "Service and admin entitlement management" ON "public"."user_entitlements"
FOR ALL TO authenticated
USING (
    ((select auth.is_admin()) = true)
    OR ((select auth.role()) = 'service_role'::text)
)
WITH CHECK (
    ((select auth.is_admin()) = true)
    OR ((select auth.role()) = 'service_role'::text)
);

-- =============================================================================
-- 5. USER_SUBSCRIPTIONS TABLE CONSOLIDATION
-- =============================================================================
-- Current: Multiple SELECT policies across anon, authenticated, authenticator, dashboard_user
-- Target: 2 optimized policies (user access + admin/service management)

-- Drop existing redundant policies
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON "public"."user_subscriptions";
DROP POLICY IF EXISTS "Only service role can insert/update/delete subscriptions" ON "public"."user_subscriptions";
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON "public"."user_subscriptions";

-- Create user access policy (read own subscriptions)
CREATE POLICY "Users can view their subscriptions" ON "public"."user_subscriptions"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING ((select auth.uid()) = user_id);

-- Create comprehensive admin/service management policy
CREATE POLICY "Admin and service subscription management" ON "public"."user_subscriptions"
FOR ALL TO authenticated
USING (
    -- Admins can view all subscriptions
    ((select auth.is_admin()) = true)
    OR
    -- Service role can manage all subscriptions
    ((select auth.role()) = 'service_role'::text)
    OR
    -- Users can view their own (for SELECT operations)
    ((select auth.uid()) = user_id)
)
WITH CHECK (
    -- Only admins and service role can modify
    ((select auth.is_admin()) = true)
    OR ((select auth.role()) = 'service_role'::text)
);

-- =============================================================================
-- VALIDATION FOR PHASE 2.2
-- =============================================================================

-- Check for remaining multiple permissive policies
DO $$
DECLARE
    remaining_conflicts INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_conflicts
    FROM (
        SELECT tablename, cmd, roles
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('courses', 'lessons', 'modules', 'user_entitlements', 'user_subscriptions')
        GROUP BY tablename, cmd, roles
        HAVING COUNT(*) > 1
    ) conflicts;
    
    RAISE NOTICE 'PHASE 2.2: Remaining policy conflicts after consolidation: %', remaining_conflicts;
    
    IF remaining_conflicts = 0 THEN
        RAISE NOTICE 'PHASE 2.2: ✅ Successfully eliminated all multiple permissive policy conflicts';
    ELSE
        RAISE WARNING 'PHASE 2.2: Still have % policy conflicts remaining', remaining_conflicts;
    END IF;
END $$;

-- Count policies per table after consolidation
SELECT 
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('courses', 'lessons', 'modules', 'user_entitlements', 'user_subscriptions')
GROUP BY tablename
ORDER BY tablename;

COMMIT; 