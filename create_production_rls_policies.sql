-- Production RLS Policies Creation Script
-- This script recreates all RLS policies from development with public.is_admin calls

-- Enable RLS on all tables that need it
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

-- AI Settings policies
CREATE POLICY "Admins can manage AI settings" ON public.ai_settings
    FOR ALL TO public
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "All users can read active setting" ON public.ai_settings
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Collections policies
CREATE POLICY "Anyone can read flashcard collections" ON public.collections
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can create flashcard collections" ON public.collections
    FOR INSERT TO authenticated
    WITH CHECK (is_official = false);

CREATE POLICY "Users can delete non-official flashcard collections" ON public.collections
    FOR DELETE TO authenticated
    USING (is_official = false);

CREATE POLICY "Users can update non-official flashcard collections" ON public.collections
    FOR UPDATE TO authenticated
    USING (is_official = false)
    WITH CHECK (is_official = false);

-- Course enrollments policies
CREATE POLICY "Admins can manage all enrollments" ON public.course_enrollments
    FOR ALL TO public
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can create their own enrollments" ON public.course_enrollments
    FOR INSERT TO public
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON public.course_enrollments
    FOR UPDATE TO public
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own course enrollments" ON public.course_enrollments
    FOR SELECT TO public
    USING (auth.uid() = user_id);

-- Courses policies
CREATE POLICY "Admins can manage all courses" ON public.courses
    FOR ALL TO public
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can view published course info" ON public.courses
    FOR SELECT TO public
    USING ((status = 'Published'::lesson_status) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text)));

CREATE POLICY "Authenticated users can view all courses" ON public.courses
    FOR SELECT TO public
    USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Users can see published or purchased courses" ON public.courses
    FOR SELECT TO public
    USING ((status = 'Published'::lesson_status) OR (status = 'Coming Soon'::lesson_status) OR (EXISTS ( SELECT 1
   FROM course_enrollments ce
  WHERE ((ce.course_id = courses.id) AND (ce.user_id = auth.uid()) AND (ce.expires_at >= now())))));

-- Error logs policies
CREATE POLICY "Only admins can view error logs" ON public.error_logs
    FOR SELECT TO public
    USING (public.is_admin());

CREATE POLICY "Users can create error logs" ON public.error_logs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Flashcards policies
CREATE POLICY "Admins can update any flashcard" ON public.flashcards
    FOR UPDATE TO authenticated
    USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))
    WITH CHECK (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))));

CREATE POLICY "Admins can view all flashcards" ON public.flashcards
    FOR SELECT TO authenticated
    USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))));

CREATE POLICY "Anyone can view official flashcards" ON public.flashcards
    FOR SELECT TO authenticated
    USING (is_official = true);

CREATE POLICY "Anyone can view public sample flashcards" ON public.flashcards
    FOR SELECT TO anon, authenticated
    USING ((is_official = true) AND (is_public_sample = true));

CREATE POLICY "Anyone can view sample flashcards" ON public.flashcards
    FOR SELECT TO anon
    USING ((is_official = true) AND (is_public_sample = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR (auth.role() = 'authenticated'::text)));

CREATE POLICY "Users can create flashcards" ON public.flashcards
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can delete their own flashcards" ON public.flashcards
    FOR DELETE TO authenticated
    USING ((auth.uid() = created_by) AND (is_official = false));

CREATE POLICY "Users can update their own flashcards" ON public.flashcards
    FOR UPDATE TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own flashcards" ON public.flashcards
    FOR SELECT TO authenticated
    USING (auth.uid() = created_by);

-- Lesson progress policies
CREATE POLICY "Users can view their own lesson progress" ON public.lesson_progress
    FOR ALL TO public
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Lessons policies
CREATE POLICY "Admins can manage all lessons" ON public.lessons
    FOR ALL TO public
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can view published lesson titles" ON public.lessons
    FOR SELECT TO public
    USING ((status = 'Published'::lesson_status) AND (module_id IN ( SELECT m.id
   FROM modules m
  WHERE (m.course_id IN ( SELECT c.id
           FROM courses c
          WHERE (c.status = 'Published'::lesson_status))))) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text)));

