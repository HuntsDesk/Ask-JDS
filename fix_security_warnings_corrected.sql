-- Fix All Remaining Security Warnings (Corrected Version)
-- This addresses the function search path and auth configuration warnings
-- Drops existing functions first to avoid conflicts

-- =============================================================================
-- 1. Drop Existing Functions First
-- =============================================================================

-- Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS public.is_subscription_active(uuid);
DROP FUNCTION IF EXISTS public.test_increment_message_count(uuid);
DROP FUNCTION IF EXISTS public.upgrade_to_admin(text);
DROP FUNCTION IF EXISTS public.upgrade_to_admin(uuid);
DROP FUNCTION IF EXISTS public.has_course_access(uuid, uuid);

-- =============================================================================
-- 2. Recreate Functions with Proper Search Path
-- =============================================================================

-- Fix is_subscription_active function
CREATE FUNCTION public.is_subscription_active(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
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

-- Fix test_increment_message_count function
CREATE FUNCTION public.test_increment_message_count(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
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

-- Fix upgrade_to_admin function (email parameter version)
CREATE FUNCTION public.upgrade_to_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Fix upgrade_to_admin function (user_id parameter version)
CREATE FUNCTION public.upgrade_to_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Fix has_course_access function
CREATE FUNCTION public.has_course_access(user_id uuid, course_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
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

-- =============================================================================
-- 3. Add Comments for Documentation
-- =============================================================================

COMMENT ON FUNCTION public.is_subscription_active(uuid) IS 'Checks if a user has an active subscription - uses security invoker with empty search_path';
COMMENT ON FUNCTION public.test_increment_message_count(uuid) IS 'Test function for incrementing message count - uses security invoker with empty search_path';
COMMENT ON FUNCTION public.upgrade_to_admin(text) IS 'Upgrades a user to admin by email - uses security definer with empty search_path';
COMMENT ON FUNCTION public.upgrade_to_admin(uuid) IS 'Upgrades a user to admin by user_id - uses security definer with empty search_path';
COMMENT ON FUNCTION public.has_course_access(uuid, uuid) IS 'Checks if user has access to a course - uses security invoker with empty search_path';

-- =============================================================================
-- 4. Verification
-- =============================================================================

-- Check that all functions now have proper search_path
SELECT 
    proname as function_name,
    proconfig as configuration
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
AND proname IN ('is_subscription_active', 'test_increment_message_count', 'upgrade_to_admin', 'has_course_access')
ORDER BY proname;

SELECT 'Function search path warnings fixed successfully!' as status; 