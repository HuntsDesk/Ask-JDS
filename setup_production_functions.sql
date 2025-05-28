-- Setup Production Functions
-- This script creates all required functions before applying the main schema

-- =============================================================================
-- 1. Create auth.is_admin function (CRITICAL - needed by many other functions)
-- =============================================================================

-- Create the auth.is_admin function that checks admin status
CREATE OR REPLACE FUNCTION auth.is_admin(user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    target_user_id uuid;
    admin_status boolean := false;
BEGIN
    -- Use provided user_id or current user
    target_user_id := COALESCE(user_id, auth.uid());
    
    -- Return false if no user
    IF target_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user has admin privileges in raw_user_meta_data
    SELECT COALESCE(
        (raw_user_meta_data->>'is_admin')::boolean, 
        false
    ) INTO admin_status
    FROM auth.users
    WHERE id = target_user_id;
    
    RETURN COALESCE(admin_status, false);
END;
$$;

-- =============================================================================
-- 2. Create public.is_admin function (used by some policies)
-- =============================================================================

-- Create the public.is_admin function that forwards to auth.is_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    -- Forward to auth.is_admin function
    RETURN auth.is_admin(user_id);
END;
$$;

-- Create overloaded version without parameters
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    -- Forward to auth.is_admin with current user
    RETURN auth.is_admin(auth.uid());
END;
$$;

-- =============================================================================
-- 3. Grant necessary permissions
-- =============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auth.is_admin(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- =============================================================================
-- 4. Test the functions
-- =============================================================================

-- Test that the functions work
DO $$
BEGIN
    -- Test auth.is_admin function
    IF auth.is_admin(NULL) = false THEN
        RAISE NOTICE 'auth.is_admin function is working correctly';
    END IF;
    
    -- Test public.is_admin function
    IF public.is_admin() = false THEN
        RAISE NOTICE 'public.is_admin function is working correctly';
    END IF;
    
    RAISE NOTICE 'All admin functions created successfully!';
END $$;

SELECT 'Production functions setup completed!' as status; 