CREATE POLICY "Users can view lessons for their enrolled courses" ON public.lessons
    FOR SELECT TO public
    USING ((EXISTS ( SELECT 1
   FROM ((modules m
     JOIN courses c ON ((c.id = m.course_id)))
     LEFT JOIN course_enrollments ce ON ((ce.course_id = c.id)))
  WHERE ((lessons.module_id = m.id) AND ((c.status = 'Published'::lesson_status) OR ((ce.user_id = auth.uid()) AND (ce.expires_at >= now())))))) AND (status = 'Published'::lesson_status));

-- Message counts policies
CREATE POLICY "Users can insert their own message counts" ON public.message_counts
    FOR INSERT TO public
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message counts" ON public.message_counts
    FOR UPDATE TO public
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own message counts" ON public.message_counts
    FOR SELECT TO public
    USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can create messages in own threads" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS ( SELECT 1
   FROM threads
  WHERE ((threads.id = messages.thread_id) AND (threads.user_id = auth.uid()))));

CREATE POLICY "Users can view messages from own threads" ON public.messages
    FOR SELECT TO authenticated
    USING (EXISTS ( SELECT 1
   FROM threads
  WHERE ((threads.id = messages.thread_id) AND (threads.user_id = auth.uid()))));

-- Models policies
CREATE POLICY "models_access" ON public.models
    FOR ALL TO authenticated
    USING (public.is_admin() OR (is_public = true));

-- Modules policies
CREATE POLICY "Admins can manage all modules" ON public.modules
    FOR ALL TO public
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can view published module titles" ON public.modules
    FOR SELECT TO public
    USING ((course_id IN ( SELECT courses.id
   FROM courses
  WHERE (courses.status = 'Published'::lesson_status))) AND ((current_setting('app.public_access'::text, true))::boolean OR (auth.role() = 'authenticated'::text)));

CREATE POLICY "Users can view modules for their enrolled courses" ON public.modules
    FOR SELECT TO public
    USING (EXISTS ( SELECT 1
   FROM (courses c
     LEFT JOIN course_enrollments ce ON ((ce.course_id = c.id)))
  WHERE ((c.id = modules.course_id) AND ((c.status = 'Published'::lesson_status) OR ((ce.user_id = auth.uid()) AND (ce.expires_at >= now()))))));

-- Profiles policies
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT TO public
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO public
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT TO public
    USING (auth.uid() = id);

-- Query logs policies
CREATE POLICY "Only admins can view query logs" ON public.query_logs
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- Subjects policies
CREATE POLICY "Anyone can read subjects" ON public.subjects
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Anyone can view official subjects" ON public.subjects
    FOR SELECT TO anon
    USING ((is_official = true) AND (( SELECT (current_setting('app.public_access'::text, true))::boolean AS current_setting) OR (auth.role() = 'authenticated'::text)));

CREATE POLICY "Users can create their own subjects" ON public.subjects
    FOR INSERT TO authenticated
    WITH CHECK (is_official = false);

CREATE POLICY "Users can delete their own non-official subjects" ON public.subjects
    FOR DELETE TO authenticated
    USING (is_official = false);

CREATE POLICY "Users can update their own non-official subjects" ON public.subjects
    FOR UPDATE TO authenticated
    USING (is_official = false)
    WITH CHECK (is_official = false);

-- System prompts policies
CREATE POLICY "Admins can manage system prompts" ON public.system_prompts
    FOR ALL TO public
    USING (public.is_admin());

CREATE POLICY "All users can read active prompt" ON public.system_prompts
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Threads policies
CREATE POLICY "Users can create own threads" ON public.threads
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own threads" ON public.threads
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own threads" ON public.threads
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own threads" ON public.threads
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- User entitlements policies
CREATE POLICY "Service role can manage entitlements" ON public.user_entitlements
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can read their own entitlements" ON public.user_entitlements
    FOR SELECT TO public
    USING (auth.uid() = user_id);

-- User subscriptions policies
CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY "Only service role can insert/update/delete subscriptions" ON public.user_subscriptions
    FOR ALL TO public
    USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
    FOR SELECT TO public
    USING (auth.uid() = user_id);

-- Document chunks policies (public access)
CREATE POLICY "Enable read access for all users" ON public.document_chunks
    FOR SELECT TO anon, authenticated
    USING (true); 