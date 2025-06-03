-- Rollback for Phase 1: Auth Function Wrapping Performance Optimization
-- Restores original auth function calls without (select ...) wrapping

BEGIN;

-- =============================================================================
-- ROLLBACK AUTH.UID() WRAPPING FIXES
-- =============================================================================

-- collection_subjects table policies
ALTER POLICY "Users can delete their own collection_subjects" ON "public"."collection_subjects"
USING (EXISTS ( SELECT 1
   FROM collections c
  WHERE ((c.id = collection_subjects.collection_id) AND (c.user_id = auth.uid()))));

ALTER POLICY "Users can insert their own collection_subjects" ON "public"."collection_subjects"
WITH CHECK (EXISTS ( SELECT 1
   FROM collections c
  WHERE ((c.id = collection_subjects.collection_id) AND (c.user_id = auth.uid()))));

-- flashcard_collections_junction table policies  
ALTER POLICY "Users can delete their own flashcard_collections_junction" ON "public"."flashcard_collections_junction"
USING (EXISTS ( SELECT 1
   FROM collections c
  WHERE ((c.id = flashcard_collections_junction.collection_id) AND (c.user_id = auth.uid()))));

ALTER POLICY "Users can insert flashcard-collection associations" ON "public"."flashcard_collections_junction"
WITH CHECK (EXISTS ( SELECT 1
   FROM collections c
  WHERE ((c.id = flashcard_collections_junction.collection_id) AND ((c.user_id = auth.uid()) OR (c.is_official = true)))));

-- course_enrollments table policies
ALTER POLICY "Users can create their own enrollments" ON "public"."course_enrollments"
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own enrollments" ON "public"."course_enrollments"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can view their own course enrollments" ON "public"."course_enrollments"
USING (auth.uid() = user_id);

-- flashcard_progress table policies
ALTER POLICY "Users can delete their own flashcard progress" ON "public"."flashcard_progress"
USING (auth.uid() = user_id);

ALTER POLICY "Users can insert their own flashcard progress" ON "public"."flashcard_progress"
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own flashcard progress" ON "public"."flashcard_progress"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can view their own flashcard progress" ON "public"."flashcard_progress"
USING (auth.uid() = user_id);

-- flashcard_subjects table policies
ALTER POLICY "Users can insert flashcard-subject associations" ON "public"."flashcard_subjects"
WITH CHECK (( SELECT auth.is_admin(auth.uid()) AS is_admin) OR (EXISTS ( SELECT 1
   FROM flashcards f
  WHERE ((f.id = flashcard_subjects.flashcard_id) AND (f.created_by = auth.uid())))));

-- flashcards table policies
ALTER POLICY "Admins can update any flashcard" ON "public"."flashcards"
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))
WITH CHECK (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))));

ALTER POLICY "Admins can view all flashcards" ON "public"."flashcards"
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))));

ALTER POLICY "Users can delete their own flashcards" ON "public"."flashcards"
USING ((auth.uid() = created_by) AND (is_official = false));

ALTER POLICY "Users can update their own flashcards" ON "public"."flashcards"
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

ALTER POLICY "Users can view their own flashcards" ON "public"."flashcards"
USING (auth.uid() = created_by);

-- lesson_progress table policies
ALTER POLICY "Users can view their own lesson progress" ON "public"."lesson_progress"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- message_counts table policies
ALTER POLICY "Users can insert their own message counts" ON "public"."message_counts"
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own message counts" ON "public"."message_counts"
USING (auth.uid() = user_id);

ALTER POLICY "Users can view their own message counts" ON "public"."message_counts"
USING (auth.uid() = user_id);

-- messages table policies
ALTER POLICY "Users can create messages in own threads" ON "public"."messages"
WITH CHECK (EXISTS ( SELECT 1
   FROM threads
  WHERE ((threads.id = messages.thread_id) AND (threads.user_id = auth.uid()))));

ALTER POLICY "Users can view messages from own threads" ON "public"."messages"
USING (EXISTS ( SELECT 1
   FROM threads
  WHERE ((threads.id = messages.thread_id) AND (threads.user_id = auth.uid()))));

-- profiles table policies
ALTER POLICY "Users can insert their own profile" ON "public"."profiles"
WITH CHECK (auth.uid() = id);

ALTER POLICY "Users can update their own profile" ON "public"."profiles"
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

ALTER POLICY "Users can view their own profile" ON "public"."profiles"
USING (auth.uid() = id);

-- threads table policies
ALTER POLICY "Users can create own threads" ON "public"."threads"
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can delete own threads" ON "public"."threads"
USING (auth.uid() = user_id);

