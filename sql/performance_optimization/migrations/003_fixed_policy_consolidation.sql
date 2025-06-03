-- Fixed Policy Consolidation - Resolves Multiple Permissive Policy conflicts
-- Issue: Previous version used FOR ALL which created overlaps with SELECT policies
-- Solution: Separate admin operations from SELECT operations

BEGIN;

-- =============================================================================
-- COURSES TABLE - FIXED CONSOLIDATION
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public access to courses" ON "public"."courses";
DROP POLICY IF EXISTS "Admins can manage courses" ON "public"."courses";
DROP POLICY IF EXISTS "Admins can manage all courses" ON "public"."courses";
DROP POLICY IF EXISTS "Anyone can view published course info" ON "public"."courses";
DROP POLICY IF EXISTS "Authenticated users can view all courses" ON "public"."courses";
DROP POLICY IF EXISTS "Users can see published or purchased courses" ON "public"."courses";
DROP POLICY IF EXISTS "Mega-consolidated courses access" ON "public"."courses";

-- Single SELECT policy for all roles and access patterns
CREATE POLICY "All users can view courses" ON "public"."courses"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    -- Published courses visible to everyone if public access enabled
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
    OR
    -- Admins can see all courses
    ((select auth.is_admin()) = true)
);

-- Separate admin management policies (INSERT/UPDATE/DELETE only)
CREATE POLICY "Admins can insert courses" ON "public"."courses"
FOR INSERT TO authenticated
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Admins can update courses" ON "public"."courses"
FOR UPDATE TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Admins can delete courses" ON "public"."courses"
FOR DELETE TO authenticated
USING ((select auth.is_admin()) = true);

-- =============================================================================
-- LESSONS TABLE - FIXED CONSOLIDATION
-- =============================================================================

DROP POLICY IF EXISTS "Anonymous access to published lessons" ON "public"."lessons";
DROP POLICY IF EXISTS "Authenticated access to lessons" ON "public"."lessons";
DROP POLICY IF EXISTS "Admins can manage lessons" ON "public"."lessons";
DROP POLICY IF EXISTS "Admins can manage all lessons" ON "public"."lessons";
DROP POLICY IF EXISTS "Anyone can view published lesson titles" ON "public"."lessons";
DROP POLICY IF EXISTS "Users can view lessons for their enrolled courses" ON "public"."lessons";

-- Single SELECT policy
CREATE POLICY "All users can view lessons" ON "public"."lessons"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    -- Published lessons in published courses (for anon and authenticated)
    (
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
    )
    OR
    -- Lessons in enrolled courses (authenticated users)
    (
        (select auth.uid()) IS NOT NULL
        AND module_id IN (
            SELECT m.id FROM modules m
            WHERE m.course_id IN (
                SELECT ce.course_id FROM course_enrollments ce
                WHERE ce.user_id = (select auth.uid())
                AND ce.expires_at >= now()
            )
        )
    )
    OR
    -- Admins can see all lessons
    ((select auth.is_admin()) = true)
);

-- Admin management policies (non-SELECT)
CREATE POLICY "Admins can insert lessons" ON "public"."lessons"
FOR INSERT TO authenticated
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Admins can update lessons" ON "public"."lessons"
FOR UPDATE TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Admins can delete lessons" ON "public"."lessons"
FOR DELETE TO authenticated
USING ((select auth.is_admin()) = true);

-- =============================================================================
-- MODULES TABLE - FIXED CONSOLIDATION
-- =============================================================================

DROP POLICY IF EXISTS "Anonymous access to published modules" ON "public"."modules";
DROP POLICY IF EXISTS "Authenticated access to modules" ON "public"."modules";
DROP POLICY IF EXISTS "Admins can manage modules" ON "public"."modules";
DROP POLICY IF EXISTS "Admins can manage all modules" ON "public"."modules";
DROP POLICY IF EXISTS "Anyone can view published module titles" ON "public"."modules";
DROP POLICY IF EXISTS "Users can view modules for their enrolled courses" ON "public"."modules";

