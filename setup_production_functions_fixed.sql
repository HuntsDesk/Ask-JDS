-- Setup Production Functions (Fixed Version)
-- This script creates all required functions in public schema only

-- =============================================================================
-- 1. Create public.is_admin function (replaces auth.is_admin)
-- =============================================================================

-- Create the main admin check function in public schema
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT NULL::uuid)
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

-- Create overloaded version without parameters
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Use current user
    RETURN public.is_admin(auth.uid());
END;
$$;

-- =============================================================================
-- 2. Grant necessary permissions
-- =============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- =============================================================================
-- 3. Test the functions
-- =============================================================================

-- Test that the functions work
DO $$
BEGIN
    -- Test public.is_admin function with null
    IF public.is_admin(NULL) = false THEN
        RAISE NOTICE 'public.is_admin(uuid) function is working correctly';
    END IF;
    
    -- Test public.is_admin function without parameters
    IF public.is_admin() = false THEN
        RAISE NOTICE 'public.is_admin() function is working correctly';
    END IF;
    
    RAISE NOTICE 'All admin functions created successfully in public schema!';
END $$;

SELECT 'Production functions setup completed!' as status; 