ALTER POLICY "Users can update own threads" ON "public"."threads"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can view own threads" ON "public"."threads"
USING (auth.uid() = user_id);

ALTER POLICY "threads_delete_own" ON "public"."threads"
USING (auth.uid() = user_id);

ALTER POLICY "threads_delete_policy" ON "public"."threads"
USING (auth.uid() = user_id);

ALTER POLICY "threads_insert_own" ON "public"."threads"
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "threads_insert_policy" ON "public"."threads"
WITH CHECK (auth.uid() IS NOT NULL);

ALTER POLICY "threads_select_policy" ON "public"."threads"
USING (auth.uid() = user_id);

ALTER POLICY "threads_update_own" ON "public"."threads"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "threads_update_policy" ON "public"."threads"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "threads_view_own" ON "public"."threads"
USING (auth.uid() = user_id);

-- user_entitlements table policies
ALTER POLICY "Users can read their own entitlements" ON "public"."user_entitlements"
USING (auth.uid() = user_id);

-- user_subscriptions table policies
ALTER POLICY "Users can view their own subscriptions" ON "public"."user_subscriptions"
USING (auth.uid() = user_id);

-- =============================================================================
-- ROLLBACK AUTH.IS_ADMIN() WRAPPING FIXES
-- =============================================================================

-- collection_subjects table policies
ALTER POLICY "Admin users can delete any collection_subjects" ON "public"."collection_subjects"
USING (( SELECT auth.is_admin(auth.uid()) AS is_admin));

ALTER POLICY "Admin users can insert any collection_subjects" ON "public"."collection_subjects"
WITH CHECK (( SELECT auth.is_admin(auth.uid()) AS is_admin));

ALTER POLICY "Admin users can update any collection_subjects" ON "public"."collection_subjects"
USING (( SELECT auth.is_admin(auth.uid()) AS is_admin))
WITH CHECK (( SELECT auth.is_admin(auth.uid()) AS is_admin));

-- flashcard_collections_junction table policies
ALTER POLICY "Admin users can delete any flashcard_collections_junction" ON "public"."flashcard_collections_junction"
USING (( SELECT auth.is_admin(auth.uid()) AS is_admin));

ALTER POLICY "Admin users can insert any flashcard_collections_junction" ON "public"."flashcard_collections_junction"
WITH CHECK (( SELECT auth.is_admin(auth.uid()) AS is_admin));

ALTER POLICY "Admin users can update any flashcard_collections_junction" ON "public"."flashcard_collections_junction"
USING (( SELECT auth.is_admin(auth.uid()) AS is_admin))
WITH CHECK (( SELECT auth.is_admin(auth.uid()) AS is_admin));

-- flashcard_exam_types table policies
ALTER POLICY "Admin users can delete any flashcard_exam_types" ON "public"."flashcard_exam_types"
USING (( SELECT auth.is_admin(auth.uid()) AS is_admin));

ALTER POLICY "Admin users can insert any flashcard_exam_types" ON "public"."flashcard_exam_types"
WITH CHECK (( SELECT auth.is_admin(auth.uid()) AS is_admin));

ALTER POLICY "Admin users can update any flashcard_exam_types" ON "public"."flashcard_exam_types"
USING (( SELECT auth.is_admin(auth.uid()) AS is_admin))
WITH CHECK (( SELECT auth.is_admin(auth.uid()) AS is_admin));

-- flashcard_subjects table policies
ALTER POLICY "Admin users can delete any flashcard_subjects" ON "public"."flashcard_subjects"
USING (( SELECT auth.is_admin(auth.uid()) AS is_admin));

ALTER POLICY "Admin users can update any flashcard_subjects" ON "public"."flashcard_subjects"
USING (( SELECT auth.is_admin(auth.uid()) AS is_admin))
WITH CHECK (( SELECT auth.is_admin(auth.uid()) AS is_admin));

-- user_subscriptions table policies
ALTER POLICY "Admins can view all subscriptions" ON "public"."user_subscriptions"
USING (( SELECT auth.is_admin(auth.uid()) AS is_admin));

-- course_enrollments table policies
ALTER POLICY "Admins can manage all enrollments" ON "public"."course_enrollments"
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- courses table policies
ALTER POLICY "Admins can manage all courses" ON "public"."courses"
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- lessons table policies
ALTER POLICY "Admins can manage all lessons" ON "public"."lessons"
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- modules table policies
ALTER POLICY "Admins can manage all modules" ON "public"."modules"
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- system_prompts table policies
ALTER POLICY "Admins can manage system prompts" ON "public"."system_prompts"
USING (auth.is_admin());