-- Single SELECT policy
CREATE POLICY "All users can view modules" ON "public"."modules"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    -- Modules in published courses
    (
        course_id IN (
            SELECT courses.id FROM courses
            WHERE courses.status = 'Published'::lesson_status
        )
        AND (
            ((select current_setting('app.public_access'::text, true))::boolean) 
            OR ((select auth.role()) = 'authenticated'::text)
        )
    )
    OR
    -- Modules in enrolled courses
    (
        (select auth.uid()) IS NOT NULL
        AND course_id IN (
            SELECT ce.course_id FROM course_enrollments ce
            WHERE ce.user_id = (select auth.uid())
            AND ce.expires_at >= now()
        )
    )
    OR
    -- Admins can see all modules
    ((select auth.is_admin()) = true)
);

-- Admin management policies (non-SELECT)
CREATE POLICY "Admins can insert modules" ON "public"."modules"
FOR INSERT TO authenticated
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Admins can update modules" ON "public"."modules"
FOR UPDATE TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Admins can delete modules" ON "public"."modules"
FOR DELETE TO authenticated
USING ((select auth.is_admin()) = true);

-- =============================================================================
-- USER_ENTITLEMENTS TABLE - FIXED CONSOLIDATION
-- =============================================================================

DROP POLICY IF EXISTS "Users can access their entitlements" ON "public"."user_entitlements";
DROP POLICY IF EXISTS "Service and admin entitlement management" ON "public"."user_entitlements";
DROP POLICY IF EXISTS "Service role can manage entitlements" ON "public"."user_entitlements";
DROP POLICY IF EXISTS "Users can read their own entitlements" ON "public"."user_entitlements";

-- Single SELECT policy
CREATE POLICY "Users can view entitlements" ON "public"."user_entitlements"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    -- Users can see their own entitlements
    ((select auth.uid()) = user_id)
    OR
    -- Admins can see all entitlements
    ((select auth.is_admin()) = true)
);

-- Admin/service management policies (non-SELECT)
CREATE POLICY "Service role can manage entitlements" ON "public"."user_entitlements"
FOR INSERT TO authenticated
WITH CHECK ((select auth.role()) = 'service_role'::text);

CREATE POLICY "Service role can update entitlements" ON "public"."user_entitlements"
FOR UPDATE TO authenticated
USING ((select auth.role()) = 'service_role'::text)
WITH CHECK ((select auth.role()) = 'service_role'::text);

CREATE POLICY "Service role can delete entitlements" ON "public"."user_entitlements"
FOR DELETE TO authenticated
USING ((select auth.role()) = 'service_role'::text);

-- =============================================================================
-- USER_SUBSCRIPTIONS TABLE - FIXED CONSOLIDATION
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their subscriptions" ON "public"."user_subscriptions";
DROP POLICY IF EXISTS "Admin and service subscription management" ON "public"."user_subscriptions";
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON "public"."user_subscriptions";
DROP POLICY IF EXISTS "Only service role can insert/update/delete subscriptions" ON "public"."user_subscriptions";
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON "public"."user_subscriptions";

-- Single SELECT policy
CREATE POLICY "Users can view subscriptions" ON "public"."user_subscriptions"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    -- Users can see their own subscriptions
    ((select auth.uid()) = user_id)
    OR
    -- Admins can see all subscriptions
    ((select auth.is_admin()) = true)
);

-- Service role management policies (non-SELECT)
CREATE POLICY "Service role can insert subscriptions" ON "public"."user_subscriptions"
FOR INSERT TO authenticated
WITH CHECK ((select auth.role()) = 'service_role'::text);

CREATE POLICY "Service role can update subscriptions" ON "public"."user_subscriptions"
FOR UPDATE TO authenticated
USING ((select auth.role()) = 'service_role'::text)
WITH CHECK ((select auth.role()) = 'service_role'::text);

CREATE POLICY "Service role can delete subscriptions" ON "public"."user_subscriptions"
FOR DELETE TO authenticated
USING ((select auth.role()) = 'service_role'::text);

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Check for remaining conflicts
SELECT 
    'FIXED CONSOLIDATION CHECK' as status,
    tablename,
    cmd,
    roles,
    COUNT(*) as policy_count,
    array_agg(policyname) as policy_names
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('courses', 'lessons', 'modules', 'user_entitlements', 'user_subscriptions')
GROUP BY tablename, cmd, roles
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;

COMMIT; 