-- Comprehensive Rollback for Phase 2.2 and 2.3: Policy Consolidation
-- Restores original policies for courses, lessons, modules, user_entitlements, 
-- user_subscriptions, collection_subjects, flashcard_collections_junction

BEGIN;

-- =============================================================================
-- ROLLBACK PHASE 2.2: HIGH IMPACT CONSOLIDATIONS
-- =============================================================================

-- =============================================================================
-- 1. COURSES TABLE ROLLBACK
-- =============================================================================

-- Drop consolidated policies
DROP POLICY IF EXISTS "Public access to courses" ON "public"."courses";
DROP POLICY IF EXISTS "Admins can manage courses" ON "public"."courses";

-- Restore original courses policies
CREATE POLICY "Admins can manage all courses" ON "public"."courses"
FOR ALL TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Anyone can view published course info" ON "public"."courses"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    (status = 'Published'::lesson_status) 
    AND (
        ((select current_setting('app.public_access'::text, true))::boolean) 
        OR ((select auth.role()) = 'authenticated'::text)
    )
);

CREATE POLICY "Authenticated users can view all courses" ON "public"."courses"
FOR SELECT TO authenticated
USING ((select auth.role()) = 'authenticated'::text);

CREATE POLICY "Users can see published or purchased courses" ON "public"."courses"
FOR SELECT TO authenticated
USING (
    (status = 'Published'::lesson_status) 
    OR (status = 'Coming Soon'::lesson_status) 
    OR (EXISTS (
        SELECT 1 FROM course_enrollments ce
        WHERE ce.course_id = courses.id 
        AND ce.user_id = (select auth.uid()) 
        AND ce.expires_at >= now()
    ))
);

-- Restore Mega-consolidated policy if it existed
CREATE POLICY "Mega-consolidated courses access" ON "public"."courses"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    (status = 'Published'::lesson_status) 
    OR (
        (select auth.role()) = 'authenticated'::text 
        AND (
            status = 'Coming Soon'::lesson_status
            OR EXISTS (
                SELECT 1 FROM course_enrollments ce
                WHERE ce.course_id = courses.id 
                AND ce.user_id = (select auth.uid()) 
                AND ce.expires_at >= now()
            )
        )
    )
);

-- =============================================================================
-- 2. LESSONS TABLE ROLLBACK
-- =============================================================================

-- Drop consolidated policies
DROP POLICY IF EXISTS "Anonymous access to published lessons" ON "public"."lessons";
DROP POLICY IF EXISTS "Authenticated access to lessons" ON "public"."lessons";
DROP POLICY IF EXISTS "Admins can manage lessons" ON "public"."lessons";

-- Restore original lessons policies
CREATE POLICY "Admins can manage all lessons" ON "public"."lessons"
FOR ALL TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Anyone can view published lesson titles" ON "public"."lessons"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    (status = 'Published'::lesson_status)
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

CREATE POLICY "Users can view lessons for their enrolled courses" ON "public"."lessons"
FOR SELECT TO authenticated
USING (
    module_id IN (
        SELECT m.id FROM modules m
        WHERE m.course_id IN (
            SELECT ce.course_id FROM course_enrollments ce
            WHERE ce.user_id = (select auth.uid())
            AND ce.expires_at >= now()
        )
    )
);

-- =============================================================================
-- 3. MODULES TABLE ROLLBACK
-- =============================================================================

-- Drop consolidated policies
DROP POLICY IF EXISTS "Anonymous access to published modules" ON "public"."modules";
DROP POLICY IF EXISTS "Authenticated access to modules" ON "public"."modules";
DROP POLICY IF EXISTS "Admins can manage modules" ON "public"."modules";

-- Restore original modules policies
CREATE POLICY "Admins can manage all modules" ON "public"."modules"
FOR ALL TO authenticated
USING ((select auth.is_admin()) = true)
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Anyone can view published module titles" ON "public"."modules"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
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

