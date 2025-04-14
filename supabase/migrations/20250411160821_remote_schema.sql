revoke delete on table "public"."collections" from "anon";

revoke insert on table "public"."collections" from "anon";

revoke references on table "public"."collections" from "anon";

revoke select on table "public"."collections" from "anon";

revoke trigger on table "public"."collections" from "anon";

revoke truncate on table "public"."collections" from "anon";

revoke update on table "public"."collections" from "anon";

revoke delete on table "public"."course_enrollments" from "anon";

revoke insert on table "public"."course_enrollments" from "anon";

revoke references on table "public"."course_enrollments" from "anon";

revoke select on table "public"."course_enrollments" from "anon";

revoke trigger on table "public"."course_enrollments" from "anon";

revoke truncate on table "public"."course_enrollments" from "anon";

revoke update on table "public"."course_enrollments" from "anon";

revoke delete on table "public"."courses" from "anon";

revoke insert on table "public"."courses" from "anon";

revoke references on table "public"."courses" from "anon";

revoke select on table "public"."courses" from "anon";

revoke trigger on table "public"."courses" from "anon";

revoke truncate on table "public"."courses" from "anon";

revoke update on table "public"."courses" from "anon";

revoke delete on table "public"."flashcard_progress" from "anon";

revoke insert on table "public"."flashcard_progress" from "anon";

revoke references on table "public"."flashcard_progress" from "anon";

revoke select on table "public"."flashcard_progress" from "anon";

revoke trigger on table "public"."flashcard_progress" from "anon";

revoke truncate on table "public"."flashcard_progress" from "anon";

revoke update on table "public"."flashcard_progress" from "anon";

revoke delete on table "public"."flashcards" from "anon";

revoke insert on table "public"."flashcards" from "anon";

revoke references on table "public"."flashcards" from "anon";

revoke select on table "public"."flashcards" from "anon";

revoke trigger on table "public"."flashcards" from "anon";

revoke truncate on table "public"."flashcards" from "anon";

revoke update on table "public"."flashcards" from "anon";

revoke delete on table "public"."lesson_progress" from "anon";

revoke insert on table "public"."lesson_progress" from "anon";

revoke references on table "public"."lesson_progress" from "anon";

revoke select on table "public"."lesson_progress" from "anon";

revoke trigger on table "public"."lesson_progress" from "anon";

revoke truncate on table "public"."lesson_progress" from "anon";

revoke update on table "public"."lesson_progress" from "anon";

revoke delete on table "public"."lessons" from "anon";

revoke insert on table "public"."lessons" from "anon";

revoke references on table "public"."lessons" from "anon";

revoke select on table "public"."lessons" from "anon";

revoke trigger on table "public"."lessons" from "anon";

revoke truncate on table "public"."lessons" from "anon";

revoke update on table "public"."lessons" from "anon";

revoke delete on table "public"."messages" from "anon";

revoke insert on table "public"."messages" from "anon";

revoke references on table "public"."messages" from "anon";

revoke select on table "public"."messages" from "anon";

revoke trigger on table "public"."messages" from "anon";

revoke truncate on table "public"."messages" from "anon";

revoke update on table "public"."messages" from "anon";

revoke delete on table "public"."modules" from "anon";

revoke insert on table "public"."modules" from "anon";

revoke references on table "public"."modules" from "anon";

revoke select on table "public"."modules" from "anon";

revoke trigger on table "public"."modules" from "anon";

revoke truncate on table "public"."modules" from "anon";

revoke update on table "public"."modules" from "anon";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."subjects" from "anon";

revoke insert on table "public"."subjects" from "anon";

revoke references on table "public"."subjects" from "anon";

revoke select on table "public"."subjects" from "anon";

revoke trigger on table "public"."subjects" from "anon";

revoke truncate on table "public"."subjects" from "anon";

revoke update on table "public"."subjects" from "anon";

revoke delete on table "public"."threads" from "anon";

revoke insert on table "public"."threads" from "anon";

revoke references on table "public"."threads" from "anon";

revoke select on table "public"."threads" from "anon";

revoke trigger on table "public"."threads" from "anon";

revoke truncate on table "public"."threads" from "anon";

revoke update on table "public"."threads" from "anon";

revoke delete on table "public"."user_entitlements" from "anon";

revoke insert on table "public"."user_entitlements" from "anon";

revoke references on table "public"."user_entitlements" from "anon";

revoke select on table "public"."user_entitlements" from "anon";

revoke trigger on table "public"."user_entitlements" from "anon";

revoke truncate on table "public"."user_entitlements" from "anon";

revoke update on table "public"."user_entitlements" from "anon";

revoke delete on table "public"."user_subscriptions" from "anon";

revoke insert on table "public"."user_subscriptions" from "anon";

revoke references on table "public"."user_subscriptions" from "anon";

revoke select on table "public"."user_subscriptions" from "anon";

revoke trigger on table "public"."user_subscriptions" from "anon";

revoke truncate on table "public"."user_subscriptions" from "anon";

revoke update on table "public"."user_subscriptions" from "anon";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.admin_connection_test()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_admin boolean;
  user_id uuid;
  result json;
BEGIN
  user_id := auth.uid();
  is_admin := auth.is_admin();
  
  result := json_build_object(
    'user_id', user_id,
    'is_admin', is_admin,
    'timestamp', now(),
    'function_exists', true
  );
  
  RETURN result;
END;
$function$
;


