

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."lesson_status" AS ENUM (
    'Draft',
    'Coming Soon',
    'Published',
    'Archived'
);


ALTER TYPE "public"."lesson_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_course_enrollment"("p_user_id" "uuid", "p_course_id" "uuid", "p_days_of_access" integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  new_id UUID;
BEGIN
  IF p_days_of_access <= 0 THEN
    RAISE EXCEPTION 'Days of access must be greater than zero';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE user_id = p_user_id AND course_id = p_course_id
      AND expires_at > NOW()
  ) THEN
    SELECT id INTO new_id
    FROM public.course_enrollments
    WHERE user_id = p_user_id AND course_id = p_course_id
      AND expires_at > NOW();

    RETURN new_id;
  END IF;

  INSERT INTO public.course_enrollments(
    user_id,
    course_id,
    enrolled_at,
    expires_at,
    renewal_count,
    notification_7day_sent,
    notification_1day_sent,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_course_id,
    NOW(),
    NOW() + (p_days_of_access || ' days')::INTERVAL,
    0,
    FALSE,
    FALSE,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;


ALTER FUNCTION "public"."create_course_enrollment"("p_user_id" "uuid", "p_course_id" "uuid", "p_days_of_access" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_first_admin"("admin_email" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Check if any admin users already exist
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE raw_user_meta_data->>'is_admin' = 'true'
  ) THEN
    RAISE EXCEPTION 'Cannot create first admin: admin users already exist';
  END IF;

  -- Get the user ID for the target email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = admin_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;

  -- Update the user's metadata to make them an admin
  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('is_admin', true)
      ELSE raw_user_meta_data || jsonb_build_object('is_admin', true)
    END
  WHERE id = target_user_id;
END;
$$;


ALTER FUNCTION "public"."create_first_admin"("admin_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_auth_uid"() RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog, public'
    AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT auth.uid() INTO user_id;
  RAISE NOTICE 'Current auth.uid(): %', user_id;
  RETURN user_id;
END;
$$;


ALTER FUNCTION "public"."debug_auth_uid"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_profile_exists"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  profile_exists boolean;
BEGIN
  -- Check if profile exists
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid()
  ) INTO profile_exists;
  
  -- If profile doesn't exist, create it
  IF NOT profile_exists THEN
    INSERT INTO public.profiles (id, created_at)
    VALUES (auth.uid(), now());
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_profile_exists"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_single_active_ai_setting"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE ai_settings
  SET is_active = false
  WHERE user_id = NEW.user_id
    AND id <> NEW.id
    AND is_active = true;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_single_active_ai_setting"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_single_active_prompt"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE prompts
  SET is_active = false
  WHERE user_id = NEW.user_id
    AND id <> NEW.id
    AND is_active = true;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_single_active_prompt"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."extract_year_month"("date_value" timestamp with time zone) RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'pg_catalog, public'
    AS $$
  SELECT (EXTRACT(YEAR FROM date_value) * 100 + EXTRACT(MONTH FROM date_value))::INTEGER;
$$;


ALTER FUNCTION "public"."extract_year_month"("date_value" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_users_24h"() RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  active_count bigint;
BEGIN
  -- Check if the executing user is an admin
  IF NOT auth.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view user statistics';
  END IF;

  SELECT COUNT(*) INTO active_count
  FROM auth.users
  WHERE last_sign_in_at >= NOW() - INTERVAL '24 hours';
  
  RETURN active_count;
END;
$$;


ALTER FUNCTION "public"."get_active_users_24h"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_users"() RETURNS TABLE("id" "uuid", "email" character varying, "created_at" timestamp with time zone, "last_sign_in_at" timestamp with time zone, "raw_user_meta_data" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Add debug logging
  RAISE NOTICE 'Executing get_all_users for user: %', auth.uid();
  RAISE NOTICE 'User is admin: %', auth.is_admin(auth.uid());

  -- Check if the executing user is an admin
  IF NOT auth.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view user data. User: %, Is admin: %', 
      auth.uid(), 
      auth.is_admin(auth.uid());
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email::varchar(255), -- Explicit cast to match return type
    au.created_at,
    au.last_sign_in_at,
    au.raw_user_meta_data
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_all_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_database_schema"() RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    result jsonb;
BEGIN
    WITH schema_info AS (
        -- Tables and Columns: Get structure of all public tables
        SELECT 
            jsonb_build_object(
                'tables',
                (SELECT jsonb_object_agg(table_name, columns)
                FROM (
                    SELECT 
                        t.table_name,
                        jsonb_agg(
                            jsonb_build_object(
                                'column_name', c.column_name,
                                'data_type', c.data_type,
                                'is_nullable', c.is_nullable,
                                'column_default', c.column_default,
                                'identity_generation', c.identity_generation
                            ) ORDER BY c.ordinal_position
                        ) as columns
                    FROM information_schema.tables t
                    JOIN information_schema.columns c 
                         ON t.table_name = c.table_name 
                         AND t.table_schema = c.table_schema
                    WHERE t.table_schema = 'public' 
                    AND t.table_type = 'BASE TABLE'
                    GROUP BY t.table_name
                ) t),

                -- Indexes: Get all indexes including their OIDs for uniqueness
                'indexes',
                (SELECT jsonb_object_agg(
                    schemaname || '.' || tablename || '.' || indexname,
                    jsonb_build_object(
                        'definition', indexdef,
                        'oid', i.oid::text
                    )
                )
                FROM pg_indexes idx
                JOIN pg_class i ON i.relname = idx.indexname
                WHERE idx.schemaname = 'public'),

                -- Constraints: Get all table constraints with their definitions
                'constraints',
                (SELECT jsonb_object_agg(
                    table_name || '.' || constraint_name,
                    jsonb_build_object(
                        'constraint_type', constraint_type,
                        'definition', pg_get_constraintdef(pg_constraint.oid)
                    )
                )
                FROM (
                    SELECT 
                        tc.table_name,
                        tc.constraint_name,
                        tc.constraint_type,
                        c.oid
                    FROM information_schema.table_constraints tc
                    JOIN pg_constraint c ON tc.constraint_name = c.conname
                    WHERE tc.table_schema = 'public'
                ) sub),

                -- RLS Policies: Get all row level security policies
                'policies',
                (SELECT jsonb_object_agg(
                    tablename || '.' || policyname,
                    jsonb_build_object(
                        'permissive', permissive,
                        'roles', roles,
                        'command', cmd,
                        'using', CASE WHEN qual IS NOT NULL 
                                    THEN pg_get_expr(qual, table_id::regclass) 
                                    ELSE null END,
                        'with_check', CASE WHEN with_check IS NOT NULL 
                                         THEN pg_get_expr(with_check, table_id::regclass) 
                                         ELSE null END
                    )
                )
                FROM pg_policies
                WHERE schemaname = 'public'),

                -- Functions: Get all functions with their properties and arguments
                'functions',
                (SELECT jsonb_object_agg(
                    proname || '_' || p.oid::text,
                    jsonb_build_object(
                        'name', proname,
                        'language', l.lanname,
                        'security', CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END,
                        'volatility', CASE p.provolatile 
                                     WHEN 'i' THEN 'IMMUTABLE'
                                     WHEN 's' THEN 'STABLE'
                                     ELSE 'VOLATILE' END,
                        'definition', pg_get_functiondef(p.oid),
                        'argument_types', pg_get_function_arguments(p.oid)
                    )
                )
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                JOIN pg_language l ON p.prolang = l.oid
                WHERE n.nspname = 'public'),

                -- Triggers: Get all trigger definitions
                'triggers',
                (SELECT jsonb_object_agg(
                    trigger_name,
                    jsonb_build_object(
                        'table', event_object_table,
                        'timing', condition_timing,
                        'event', event_manipulation,
                        'definition', action_statement
                    )
                )
                FROM information_schema.triggers
                WHERE trigger_schema = 'public')
            ) as schema_info
    )
    SELECT schema_info INTO result FROM schema_info;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_database_schema"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_database_schema"() IS 'Returns a comprehensive view of the database schema including tables, columns, indexes, constraints, policies, functions, and triggers';



CREATE OR REPLACE FUNCTION "public"."get_error_logs"() RETURNS TABLE("id" "uuid", "message" "text", "stack_trace" "text", "investigated" boolean, "created_at" timestamp with time zone, "user_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT auth.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view error logs';
  END IF;

  RETURN QUERY
  SELECT el.*
  FROM error_logs el
  ORDER BY el.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_error_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_flashcard_stats"() RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    total_count INTEGER;
    official_count INTEGER;
    user_count INTEGER;
    pitfalls_count INTEGER;
    samples_count INTEGER;
    result JSON;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_count FROM flashcards;
    
    -- Get official count
    SELECT COUNT(*) INTO official_count 
    FROM flashcards 
    WHERE is_official = TRUE;
    
    -- Get user-generated count
    SELECT COUNT(*) INTO user_count 
    FROM flashcards 
    WHERE is_official = FALSE;
    
    -- Get common pitfalls count
    SELECT COUNT(*) INTO pitfalls_count 
    FROM flashcards 
    WHERE is_common_pitfall = TRUE;
    
    -- Get public samples count
    SELECT COUNT(*) INTO samples_count 
    FROM flashcards 
    WHERE is_public_sample = TRUE;
    
    -- Construct JSON result
    result := json_build_object(
        'total', total_count,
        'official', official_count,
        'user', user_count,
        'pitfalls', pitfalls_count,
        'samples', samples_count
    );
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_flashcard_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lifetime_message_count"("user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  lifetime_count INTEGER;
BEGIN
  -- Get current lifetime count
  SELECT lifetime_message_count INTO lifetime_count
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN COALESCE(lifetime_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_lifetime_message_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_total_users"() RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  total bigint;
BEGIN
  -- Check if the executing user is an admin
  IF NOT auth.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view user statistics';
  END IF;

  SELECT COUNT(*) INTO total FROM auth.users;
  RETURN total;
END;
$$;


ALTER FUNCTION "public"."get_total_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_message_count"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog, public'
    AS $$
DECLARE
  user_id UUID;
  count_value INTEGER;
  first_day_of_month TIMESTAMPTZ;
  last_day_of_month TIMESTAMPTZ;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  -- Return 0 if no user is authenticated
  IF user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate the first and last day of the current month
  first_day_of_month := date_trunc('month', now());
  last_day_of_month := (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date;
  
  -- First try to get from message_counts table
  SELECT count INTO count_value
  FROM public.message_counts
  WHERE user_id = auth.uid()
    AND period_start >= first_day_of_month
    AND period_end <= last_day_of_month
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- If found, return the count
  IF count_value IS NOT NULL THEN
    RETURN count_value;
  END IF;
  
  -- Otherwise, count messages directly
  SELECT COUNT(*)::INTEGER INTO count_value
  FROM public.messages
  WHERE user_id = auth.uid()
    AND role = 'user'
    AND created_at >= first_day_of_month
    AND created_at <= last_day_of_month;
  
  -- Return the count or 0 if null
  RETURN COALESCE(count_value, 0);
END;
$$;


ALTER FUNCTION "public"."get_user_message_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_message_count"("input_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog, public'
    AS $$
DECLARE
  user_id_internal UUID;
  count_value INTEGER;
  first_day_of_month TIMESTAMPTZ;
  last_day_of_month TIMESTAMPTZ;
BEGIN
  -- Get the current user ID
  user_id_internal := COALESCE(input_user_id, auth.uid());
  
  -- Return 0 if no user is authenticated
  IF user_id_internal IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate the first and last day of the current month (in UTC)
  first_day_of_month := date_trunc('month', now() AT TIME ZONE 'UTC');
  last_day_of_month := first_day_of_month + interval '1 month' - interval '1 second';
  
  -- First try to get the message count from the message_counts table
  SELECT count INTO count_value
  FROM public.message_counts mc
  WHERE mc.user_id = user_id_internal
    AND mc.period_start >= first_day_of_month
    AND mc.period_end <= last_day_of_month
  ORDER BY count DESC
  LIMIT 1;
  
  -- If found, return the count
  IF count_value IS NOT NULL THEN
    RETURN count_value;
  END IF;
  
  -- Otherwise, count messages directly
  SELECT COUNT(*)::INTEGER INTO count_value
  FROM public.messages m
  WHERE m.user_id = user_id_internal
    AND m.role = 'user'
    AND m.created_at >= first_day_of_month
    AND m.created_at <= last_day_of_month;
  
  -- Return the count or 0 if null
  RETURN COALESCE(count_value, 0);
END;
$$;


ALTER FUNCTION "public"."get_user_message_count"("input_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.users (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog, public'
    AS $$
BEGIN
  INSERT INTO public.user_subscriptions (
    user_id,
    status,
    current_period_end,
    cancel_at_period_end,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'inactive',
    NOW() + INTERVAL '30 days',
    false,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog, public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_any_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE raw_user_meta_data->>'is_admin' = 'true'
  );
END;
$$;


ALTER FUNCTION "public"."has_any_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_course_access"("user_id" "uuid", "course_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    -- Check if user has an active enrollment for this course
    RETURN EXISTS (
        SELECT 1 
        FROM public.course_enrollments ce
        WHERE ce.user_id = has_course_access.user_id 
        AND ce.course_id = has_course_access.course_id
        AND ce.expires_at >= now()
    );
END;
$$;


ALTER FUNCTION "public"."has_course_access"("user_id" "uuid", "course_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_course_access"("user_id" "uuid", "course_id" "uuid") IS 'Checks if user has access to a course - uses security invoker with empty search_path';



CREATE OR REPLACE FUNCTION "public"."has_entitlement"("feature_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_entitlements
    WHERE user_id = auth.uid()
    AND feature = feature_name
    AND status = 'active'
  );
END;
$$;


ALTER FUNCTION "public"."has_entitlement"("feature_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_entitlement"("user_id" "uuid", "entitlement_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_entitlements
    WHERE user_entitlements.user_id = has_entitlement.user_id
      AND user_entitlements.entitlement = has_entitlement.entitlement_name
      AND user_entitlements.is_active = true
  );
END;
$$;


ALTER FUNCTION "public"."has_entitlement"("user_id" "uuid", "entitlement_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_lifetime_message_count"("user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_count INTEGER;
  new_count INTEGER;
BEGIN
  -- Get current lifetime count
  SELECT lifetime_message_count INTO current_count
  FROM public.profiles
  WHERE id = user_id;
  
  -- If profile record doesn't exist yet, create it
  IF current_count IS NULL THEN
    INSERT INTO public.profiles (id, created_at, lifetime_message_count)
    VALUES (user_id, now(), 1)
    ON CONFLICT (id) DO UPDATE
    SET lifetime_message_count = COALESCE(public.profiles.lifetime_message_count, 0) + 1;
    
    new_count := 1;
  ELSE
    -- Increment the count
    new_count := current_count + 1;
    
    UPDATE public.profiles
    SET lifetime_message_count = new_count
    WHERE id = user_id;
  END IF;
  
  RETURN new_count;
END;
$$;


ALTER FUNCTION "public"."increment_lifetime_message_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_user_message_count"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog, public'
    AS $$
DECLARE
  user_id UUID;
  current_count INTEGER;
  new_count INTEGER;
  record_id UUID;
  first_day_of_month TIMESTAMPTZ;
  last_day_of_month TIMESTAMPTZ;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  -- Return 0 if no user is authenticated
  IF user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate the first and last day of the current month
  first_day_of_month := date_trunc('month', now());
  last_day_of_month := (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date;
  
  -- First try to get from message_counts table
  SELECT id, count INTO record_id, current_count
  FROM public.message_counts
  WHERE user_id = auth.uid()
    AND period_start >= first_day_of_month
    AND period_end <= last_day_of_month
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- If found, increment the count
  IF record_id IS NOT NULL THEN
    new_count := current_count + 1;
    
    UPDATE public.message_counts
    SET count = new_count, updated_at = now()
    WHERE id = record_id;
    
    RETURN new_count;
  END IF;
  
  -- Otherwise, count messages directly
  SELECT COUNT(*)::INTEGER INTO current_count
  FROM public.messages
  WHERE user_id = auth.uid()
    AND role = 'user'
    AND created_at >= first_day_of_month
    AND created_at <= last_day_of_month;
  
  -- Calculate new count
  new_count := COALESCE(current_count, 0) + 1;
  
  -- Insert new record
  INSERT INTO public.message_counts (
    user_id,
    count,
    period_start,
    period_end
  ) VALUES (
    auth.uid(),
    new_count,
    first_day_of_month,
    last_day_of_month
  );
  
  RETURN new_count;
END;
$$;


ALTER FUNCTION "public"."increment_user_message_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_user_message_count"("input_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog, public'
    AS $$
DECLARE
  user_id_internal UUID;
  current_count INTEGER;
  new_count INTEGER;
  record_id UUID;
  first_day_of_month TIMESTAMPTZ;
  last_day_of_month TIMESTAMPTZ;
  debug_info TEXT;
BEGIN
  -- Add debug logging
  RAISE LOG 'increment_user_message_count called for user: %', input_user_id;

  -- Get the current user ID or use the provided one
  user_id_internal := COALESCE(input_user_id, auth.uid());
  
  -- Return 0 if no user is authenticated
  IF user_id_internal IS NULL THEN
    RAISE LOG 'No user ID provided/available';
    RETURN 0;
  END IF;
  
  -- Also increment the lifetime message count
  PERFORM public.increment_lifetime_message_count(user_id_internal);
  
  -- Calculate the first and last day of the current month (in UTC)
  first_day_of_month := date_trunc('month', now() AT TIME ZONE 'UTC');
  last_day_of_month := first_day_of_month + interval '1 month' - interval '1 second';
  
  RAISE LOG 'Checking for existing record for period: % to %', first_day_of_month, last_day_of_month;
  
  -- First check if we already have a record for this month
  SELECT id, count INTO record_id, current_count
  FROM public.message_counts mc
  WHERE mc.user_id = user_id_internal
    AND mc.period_start >= first_day_of_month
    AND mc.period_end <= last_day_of_month
  ORDER BY count DESC
  LIMIT 1;
  
  -- Log what we found
  IF record_id IS NOT NULL THEN
    RAISE LOG 'Found existing record ID: % with count: %', record_id, current_count;
  ELSE
    RAISE LOG 'No existing record found for this month';
  END IF;
  
  -- If found, increment the count
  IF record_id IS NOT NULL THEN
    new_count := current_count + 1;
    
    RAISE LOG 'Updating record % to new count: %', record_id, new_count;
    
    UPDATE public.message_counts
    SET count = new_count, updated_at = now()
    WHERE id = record_id;
    
    -- Check if the update was successful
    IF NOT FOUND THEN
      RAISE LOG 'Update failed - no rows affected';
    ELSE
      RAISE LOG 'Update successful';
    END IF;
    
    RETURN new_count;
  END IF;
  
  -- Otherwise, count messages directly
  SELECT COUNT(*)::INTEGER INTO current_count
  FROM public.messages m
  WHERE m.user_id = user_id_internal
    AND m.role = 'user'
    AND m.created_at >= first_day_of_month
    AND m.created_at <= last_day_of_month;
  
  -- Calculate new count
  new_count := COALESCE(current_count, 0) + 1;
  
  RAISE LOG 'Inserting new record with count: %', new_count;
  
  -- Insert new record - add a short delay to help avoid race conditions
  PERFORM pg_sleep(0.1);
  
  -- Insert with ON CONFLICT handling to ensure it works even with simultaneous calls
  INSERT INTO public.message_counts (
    user_id,
    count,
    period_start,
    period_end,
    created_at,
    updated_at
  ) VALUES (
    user_id_internal,
    new_count,
    first_day_of_month,
    last_day_of_month,
    now(),
    now()
  )
  ON CONFLICT (user_id, (extract_year_month(period_start)))
  DO UPDATE SET 
    count = EXCLUDED.count,
    updated_at = now();
  
  RETURN new_count;
END;
$$;


ALTER FUNCTION "public"."increment_user_message_count"("input_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog, public'
    AS $$
BEGIN
  RETURN auth.is_admin();
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- If no user_id provided, use the current user
  IF user_id IS NULL THEN
    target_user_id := auth.uid();
  ELSE
    target_user_id := user_id;
  END IF;
  
  -- Return false if no user is authenticated or provided
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if the user is an admin in auth.users metadata
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = target_user_id
    AND (raw_user_meta_data->>'is_admin')::boolean = true
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_subscription_active"("user_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_subscriptions 
        WHERE user_id = user_uuid 
        AND status = 'active'
    );
END;
$$;


ALTER FUNCTION "public"."is_subscription_active"("user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_subscription_active"("user_uuid" "uuid") IS 'Checks if a user has an active subscription - uses security invoker with empty search_path';



CREATE OR REPLACE FUNCTION "public"."log_slow_query"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog, public'
    AS $$
BEGIN
  -- Log slow queries to a table
  INSERT INTO public.query_logs (query, duration, executed_at)
  VALUES (current_query(), EXTRACT(EPOCH FROM now() - statement_timestamp()), now());
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_slow_query"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_error_investigated"("error_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT auth.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can update error logs';
  END IF;

  UPDATE error_logs
  SET investigated = NOT investigated
  WHERE id = error_id;
END;
$$;


ALTER FUNCTION "public"."mark_error_investigated"("error_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_admin"("user_email" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog, public'
    AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'is_admin' = 'true'
  ) THEN
    RAISE EXCEPTION 'Only administrators can revoke admin status';
  END IF;

  -- Get the user ID for the target email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Update the user's metadata to remove admin status
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data - 'is_admin'
  WHERE id = target_user_id;
END;
$$;


ALTER FUNCTION "public"."revoke_admin"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_admin"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog, public'
    AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can revoke admin status';
  END IF;

  -- Update the profile to remove admin status
  UPDATE public.profiles
  SET is_admin = false
  WHERE id = user_id;
  
  -- Also update the auth.users metadata for backward compatibility
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data - 'is_admin'
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."revoke_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_flashcard_creator"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog, public'
    AS $$
BEGIN
  -- If created_by is not provided, set it to the current user
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  -- We no longer inherit is_official from a collection since we can have multiple
  -- For simplicity, if is_official isn't explicitly set, default to false
  IF NEW.is_official IS NULL THEN
    NEW.is_official := false;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_flashcard_creator"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_increment_message_count"("user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    new_count integer;
BEGIN
    -- Insert or update message count
    INSERT INTO public.message_counts (user_id, count, updated_at)
    VALUES (user_id, 1, now())
    ON CONFLICT (user_id)
    DO UPDATE SET 
        count = public.message_counts.count + 1,
        updated_at = now()
    RETURNING count INTO new_count;
    
    RETURN new_count;
END;
$$;


ALTER FUNCTION "public"."test_increment_message_count"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."test_increment_message_count"("user_id" "uuid") IS 'Test function for incrementing message count - uses security invoker with empty search_path';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_profile"("user_id" "uuid", "new_first_name" "text" DEFAULT NULL::"text", "new_last_name" "text" DEFAULT NULL::"text", "new_email" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  is_current_user BOOLEAN;
  current_email TEXT;
BEGIN
  -- Verify that the user is updating their own profile
  SELECT (user_id = auth.uid()) INTO is_current_user;
  
  IF NOT is_current_user THEN
    RAISE EXCEPTION 'Cannot update another user''s profile';
  END IF;
  
  -- If email is being updated, verify it's not already in use
  IF new_email IS NOT NULL THEN
    SELECT email INTO current_email FROM auth.users WHERE id = user_id;
    
    -- Only do this check if email is actually changing
    IF new_email != current_email THEN
      -- Check if email exists in auth.users
      IF EXISTS (SELECT 1 FROM auth.users WHERE email = new_email) THEN
        RAISE EXCEPTION 'Email address already in use';
      END IF;
      
      -- Update email in auth.users - this will be handled by the application instead
      -- to properly handle auth system requirements
    END IF;
  END IF;
  
  -- Update the user profile in public.profiles
  UPDATE public.profiles
  SET 
    first_name = COALESCE(new_first_name, first_name),
    last_name = COALESCE(new_last_name, last_name),
    updated_at = now()
  WHERE id = user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."update_user_profile"("user_id" "uuid", "new_first_name" "text", "new_last_name" "text", "new_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upgrade_to_admin"("user_email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    target_user_id uuid;
    success boolean := false;
BEGIN
    -- Get user ID from auth.users table
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update the user's admin status in profiles table
    UPDATE public.profiles
    SET is_admin = true
    WHERE id = target_user_id;
    
    -- Check if update was successful
    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$;


ALTER FUNCTION "public"."upgrade_to_admin"("user_email" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."upgrade_to_admin"("user_email" "text") IS 'Upgrades a user to admin by email - uses security definer with empty search_path';



CREATE OR REPLACE FUNCTION "public"."upgrade_to_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    success boolean := false;
BEGIN
    -- Update the user's admin status in profiles table
    UPDATE public.profiles
    SET is_admin = true
    WHERE id = user_id;
    
    -- Check if update was successful
    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$;


ALTER FUNCTION "public"."upgrade_to_admin"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."upgrade_to_admin"("user_id" "uuid") IS 'Upgrades a user to admin by user_id - uses security definer with empty search_path';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "model" "text" NOT NULL,
    "is_active" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "ai_settings_provider_check" CHECK (("provider" = ANY (ARRAY['openai'::"text", 'anthropic'::"text", 'gemini'::"text", 'google'::"text"])))
);


ALTER TABLE "public"."ai_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collection_subjects" (
    "collection_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."collection_subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "is_official" boolean DEFAULT false,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."collections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_enrollments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "course_id" "uuid",
    "enrolled_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "renewal_count" integer DEFAULT 0,
    "notification_7day_sent" boolean DEFAULT false,
    "notification_1day_sent" boolean DEFAULT false,
    "last_accessed" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "stripe_price_id" "text",
    "stripe_payment_intent_id" "text"
);


ALTER TABLE "public"."course_enrollments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."course_enrollments"."stripe_price_id" IS 'Stores the Stripe Price ID used for this specific course enrollment transaction (e.g., price_xxxxxxxxxxxxxx).';



COMMENT ON COLUMN "public"."course_enrollments"."stripe_payment_intent_id" IS 'Stores the Stripe Payment Intent ID for webhook idempotency.';



CREATE TABLE IF NOT EXISTS "public"."course_subjects" (
    "course_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."course_subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "tile_description" "text",
    "overview" "text",
    "days_of_access" integer DEFAULT 30 NOT NULL,
    "is_featured" boolean DEFAULT false,
    "what_youll_learn" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "status" "public"."lesson_status" DEFAULT 'Draft'::"public"."lesson_status",
    "price" numeric DEFAULT 0,
    "original_price" numeric,
    "stripe_price_id" "text",
    "stripe_price_id_dev" "text"
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


COMMENT ON COLUMN "public"."courses"."stripe_price_id" IS 'Linking the product to its Stripe Price ID';



COMMENT ON COLUMN "public"."courses"."stripe_price_id_dev" IS 'Price ID if the product is entered into Stripe Sandbox/Dev mode.';



CREATE TABLE IF NOT EXISTS "public"."document_chunks" (
    "id" integer NOT NULL,
    "source" "text" NOT NULL,
    "type" "text" NOT NULL,
    "speaker" "text",
    "start_time" double precision,
    "end_time" double precision,
    "text" "text" NOT NULL,
    "embedding" "extensions"."vector"(768) NOT NULL,
    "clip" boolean,
    "heading" "text",
    "outline_subject" "text",
    "outline_source" "text",
    "heading_level" integer,
    "heading_number" "text",
    "heading_text" "text",
    "heading_path" "text"[],
    CONSTRAINT "heading_level_check" CHECK (("heading_level" >= 0)),
    CONSTRAINT "outline_source_not_null" CHECK (("outline_source" IS NOT NULL)),
    CONSTRAINT "outline_subject_not_empty" CHECK ((("outline_subject" IS NULL) OR ("length"(TRIM(BOTH FROM "outline_subject")) > 0)))
);


ALTER TABLE "public"."document_chunks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."document_chunks"."type" IS 'Type of document chunk - either transcript or outline';



COMMENT ON COLUMN "public"."document_chunks"."heading" IS 'Section heading for outline chunks, null for transcripts';



COMMENT ON COLUMN "public"."document_chunks"."outline_subject" IS 'Subject area of the outline (e.g., Agency Law, Contracts)';



COMMENT ON COLUMN "public"."document_chunks"."outline_source" IS 'Source of the outline (e.g., Commercial, Personal Notes)';



COMMENT ON COLUMN "public"."document_chunks"."heading_level" IS 'Hierarchy level of the heading (1 for main sections, 2 for subsections, etc.)';



COMMENT ON COLUMN "public"."document_chunks"."heading_number" IS 'The identifier of the heading (A, 1, I, etc.)';



COMMENT ON COLUMN "public"."document_chunks"."heading_text" IS 'The text content of the heading without the number';



COMMENT ON COLUMN "public"."document_chunks"."heading_path" IS 'Full path array showing hierarchy (e.g., [Agency Law, A. Background, 1. Actual Authority])';



COMMENT ON CONSTRAINT "outline_source_not_null" ON "public"."document_chunks" IS 'Ensures outline_source is not null but allows empty strings';



CREATE SEQUENCE IF NOT EXISTS "public"."document_chunks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."document_chunks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."document_chunks_id_seq" OWNED BY "public"."document_chunks"."id";



CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message" "text" NOT NULL,
    "stack_trace" "text",
    "investigated" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exam_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_official" boolean DEFAULT false
);


ALTER TABLE "public"."exam_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcard_collections_junction" (
    "flashcard_id" "uuid" NOT NULL,
    "collection_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."flashcard_collections_junction" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcard_exam_types" (
    "flashcard_id" "uuid" NOT NULL,
    "exam_type_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."flashcard_exam_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcard_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "flashcard_id" "uuid" NOT NULL,
    "is_mastered" boolean DEFAULT false,
    "last_reviewed" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."flashcard_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcard_subjects" (
    "flashcard_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."flashcard_subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_reviewed" timestamp with time zone,
    "is_mastered" boolean DEFAULT false,
    "position" integer DEFAULT 0,
    "created_by" "uuid",
    "is_official" boolean DEFAULT false,
    "difficulty_level" "text",
    "highly_tested" boolean DEFAULT false,
    "is_public_sample" boolean DEFAULT false NOT NULL,
    "is_common_pitfall" boolean DEFAULT false,
    CONSTRAINT "flashcards_difficulty_level_check" CHECK (("difficulty_level" = ANY (ARRAY['EASY'::"text", 'MEDIUM'::"text", 'HARD'::"text"])))
);


ALTER TABLE "public"."flashcards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "lesson_id" "uuid",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lesson_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "module_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "video_id" "text",
    "position" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "status" "public"."lesson_status" DEFAULT 'Draft'::"public"."lesson_status"
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_counts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."message_counts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "thread_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    CONSTRAINT "messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."models" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "api_key_required" boolean DEFAULT false,
    "max_tokens" integer DEFAULT 4096,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "model_version" "text",
    "provider" "text",
    "is_public" boolean DEFAULT false
);


ALTER TABLE "public"."models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "position" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "stripe_customer_id" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "first_name" "text",
    "last_name" "text",
    "lifetime_message_count" integer DEFAULT 0,
    "email" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."query_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "query" "text",
    "duration" numeric,
    "executed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."query_logs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."schema_overview" WITH ("security_invoker"='true') AS
 SELECT "pg_tables"."schemaname",
    "pg_tables"."tablename",
    "pg_tables"."tableowner",
    "pg_tables"."tablespace",
    "pg_tables"."hasindexes",
    "pg_tables"."hasrules",
    "pg_tables"."hastriggers",
    "pg_tables"."rowsecurity"
   FROM "pg_tables"
  WHERE ("pg_tables"."schemaname" = 'public'::"name")
  ORDER BY "pg_tables"."tablename";


ALTER TABLE "public"."schema_overview" OWNER TO "postgres";


COMMENT ON VIEW "public"."schema_overview" IS 'Schema overview view - explicitly uses security invoker to respect RLS policies';



CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_official" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "is_active" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."system_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);


ALTER TABLE "public"."threads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_entitlements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "feature" "text" NOT NULL,
    "status" "text" DEFAULT 'inactive'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_entitlements_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."user_entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_end" timestamp with time zone NOT NULL,
    "cancel_at_period_end" boolean DEFAULT false NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "stripe_price_id" "text",
    CONSTRAINT "user_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'canceled'::"text", 'past_due'::"text", 'trialing'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_subscriptions"."stripe_price_id" IS 'Stores the Stripe Price ID associated with this specific subscription instance (e.g., price_xxxxxxxxxxxxxx).';



ALTER TABLE ONLY "public"."document_chunks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."document_chunks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ai_settings"
    ADD CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collection_subjects"
    ADD CONSTRAINT "collection_subjects_pkey" PRIMARY KEY ("collection_id", "subject_id");



ALTER TABLE ONLY "public"."course_enrollments"
    ADD CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_enrollments"
    ADD CONSTRAINT "course_enrollments_stripe_payment_intent_id_key" UNIQUE ("stripe_payment_intent_id");



ALTER TABLE ONLY "public"."course_enrollments"
    ADD CONSTRAINT "course_enrollments_user_id_course_id_key" UNIQUE ("user_id", "course_id");



ALTER TABLE ONLY "public"."course_subjects"
    ADD CONSTRAINT "course_subjects_pkey" PRIMARY KEY ("course_id", "subject_id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_chunks"
    ADD CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exam_types"
    ADD CONSTRAINT "exam_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."exam_types"
    ADD CONSTRAINT "exam_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flashcard_collections_junction"
    ADD CONSTRAINT "flashcard_collections_junction_pkey" PRIMARY KEY ("flashcard_id", "collection_id");



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "flashcard_collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flashcard_exam_types"
    ADD CONSTRAINT "flashcard_exam_types_pkey" PRIMARY KEY ("flashcard_id", "exam_type_id");



ALTER TABLE ONLY "public"."flashcard_progress"
    ADD CONSTRAINT "flashcard_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flashcard_progress"
    ADD CONSTRAINT "flashcard_progress_user_id_flashcard_id_key" UNIQUE ("user_id", "flashcard_id");



ALTER TABLE ONLY "public"."flashcard_subjects"
    ADD CONSTRAINT "flashcard_subjects_pkey" PRIMARY KEY ("flashcard_id", "subject_id");



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_user_id_lesson_id_key" UNIQUE ("user_id", "lesson_id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_counts"
    ADD CONSTRAINT "message_counts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."query_logs"
    ADD CONSTRAINT "query_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_prompts"
    ADD CONSTRAINT "system_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."threads"
    ADD CONSTRAINT "threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_user_id_feature_key" UNIQUE ("user_id", "feature");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



CREATE INDEX "document_chunks_embedding_idx" ON "public"."document_chunks" USING "ivfflat" ("embedding" "extensions"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_collections_created_at" ON "public"."collections" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_course_enrollments_enrolled_at" ON "public"."course_enrollments" USING "btree" ("enrolled_at");



CREATE INDEX "idx_course_enrollments_expires_at" ON "public"."course_enrollments" USING "btree" ("expires_at");



CREATE INDEX "idx_course_enrollments_status" ON "public"."course_enrollments" USING "btree" ("status");



CREATE INDEX "idx_course_enrollments_user" ON "public"."course_enrollments" USING "btree" ("user_id");



CREATE INDEX "idx_courses_featured" ON "public"."courses" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_courses_status" ON "public"."courses" USING "btree" ("status");



CREATE INDEX "idx_document_chunks_embedding" ON "public"."document_chunks" USING "ivfflat" ("embedding" "extensions"."vector_cosine_ops") WITH ("lists"='100');



COMMENT ON INDEX "public"."idx_document_chunks_embedding" IS 'Optimizes vector similarity searches using IVFFlat';



CREATE INDEX "idx_document_chunks_heading_path" ON "public"."document_chunks" USING "gin" ("heading_path") WHERE ("heading_path" IS NOT NULL);



COMMENT ON INDEX "public"."idx_document_chunks_heading_path" IS 'Enables efficient hierarchical path queries';



CREATE INDEX "idx_document_chunks_outline_source" ON "public"."document_chunks" USING "btree" ("outline_source") WHERE ("outline_source" IS NOT NULL);



COMMENT ON INDEX "public"."idx_document_chunks_outline_source" IS 'Improves performance of source-based filtering';



CREATE INDEX "idx_document_chunks_outline_subject" ON "public"."document_chunks" USING "btree" ("outline_subject") WHERE ("outline_subject" IS NOT NULL);



COMMENT ON INDEX "public"."idx_document_chunks_outline_subject" IS 'Improves performance of subject-based filtering';



CREATE INDEX "idx_document_chunks_type_subject" ON "public"."document_chunks" USING "btree" ("type", "outline_subject") WHERE (("type" IS NOT NULL) AND ("outline_subject" IS NOT NULL));



COMMENT ON INDEX "public"."idx_document_chunks_type_subject" IS 'Improves performance of combined type and subject filtering';



CREATE INDEX "idx_flashcards_created_by" ON "public"."flashcards" USING "btree" ("created_by");



CREATE INDEX "idx_flashcards_is_common_pitfall" ON "public"."flashcards" USING "btree" ("is_common_pitfall");



CREATE INDEX "idx_flashcards_is_official" ON "public"."flashcards" USING "btree" ("is_official");



CREATE INDEX "idx_flashcards_is_public_sample" ON "public"."flashcards" USING "btree" ("is_public_sample");



CREATE INDEX "idx_flashcards_public_sample" ON "public"."flashcards" USING "btree" ("is_public_sample") WHERE ("is_public_sample" = true);



CREATE INDEX "idx_lesson_progress_user" ON "public"."lesson_progress" USING "btree" ("user_id");



CREATE INDEX "idx_lessons_position" ON "public"."lessons" USING "btree" ("position");



CREATE INDEX "idx_modules_position" ON "public"."modules" USING "btree" ("position");



CREATE UNIQUE INDEX "message_counts_user_month" ON "public"."message_counts" USING "btree" ("user_id", "public"."extract_year_month"("period_start"));



CREATE INDEX "threads_created_at_idx" ON "public"."threads" USING "btree" ("created_at");



CREATE INDEX "threads_user_id_idx" ON "public"."threads" USING "btree" ("user_id");



CREATE INDEX "user_subscriptions_user_id_idx" ON "public"."user_subscriptions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "ensure_profile_before_thread_insert" BEFORE INSERT ON "public"."threads" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_profile_exists"();



CREATE OR REPLACE TRIGGER "set_flashcard_creator_trigger" BEFORE INSERT ON "public"."flashcards" FOR EACH ROW EXECUTE FUNCTION "public"."set_flashcard_creator"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at_profile"();



ALTER TABLE ONLY "public"."ai_settings"
    ADD CONSTRAINT "ai_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."collection_subjects"
    ADD CONSTRAINT "collection_subjects_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collection_subjects"
    ADD CONSTRAINT "collection_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_enrollments"
    ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_enrollments"
    ADD CONSTRAINT "course_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_subjects"
    ADD CONSTRAINT "course_subjects_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_subjects"
    ADD CONSTRAINT "course_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "courses_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "fk_flashcards_created_by" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "fk_lessons_created_by" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "fk_modules_created_by" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."flashcard_collections_junction"
    ADD CONSTRAINT "flashcard_collections_junction_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flashcard_collections_junction"
    ADD CONSTRAINT "flashcard_collections_junction_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "flashcard_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flashcard_exam_types"
    ADD CONSTRAINT "flashcard_exam_types_exam_type_id_fkey" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flashcard_exam_types"
    ADD CONSTRAINT "flashcard_exam_types_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flashcard_progress"
    ADD CONSTRAINT "flashcard_progress_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flashcard_progress"
    ADD CONSTRAINT "flashcard_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."flashcard_subjects"
    ADD CONSTRAINT "flashcard_subjects_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flashcard_subjects"
    ADD CONSTRAINT "flashcard_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_counts"
    ADD CONSTRAINT "message_counts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_prompts"
    ADD CONSTRAINT "system_prompts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."threads"
    ADD CONSTRAINT "threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin users can delete any collection_subjects" ON "public"."collection_subjects" FOR DELETE TO "authenticated" USING (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin"));



CREATE POLICY "Admin users can delete any flashcard_collections_junction" ON "public"."flashcard_collections_junction" FOR DELETE TO "authenticated" USING (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin"));



CREATE POLICY "Admin users can delete any flashcard_exam_types" ON "public"."flashcard_exam_types" FOR DELETE TO "authenticated" USING (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin"));



CREATE POLICY "Admin users can delete any flashcard_subjects" ON "public"."flashcard_subjects" FOR DELETE TO "authenticated" USING (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin"));



CREATE POLICY "Admin users can insert any collection_subjects" ON "public"."collection_subjects" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin"));



CREATE POLICY "Admin users can insert any flashcard_collections_junction" ON "public"."flashcard_collections_junction" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin"));



CREATE POLICY "Admin users can insert any flashcard_exam_types" ON "public"."flashcard_exam_types" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin"));



CREATE POLICY "Admin users can update any collection_subjects" ON "public"."collection_subjects" FOR UPDATE TO "authenticated" USING (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin")) WITH CHECK (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin"));



CREATE POLICY "Admin users can update any flashcard_collections_junction" ON "public"."flashcard_collections_junction" FOR UPDATE TO "authenticated" USING (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin")) WITH CHECK (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin"));



CREATE POLICY "Admin users can update any flashcard_exam_types" ON "public"."flashcard_exam_types" FOR UPDATE TO "authenticated" USING (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin")) WITH CHECK (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin"));



CREATE POLICY "Admin users can update any flashcard_subjects" ON "public"."flashcard_subjects" FOR UPDATE TO "authenticated" USING (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin")) WITH CHECK (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin"));



CREATE POLICY "Admins can create course-subject relationships" ON "public"."course_subjects" FOR INSERT TO "authenticated" WITH CHECK ("auth"."is_admin"());



CREATE POLICY "Admins can delete course-subject relationships" ON "public"."course_subjects" FOR DELETE TO "authenticated" USING ("auth"."is_admin"());



CREATE POLICY "Admins can manage AI settings" ON "public"."ai_settings";



CREATE POLICY "Admins can manage all courses" ON "public"."courses" USING ("auth"."is_admin"()) WITH CHECK ("auth"."is_admin"());



CREATE POLICY "Admins can manage all enrollments" ON "public"."course_enrollments" USING ("auth"."is_admin"()) WITH CHECK ("auth"."is_admin"());



CREATE POLICY "Admins can manage all lessons" ON "public"."lessons" USING ("auth"."is_admin"()) WITH CHECK ("auth"."is_admin"());



CREATE POLICY "Admins can manage all modules" ON "public"."modules" USING ("auth"."is_admin"()) WITH CHECK ("auth"."is_admin"());



CREATE POLICY "Admins can manage system prompts" ON "public"."system_prompts" USING ("auth"."is_admin"());



CREATE POLICY "Admins can update any flashcard" ON "public"."flashcards" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can update course-subject relationships" ON "public"."course_subjects" FOR UPDATE TO "authenticated" USING ("auth"."is_admin"()) WITH CHECK ("auth"."is_admin"());



CREATE POLICY "Admins can view all flashcards" ON "public"."flashcards" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can view all subscriptions" ON "public"."user_subscriptions" FOR SELECT TO "authenticated" USING (( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin"));



CREATE POLICY "All users can read active prompt" ON "public"."system_prompts" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "All users can read active setting" ON "public"."ai_settings" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Anyone can read flashcard collections" ON "public"."collections" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can read subjects" ON "public"."subjects" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view official flashcards" ON "public"."flashcards" FOR SELECT TO "authenticated" USING (("is_official" = true));



CREATE POLICY "Anyone can view official subjects" ON "public"."subjects" FOR SELECT TO "anon" USING ((("is_official" = true) AND (( SELECT ("current_setting"('app.public_access'::"text", true))::boolean AS "current_setting") OR ("auth"."role"() = 'authenticated'::"text"))));



CREATE POLICY "Anyone can view public sample flashcards" ON "public"."flashcards" FOR SELECT TO "authenticated", "anon" USING ((("is_official" = true) AND ("is_public_sample" = true)));



CREATE POLICY "Anyone can view published course info" ON "public"."courses" FOR SELECT USING ((("status" = 'Published'::"public"."lesson_status") AND (("current_setting"('app.public_access'::"text", true))::boolean OR ("auth"."role"() = 'authenticated'::"text"))));



CREATE POLICY "Anyone can view published lesson titles" ON "public"."lessons" FOR SELECT USING ((("status" = 'Published'::"public"."lesson_status") AND ("module_id" IN ( SELECT "m"."id"
   FROM "public"."modules" "m"
  WHERE ("m"."course_id" IN ( SELECT "c"."id"
           FROM "public"."courses" "c"
          WHERE ("c"."status" = 'Published'::"public"."lesson_status"))))) AND (("current_setting"('app.public_access'::"text", true))::boolean OR ("auth"."role"() = 'authenticated'::"text"))));



CREATE POLICY "Anyone can view published module titles" ON "public"."modules" FOR SELECT USING ((("course_id" IN ( SELECT "courses"."id"
   FROM "public"."courses"
  WHERE ("courses"."status" = 'Published'::"public"."lesson_status"))) AND (("current_setting"('app.public_access'::"text", true))::boolean OR ("auth"."role"() = 'authenticated'::"text"))));



CREATE POLICY "Anyone can view sample flashcards" ON "public"."flashcards" FOR SELECT TO "anon" USING ((("is_official" = true) AND ("is_public_sample" = true) AND (( SELECT ("current_setting"('app.public_access'::"text", true))::boolean AS "current_setting") OR ("auth"."role"() = 'authenticated'::"text"))));



CREATE POLICY "Authenticated users can view all courses" ON "public"."courses" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."document_chunks" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Only admins can manage exam types" ON "public"."exam_types" TO "authenticated" USING ("auth"."is_admin"());



CREATE POLICY "Only admins can view error logs" ON "public"."error_logs" FOR SELECT USING ("auth"."is_admin"());



CREATE POLICY "Only admins can view query logs" ON "public"."query_logs" FOR SELECT TO "authenticated" USING ("auth"."is_admin"());



CREATE POLICY "Only service role can insert/update/delete subscriptions" ON "public"."user_subscriptions" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage entitlements" ON "public"."user_entitlements" USING (true) WITH CHECK (true);



CREATE POLICY "Users can access collection subjects" ON "public"."collection_subjects" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can access course subjects" ON "public"."course_subjects" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can access exam types" ON "public"."exam_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can access flashcard exam types" ON "public"."flashcard_exam_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can access flashcard subjects" ON "public"."flashcard_subjects" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can create error logs" ON "public"."error_logs" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create flashcard collections" ON "public"."collections" FOR INSERT TO "authenticated" WITH CHECK (("is_official" = false));



CREATE POLICY "Users can create flashcards" ON "public"."flashcards" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can create messages in own threads" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."threads"
  WHERE (("threads"."id" = "messages"."thread_id") AND ("threads"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create own threads" ON "public"."threads" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own enrollments" ON "public"."course_enrollments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own subjects" ON "public"."subjects" FOR INSERT TO "authenticated" WITH CHECK (("is_official" = false));



CREATE POLICY "Users can delete non-official flashcard collections" ON "public"."collections" FOR DELETE TO "authenticated" USING (("is_official" = false));



CREATE POLICY "Users can delete own threads" ON "public"."threads" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own collection_subjects" ON "public"."collection_subjects" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."collections" "c"
  WHERE (("c"."id" = "collection_subjects"."collection_id") AND ("c"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own flashcard progress" ON "public"."flashcard_progress" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own flashcard_collections_junction" ON "public"."flashcard_collections_junction" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."collections" "c"
  WHERE (("c"."id" = "flashcard_collections_junction"."collection_id") AND ("c"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own flashcards" ON "public"."flashcards" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "created_by") AND ("is_official" = false)));



CREATE POLICY "Users can delete their own non-official subjects" ON "public"."subjects" FOR DELETE TO "authenticated" USING (("is_official" = false));



CREATE POLICY "Users can insert flashcard-collection associations" ON "public"."flashcard_collections_junction" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."collections" "c"
  WHERE (("c"."id" = "flashcard_collections_junction"."collection_id") AND (("c"."user_id" = "auth"."uid"()) OR ("c"."is_official" = true))))));



CREATE POLICY "Users can insert flashcard-subject associations" ON "public"."flashcard_subjects" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."is_admin"("auth"."uid"()) AS "is_admin") OR (EXISTS ( SELECT 1
   FROM "public"."flashcards" "f"
  WHERE (("f"."id" = "flashcard_subjects"."flashcard_id") AND ("f"."created_by" = "auth"."uid"()))))));



CREATE POLICY "Users can insert their own collection_subjects" ON "public"."collection_subjects" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."collections" "c"
  WHERE (("c"."id" = "collection_subjects"."collection_id") AND ("c"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own flashcard progress" ON "public"."flashcard_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own message counts" ON "public"."message_counts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can read any collection_subjects" ON "public"."collection_subjects" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can read any flashcard_collections_junction" ON "public"."flashcard_collections_junction" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can read their own entitlements" ON "public"."user_entitlements" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can see published or purchased courses" ON "public"."courses" FOR SELECT USING ((("status" = 'Published'::"public"."lesson_status") OR ("status" = 'Coming Soon'::"public"."lesson_status") OR (EXISTS ( SELECT 1
   FROM "public"."course_enrollments" "ce"
  WHERE (("ce"."course_id" = "courses"."id") AND ("ce"."user_id" = "auth"."uid"()) AND ("ce"."expires_at" >= "now"()))))));



CREATE POLICY "Users can update non-official flashcard collections" ON "public"."collections" FOR UPDATE TO "authenticated" USING (("is_official" = false)) WITH CHECK (("is_official" = false));



CREATE POLICY "Users can update own threads" ON "public"."threads" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own enrollments" ON "public"."course_enrollments" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own flashcard progress" ON "public"."flashcard_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own flashcards" ON "public"."flashcards" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own message counts" ON "public"."message_counts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own non-official subjects" ON "public"."subjects" FOR UPDATE TO "authenticated" USING (("is_official" = false)) WITH CHECK (("is_official" = false));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view lessons for their enrolled courses" ON "public"."lessons" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM (("public"."modules" "m"
     JOIN "public"."courses" "c" ON (("c"."id" = "m"."course_id")))
     LEFT JOIN "public"."course_enrollments" "ce" ON (("ce"."course_id" = "c"."id")))
  WHERE (("lessons"."module_id" = "m"."id") AND (("c"."status" = 'Published'::"public"."lesson_status") OR (("ce"."user_id" = "auth"."uid"()) AND ("ce"."expires_at" >= "now"())))))) AND ("status" = 'Published'::"public"."lesson_status")));



CREATE POLICY "Users can view messages from own threads" ON "public"."messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."threads"
  WHERE (("threads"."id" = "messages"."thread_id") AND ("threads"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view modules for their enrolled courses" ON "public"."modules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."courses" "c"
     LEFT JOIN "public"."course_enrollments" "ce" ON (("ce"."course_id" = "c"."id")))
  WHERE (("c"."id" = "modules"."course_id") AND (("c"."status" = 'Published'::"public"."lesson_status") OR (("ce"."user_id" = "auth"."uid"()) AND ("ce"."expires_at" >= "now"())))))));



CREATE POLICY "Users can view own threads" ON "public"."threads" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own course enrollments" ON "public"."course_enrollments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own flashcard progress" ON "public"."flashcard_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own flashcards" ON "public"."flashcards" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own lesson progress" ON "public"."lesson_progress" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own message counts" ON "public"."message_counts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own subscriptions" ON "public"."user_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."ai_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collection_subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exam_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flashcard_collections_junction" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flashcard_exam_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flashcard_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flashcard_subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flashcards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_counts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."models" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "models_access" ON "public"."models" TO "authenticated" USING (("auth"."is_admin"() OR ("is_public" = true)));



ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."query_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."threads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "threads_delete_own" ON "public"."threads" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "threads_delete_policy" ON "public"."threads" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "threads_insert_own" ON "public"."threads" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "threads_insert_policy" ON "public"."threads" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "threads_select_policy" ON "public"."threads" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "threads_update_own" ON "public"."threads" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "threads_update_policy" ON "public"."threads" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "threads_view_own" ON "public"."threads" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_entitlements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_course_enrollment"("p_user_id" "uuid", "p_course_id" "uuid", "p_days_of_access" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_course_enrollment"("p_user_id" "uuid", "p_course_id" "uuid", "p_days_of_access" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_course_enrollment"("p_user_id" "uuid", "p_course_id" "uuid", "p_days_of_access" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_first_admin"("admin_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_first_admin"("admin_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_first_admin"("admin_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_auth_uid"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_auth_uid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_auth_uid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_profile_exists"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_profile_exists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_profile_exists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_single_active_ai_setting"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_single_active_ai_setting"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_single_active_ai_setting"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_single_active_prompt"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_single_active_prompt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_single_active_prompt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."extract_year_month"("date_value" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."extract_year_month"("date_value" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."extract_year_month"("date_value" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_users_24h"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_users_24h"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_users_24h"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_database_schema"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_database_schema"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_database_schema"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_error_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_error_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_error_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_flashcard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_flashcard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_flashcard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lifetime_message_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_lifetime_message_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lifetime_message_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_total_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_message_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_message_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_message_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_message_count"("input_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_message_count"("input_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_message_count"("input_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_any_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."has_any_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_any_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_course_access"("user_id" "uuid", "course_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_course_access"("user_id" "uuid", "course_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_course_access"("user_id" "uuid", "course_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_entitlement"("feature_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_entitlement"("feature_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_entitlement"("feature_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_entitlement"("user_id" "uuid", "entitlement_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_entitlement"("user_id" "uuid", "entitlement_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_entitlement"("user_id" "uuid", "entitlement_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_lifetime_message_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_lifetime_message_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_lifetime_message_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_user_message_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_user_message_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_user_message_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_user_message_count"("input_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_user_message_count"("input_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_user_message_count"("input_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_subscription_active"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_subscription_active"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_subscription_active"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_slow_query"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_slow_query"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_slow_query"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_error_investigated"("error_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_error_investigated"("error_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_error_investigated"("error_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."revoke_admin"("user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_admin"("user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_admin"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."revoke_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_flashcard_creator"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_flashcard_creator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_flashcard_creator"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_increment_message_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."test_increment_message_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_increment_message_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_profile"("user_id" "uuid", "new_first_name" "text", "new_last_name" "text", "new_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_profile"("user_id" "uuid", "new_first_name" "text", "new_last_name" "text", "new_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_profile"("user_id" "uuid", "new_first_name" "text", "new_last_name" "text", "new_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."upgrade_to_admin"("user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upgrade_to_admin"("user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upgrade_to_admin"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."upgrade_to_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."upgrade_to_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upgrade_to_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."ai_settings" TO "anon";
GRANT ALL ON TABLE "public"."ai_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_settings" TO "service_role";



GRANT ALL ON TABLE "public"."collection_subjects" TO "anon";
GRANT ALL ON TABLE "public"."collection_subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."collection_subjects" TO "service_role";



GRANT ALL ON TABLE "public"."collections" TO "authenticated";
GRANT ALL ON TABLE "public"."collections" TO "service_role";



GRANT ALL ON TABLE "public"."course_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."course_enrollments" TO "service_role";
GRANT SELECT ON TABLE "public"."course_enrollments" TO "anon";



GRANT ALL ON TABLE "public"."course_subjects" TO "anon";
GRANT ALL ON TABLE "public"."course_subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."course_subjects" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";
GRANT SELECT ON TABLE "public"."courses" TO "anon";



GRANT ALL ON TABLE "public"."document_chunks" TO "anon";
GRANT ALL ON TABLE "public"."document_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."document_chunks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."document_chunks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."document_chunks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."document_chunks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."exam_types" TO "anon";
GRANT ALL ON TABLE "public"."exam_types" TO "authenticated";
GRANT ALL ON TABLE "public"."exam_types" TO "service_role";



GRANT ALL ON TABLE "public"."flashcard_collections_junction" TO "anon";
GRANT ALL ON TABLE "public"."flashcard_collections_junction" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcard_collections_junction" TO "service_role";



GRANT ALL ON TABLE "public"."flashcard_exam_types" TO "anon";
GRANT ALL ON TABLE "public"."flashcard_exam_types" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcard_exam_types" TO "service_role";



GRANT ALL ON TABLE "public"."flashcard_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcard_progress" TO "service_role";



GRANT ALL ON TABLE "public"."flashcard_subjects" TO "anon";
GRANT ALL ON TABLE "public"."flashcard_subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcard_subjects" TO "service_role";



GRANT ALL ON TABLE "public"."flashcards" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcards" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_progress" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";
GRANT SELECT ON TABLE "public"."lessons" TO "anon";



GRANT ALL ON TABLE "public"."message_counts" TO "anon";
GRANT ALL ON TABLE "public"."message_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."message_counts" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."models" TO "anon";
GRANT ALL ON TABLE "public"."models" TO "authenticated";
GRANT ALL ON TABLE "public"."models" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";
GRANT SELECT ON TABLE "public"."modules" TO "anon";



GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."query_logs" TO "anon";
GRANT ALL ON TABLE "public"."query_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."query_logs" TO "service_role";



GRANT ALL ON TABLE "public"."schema_overview" TO "anon";
GRANT ALL ON TABLE "public"."schema_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."schema_overview" TO "service_role";



GRANT ALL ON TABLE "public"."subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."subjects" TO "service_role";



GRANT ALL ON TABLE "public"."system_prompts" TO "anon";
GRANT ALL ON TABLE "public"."system_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."system_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."threads" TO "authenticated";
GRANT ALL ON TABLE "public"."threads" TO "service_role";



GRANT ALL ON TABLE "public"."user_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