CREATE POLICY "Users can view modules for their enrolled courses" ON "public"."modules"
FOR SELECT TO authenticated
USING (
    course_id IN (
        SELECT ce.course_id FROM course_enrollments ce
        WHERE ce.user_id = (select auth.uid())
        AND ce.expires_at >= now()
    )
);

-- =============================================================================
-- 4. USER_ENTITLEMENTS TABLE ROLLBACK
-- =============================================================================

-- Drop consolidated policies
DROP POLICY IF EXISTS "Users can access their entitlements" ON "public"."user_entitlements";
DROP POLICY IF EXISTS "Service and admin entitlement management" ON "public"."user_entitlements";

-- Restore original user_entitlements policies
CREATE POLICY "Service role can manage entitlements" ON "public"."user_entitlements"
FOR ALL TO anon, authenticated, authenticator, dashboard_user
USING ((select auth.role()) = 'service_role'::text)
WITH CHECK ((select auth.role()) = 'service_role'::text);

CREATE POLICY "Users can read their own entitlements" ON "public"."user_entitlements"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING ((select auth.uid()) = user_id);

-- =============================================================================
-- 5. USER_SUBSCRIPTIONS TABLE ROLLBACK
-- =============================================================================

-- Drop consolidated policies
DROP POLICY IF EXISTS "Users can view their subscriptions" ON "public"."user_subscriptions";
DROP POLICY IF EXISTS "Admin and service subscription management" ON "public"."user_subscriptions";

-- Restore original user_subscriptions policies
CREATE POLICY "Admins can view all subscriptions" ON "public"."user_subscriptions"
FOR SELECT TO authenticated
USING ((select auth.is_admin()) = true);

CREATE POLICY "Only service role can insert/update/delete subscriptions" ON "public"."user_subscriptions"
FOR ALL TO anon, authenticated, authenticator, dashboard_user
USING ((select auth.role()) = 'service_role'::text)
WITH CHECK ((select auth.role()) = 'service_role'::text);

CREATE POLICY "Users can view their own subscriptions" ON "public"."user_subscriptions"
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING ((select auth.uid()) = user_id);

-- =============================================================================
-- ROLLBACK PHASE 2.3: MODERATE IMPACT CONSOLIDATIONS
-- =============================================================================

-- =============================================================================
-- 6. COLLECTION_SUBJECTS TABLE ROLLBACK
-- =============================================================================

-- Drop consolidated policies
DROP POLICY IF EXISTS "Authenticated users can delete collection_subjects" ON "public"."collection_subjects";
DROP POLICY IF EXISTS "Authenticated users can insert collection_subjects" ON "public"."collection_subjects";
DROP POLICY IF EXISTS "Authenticated users can read collection_subjects" ON "public"."collection_subjects";

-- Restore original collection_subjects policies
CREATE POLICY "Admin users can delete any collection_subjects" ON "public"."collection_subjects"
FOR DELETE TO authenticated
USING ((select auth.is_admin()) = true);

CREATE POLICY "Users can delete their own collection_subjects" ON "public"."collection_subjects"
FOR DELETE TO authenticated
USING (EXISTS (
    SELECT 1 FROM collections c 
    WHERE c.id = collection_subjects.collection_id 
    AND c.user_id = (select auth.uid())
));

CREATE POLICY "Admin users can insert any collection_subjects" ON "public"."collection_subjects"
FOR INSERT TO authenticated
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Users can insert their own collection_subjects" ON "public"."collection_subjects"
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM collections c 
    WHERE c.id = collection_subjects.collection_id 
    AND c.user_id = (select auth.uid())
));

CREATE POLICY "Users can access collection subjects" ON "public"."collection_subjects"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can read any collection_subjects" ON "public"."collection_subjects"
FOR SELECT TO authenticated
USING (true);

-- =============================================================================
-- 7. FLASHCARD_COLLECTIONS_JUNCTION TABLE ROLLBACK
-- =============================================================================