-- query_logs table policies
ALTER POLICY "Only admins can view query logs" ON "public"."query_logs"
USING (auth.is_admin());

-- error_logs table policies
ALTER POLICY "Only admins can view error logs" ON "public"."error_logs"
USING (auth.is_admin());

-- models table policies
ALTER POLICY "models_access" ON "public"."models"
USING ((auth.is_admin() OR (is_public = true)));

-- course_subjects table policies
ALTER POLICY "Admins can create course-subject relationships" ON "public"."course_subjects"
WITH CHECK (auth.is_admin());

ALTER POLICY "Admins can delete course-subject relationships" ON "public"."course_subjects"
USING (auth.is_admin());

ALTER POLICY "Admins can update course-subject relationships" ON "public"."course_subjects"
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- exam_types table policies
ALTER POLICY "Only admins can manage exam types" ON "public"."exam_types"
USING (auth.is_admin());

-- =============================================================================
-- ROLLBACK AUTH.ROLE() WRAPPING FIXES
-- =============================================================================

-- courses table policies
ALTER POLICY "Anyone can view published course info" ON "public"."courses"
USING (((status = 'Published'::lesson_status) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text))));

ALTER POLICY "Authenticated users can view all courses" ON "public"."courses"
USING ((auth.role() = 'authenticated'::text));

-- lessons table policies  
ALTER POLICY "Anyone can view published lesson titles" ON "public"."lessons"
USING (((status = 'Published'::lesson_status) AND (module_id IN ( SELECT m.id
   FROM modules m
  WHERE (m.course_id IN ( SELECT c.id
           FROM courses c
          WHERE (c.status = 'Published'::lesson_status))))) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text))));

-- modules table policies
ALTER POLICY "Anyone can view published module titles" ON "public"."modules"
USING (((course_id IN ( SELECT courses.id
   FROM courses
  WHERE (courses.status = 'Published'::lesson_status))) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text))));

-- subjects table policies
ALTER POLICY "Anyone can view official subjects" ON "public"."subjects"
USING (((is_official = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR (auth.role() = 'authenticated'::text))));

-- flashcards table policies
ALTER POLICY "Anyone can view sample flashcards" ON "public"."flashcards"
USING (((is_official = true) AND (is_public_sample = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR (auth.role() = 'authenticated'::text))));

-- =============================================================================
-- ROLLBACK AUTH.JWT() WRAPPING FIXES
-- =============================================================================

-- user_subscriptions table policies
ALTER POLICY "Only service role can insert/update/delete subscriptions" ON "public"."user_subscriptions"
USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- =============================================================================
-- ROLLBACK COMPLEX POLICIES WITH MIXED AUTH CALLS
-- =============================================================================

-- courses table - policy with auth.uid() in subquery
ALTER POLICY "Users can see published or purchased courses" ON "public"."courses"
USING (((status = 'Published'::lesson_status) OR (status = 'Coming Soon'::lesson_status) OR (EXISTS ( SELECT 1
   FROM course_enrollments ce
  WHERE ((ce.course_id = courses.id) AND (ce.user_id = auth.uid()) AND (ce.expires_at >= now()))))));

-- lessons table - policy with auth.uid() in complex subquery
ALTER POLICY "Users can view lessons for their enrolled courses" ON "public"."lessons"
USING (((EXISTS ( SELECT 1
   FROM ((modules m
     JOIN courses c ON ((c.id = m.course_id)))
     LEFT JOIN course_enrollments ce ON ((ce.course_id = c.id)))
  WHERE ((lessons.module_id = m.id) AND ((c.status = 'Published'::lesson_status) OR ((ce.user_id = auth.uid()) AND (ce.expires_at >= now())))))) AND (status = 'Published'::lesson_status)));

-- modules table - policy with auth.uid() in complex subquery  
ALTER POLICY "Users can view modules for their enrolled courses" ON "public"."modules"
USING ((EXISTS ( SELECT 1
   FROM (courses c
     LEFT JOIN course_enrollments ce ON ((ce.course_id = c.id)))
  WHERE ((c.id = modules.course_id) AND ((c.status = 'Published'::lesson_status) OR ((ce.user_id = auth.uid()) AND (ce.expires_at >= now())))))));

-- error_logs table - policy with auth.uid()
ALTER POLICY "Users can create error logs" ON "public"."error_logs"
WITH CHECK (auth.uid() = user_id);

COMMIT; 