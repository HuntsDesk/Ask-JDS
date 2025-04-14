-- course_enrollments
ALTER POLICY "course_enrollments_select" ON public.course_enrollments
USING ((user_id = auth.uid()) OR auth.is_admin(auth.uid()));

-- flashcards
ALTER POLICY "Admins can view all flashcards" ON public.flashcards
USING (auth.is_admin(auth.uid()));

-- user_subscriptions
ALTER POLICY "Admins can view all subscriptions" ON public.user_subscriptions
USING (auth.is_admin(auth.uid()) OR ((auth.jwt() ->> 'role') = 'service_role'));

ALTER POLICY "Only service role can insert/update/delete subscriptions" ON public.user_subscriptions
USING (((auth.jwt() ->> 'role') = 'service_role'));

-- Optional: this line assumes access should remain for service role + admin
ALTER POLICY "user_subscriptions_select" ON public.user_subscriptions
USING ((user_id = auth.uid()) OR auth.is_admin(auth.uid()));

/* 
The rest of this file appears to be a table dump of RLS Policies.
This is not valid SQL and has been commented out.

Original content kept for reference but commented out:

# RLS Policies

schemaname	tablename	policyname	roles	command	permissive	using_raw	with_check_raw
...etc...
*/