-- Drop consolidated policies
DROP POLICY IF EXISTS "Authenticated users can delete flashcard_collections_junction" ON "public"."flashcard_collections_junction";
DROP POLICY IF EXISTS "Authenticated users can insert flashcard_collections_junction" ON "public"."flashcard_collections_junction";

-- Restore original flashcard_collections_junction policies
CREATE POLICY "Admin users can delete any flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR DELETE TO authenticated
USING ((select auth.is_admin()) = true);

CREATE POLICY "Users can delete their own flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR DELETE TO authenticated
USING (EXISTS (
    SELECT 1 FROM collections c 
    WHERE c.id = flashcard_collections_junction.collection_id 
    AND c.user_id = (select auth.uid())
));

CREATE POLICY "Admin users can insert any flashcard_collections_junction" ON "public"."flashcard_collections_junction"
FOR INSERT TO authenticated
WITH CHECK ((select auth.is_admin()) = true);

CREATE POLICY "Users can insert flashcard-collection associations" ON "public"."flashcard_collections_junction"
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM collections c 
    WHERE c.id = flashcard_collections_junction.collection_id 
    AND (c.user_id = (select auth.uid()) OR c.is_official = true)
));

-- =============================================================================
-- 8. REMAINING FLASHCARDS POLICIES ROLLBACK
-- =============================================================================

-- Drop consolidated UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can update flashcards" ON "public"."flashcards";

-- Restore original UPDATE policies
CREATE POLICY "Admins can update any flashcard" ON "public"."flashcards"
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = (select auth.uid()) 
        AND profiles.is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = (select auth.uid()) 
        AND profiles.is_admin = true
    )
);

CREATE POLICY "Users can update their own flashcards" ON "public"."flashcards"
FOR UPDATE TO authenticated
USING ((select auth.uid()) = created_by)
WITH CHECK ((select auth.uid()) = created_by);

-- Restore original anon SELECT policies (restore redundancy)
DROP POLICY IF EXISTS "Anonymous users can view sample flashcards" ON "public"."flashcards";

CREATE POLICY "Anyone can view public sample flashcards" ON "public"."flashcards"
FOR SELECT TO anon, authenticated
USING ((is_official = true) AND (is_public_sample = true));

CREATE POLICY "Anyone can view sample flashcards" ON "public"."flashcards"
FOR SELECT TO anon
USING (
    (is_official = true) 
    AND (is_public_sample = true) 
    AND (
        ((select current_setting('app.public_access'::text, true))::boolean) 
        OR ((select auth.role()) = 'authenticated'::text)
    )
);

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify rollback worked - should see multiple policies again
DO $$
DECLARE
    total_conflicts INTEGER;
    total_policies INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_conflicts
    FROM (
        SELECT tablename, cmd, roles
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN (
            'courses', 'lessons', 'modules', 'user_entitlements', 'user_subscriptions',
            'collection_subjects', 'flashcard_collections_junction', 'flashcards'
        )
        GROUP BY tablename, cmd, roles
        HAVING COUNT(*) > 1
    ) conflicts;
    
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename IN (
        'courses', 'lessons', 'modules', 'user_entitlements', 'user_subscriptions',
        'collection_subjects', 'flashcard_collections_junction', 'flashcards'
    );
    
    RAISE NOTICE 'ROLLBACK VALIDATION:';
    RAISE NOTICE 'Multiple permissive policy conflicts restored: %', total_conflicts;
    RAISE NOTICE 'Total policies for target tables: %', total_policies;
    
    IF total_conflicts >= 20 THEN
        RAISE NOTICE '✅ ROLLBACK SUCCESS: Multiple permissive policies restored';
    ELSE
        RAISE WARNING '❌ ROLLBACK INCOMPLETE: Expected 20+ conflicts, found %', total_conflicts;
    END IF;
END $$;

COMMIT; 