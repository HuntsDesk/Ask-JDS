-- Fix is_admin function overloading in development
-- Keep both functions but fix the signature conflict
-- The issue is that DEFAULT NULL makes PostgreSQL unable to choose between them

-- Keep the parameterless version for RLS policies
-- (This one stays as-is)

-- Drop and recreate the UUID version to remove DEFAULT NULL
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

-- Recreate without DEFAULT NULL to eliminate ambiguity
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- Check if user is admin
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'is_admin' = 'true'
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin(user_id uuid) IS 'Checks if a specific user has admin privileges. Requires UUID parameter.'; 