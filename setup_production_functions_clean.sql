-- Setup Production Functions (Clean Version)
-- This script safely creates admin functions by dropping existing ones first

-- =============================================================================
-- 1. Drop any existing is_admin functions to avoid conflicts
-- =============================================================================

-- Drop all existing is_admin functions in public schema
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_admin(text);

-- =============================================================================
-- 2. Create public.is_admin function (replaces auth.is_admin)
-- =============================================================================

-- Create the main admin check function with UUID parameter
CREATE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    target_user_id uuid;
    admin_status boolean := false;
BEGIN
    -- Use provided user_id or current user if null
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
CREATE FUNCTION public.is_admin()
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
-- 3. Grant necessary permissions
-- =============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- =============================================================================
-- 4. Test the functions individually
-- =============================================================================

-- Test the UUID version
DO $$
DECLARE
    test_result boolean;
BEGIN
    -- Test with null UUID
    SELECT public.is_admin(NULL::uuid) INTO test_result;
    IF test_result = false THEN
        RAISE NOTICE 'public.is_admin(uuid) function is working correctly';
    END IF;
END $$;

-- Test the parameterless version
DO $$
DECLARE
    test_result boolean;
BEGIN
    -- Test without parameters
    SELECT public.is_admin() INTO test_result;
    RAISE NOTICE 'public.is_admin() function is working correctly, result: %', test_result;
END $$;

-- =============================================================================
-- 5. Verify function signatures
-- =============================================================================

-- Show the created functions
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'is_admin' 
AND pronamespace = 'public'::regnamespace
ORDER BY pg_get_function_arguments(oid);

SELECT 'Production functions setup completed successfully!' as status; 